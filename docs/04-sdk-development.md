# dApp 開発ガイド: midnight-js と Wallet SDK

この章では、midnight-js を使った dApp 開発の実践的なガイドを提供します。

## 開発環境のセットアップ

### 必要なパッケージ

```bash
# 主要パッケージ
pnpm add @midnight-ntwrk/midnight-js-contracts@latest
pnpm add @midnight-ntwrk/midnight-js-types@latest
pnpm add @midnight-ntwrk/compact-runtime@latest

# プロバイダー
pnpm add @midnight-ntwrk/midnight-js-indexer-public-data-provider@latest
pnpm add @midnight-ntwrk/midnight-js-http-client-proof-provider@latest
pnpm add @midnight-ntwrk/midnight-js-level-private-state-provider@latest
pnpm add @midnight-ntwrk/midnight-js-fetch-zk-config-provider@latest

# ウォレット連携
pnpm add @midnight-ntwrk/wallet@latest
pnpm add @midnight-ntwrk/dapp-connector-api@latest
```

### プロジェクト構造

```
my-dapp/
├── contracts/
│   ├── counter.compact          # Compact ソースコード
│   └── build/
│       ├── counter.js           # コンパイル済みランタイム
│       ├── counter.d.ts         # 型定義
│       └── keys/                # ZK キー
├── src/
│   ├── providers/               # プロバイダー設定
│   ├── witnesses/               # witness 実装
│   ├── contracts/               # コントラクト操作
│   └── components/              # UI コンポーネント
├── package.json
└── tsconfig.json
```

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Your dApp                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                   Contract API                              │    │
│   │   (Compact から生成されたコントラクトインターフェース)          │    │
│   └────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │              @midnight-ntwrk/midnight-js-contracts          │    │
│   │                                                             │    │
│   │   - deployContract()    コントラクトデプロイ                  │    │
│   │   - findContract()      既存コントラクト接続                  │    │
│   │   - callTx()            circuit 呼び出し                     │    │
│   │                                                             │    │
│   └────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│   ┌─────────────┬─────────────┬─────────────┬─────────────────┐    │
│   │ PublicData  │   Proof     │ PrivateState│    ZKConfig     │    │
│   │  Provider   │  Provider   │  Provider   │    Provider     │    │
│   │             │             │             │                 │    │
│   │ (Indexer)   │(ProofServer)│ (LevelDB)   │  (Keys/ZKIR)    │    │
│   └─────────────┴─────────────┴─────────────┴─────────────────┘    │
│          │              │             │              │              │
└──────────│──────────────│─────────────│──────────────│──────────────┘
           │              │             │              │
           ▼              ▼             ▼              ▼
      ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────────┐
      │ Indexer │   │  Proof  │   │  Local  │   │  ZK Artifact│
      │   API   │   │ Server  │   │ Storage │   │   Storage   │
      └─────────┘   └─────────┘   └─────────┘   └─────────────┘
```

## プロバイダーの設定

### 完全な設定例

```typescript
// src/providers/index.ts
import { 
  createIndexerPublicDataProvider 
} from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { 
  createHttpClientProofProvider 
} from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { 
  createLevelPrivateStateProvider 
} from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { 
  createFetchZkConfigProvider 
} from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import type { 
  PublicDataProvider,
  ProofProvider,
  PrivateStateProvider,
  ZkConfigProvider 
} from '@midnight-ntwrk/midnight-js-types';

// 環境設定
const config = {
  indexerUrl: 'http://localhost:8088/graphql',
  indexerWsUrl: 'ws://localhost:8088/graphql',
  proofServerUrl: 'http://localhost:6300',
  zkConfigBaseUrl: 'http://localhost:3000/zk-artifacts',
  privateStatePath: './private-state',
};

// PublicDataProvider: オンチェーン状態の読み取り
export const createPublicDataProvider = (): PublicDataProvider => {
  return createIndexerPublicDataProvider({
    httpUri: config.indexerUrl,
    wsUri: config.indexerWsUrl,
  });
};

