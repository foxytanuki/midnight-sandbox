# 05. midnight-js で dApp 開発

midnight-js を使った dApp 開発の基本を説明します。

## midnight-js とは

Midnight ブロックチェーン向けの TypeScript dApp 開発フレームワークです。
Web3.js (Ethereum) や polkadot.js (Polkadot) に相当します。

## プロジェクトセットアップ

### 1. 新規プロジェクト作成

```bash
mkdir my-midnight-dapp
cd my-midnight-dapp
npm init -y
```

### 2. 依存関係インストール

```bash
npm install \
  @midnight-ntwrk/midnight-js-contracts \
  @midnight-ntwrk/midnight-js-types \
  @midnight-ntwrk/midnight-js-indexer-public-data-provider \
  @midnight-ntwrk/midnight-js-http-client-proof-provider \
  @midnight-ntwrk/midnight-js-fetch-zk-config-provider \
  @midnight-ntwrk/wallet
```

## 基本構成

```typescript
import { 
  ContractState,
  deployContract,
  callCircuit 
} from '@midnight-ntwrk/midnight-js-contracts';

import { 
  createIndexerPublicDataProvider 
} from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

import { 
  createProofClient 
} from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
```

## プロバイダー設定

```typescript
// ローカル開発用設定
const config = {
  nodeUrl: 'ws://localhost:9944',
  indexerUrl: 'http://localhost:8088/graphql',
  proofServerUrl: 'http://localhost:6300',
};

// Indexer プロバイダー
const indexerProvider = createIndexerPublicDataProvider(config.indexerUrl);

// Proof Server プロバイダー
const proofProvider = createProofClient(config.proofServerUrl);
```

## コントラクト操作

### デプロイ

```typescript
import { Contract } from './contract/index.js';
import { witnesses } from './contract/witnesses.js';

const deployedContract = await deployContract(
  providers,
  {
    contract: Contract,
    initialPrivateState: { count: 0 },
    witnesses,
  }
);
```

### Circuit 呼び出し

```typescript
const result = await callCircuit(
  deployedContract,
  'increment',  // circuit 名
  []            // 引数
);
```

### 状態取得

```typescript
const state = await deployedContract.queryContractState();
console.log('Current count:', state.count);
```

## ウォレット連携

```typescript
import { WalletBuilder } from '@midnight-ntwrk/wallet';

// ウォレット作成
const wallet = await WalletBuilder.build({
  indexerUrl: config.indexerUrl,
  nodeUrl: config.nodeUrl,
});

// 残高確認
const balance = await wallet.getBalance();
```

## イベント購読

```typescript
// ブロックイベント購読
const subscription = indexerProvider.subscribeToBlocks({
  onBlock: (block) => {
    console.log('New block:', block.height);
  },
  onError: (error) => {
    console.error('Subscription error:', error);
  }
});

// 購読解除
subscription.unsubscribe();
```

## React での使用例

```tsx
import { useState, useEffect } from 'react';
import { Contract } from './contract/index.js';

function CounterApp() {
  const [count, setCount] = useState(0);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    // コントラクト接続
    const connect = async () => {
      const deployed = await connectToContract(CONTRACT_ADDRESS);
      setContract(deployed);
      
      const state = await deployed.queryContractState();
      setCount(state.count);
    };
    connect();
  }, []);

  const handleIncrement = async () => {
    await callCircuit(contract, 'increment', []);
    const state = await contract.queryContractState();
    setCount(state.count);
  };

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={handleIncrement}>Increment</button>
    </div>
  );
}
```

## ディレクトリ構成例

```
my-midnight-dapp/
├── contract/
│   ├── counter.compact      # Compact ソース
│   └── out/                  # コンパイル出力
│       ├── index.js
│       ├── index.d.ts
│       └── managed/
├── src/
│   ├── providers.ts          # プロバイダー設定
│   ├── contract.ts           # コントラクト操作
│   └── App.tsx               # UI
├── package.json
└── tsconfig.json
```

## 参考

- [example-counter](../../example-counter/) - 完全なサンプル
- [midnight-js README](../submodules/midnight-js/README.md)

## 次のステップ

- [06-toolkit.md](06-toolkit.md) - Toolkit の使い方


