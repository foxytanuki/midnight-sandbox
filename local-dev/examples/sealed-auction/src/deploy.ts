import * as fs from "fs";
import * as path from "path";
import * as Rx from "rxjs";
import WebSocket from "ws";

import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { createBalancedTx } from "@midnight-ntwrk/midnight-js-types";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { 
  setNetworkId, 
  NetworkId,
  getLedgerNetworkId,
  getZswapNetworkId 
} from "@midnight-ntwrk/midnight-js-network-id";
import { WalletBuilder } from "@midnight-ntwrk/wallet";
import { nativeToken, Transaction } from "@midnight-ntwrk/ledger";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";

// Fix WebSocket for Node.js environment
// @ts-ignore
globalThis.WebSocket = WebSocket;

// ローカル環境用の設定
const LOCAL_CONFIG = {
  indexer: "http://localhost:8088/api/v1/graphql",
  indexerWS: "ws://localhost:8088/api/v1/graphql/ws",
  node: "http://localhost:9944",
  proofServer: "http://localhost:6300"
};

// ジェネシスシード（ローカル開発用）
const GENESIS_SEED = "0000000000000000000000000000000000000000000000000000000000000001";

const waitForFunds = (wallet: any) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.tap((state: any) => {
        if (state.syncProgress) {
          console.log(
            `Sync progress: synced=${state.syncProgress.synced}, sourceGap=${state.syncProgress.lag.sourceGap}, applyGap=${state.syncProgress.lag.applyGap}`
          );
        }
      }),
      Rx.filter((state: any) => state.syncProgress?.synced === true),
      Rx.map((s: any) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance: bigint) => balance > 0n),
      Rx.tap((balance: bigint) => console.log(`Wallet funded with balance: ${balance}`))
    )
  );

async function main() {
  console.log("=== Auction Contract Deployment ===\n");

  // Configure for local devnet
  setNetworkId(NetworkId.Undeployed);

  // Load compiled contract
  console.log("Loading contract...");
  const contractPath = path.join(process.cwd(), "contract");
  const contractModulePath = path.join(contractPath, "contract", "index.cjs");

  if (!fs.existsSync(contractModulePath)) {
    console.error("Contract not found! Make sure auction contract is compiled.");
    console.error(`Expected path: ${contractModulePath}`);
    process.exit(1);
  }

  const AuctionModule = await import(contractModulePath);
  const contractInstance = new AuctionModule.Contract({});

  console.log("Contract loaded successfully");

  // Build wallet
  console.log("\nBuilding wallet from genesis seed...");
  const wallet = await WalletBuilder.buildFromSeed(
    LOCAL_CONFIG.indexer,
    LOCAL_CONFIG.indexerWS,
    LOCAL_CONFIG.proofServer,
    LOCAL_CONFIG.node,
    GENESIS_SEED,
    getZswapNetworkId(),
    "info"
  );

  console.log("Wallet built, starting sync...");
  await wallet.start();

  // Wait for wallet to sync and have funds
  console.log("Waiting for wallet sync and funds...");
  await waitForFunds(wallet);

  // Create wallet provider
  const walletState: any = await Rx.firstValueFrom(wallet.state());

  const walletProvider = {
    coinPublicKey: walletState.coinPublicKey,
    encryptionPublicKey: walletState.encryptionPublicKey,
    balanceTx(tx: any, newCoins: any): Promise<any> {
      return wallet
        .balanceTransaction(
          ZswapTransaction.deserialize(
            tx.serialize(getLedgerNetworkId()),
            getZswapNetworkId()
          ),
          newCoins
        )
        .then((result: any) => wallet.proveTransaction(result))
        .then((zswapTx: any) =>
          Transaction.deserialize(
            zswapTx.serialize(getZswapNetworkId()),
            getLedgerNetworkId()
          )
        )
        .then(createBalancedTx);
    },
    submitTx(tx: any): Promise<any> {
      return wallet.submitTransaction(tx);
    }
  };

  // Configure providers
  console.log("\nSetting up providers...");
  const zkConfigPath = path.join(contractPath);
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: "auction-state"
    }),
    publicDataProvider: indexerPublicDataProvider(
      LOCAL_CONFIG.indexer,
      LOCAL_CONFIG.indexerWS
    ),
    zkConfigProvider: new NodeZkConfigProvider(zkConfigPath),
    proofProvider: httpClientProofProvider(LOCAL_CONFIG.proofServer),
    walletProvider: walletProvider,
    midnightProvider: walletProvider
  };

  // Deploy contract
  console.log("\nDeploying contract (this may take a while)...");

  const deployed = await deployContract(providers, {
    contract: contractInstance,
    privateStateId: "auctionState",
    initialPrivateState: {}
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;

  // Save deployment info
  console.log("\n✅ DEPLOYED!");
  console.log(`Contract address: ${contractAddress}`);

  const info = {
    contractAddress,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync("deployment.json", JSON.stringify(info, null, 2));
  console.log("\nSaved to deployment.json");

  // Close wallet
  await wallet.close();
  console.log("\nWallet closed. Deployment complete!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});

