/**
 * Lottery サーキット実行スクリプト
 * Usage: node dist/run-circuit.js <circuit>
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

  if (!circuit) {
    console.log("Usage: node dist/run-circuit.js <circuit>");
    console.log("Available: enter, close_entry, draw, get_participant_count, get_winner, is_drawn");
    process.exit(1);
  }

  console.log(`Running circuit: ${circuit}\n`);

  const deploymentPath = path.join(process.cwd(), "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("deployment.json not found! Run deploy first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  console.log(`Contract: ${deployment.contractAddress}`);

  setNetworkId(NetworkId.Undeployed);

  const contractPath = path.join(process.cwd(), "contract");
  const contractModulePath = path.join(contractPath, "contract", "index.cjs");
  const LotteryModule = await import(contractModulePath);
  const contractInstance = new LotteryModule.Contract({});

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

  const walletState: any = await Rx.firstValueFrom(wallet.state());
  const walletProvider = {
    coinPublicKey: walletState.coinPublicKey,
    encryptionPublicKey: walletState.encryptionPublicKey,
    balanceTx(tx: any, newCoins: any): Promise<any> {
      return wallet
        .balanceTransaction(
          ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
          newCoins
        )
        .then((result: any) => wallet.proveTransaction(result))
        .then((zswapTx: any) =>
          Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId())
        )
        .then(createBalancedTx);
    },
    submitTx(tx: any): Promise<any> {
      return wallet.submitTransaction(tx);
    },
  };

  const providers = {
    privateStateProvider: levelPrivateStateProvider({ privateStateStoreName: "lottery-state" }),
    publicDataProvider: indexerPublicDataProvider(LOCAL_CONFIG.indexer, LOCAL_CONFIG.indexerWS),
    zkConfigProvider: new NodeZkConfigProvider(contractPath),
    proofProvider: httpClientProofProvider(LOCAL_CONFIG.proofServer),
    walletProvider: walletProvider,
    midnightProvider: walletProvider,
  };

  console.log("Connecting to contract...");
  const deployed: any = await findDeployedContract(providers, {
    contractAddress: deployment.contractAddress,
    contract: contractInstance,
    privateStateId: "lotteryState",
    initialPrivateState: {},
  });

  console.log("Connected!\n");

  const getLedgerState = () => {
    try {
      const ledgerState = LotteryModule.ledger(deployed.deployTxData.public.initialContractState.data);
      return {
        participantCount: ledgerState.participantCount,
        winnerNumber: ledgerState.winnerNumber,
        isDrawn: ledgerState.isDrawn,
        isOpen: ledgerState.isOpen,
      };
    } catch {
      return { participantCount: "N/A", winnerNumber: "N/A", isDrawn: "N/A", isOpen: "N/A" };
    }
  };

  const state = getLedgerState();
  console.log(`Participants: ${state.participantCount}, Winner: ${state.winnerNumber}, Drawn: ${state.isDrawn}, Open: ${state.isOpen}\n`);

  let result: any;
  switch (circuit.toLowerCase()) {
    case "enter":
      result = await deployed.callTx.enter();
      console.log("✅ Entered lottery!");
      break;

    case "close_entry":
      result = await deployed.callTx.close_entry();
      console.log("✅ Entry closed!");
      break;

    case "draw":
      result = await deployed.callTx.draw();
      console.log("✅ Lottery drawn!");
      break;

    case "get_participant_count":
      result = await deployed.callTx.get_participant_count();
      console.log(`✅ Participants: ${result.callResult?.private?.result ?? "N/A"}`);
      break;

    case "get_winner":
      result = await deployed.callTx.get_winner();
      console.log(`✅ Winner: ${result.callResult?.private?.result ?? "N/A"}`);
      break;

    case "is_drawn":
      result = await deployed.callTx.is_drawn();
      console.log(`✅ Is drawn: ${result.callResult?.private?.result ?? "N/A"}`);
      break;

    default:
      console.error(`Unknown circuit: ${circuit}`);
      process.exit(1);
  }

  await wallet.close();
  console.log("\nDone!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