// ProofProvider: ZK証明の生成
export const createProofProvider = (): ProofProvider => {
  return createHttpClientProofProvider({
    serverUrl: config.proofServerUrl,
  });
};

// PrivateStateProvider: プライベート状態の永続化
export const createPrivateStateProvider = <T>(): PrivateStateProvider<T> => {
  return createLevelPrivateStateProvider({
    path: config.privateStatePath,
  });
};

// ZkConfigProvider: ZKアーティファクトの取得
export const createZkConfigProvider = (): ZkConfigProvider => {
  return createFetchZkConfigProvider({
    baseUrl: config.zkConfigBaseUrl,
  });
};
```

## コントラクト操作

### コントラクトのデプロイ

```typescript
// src/contracts/counter.ts
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract, Witnesses, Ledger } from '../../contracts/build/counter';
import counterRuntime from '../../contracts/build/counter';
import { witnesses } from '../witnesses/counter';
import { 
  createPublicDataProvider,
  createProofProvider,
  createPrivateStateProvider,
  createZkConfigProvider,
} from '../providers';

// プライベート状態の型定義
type CounterPrivateState = {
  localCount: bigint;
};

// 初期プライベート状態
const initialPrivateState: CounterPrivateState = {
  localCount: 0n,
};

export async function deployCounterContract() {
  // プロバイダーを作成
  const publicDataProvider = createPublicDataProvider();
  const proofProvider = createProofProvider();
  const privateStateProvider = createPrivateStateProvider<CounterPrivateState>();
  const zkConfigProvider = createZkConfigProvider();

  // コントラクトをデプロイ
  const { contractAddress, initialLedger } = await deployContract({
    // Compact から生成されたランタイム
    runtime: counterRuntime,
    
    // witness 実装
    witnesses: witnesses,
    
    // プロバイダー
    publicDataProvider,
    proofProvider,
    privateStateProvider,
    zkConfigProvider,
    
    // 初期状態
    initialPrivateState,
    
    // デプロイ設定
    deployArgs: {
      count: 0n, // ledger の初期値
    },
  });

  console.log('Contract deployed at:', contractAddress);
  console.log('Initial ledger state:', initialLedger);
  
  return { contractAddress, initialLedger };
}
```

### 既存コントラクトへの接続

```typescript
// src/contracts/connect.ts
import { findContract } from '@midnight-ntwrk/midnight-js-contracts';
import counterRuntime from '../../contracts/build/counter';
import { witnesses } from '../witnesses/counter';

export async function connectToContract(contractAddress: string) {
  const publicDataProvider = createPublicDataProvider();
  const proofProvider = createProofProvider();
  const privateStateProvider = createPrivateStateProvider<CounterPrivateState>();
  const zkConfigProvider = createZkConfigProvider();

  const contract = await findContract({
    runtime: counterRuntime,
    witnesses,
    publicDataProvider,
    proofProvider,
    privateStateProvider,
    zkConfigProvider,
    contractAddress,
    privateState: await privateStateProvider.get(contractAddress),
  });

  return contract;
}
```

### Circuit の呼び出し

```typescript
// src/contracts/operations.ts
import { callTx } from '@midnight-ntwrk/midnight-js-contracts';

export async function incrementCounter(contract: Contract) {
  // circuit を呼び出し
  const result = await callTx(contract, 'increment', {
    // 引数がある場合はここで渡す
  });

  console.log('Transaction submitted:', result.txHash);
  console.log('New ledger state:', result.ledger);
  
  return result;
}

export async function addToCounter(contract: Contract, value: bigint) {
  const result = await callTx(contract, 'add', {
    value,
  });

  return result;
}

export async function getCurrentCount(contract: Contract): Promise<bigint> {
  // 読み取り専用の circuit
  const result = await callTx(contract, 'get_count', {});
  return result.returnValue as bigint;
}
```

## Witness の実装

### 基本的な witness

```typescript
// src/witnesses/counter.ts
import type { Witnesses, WitnessContext } from '../../contracts/build/counter';

type CounterPrivateState = {
  localCount: bigint;
  secretMultiplier: bigint;
};

