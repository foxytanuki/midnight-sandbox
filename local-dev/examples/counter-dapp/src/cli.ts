import * as fs from "fs";
import * as path from "path";
import * as Rx from "rxjs";
import * as readline from "readline";
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

// Fix WebSocket for Node.js environment
// @ts-ignore
globalThis.WebSocket = WebSocket;

// ローカル環境用の設定
const LOCAL_CONFIG = {
  indexer: "http://localhost:8088/api/v1/graphql",
  indexerWS: "ws://localhost:8088/api/v1/graphql/ws",
  node: "http://localhost:9944",
  proofServer: "http://localhost:6300",
};

// ジェネシスシード（ローカル開発用）
const GENESIS_SEED =
  "0000000000000000000000000000000000000000000000000000000000000001";

interface DeploymentInfo {
  contractAddress: string;
  deployedAt: string;
}

const waitForSync = (wallet: any) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.tap((state: any) => {
        if (state.syncProgress && !state.syncProgress.synced) {
          console.log(
            `Sync progress: synced=${state.syncProgress.synced}, sourceGap=${state.syncProgress.lag.sourceGap}`
          );
        }
      }),
      Rx.filter((state: any) => state.syncProgress?.synced === true),
      Rx.map((s: any) => s.balances[nativeToken()] ?? 0n)
    )
  );

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("=== Counter Contract CLI ===\n");

  // Load deployment info
  const deploymentPath = path.join(process.cwd(), "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("deployment.json not found! Run deploy first.");
    process.exit(1);
  }

  const deployment: DeploymentInfo = JSON.parse(
    fs.readFileSync(deploymentPath, "utf-8")
  );
  console.log(`Contract address: ${deployment.contractAddress}`);
  console.log(`Deployed at: ${deployment.deployedAt}\n`);

  // Configure for local devnet
  setNetworkId(NetworkId.Undeployed);

  // Load compiled contract
  console.log("Loading contract...");
  const contractPath = path.join(process.cwd(), "..", "counter", "out");
  const contractModulePath = path.join(contractPath, "contract", "index.cjs");

  if (!fs.existsSync(contractModulePath)) {
    console.error("Contract not found!");
    process.exit(1);
  }

  const CounterModule = await import(contractModulePath);
  const contractInstance = new CounterModule.Contract({});

  // Build wallet
  console.log("Building wallet from genesis seed...");
  const wallet = await WalletBuilder.buildFromSeed(
    LOCAL_CONFIG.indexer,
    LOCAL_CONFIG.indexerWS,
    LOCAL_CONFIG.proofServer,
    LOCAL_CONFIG.node,
    GENESIS_SEED,
    getZswapNetworkId(),
    "warn"
  );

  console.log("Starting wallet sync...");
  await wallet.start();
  const balance = await waitForSync(wallet);
  console.log(`Wallet synced. Balance: ${balance}\n`);

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
  const zkConfigPath = path.join(contractPath);
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: "counter-cli-state",
    }),
    publicDataProvider: indexerPublicDataProvider(
      LOCAL_CONFIG.indexer,
      LOCAL_CONFIG.indexerWS
    ),
    zkConfigProvider: new NodeZkConfigProvider(zkConfigPath),
    proofProvider: httpClientProofProvider(LOCAL_CONFIG.proofServer),
    walletProvider: walletProvider,
    midnightProvider: walletProvider,
  };

  // Connect to deployed contract
  console.log("Connecting to deployed contract...");
  const deployed: any = await findDeployedContract(providers, {
    contractAddress: deployment.contractAddress,
    contract: contractInstance,
    privateStateId: "counterCliState",
    initialPrivateState: {},
  });

  console.log("Connected!\n");

  // Get current count from ledger
  const getLedgerCount = () => {
    try {
      const ledgerState = CounterModule.ledger(deployed.state.data);
      return ledgerState.count;
    } catch {
      return "N/A";
    }
  };

  // CLI loop
  const rl = createReadlineInterface();

  const showMenu = () => {
    console.log("\n--- Menu ---");
    console.log("1. increment - カウンターを +1");
    console.log("2. decrement - カウンターを -1");
    console.log("3. add <n>   - カウンターに n を加算");
    console.log("4. get_count - 現在のカウントを取得");
    console.log("5. status    - 現在の状態を表示");
    console.log("6. exit      - 終了");
    console.log("-------------\n");
  };

  showMenu();
  console.log(`Current count: ${getLedgerCount()}`);

  let running = true;
  while (running) {
    const input = await prompt(rl, "\n> ");
    const [command, ...args] = input.split(" ");

    try {
      switch (command.toLowerCase()) {
        case "1":
        case "increment":
          console.log("Calling increment...");
          await deployed.callTx.increment();
          console.log(`✅ Increment completed! Count: ${getLedgerCount()}`);
          break;

        case "2":
        case "decrement":
          console.log("Calling decrement...");
          await deployed.callTx.decrement();
          console.log(`✅ Decrement completed! Count: ${getLedgerCount()}`);
          break;

        case "3":
        case "add":
          const value = args[0] ? BigInt(args[0]) : 1n;
          console.log(`Calling add(${value})...`);
          await deployed.callTx.add(value);
          console.log(`✅ Add completed! Count: ${getLedgerCount()}`);
          break;

        case "4":
        case "get_count":
          console.log("Calling get_count...");
          const result = await deployed.callTx.get_count();
          console.log(`✅ Current count: ${result.callResult?.private?.result ?? getLedgerCount()}`);
          break;

        case "5":
        case "status":
          console.log("\n=== Status ===");
          console.log(`Contract: ${deployment.contractAddress}`);
          console.log(`Count: ${getLedgerCount()}`);
          const currentState: any = await Rx.firstValueFrom(wallet.state());
          console.log(`Wallet balance: ${currentState.balances[nativeToken()] ?? 0n}`);
          break;

        case "6":
        case "exit":
        case "quit":
        case "q":
          running = false;
          console.log("Goodbye!");
          break;

        case "help":
        case "?":
          showMenu();
          break;

        case "":
          break;

        default:
          console.log(`Unknown command: ${command}. Type 'help' for menu.`);
      }
    } catch (error: any) {
      console.error(`❌ Error: ${error.message || error}`);
    }
  }

  rl.close();
  await wallet.close();
  console.log("Wallet closed.");
}

main().catch((error) => {
  console.error("CLI failed:", error);
  process.exit(1);
});

