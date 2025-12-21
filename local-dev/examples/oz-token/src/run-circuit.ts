/**
 * OpenZeppelin Token サーキット実行スクリプト
 * Usage: node dist/run-circuit.js <circuit> [args]
 * Examples:
 *   node dist/run-circuit.js transfer <to> <amount>
 *   node dist/run-circuit.js mint <to> <amount>
 *   node dist/run-circuit.js burn <account> <amount>
 *   node dist/run-circuit.js pause
 *   node dist/run-circuit.js unpause
 *   node dist/run-circuit.js balanceOf <account>
 *   node dist/run-circuit.js totalSupply
 *   node dist/run-circuit.js owner
 *   node dist/run-circuit.js isPaused
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
    console.log("Usage: node dist/run-circuit.js <circuit> [args]");
    console.log("\nAvailable circuits:");
    console.log("  transfer <to> <amount>  - Transfer tokens");
    console.log("  mint <to> <amount>      - Mint tokens (owner only)");
    console.log("  burn <account> <amount> - Burn tokens from account");
    console.log("  pause                   - Pause contract (owner only)");
    console.log("  unpause                 - Unpause contract (owner only)");
    console.log("  balanceOf <account>     - Get balance of account");
    console.log("  totalSupply             - Get total supply");
    console.log("  owner                   - Get owner address");
    console.log("  isPaused                - Check if paused");
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
      privateStateStoreName: "oz-token-state",
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
    privateStateId: "ozTokenState",
    initialPrivateState: {},
  });

  console.log("Connected!\n");

  // Execute circuit
  let result: any;
  switch (circuit.toLowerCase()) {
    case "transfer": {
      const to = args[1];
      const amount = args[2] ? BigInt(args[2]) : 100n;
      if (!to) {
        console.error("Error: 'to' address is required for transfer");
        process.exit(1);
      }
      // Note: In a real scenario, you'd need to convert the address string to the proper type
      // For now, using the wallet's coinPublicKey as an example
      result = await deployed.callTx.transfer(walletState.coinPublicKey, amount);
      console.log(`✅ Transferred ${amount} tokens!`);
      break;
    }

    case "mint": {
      const to = args[1];
      const amount = args[2] ? BigInt(args[2]) : 1000n;
      if (!to) {
        console.error("Error: 'to' address is required for mint");
        process.exit(1);
      }
      result = await deployed.callTx.mint(walletState.coinPublicKey, amount);
      console.log(`✅ Minted ${amount} tokens!`);
      break;
    }

    case "burn": {
      const account = args[1] || walletState.coinPublicKey;
      const amount = args[2] ? BigInt(args[2]) : 100n;
      if (!account) {
        console.error("Error: 'account' address is required for burn");
        process.exit(1);
      }
      result = await deployed.callTx.burn(account, amount);
      console.log(`✅ Burned ${amount} tokens from account!`);
      break;
    }

    case "pause": {
      result = await deployed.callTx.pause();
      console.log(`✅ Contract paused!`);
      break;
    }

    case "unpause": {
      result = await deployed.callTx.unpause();
      console.log(`✅ Contract unpaused!`);
      break;
    }

    case "balanceof": {
      const account = args[1] || walletState.coinPublicKey;
      result = await deployed.callTx.balanceOf(account);
      console.log(`✅ Balance: ${result.callResult?.private?.result ?? "N/A"}`);
      break;
    }

    case "totalsupply": {
      result = await deployed.callTx.totalSupply();
      console.log(`✅ Total Supply: ${result.callResult?.private?.result ?? "N/A"}`);
      break;
    }

    case "owner": {
      result = await deployed.callTx.owner();
      console.log(`✅ Owner: ${result.callResult?.private?.result ?? "N/A"}`);
      break;
    }

    case "ispaused": {
      result = await deployed.callTx.isPaused();
      console.log(`✅ Is Paused: ${result.callResult?.private?.result ?? "N/A"}`);
      break;
    }

    default:
      console.error(`Unknown circuit: ${circuit}`);
      console.log("\nAvailable circuits:");
      console.log("  transfer, mint, burn, pause, unpause");
      console.log("  balanceOf, totalSupply, owner, isPaused");
      process.exit(1);
  }

  await wallet.close();
  console.log("\nDone!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

