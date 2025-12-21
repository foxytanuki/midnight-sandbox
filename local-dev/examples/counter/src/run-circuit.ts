/**
 * 単一のサーキットを実行するスクリプト
 * Usage: node dist/run-circuit.js <circuit> [args]
 * Examples:
 *   node dist/run-circuit.js increment
 *   node dist/run-circuit.js decrement
 *   node dist/run-circuit.js add 5
 *   node dist/run-circuit.js get_count
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
    console.log("Available circuits: increment, decrement, add <n>, get_count");
    process.exit(1);
  }

  console.log(`Running circuit: ${circuit}${circuitArg ? ` with arg: ${circuitArg}` : ""}\n`);

  // Load deployment info
  const deploymentPath = path.join(process.cwd(), "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("deployment.json not found!");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  console.log(`Contract: ${deployment.contractAddress}`);

  setNetworkId(NetworkId.Undeployed);

  // Load contract
  const contractPath = path.join(process.cwd(), "contract");
  const contractModulePath = path.join(contractPath, "contract", "index.cjs");
  const CounterModule = await import(contractModulePath);
  const contractInstance = new CounterModule.Contract({});

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
      privateStateStoreName: "counter-run-state",
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
    privateStateId: "counterRunState",
    initialPrivateState: {},
  });

  console.log("Connected!\n");

  // Get current count
  const getLedgerCount = () => {
    try {
      const ledgerState = CounterModule.ledger(deployed.deployTxData.public.initialContractState.data);
      return ledgerState.count;
    } catch {
      return "N/A";
    }
  };

  console.log(`Count before: ${getLedgerCount()}`);

  // Execute circuit
  let result: any;
  switch (circuit.toLowerCase()) {
    case "increment":
      result = await deployed.callTx.increment();
      console.log("✅ Increment completed!");
      break;

    case "decrement":
      result = await deployed.callTx.decrement();
      console.log("✅ Decrement completed!");
      break;

    case "add":
      const value = circuitArg ? BigInt(circuitArg) : 1n;
      result = await deployed.callTx.add(value);
      console.log(`✅ Add(${value}) completed!`);
      break;

    case "get_count":
      result = await deployed.callTx.get_count();
      console.log(`✅ get_count result: ${result.callResult?.private?.result ?? "N/A"}`);
      break;

    default:
      console.error(`Unknown circuit: ${circuit}`);
      process.exit(1);
  }

  if (result?.txId) {
    console.log(`Transaction ID: ${result.txId}`);
  }

  await wallet.close();
  console.log("\nDone!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});


