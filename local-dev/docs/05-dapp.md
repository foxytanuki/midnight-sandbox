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

## 基本構成

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

## プロバイダー設定

```typescript
// ローカル環境用の設定
const LOCAL_CONFIG = {
  indexer: "http://localhost:8088/api/v1/graphql",
  indexerWS: "ws://localhost:8088/api/v1/graphql/ws",
  node: "http://localhost:9944",
  proofServer: "http://localhost:6300"
};

// ネットワークID設定
setNetworkId(NetworkId.Undeployed);

// ウォレット構築
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

// ウォレットプロバイダー作成
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

// プロバイダー設定
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

## コントラクト操作

### デプロイ

```typescript
// コンパイル済みコントラクトを読み込み
const contractPath = path.join(process.cwd(), "contract");
const contractModulePath = path.join(contractPath, "contract", "index.cjs");
const ContractModule = await import(contractModulePath);
const contractInstance = new ContractModule.Contract({});

// デプロイ
const deployed = await deployContract(providers, {
  contract: contractInstance,
  privateStateId: "myContractState",
  initialPrivateState: {}
});

const contractAddress = deployed.deployTxData.public.contractAddress;
console.log('Contract deployed at:', contractAddress);
```

### 既存コントラクトへの接続

```typescript
// deployment.json からアドレスを読み込み
const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf-8"));

// コントラクトに接続
const deployed = await findDeployedContract(providers, {
  contractAddress: deployment.contractAddress,
  contract: contractInstance,
  privateStateId: "myContractState",
  initialPrivateState: {}
});
```

### Circuit 呼び出し

```typescript
// increment を呼び出し
await deployed.callTx.increment();

// 引数付きの呼び出し
await deployed.callTx.add(5n);

// 戻り値のある呼び出し
const result = await deployed.callTx.get_count();
console.log('Count:', result.callResult?.private?.result);
```

### 状態取得

```typescript
// Ledger 状態を取得
const ledgerState = ContractModule.ledger(deployed.state.data);
console.log('Current count:', ledgerState.count);
```

## ウォレット連携

```typescript
import { WalletBuilder } from '@midnight-ntwrk/wallet';
import { nativeToken } from '@midnight-ntwrk/ledger';
import * as Rx from "rxjs";

// ウォレット作成（シードから）
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

// 残高確認
const walletState: any = await Rx.firstValueFrom(wallet.state());
const balance = walletState.balances[nativeToken()] ?? 0n;
console.log('Balance:', balance);

// ウォレットを閉じる
await wallet.close();
```

## イベント購読

```typescript
// ウォレット状態の購読
const subscription = wallet.state().subscribe((state: any) => {
  if (state.syncProgress) {
    console.log('Sync progress:', state.syncProgress);
  }
  if (state.balances) {
    console.log('Balance:', state.balances[nativeToken()] ?? 0n);
  }
});

// 購読解除
subscription.unsubscribe();
```

## React での使用例

```tsx
import { useState, useEffect } from 'react';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
// ... 他のインポート

function CounterApp() {
  const [count, setCount] = useState(0);
  const [deployed, setDeployed] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // コントラクト接続
    const connect = async () => {
      try {
        // プロバイダー設定（上記参照）
        const providers = { /* ... */ };
        
        // コントラクト読み込み
        const ContractModule = await import('./contract/contract/index.cjs');
        const contractInstance = new ContractModule.Contract({});
        
        // deployment.json から読み込み
        const deployment = JSON.parse(
          await fetch('/deployment.json').then(r => r.text())
        );
        
        // コントラクトに接続
        const deployedContract = await findDeployedContract(providers, {
          contractAddress: deployment.contractAddress,
          contract: contractInstance,
          privateStateId: "counterState",
          initialPrivateState: {}
        });
        
        setDeployed(deployedContract);
        
        // 初期状態を取得
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
      
      // 状態を更新
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

## ディレクトリ構成例

```
my-midnight-dapp/
├── contract/
│   ├── counter.compact           # Compact ソース
│   └── counter/                   # コンパイル出力
│       └── contract/
│           ├── index.cjs          # コントラクトランタイム
│           ├── index.d.cts       # TypeScript 型定義
│           └── ...
├── src/
│   ├── deploy.ts                  # デプロイスクリプト
│   ├── cli.ts                     # CLI インターフェース
│   └── App.tsx                    # UI（React の場合）
├── deployment.json                # デプロイ情報
├── package.json
└── tsconfig.json
```

## 参考

- [examples/counter](../examples/counter/) - 完全なサンプル
- [04-deploy.md](04-deploy.md) - デプロイ方法の詳細

## 次のステップ

- [06-toolkit.md](06-toolkit.md) - Toolkit の使い方


