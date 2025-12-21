/**
 * Voting サーキット実行スクリプト
 * Usage: node dist/run-circuit.js <circuit>
 * Examples:
 *   node dist/run-circuit.js vote_yes
 *   node dist/run-circuit.js vote_no
 *   node dist/run-circuit.js close_voting
 *   node dist/run-circuit.js get_yes_votes
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
    console.log("Available: vote_yes, vote_no, close_voting, get_yes_votes, get_no_votes, get_total_votes");
    process.exit(1);
  }

  console.log(`Running circuit: ${circuit}\n`);

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
  const VotingModule = await import(contractModulePath);
  const contractInstance = new VotingModule.Contract({});

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
      privateStateStoreName: "voting-state",
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
    privateStateId: "votingState",
    initialPrivateState: {},
  });

  console.log("Connected!\n");

  // Get ledger state
  const getLedgerState = () => {
    try {
      const ledgerState = VotingModule.ledger(deployed.deployTxData.public.initialContractState.data);
      return {
        yesVotes: ledgerState.yesVotes,
        noVotes: ledgerState.noVotes,
        totalVotes: ledgerState.totalVotes,
        isOpen: ledgerState.isOpen,
      };
    } catch {
      return { yesVotes: "N/A", noVotes: "N/A", totalVotes: "N/A", isOpen: "N/A" };
    }
  };

  const state = getLedgerState();
  console.log(`Yes: ${state.yesVotes}, No: ${state.noVotes}, Total: ${state.totalVotes}, Open: ${state.isOpen}\n`);

  // Execute circuit
  let result: any;
  switch (circuit.toLowerCase()) {
    case "vote_yes":
      result = await deployed.callTx.vote_yes();
      console.log("✅ Voted YES!");
      break;

    case "vote_no":
      result = await deployed.callTx.vote_no();
      console.log("✅ Voted NO!");
      break;

    case "close_voting":
      result = await deployed.callTx.close_voting();
      console.log("✅ Voting closed!");
      break;

    case "get_yes_votes":
      result = await deployed.callTx.get_yes_votes();
      console.log(`✅ Yes votes: ${result.callResult?.private?.result ?? "N/A"}`);
      break;

    case "get_no_votes":
      result = await deployed.callTx.get_no_votes();
      console.log(`✅ No votes: ${result.callResult?.private?.result ?? "N/A"}`);
      break;

    case "get_total_votes":
      result = await deployed.callTx.get_total_votes();
      console.log(`✅ Total votes: ${result.callResult?.private?.result ?? "N/A"}`);
      break;

    default:
      console.error(`Unknown circuit: ${circuit}`);
      console.log("Available: vote_yes, vote_no, close_voting, get_yes_votes, get_no_votes, get_total_votes");
      process.exit(1);
  }

  await wallet.close();
  console.log("\nDone!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
