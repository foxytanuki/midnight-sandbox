/**
 * Auction サーキット実行スクリプト（真の封印オークション版）
 */

import * as fs from "fs";
import * as path from "path";
import * as Rx from "rxjs";
import WebSocket from "ws";
import * as crypto from "crypto";

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
import { persistentCommit, CompactTypeUnsignedInteger } from "@midnight-ntwrk/compact-runtime";

// @ts-ignore
globalThis.WebSocket = WebSocket;

const LOCAL_CONFIG = {
  indexer: "http://localhost:8088/api/v1/graphql",
  indexerWS: "ws://localhost:8088/api/v1/graphql/ws",
  node: "http://localhost:9944",
  proofServer: "http://localhost:6300",
};

const GENESIS_SEED = "0000000000000000000000000000000000000000000000000000000000000001";

const BID_SECRETS_FILE = path.join(process.cwd(), "bid-secrets.json");

const waitForSync = (wallet: any) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.filter((state: any) => state.syncProgress?.synced === true),
      Rx.map((s: any) => s.balances[nativeToken()] ?? 0n)
    )
  );

// ランダムな32バイトの秘密値を生成
function generateSecret(): Uint8Array {
  return new Uint8Array(crypto.randomBytes(32));
}

// コミットメントを生成
function createCommitment(amount: bigint, secret: Uint8Array): Uint8Array {
  const uint64Type = new CompactTypeUnsignedInteger(18446744073709551615n, 8);
  return persistentCommit(uint64Type, amount, secret);
}

// 入札秘密値を保存
function saveBidSecret(commitment: Uint8Array, amount: bigint, secret: Uint8Array) {
  let secrets: Record<string, { amount: string; secret: number[] }> = {};
  if (fs.existsSync(BID_SECRETS_FILE)) {
    secrets = JSON.parse(fs.readFileSync(BID_SECRETS_FILE, "utf-8"));
  }
  const commitmentHex = Buffer.from(commitment).toString("hex");
  secrets[commitmentHex] = {
    amount: amount.toString(),
    secret: Array.from(secret),
  };
  fs.writeFileSync(BID_SECRETS_FILE, JSON.stringify(secrets, null, 2));
  console.log(`💾 Saved bid secret for commitment: ${commitmentHex.slice(0, 16)}...`);
}

// 入札秘密値を読み込み
function loadBidSecret(commitment: Uint8Array): { amount: bigint; secret: Uint8Array } | null {
  if (!fs.existsSync(BID_SECRETS_FILE)) {
    return null;
  }
  const secrets = JSON.parse(fs.readFileSync(BID_SECRETS_FILE, "utf-8"));
  const commitmentHex = Buffer.from(commitment).toString("hex");
  const secretData = secrets[commitmentHex];
  if (!secretData) {
    return null;
  }
  return {
    amount: BigInt(secretData.amount),
    secret: new Uint8Array(secretData.secret),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const circuit = args[0];
  const circuitArg = args[1];

  if (!circuit) {
    console.log("Usage: node dist/run-circuit.js <circuit> [args]");
    console.log("Available:");
    console.log("  bid <amount>              - Place a bid (commitment)");
    console.log("  close_bidding             - Close bidding");
    console.log("  reveal <commitment_hex>    - Reveal a bid");
    console.log("  get_highest_bid           - Get highest bid");
    console.log("  get_bid_count             - Get bid count");
    console.log("  is_revealed               - Check if revealed");
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
  const contractModulePath = path.join(contractPath, "auction", "contract", "index.cjs");
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
    zkConfigProvider: new NodeZkConfigProvider(path.join(contractPath, "auction")),
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

  const getLedgerState = async () => {
    try {
      const currentState = await providers.publicDataProvider.queryContractState(deployment.contractAddress);
      if (!currentState) {
        return { highestBid: "N/A", bidCount: "N/A", isOpen: "N/A", isRevealed: "N/A" };
      }
      const s = AuctionModule.ledger(currentState.data);
      return { highestBid: s.highestBid, bidCount: s.bidCount, isOpen: s.isOpen, isRevealed: s.isRevealed };
    } catch (e) {
      console.error("Error getting ledger state:", e);
      return { highestBid: "N/A", bidCount: "N/A", isOpen: "N/A", isRevealed: "N/A" };
    }
  };

  const state = await getLedgerState();
  console.log(`Highest: ${state.highestBid}, Bids: ${state.bidCount}, Open: ${state.isOpen}, Revealed: ${state.isRevealed}\n`);

  let result: any;
  switch (circuit.toLowerCase()) {
    case "bid": {
      const amount = circuitArg ? BigInt(circuitArg) : 100n;
      const secret = generateSecret();
      const commitment = createCommitment(amount, secret);
      
      console.log(`🔒 Creating commitment for bid amount: ${amount}`);
      console.log(`   Commitment: ${Buffer.from(commitment).toString("hex").slice(0, 16)}...`);
      
      result = await deployed.callTx.bid(commitment);
      saveBidSecret(commitment, amount, secret);
      console.log(`✅ Bid committed! Amount: ${amount} (secret saved)`);
      break;
    }
    case "close_bidding":
      result = await deployed.callTx.close_bidding();
      console.log("✅ Bidding closed!");
      break;
    case "reveal": {
      if (!circuitArg) {
        console.error("Error: reveal requires commitment hex as argument");
        console.error("Usage: reveal <commitment_hex>");
        process.exit(1);
      }
      
      const commitment = new Uint8Array(Buffer.from(circuitArg, "hex"));
      const secretData = loadBidSecret(commitment);
      
      if (!secretData) {
        console.error(`Error: No secret found for commitment: ${circuitArg.slice(0, 16)}...`);
        console.error("Make sure you placed the bid using this script and the secret was saved.");
        process.exit(1);
      }
      
      console.log(`🔓 Revealing bid: amount=${secretData.amount}, commitment=${circuitArg.slice(0, 16)}...`);
      result = await deployed.callTx.reveal(secretData.amount, secretData.secret);
      console.log(`✅ Bid revealed! Amount: ${secretData.amount}`);
      break;
    }
    case "get_highest_bid":
      result = await deployed.callTx.get_highest_bid();
      const highestBidResult = result.callResult?.private?.result;
      if (highestBidResult !== undefined) {
        console.log(`✅ Highest bid: ${highestBidResult}`);
      } else {
        // 状態を直接確認
        const currentState = await getLedgerState();
        console.log(`✅ Highest bid: ${currentState.highestBid}`);
      }
      break;
    case "get_bid_count":
      result = await deployed.callTx.get_bid_count();
      const bidCountResult = result.callResult?.private?.result;
      if (bidCountResult !== undefined) {
        console.log(`✅ Bid count: ${bidCountResult}`);
      } else {
        const currentState = await getLedgerState();
        console.log(`✅ Bid count: ${currentState.bidCount}`);
      }
      break;
    case "is_revealed":
      result = await deployed.callTx.is_revealed();
      const isRevealedResult = result.callResult?.private?.result;
      if (isRevealedResult !== undefined) {
        console.log(`✅ Revealed: ${isRevealedResult}`);
      } else {
        const currentState = await getLedgerState();
        console.log(`✅ Revealed: ${currentState.isRevealed}`);
      }
      break;
    default:
      console.error(`Unknown circuit: ${circuit}`);
      process.exit(1);
  }

  await wallet.close();
  console.log("\nDone!");
}

main().catch((error) => { console.error("Error:", error); process.exit(1); });
