# 04. コントラクトデプロイ

ローカルチェーンへのコントラクトデプロイ方法を説明します。

## 前提条件

- ローカル環境が起動していること (`make up`)
- Compact コントラクトがコンパイル済みであること

## 方法1: midnight-js を使用（推奨）

dApp 開発時はこの方法を使います。

### 1. プロジェクトセットアップ

```bash
mkdir my-dapp && cd my-dapp
npm init -y
npm install @midnight-ntwrk/midnight-js-contracts \
            @midnight-ntwrk/midnight-js-types \
            @midnight-ntwrk/wallet
```

### 2. コントラクトのインポート

```typescript
import { Contract } from './contract/index.js';
import { witnesses } from './contract/witnesses.js';
```

### 3. デプロイコード

```typescript
import { 
  deployContract,
  createBalancedTx 
} from '@midnight-ntwrk/midnight-js-contracts';

// プロバイダー設定
const providers = {
  indexer: indexerClient,
  proofServer: proofServerClient,
  node: nodeClient,
  wallet: walletProvider,
  zkConfig: zkConfigProvider,
};

// デプロイ
const deployedContract = await deployContract(
  providers,
  {
    contract: Contract,
    initialPrivateState: { count: 0 },
    witnesses,
  }
);

console.log('Contract deployed at:', deployedContract.address);
```

## 方法2: Toolkit を使用

テストやスクリプトでの自動化に適しています。

### 1. シンプルなデプロイ

```bash
# ビルトインコントラクト（テスト用）
midnight-node-toolkit generate-txs \
  --src-url ws://localhost:9944 \
  --dest-url ws://localhost:9944 \
  contract-simple deploy \
  --rng-seed '0000000000000000000000000000000000000000000000000000000000000001'
```

### 2. カスタムコントラクト

```bash
# 1. Intent を生成
midnight-node-toolkit generate-intent deploy \
  -c ./contract.config.ts \
  --toolkit-js-path /path/to/toolkit-js \
  --coin-public YOUR_COIN_PUBLIC_KEY \
  --output-intent out/deploy.bin \
  --output-private-state out/ps.json \
  --output-zswap-state out/zswap.json \
  0

# 2. トランザクション送信
midnight-node-toolkit send-intent \
  --intent-file out/deploy.bin \
  --compiled-contract-dir ./contract/out
```

### 3. コントラクトアドレス取得

```bash
midnight-node-toolkit contract-address \
  --src-file ./deploy_tx.mn
```

## デプロイの確認

### Indexer でクエリ

```graphql
query {
  contractState(address: "YOUR_CONTRACT_ADDRESS") {
    state
  }
}
```

### Toolkit でウォレット確認

```bash
midnight-node-toolkit show-wallet \
  --src-url ws://localhost:9944 \
  --seed YOUR_SEED
```

## トラブルシューティング

### "Insufficient funds" エラー

ジェネシスウォレットから資金を転送する必要があります。

```bash
# ジェネシスシード（ローカル開発用）
GENESIS_SEED="0000000000000000000000000000000000000000000000000000000000000001"
```

### "Proof generation failed"

Proof Server が起動しているか確認：

```bash
curl http://localhost:6300/health
```

## 次のステップ

- [05-dapp.md](05-dapp.md) - midnight-js で dApp 開発


