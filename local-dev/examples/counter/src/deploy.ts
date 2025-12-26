import * as fs from "fs";
import * as path from "path";
import * as Rx from "rxjs";
import WebSocket from "ws";

import { deployContract, DeployTxFailedError } from "@midnight-ntwrk/midnight-js-contracts";
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
  console.log("=== Counter Contract Deployment ===\n");

  // Configure for local devnet
  setNetworkId(NetworkId.Undeployed);

  // Load compiled contract
  console.log("Loading contract...");
  const contractPath = path.join(process.cwd(), "contract");
  const contractModulePath = path.join(contractPath, "counter", "contract", "index.cjs");

  if (!fs.existsSync(contractModulePath)) {
    console.error("Contract not found! Make sure counter contract is compiled.");
    console.error(`Expected path: ${contractModulePath}`);
    process.exit(1);
  }

  const CounterModule = await import(contractModulePath);
  const contractInstance = new CounterModule.Contract({});

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
  const zkConfigPath = path.join(contractPath, "counter");
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: "counter-state"
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
    privateStateId: "counterState",
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
  console.error("\n❌ Deployment failed!");
  
  if (error instanceof DeployTxFailedError) {
    console.error("\n=== Deployment Transaction Failure Details ===");
    console.error(`Status: ${error.finalizedTxData.status}`);
    console.error(`Transaction ID: ${error.finalizedTxData.txId}`);
    console.error(`Transaction Hash: ${error.finalizedTxData.txHash}`);
    console.error(`Block Height: ${error.finalizedTxData.blockHeight}`);
    console.error(`Block Hash: ${error.finalizedTxData.blockHash}`);
    
    console.error("\nPossible causes:");
    console.error("1. Contract compilation issue");
    console.error("2. Missing key files for deploy transaction");
    console.error("3. Incorrect network configuration");
    console.error("4. Transaction construction issue");
    
    console.error("\nCheck items:");
    const contractPath = path.join(process.cwd(), "contract");
    const keysDir = path.join(contractPath, "keys");
    console.error(`- Contract path: ${contractPath}`);
    console.error(`- Keys directory: ${keysDir}`);
    
    if (fs.existsSync(keysDir)) {
      const keys = fs.readdirSync(keysDir);
      console.error(`- Number of key files: ${keys.length}`);
      if (keys.length > 0) {
        console.error(`- Key files: ${keys.join(", ")}`);
      }
    } else {
      console.error(`- ⚠️ Keys directory does not exist`);
    }
    
    const zkirDir = path.join(contractPath, "zkir");
    if (fs.existsSync(zkirDir)) {
      const zkirFiles = fs.readdirSync(zkirDir);
      console.error(`- Number of ZKIR files: ${zkirFiles.length}`);
    } else {
      console.error(`- ⚠️ ZKIR directory does not exist`);
    }
  } else {
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
  
  process.exit(1);
});

