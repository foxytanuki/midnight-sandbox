/**
 * Auction サーキット実行スクリプト
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

const GENESIS_SEED = "0000000000000000000000000000000000000000000000000000000000000001";

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
    console.log("Available: bid <amount>, close_bidding, reveal, get_highest_bid, get_bid_count, is_revealed");
    process.exit(1);
  }

  console.log(`Running circuit: ${circuit}${circuitArg ? ` with arg: ${circuitArg}` : ""}\n`);

  const deploymentPath = path.join(process.cwd(), "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("deployment.json not found!");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  console.log(`Contract: ${deployment.contractAddress}`);

  setNetworkId(NetworkId.Undeployed);

  const contractPath = path.join(process.cwd(), "contract");
  const contractModulePath = path.join(contractPath, "contract", "index.cjs");
  const AuctionModule = await import(contractModulePath);
  const contractInstance = new AuctionModule.Contract({});

  console.log("Building wallet...");
  const wallet = await WalletBuilder.buildFromSeed(
    LOCAL_CONFIG.indexer, LOCAL_CONFIG.indexerWS, LOCAL_CONFIG.proofServer,
    LOCAL_CONFIG.node, GENESIS_SEED, getZswapNetworkId(), "warn"
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
        .balanceTransaction(ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()), newCoins)
        .then((result: any) => wallet.proveTransaction(result))
        .then((zswapTx: any) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
        .then(createBalancedTx);
    },
    submitTx(tx: any): Promise<any> { return wallet.submitTransaction(tx); },
  };

  const providers = {
    privateStateProvider: levelPrivateStateProvider({ privateStateStoreName: "auction-state" }),
    publicDataProvider: indexerPublicDataProvider(LOCAL_CONFIG.indexer, LOCAL_CONFIG.indexerWS),
    zkConfigProvider: new NodeZkConfigProvider(contractPath),
    proofProvider: httpClientProofProvider(LOCAL_CONFIG.proofServer),
    walletProvider, midnightProvider: walletProvider,
  };

  console.log("Connecting to contract...");
  const deployed: any = await findDeployedContract(providers, {
    contractAddress: deployment.contractAddress,
    contract: contractInstance,
    privateStateId: "auctionState",
    initialPrivateState: {},
  });

  console.log("Connected!\n");

  const getLedgerState = () => {
    try {
      const s = AuctionModule.ledger(deployed.deployTxData.public.initialContractState.data);
      return { highestBid: s.highestBid, bidCount: s.bidCount, isOpen: s.isOpen, isRevealed: s.isRevealed };
    } catch { return { highestBid: "N/A", bidCount: "N/A", isOpen: "N/A", isRevealed: "N/A" }; }
  };

  const state = getLedgerState();
  console.log(`Highest: ${state.highestBid}, Bids: ${state.bidCount}, Open: ${state.isOpen}, Revealed: ${state.isRevealed}\n`);

  let result: any;
  switch (circuit.toLowerCase()) {
    case "bid":
      const amount = circuitArg ? BigInt(circuitArg) : 100n;
      result = await deployed.callTx.bid(amount);
      console.log(`✅ Bid ${amount}!`);
      break;
    case "close_bidding":
      result = await deployed.callTx.close_bidding();
      console.log("✅ Bidding closed!");
      break;
    case "reveal":
      result = await deployed.callTx.reveal();
      console.log("✅ Revealed!");
      break;
    case "get_highest_bid":
      result = await deployed.callTx.get_highest_bid();
      console.log(`✅ Highest bid: ${result.callResult?.private?.result ?? "N/A"}`);
      break;
    case "get_bid_count":
      result = await deployed.callTx.get_bid_count();
      console.log(`✅ Bid count: ${result.callResult?.private?.result ?? "N/A"}`);
      break;
    case "is_revealed":
      result = await deployed.callTx.is_revealed();
      console.log(`✅ Revealed: ${result.callResult?.private?.result ?? "N/A"}`);
      break;
    default:
      console.error(`Unknown circuit: ${circuit}`);
      process.exit(1);
  }

  await wallet.close();
  console.log("\nDone!");
}

main().catch((error) => { console.error("Error:", error); process.exit(1); });
