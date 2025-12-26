# 04. Contract Deployment

This guide explains how to deploy contracts to the local chain.

## Prerequisites

- Local environment is running (`make up`)
- Compact contract is compiled

## Method 1: Using midnight-js (Recommended)

Use this method for dApp development.

### 1. Project Setup

```bash
mkdir my-dapp && cd my-dapp
npm init -y
npm install @midnight-ntwrk/midnight-js-contracts \
            @midnight-ntwrk/midnight-js-types \
            @midnight-ntwrk/midnight-js-level-private-state-provider \
            @midnight-ntwrk/midnight-js-indexer-public-data-provider \
            @midnight-ntwrk/midnight-js-http-client-proof-provider \
            @midnight-ntwrk/midnight-js-node-zk-config-provider \
            @midnight-ntwrk/midnight-js-network-id \
            @midnight-ntwrk/wallet \
            @midnight-ntwrk/ledger \
            @midnight-ntwrk/zswap \
            rxjs \
            ws
```

### 2. Create Deployment Script

```typescript
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

// Configuration for local environment
const LOCAL_CONFIG = {
  indexer: "http://localhost:8088/api/v1/graphql",
  indexerWS: "ws://localhost:8088/api/v1/graphql/ws",
  node: "http://localhost:9944",
  proofServer: "http://localhost:6300"
};

// Genesis seed (for local development)
const GENESIS_SEED = "0000000000000000000000000000000000000000000000000000000000000001";

const waitForFunds = (wallet: any) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.tap((state: any) => {
        if (state.syncProgress) {
          console.log(
            `Sync progress: synced=${state.syncProgress.synced}, sourceGap=${state.syncProgress.lag.sourceGap}`
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
  console.log("=== Contract Deployment ===\n");

  // Configure for local devnet
  setNetworkId(NetworkId.Undeployed);

  // Load compiled contract
  console.log("Loading contract...");
  const contractPath = path.join(process.cwd(), "contract");
  const contractModulePath = path.join(contractPath, "contract", "index.cjs");

  if (!fs.existsSync(contractModulePath)) {
    console.error("Contract not found! Make sure contract is compiled.");
    console.error(`Expected path: ${contractModulePath}`);
    process.exit(1);
  }

  const ContractModule = await import(contractModulePath);
  const contractInstance = new ContractModule.Contract({});

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
      privateStateStoreName: "my-contract-state"
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
    privateStateId: "myContractState",
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
```

## Method 2: Using Toolkit

Suitable for testing and automation in scripts.

### 1. Simple Deployment (Built-in Contract)

```bash
# Built-in contract (for testing)
midnight-node-toolkit generate-txs \
  --src-url ws://localhost:9944 \
  --dest-url ws://localhost:9944 \
  contract-simple deploy \
  --rng-seed '0000000000000000000000000000000000000000000000000000000000000037'
```

### 2. Custom Contract

```bash
# 1. Generate Intent
midnight-node-toolkit generate-intent deploy \
  -c ./contract.config.ts \
  --toolkit-js-path /path/to/toolkit-js \
  --coin-public YOUR_COIN_PUBLIC_KEY \
  --output-intent out/deploy.bin \
  --output-private-state out/ps.json \
  --output-zswap-state out/zswap.json \
  0

# 2. Send Transaction
midnight-node-toolkit send-intent \
  --intent-file out/deploy.bin \
  --compiled-contract-dir ./contract/out
```

### 3. Get Contract Address

```bash
midnight-node-toolkit contract-address \
  --src-file ./deploy_tx.mn
```

See [06-toolkit.md](06-toolkit.md) for details.

## Verifying Deployment

### Check with deployment.json

When deployment succeeds, a `deployment.json` file is created:

```json
{
  "contractAddress": "YOUR_CONTRACT_ADDRESS",
  "deployedAt": "2024-01-01T00:00:00.000Z"
}
```

### Query with Indexer

```graphql
query {
  contractState(address: "YOUR_CONTRACT_ADDRESS") {
    state
  }
}
```

### Check Wallet with Toolkit

```bash
midnight-node-toolkit show-wallet \
  --src-url ws://localhost:9944 \
  --seed 0000000000000000000000000000000000000000000000000000000000000001
```

## Troubleshooting

### "Insufficient funds" Error

Make sure you're using the genesis wallet. In the local development environment, the genesis seed automatically has funds.

```typescript
// Genesis seed (for local development)
const GENESIS_SEED = "0000000000000000000000000000000000000000000000000000000000000001";
```

You need to wait for the wallet to sync and confirm funds are available.

### "Contract not found" Error

Make sure the contract is compiled:

```bash
# In the contract directory
compact compile counter.compact counter/
```

After compilation, verify that `contract/counter/contract/index.cjs` exists.

### "Proof generation failed"

Check if the Proof Server is running:

```bash
curl http://localhost:6300/health
```

### Wallet sync doesn't complete

Make sure the local environment is fully started:

```bash
# Check if all services are running
make status
```

## Next Steps

- [05-dapp.md](05-dapp.md) - dApp development with midnight-js

