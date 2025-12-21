/**
 * Token サーキット実行スクリプト
 * Usage: node dist/run-circuit.js <circuit> [args]
 * Examples:
 *   node dist/run-circuit.js mint 1000
 *   node dist/run-circuit.js burn 500
 *   node dist/run-circuit.js get_balance
 *   node dist/run-circuit.js get_total_supply
 */

import * as fs from "fs";
import * as path from "path";
import * as Rx from "rxjs";
import WebSocket from "ws";

import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { createBalancedTx } from "@midnight-ntwrk/midnight-js-types";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import {
  setNetworkId,
  NetworkId,
  getLedgerNetworkId,
  getZswapNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { WalletBuilder } from "@midnight-ntwrk/wallet";
import { nativeToken, Transaction } from "@midnight-ntwrk/ledger";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";

// @ts-ignore
globalThis.WebSocket = WebSocket;

const LOCAL_CONFIG = {
  indexer: "http://localhost:8088/api/v1/graphql",
  indexerWS: "ws://localhost:8088/api/v1/graphql/ws",
  node: "http://localhost:9944",
  proofServer: "http://localhost:6300",
};

const GENESIS_SEED =
  "0000000000000000000000000000000000000000000000000000000000000001";

const waitForSync = (wallet: any) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.filter((state: any) => state.syncProgress?.synced === true),
      Rx.map((s: any) => s.balances[nativeToken()] ?? 0n)
    )
  );

async function main() {
  const args = process.argv.slice(2);
  const circuit = args[0];
  const circuitArg = args[1];

  if (!circuit) {
    console.log("Usage: node dist/run-circuit.js <circuit> [args]");
    console.log("Available circuits: mint <amount>, burn <amount>, get_balance, get_total_supply");
    process.exit(1);
  }

  console.log(`Running circuit: ${circuit}${circuitArg ? ` with arg: ${circuitArg}` : ""}\n`);

  // Load deployment info
  const deploymentPath = path.join(process.cwd(), "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("deployment.json not found! Run deploy first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  console.log(`Contract: ${deployment.contractAddress}`);

  setNetworkId(NetworkId.Undeployed);

  // Load contract
  const contractPath = path.join(process.cwd(), "contract");
  const contractModulePath = path.join(contractPath, "contract", "index.cjs");
  const TokenModule = await import(contractModulePath);
  const contractInstance = new TokenModule.Contract({});

  // Build wallet
  console.log("Building wallet...");
  const wallet = await WalletBuilder.buildFromSeed(
    LOCAL_CONFIG.indexer,
    LOCAL_CONFIG.indexerWS,
    LOCAL_CONFIG.proofServer,
    LOCAL_CONFIG.node,
    GENESIS_SEED,
    getZswapNetworkId(),
    "warn"
  );

  await wallet.start();
  await waitForSync(wallet);
  console.log("Wallet synced");

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
    },
  };

  // Configure providers
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: "token-state",
    }),
    publicDataProvider: indexerPublicDataProvider(
      LOCAL_CONFIG.indexer,
      LOCAL_CONFIG.indexerWS
    ),
    zkConfigProvider: new NodeZkConfigProvider(contractPath),
    proofProvider: httpClientProofProvider(LOCAL_CONFIG.proofServer),
    walletProvider: walletProvider,
    midnightProvider: walletProvider,
  };

  // Connect to contract
  console.log("Connecting to contract...");
  const deployed: any = await findDeployedContract(providers, {
    contractAddress: deployment.contractAddress,
    contract: contractInstance,
    privateStateId: "tokenState",
    initialPrivateState: {},
  });

  console.log("Connected!\n");

  // Get ledger state
  const getLedgerState = () => {
    try {
      const ledgerState = TokenModule.ledger(deployed.deployTxData.public.initialContractState.data);
      return {
        totalSupply: ledgerState.totalSupply,
        ownerBalance: ledgerState.ownerBalance,
      };
    } catch {
      return { totalSupply: "N/A", ownerBalance: "N/A" };
    }
  };

  const state = getLedgerState();
  console.log(`Total Supply: ${state.totalSupply}`);
  console.log(`Owner Balance: ${state.ownerBalance}\n`);

  // Execute circuit
  let result: any;
  switch (circuit.toLowerCase()) {
    case "mint":
      const mintAmount = circuitArg ? BigInt(circuitArg) : 1000n;
      result = await deployed.callTx.mint(mintAmount);
      console.log(`✅ Minted ${mintAmount} tokens!`);
      break;

    case "burn":
      const burnAmount = circuitArg ? BigInt(circuitArg) : 100n;
      result = await deployed.callTx.burn(burnAmount);
      console.log(`✅ Burned ${burnAmount} tokens!`);
      break;

    case "get_balance":
      result = await deployed.callTx.get_balance();
      console.log(`✅ Balance: ${result.callResult?.private?.result ?? "N/A"}`);
      break;

    case "get_total_supply":
      result = await deployed.callTx.get_total_supply();
      console.log(`✅ Total Supply: ${result.callResult?.private?.result ?? "N/A"}`);
      break;

    default:
      console.error(`Unknown circuit: ${circuit}`);
      console.log("Available: mint, burn, get_balance, get_total_supply");
      process.exit(1);
  }

  await wallet.close();
  console.log("\nDone!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