export const witnesses: Witnesses<CounterPrivateState> = {
  // 単純な読み取り
  get_local_count: (context: WitnessContext<CounterPrivateState>) => () => {
    return context.privateState.localCount;
  },
  
  // 読み取りと更新
  increment_local: (context: WitnessContext<CounterPrivateState>) => () => {
    const current = context.privateState.localCount;
    context.privateState.localCount = current + 1n;
    return current + 1n;
  },
  
  // 引数を取る witness
  apply_multiplier: (context: WitnessContext<CounterPrivateState>) => 
    (value: bigint) => {
      return value * context.privateState.secretMultiplier;
    },
  
  // 複雑な計算
  compute_hash: (context: WitnessContext<CounterPrivateState>) => 
    (data: Uint8Array) => {
      // プライベートな計算
      const hash = crypto.subtle.digestSync('SHA-256', data);
      return new Uint8Array(hash);
    },
};
```

### 非同期 witness

```typescript
// witness は同期的でなければならないため、
// 非同期処理が必要な場合は事前に解決しておく

export async function createWitnessesWithAsyncData(userId: string) {
  // 非同期データを事前に取得
  const userData = await fetchUserData(userId);
  
  const witnesses: Witnesses<PrivateState> = {
    get_user_credential: (context) => () => {
      // 事前に取得したデータを使用
      return userData.credential;
    },
  };
  
  return witnesses;
}
```

## ウォレット連携

### DApp Connector API

```typescript
// src/wallet/connector.ts
import { 
  DAppConnector, 
  type WalletAPI 
} from '@midnight-ntwrk/dapp-connector-api';

let walletApi: WalletAPI | null = null;

export async function connectWallet(): Promise<WalletAPI> {
  // ウォレット拡張を検出
  const connector = new DAppConnector();
  
  // 利用可能なウォレットを取得
  const wallets = await connector.getAvailableWallets();
  
  if (wallets.length === 0) {
    throw new Error('No Midnight wallet found. Please install a compatible wallet.');
  }
  
  // 最初のウォレットに接続
  walletApi = await connector.connect(wallets[0].id);
  
  console.log('Connected to wallet:', wallets[0].name);
  
  return walletApi;
}

export async function getWalletAddress(): Promise<string> {
  if (!walletApi) {
    throw new Error('Wallet not connected');
  }
  
  const addresses = await walletApi.getAddresses();
  return addresses[0];
}

export async function signAndSubmitTransaction(tx: unknown): Promise<string> {
  if (!walletApi) {
    throw new Error('Wallet not connected');
  }
  
  // ウォレットでバランス調整と署名
  const signedTx = await walletApi.balanceAndSign(tx);
  
  // トランザクション送信
  const txHash = await walletApi.submitTransaction(signedTx);
  
  return txHash;
}
```

### NodeProvider との連携

```typescript
// src/providers/node.ts
import { createNodeProvider } from '@midnight-ntwrk/midnight-js-types';

export function createNodeProviderWithWallet(walletApi: WalletAPI) {
  return createNodeProvider({
    // ウォレット経由でトランザクション送信
    submitTransaction: async (tx) => {
      const signedTx = await walletApi.balanceAndSign(tx);
      return walletApi.submitTransaction(signedTx);
    },
  });
}
```

## 状態の購読

### リアルタイム更新

```typescript
// src/subscriptions/ledger.ts
import { subscribeToLedger } from '@midnight-ntwrk/midnight-js-contracts';

export async function watchContractState(
  contract: Contract,
  onUpdate: (ledger: Ledger) => void
) {
  const subscription = await subscribeToLedger(contract, {
    onLedgerUpdate: (newLedger) => {
      console.log('Ledger updated:', newLedger);
      onUpdate(newLedger);
    },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
  });

  // クリーンアップ関数を返す
  return () => subscription.unsubscribe();
}
```

### ブロック監視

```typescript
// src/subscriptions/blocks.ts
import { createPublicDataProvider } from '../providers';

