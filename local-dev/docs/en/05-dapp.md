# 05. dApp Development with midnight-js

This guide explains the basics of dApp development using midnight-js.

## What is midnight-js

A TypeScript dApp development framework for the Midnight blockchain.
It's equivalent to Web3.js (Ethereum) or polkadot.js (Polkadot).

## Project Setup

### 1. Create New Project

```bash
mkdir my-midnight-dapp
cd my-midnight-dapp
npm init -y
```

### 2. Install Dependencies

```bash
npm install \
  @midnight-ntwrk/midnight-js-contracts \
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

## Basic Configuration

```typescript
import * as Rx from "rxjs";
import WebSocket from "ws";

import { deployContract, findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
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
```

## Provider Configuration

```typescript
// Configuration for local environment
const LOCAL_CONFIG = {
  indexer: "http://localhost:8088/api/v1/graphql",
  indexerWS: "ws://localhost:8088/api/v1/graphql/ws",
  node: "http://localhost:9944",
  proofServer: "http://localhost:6300"
};

// Set network ID
setNetworkId(NetworkId.Undeployed);

// Build wallet
const wallet = await WalletBuilder.buildFromSeed(
  LOCAL_CONFIG.indexer,
  LOCAL_CONFIG.indexerWS,
  LOCAL_CONFIG.proofServer,
  LOCAL_CONFIG.node,
  GENESIS_SEED,
  getZswapNetworkId(),
  "info"
);

await wallet.start();

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
const providers = {
  privateStateProvider: levelPrivateStateProvider({
    privateStateStoreName: "my-dapp-state"
  }),
  publicDataProvider: indexerPublicDataProvider(
    LOCAL_CONFIG.indexer,
    LOCAL_CONFIG.indexerWS
  ),
  zkConfigProvider: new NodeZkConfigProvider(contractPath),
  proofProvider: httpClientProofProvider(LOCAL_CONFIG.proofServer),
  walletProvider: walletProvider,
  midnightProvider: walletProvider
};
```

## Contract Operations

### Deploy

```typescript
// Load compiled contract
const contractPath = path.join(process.cwd(), "contract");
const contractModulePath = path.join(contractPath, "contract", "index.cjs");
const ContractModule = await import(contractModulePath);
const contractInstance = new ContractModule.Contract({});

// Deploy
const deployed = await deployContract(providers, {
  contract: contractInstance,
  privateStateId: "myContractState",
  initialPrivateState: {}
});

const contractAddress = deployed.deployTxData.public.contractAddress;
console.log('Contract deployed at:', contractAddress);
```

### Connect to Existing Contract

```typescript
// Load address from deployment.json
const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf-8"));

// Connect to contract
const deployed = await findDeployedContract(providers, {
  contractAddress: deployment.contractAddress,
  contract: contractInstance,
  privateStateId: "myContractState",
  initialPrivateState: {}
});
```

### Circuit Invocation

```typescript
// Call increment
await deployed.callTx.increment();

// Call with arguments
await deployed.callTx.add(5n);

// Call with return value
const result = await deployed.callTx.get_count();
console.log('Count:', result.callResult?.private?.result);
```

### Get State

```typescript
// Get Ledger state
const ledgerState = ContractModule.ledger(deployed.state.data);
console.log('Current count:', ledgerState.count);
```

## Wallet Integration

```typescript
import { WalletBuilder } from '@midnight-ntwrk/wallet';
import { nativeToken } from '@midnight-ntwrk/ledger';
import * as Rx from "rxjs";

// Create wallet (from seed)
const GENESIS_SEED = "0000000000000000000000000000000000000000000000000000000000000001";
const wallet = await WalletBuilder.buildFromSeed(
  LOCAL_CONFIG.indexer,
  LOCAL_CONFIG.indexerWS,
  LOCAL_CONFIG.proofServer,
  LOCAL_CONFIG.node,
  GENESIS_SEED,
  getZswapNetworkId(),
  "info"
);

await wallet.start();

// Check balance
const walletState: any = await Rx.firstValueFrom(wallet.state());
const balance = walletState.balances[nativeToken()] ?? 0n;
console.log('Balance:', balance);

// Close wallet
await wallet.close();
```

## Event Subscription

```typescript
// Subscribe to wallet state
const subscription = wallet.state().subscribe((state: any) => {
  if (state.syncProgress) {
    console.log('Sync progress:', state.syncProgress);
  }
  if (state.balances) {
    console.log('Balance:', state.balances[nativeToken()] ?? 0n);
  }
});

// Unsubscribe
subscription.unsubscribe();
```

## React Usage Example

```tsx
import { useState, useEffect } from 'react';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
// ... other imports

function CounterApp() {
  const [count, setCount] = useState(0);
  const [deployed, setDeployed] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to contract
    const connect = async () => {
      try {
        // Provider configuration (see above)
        const providers = { /* ... */ };
        
        // Load contract
        const ContractModule = await import('./contract/contract/index.cjs');
        const contractInstance = new ContractModule.Contract({});
        
        // Load from deployment.json
        const deployment = JSON.parse(
          await fetch('/deployment.json').then(r => r.text())
        );
        
        // Connect to contract
        const deployedContract = await findDeployedContract(providers, {
          contractAddress: deployment.contractAddress,
          contract: contractInstance,
          privateStateId: "counterState",
          initialPrivateState: {}
        });
        
        setDeployed(deployedContract);
        
        // Get initial state
        const ledgerState = ContractModule.ledger(deployedContract.state.data);
        setCount(Number(ledgerState.count));
      } catch (error) {
        console.error('Connection failed:', error);
      } finally {
        setLoading(false);
      }
    };
    connect();
  }, []);

  const handleIncrement = async () => {
    if (!deployed) return;
    
    try {
      await deployed.callTx.increment();
      
      // Update state
      const ledgerState = ContractModule.ledger(deployed.state.data);
      setCount(Number(ledgerState.count));
    } catch (error) {
      console.error('Increment failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  );
}
```

## Directory Structure Example

```
my-midnight-dapp/
├── contract/
│   ├── counter.compact           # Compact source
│   └── counter/                   # Compilation output
│       └── contract/
│           ├── index.cjs          # Contract runtime
│           ├── index.d.cts       # TypeScript type definitions
│           └── ...
├── src/
│   ├── deploy.ts                  # Deployment script
│   ├── cli.ts                     # CLI interface
│   └── App.tsx                    # UI (if using React)
├── deployment.json                # Deployment info
├── package.json
└── tsconfig.json
```

## References

- [examples/counter](../../examples/counter/) - Complete sample
- [04-deploy.md](04-deploy.md) - Detailed deployment methods

## Next Steps

- [06-toolkit.md](06-toolkit.md) - Toolkit usage