export async function watchNewBlocks(onBlock: (block: Block) => void) {
  const provider = createPublicDataProvider();
  
  const subscription = await provider.subscribeToNewBlocks({
    onBlock,
    onError: (error) => {
      console.error('Block subscription error:', error);
    },
  });

  return () => subscription.unsubscribe();
}
```

## React 統合例

### コントラクトフック

```typescript
// src/hooks/useContract.ts
import { useState, useEffect, useCallback } from 'react';
import { Contract, Ledger } from '../../contracts/build/counter';
import { connectToContract, incrementCounter } from '../contracts/counter';

export function useCounterContract(contractAddress: string) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // コントラクト接続
  useEffect(() => {
    let mounted = true;
    
    async function connect() {
      try {
        const c = await connectToContract(contractAddress);
        if (mounted) {
          setContract(c);
          setLedger(c.ledger);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(e as Error);
          setLoading(false);
        }
      }
    }
    
    connect();
    
    return () => { mounted = false; };
  }, [contractAddress]);

  // インクリメント関数
  const increment = useCallback(async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const result = await incrementCounter(contract);
      setLedger(result.ledger);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  return {
    contract,
    ledger,
    loading,
    error,
    increment,
  };
}
```

### コンポーネント例

```tsx
// src/components/Counter.tsx
import React from 'react';
import { useCounterContract } from '../hooks/useContract';

interface CounterProps {
  contractAddress: string;
}

export function Counter({ contractAddress }: CounterProps) {
  const { ledger, loading, error, increment } = useCounterContract(contractAddress);

  if (loading) return <div>Loading contract...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!ledger) return <div>No ledger state</div>;

  return (
    <div className="counter">
      <h2>Counter Contract</h2>
      <p>Current count: {ledger.count.toString()}</p>
      <button onClick={increment} disabled={loading}>
        {loading ? 'Processing...' : 'Increment'}
      </button>
    </div>
  );
}
```

## エラーハンドリング

### よくあるエラーと対処

```typescript
// src/utils/errors.ts
export class MidnightError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MidnightError';
  }
}

export function handleContractError(error: unknown): never {
  if (error instanceof Error) {
    // 証明生成エラー
    if (error.message.includes('proof generation failed')) {
      throw new MidnightError(
        'Failed to generate ZK proof. Please try again.',
        'PROOF_GENERATION_FAILED',
        error
      );
    }
    
    // インデクサー接続エラー
    if (error.message.includes('indexer')) {
      throw new MidnightError(
        'Cannot connect to indexer. Please check your connection.',
        'INDEXER_CONNECTION_FAILED',
        error
      );
    }
    
    // アサーション失敗
    if (error.message.includes('assertion failed')) {
      throw new MidnightError(
        'Contract assertion failed. Check your input values.',
        'ASSERTION_FAILED',
        error
      );
    }
  }
  
  throw new MidnightError(
    'Unknown error occurred',
    'UNKNOWN_ERROR',
    error
  );
}
```

## テスト

### ユニットテスト

```typescript
// src/__tests__/witnesses.test.ts
import { describe, it, expect } from 'vitest';
import { witnesses } from '../witnesses/counter';

describe('Counter Witnesses', () => {
  it('should increment local count', () => {
    const mockContext = {
      privateState: { localCount: 5n },
    };
    
    const result = witnesses.increment_local(mockContext)();
    
    expect(result).toBe(6n);
    expect(mockContext.privateState.localCount).toBe(6n);
  });
});
```

### 統合テスト

```typescript
// src/__tests__/contract.integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { deployCounterContract, connectToContract } from '../contracts/counter';

describe('Counter Contract Integration', () => {
  let contractAddress: string;
  
  beforeAll(async () => {
    // テスト用コントラクトをデプロイ
    const { contractAddress: addr } = await deployCounterContract();
    contractAddress = addr;
  }, 60000); // 証明生成のため長めのタイムアウト
  
  it('should increment counter', async () => {
    const contract = await connectToContract(contractAddress);
    
    const initialCount = contract.ledger.count;
    await incrementCounter(contract);
    const newCount = contract.ledger.count;
    
    expect(newCount).toBe(initialCount + 1n);
  }, 30000);
});
```

---

**次章**: [05-infrastructure](./05-infrastructure.md) - インフラストラクチャガイド

