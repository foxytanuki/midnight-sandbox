# インフラストラクチャガイド: Node と Indexer

この章では、Midnight のインフラコンポーネントの運用・設定について解説します。

## 概要

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Development                                  │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    Local Development                         │   │
│   │                                                              │   │
│   │   Node (standalone) + Indexer (standalone) + Proof Server   │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         Production                                   │
│                                                                      │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐           │
│   │    Node      │   │  Chain       │   │  Indexer     │           │
│   │   Cluster    │   │  Indexer     │   │    API       │           │
│   └──────────────┘   └──────────────┘   └──────────────┘           │
│          ▲                  │                  ▲                    │
│          │                  ▼                  │                    │
│          │           ┌──────────────┐          │                    │
│          │           │  PostgreSQL  │          │                    │
│          │           │     NATS     │          │                    │
│          │           └──────────────┘          │                    │
│          │                  ▲                  │                    │
│          │                  │                  │                    │
│   ┌──────┴──────────────────┴──────────────────┴──────┐             │
│   │                   Wallet Indexer                   │             │
│   └────────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## Midnight Node

### Docker での起動（推奨）

```bash
# リポジトリをクローン
git clone https://github.com/midnightntwrk/midnight-node-docker
cd midnight-node-docker

# 起動
docker-compose up -d
```

### 設定パラメータ

| パラメータ | 環境変数 | デフォルト | 説明 |
|-----------|---------|-----------|------|
| チェーン | `CHAIN` | `local` | 接続するネットワーク |
| ベースパス | `BASE_PATH` | `/data` | データディレクトリ |
| バリデータモード | `VALIDATOR` | `false` | バリデータとして動作 |
| RPC ポート | `--rpc-port` | `9944` | WebSocket RPC |
| P2P ポート | `--port` | `30333` | P2P ネットワーク |

### 開発用シングルノード

```bash
# シードファイルを作成
echo "//Alice" > /tmp/alice-seed

# 起動
CFG_PRESET=dev \
AURA_SEED_FILE=/tmp/alice-seed \
GRANDPA_SEED_FILE=/tmp/alice-seed \
CROSS_CHAIN_SEED_FILE=/tmp/alice-seed \
BASE_PATH=/tmp/node-1 \
CHAIN=local \
VALIDATOR=true \
./midnight-node
```

### 利用可能なネットワーク

| ネットワーク | 用途 | Cardano 接続 |
|-------------|------|-------------|
| `local` | ローカル開発 | なし |
| `qanet` | QA テスト | Preview |
| `preview` | ステージング | Preview |
| `perfnet` | パフォーマンステスト | Preview |

### RPC エンドポイント

Node は WebSocket RPC を提供します：

```typescript
// WebSocket 接続
const ws = new WebSocket('ws://localhost:9944');

// 基本的なクエリ
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'system_health',
  params: []
}));
```

**主要な RPC メソッド:**
- `system_health`: ノードの健康状態
- `chain_getBlock`: ブロック取得
- `state_getRuntimeVersion`: ランタイムバージョン
- `author_submitExtrinsic`: トランザクション送信

## Midnight Indexer

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Midnight Indexer                               │
│                                                                      │
│   ┌─────────────────┐                                               │
│   │  Chain Indexer  │ ◄─── Node からブロックを取得                   │
│   └─────────────────┘                                               │
│            │                                                         │
│            ▼                                                         │
│   ┌─────────────────┐                                               │
│   │    Database     │ ◄─── SQLite (standalone) / PostgreSQL (cloud) │
│   └─────────────────┘                                               │
│            │                                                         │
│            ▼                                                         │
│   ┌─────────────────┐                                               │
│   │   Indexer API   │ ◄─── GraphQL Query/Subscription                │
│   └─────────────────┘                                               │
│            │                                                         │
│            ▼                                                         │
│   ┌─────────────────┐                                               │
│   │ Wallet Indexer  │ ◄─── ウォレット関連トランザクションの追跡       │
│   └─────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Standalone モード（開発用）

すべてのコンポーネントが単一バイナリ + SQLite で動作します。

```bash
docker run -d \
  --name midnight-indexer \
  -p 8088:8088 \
  -e APP__INFRA__NODE__URL=ws://host.docker.internal:9944 \
  -e APP__INFRA__SECRET=<hex-encoded-32-bytes> \
  -v indexer-data:/data \
  midnightntwrk/indexer-standalone
```

**環境変数:**
| 変数 | デフォルト | 説明 |
|-----|-----------|------|
| `APP__INFRA__NODE__URL` | `ws://localhost:9944` | Node WebSocket URL |
| `APP__INFRA__STORAGE__CNN_URL` | `/data/indexer.sqlite` | SQLite パス |
| `APP__INFRA__API__PORT` | `8088` | GraphQL API ポート |
| `APP__INFRA__SECRET` | - | 暗号化シークレット (32バイト hex) |

### Cloud モード（本番用）

各コンポーネントを個別に起動し、PostgreSQL と NATS を使用します。

```yaml
# docker-compose.yml (簡略版)
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: indexer
      POSTGRES_USER: indexer
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  nats:
    image: nats:2.10
    command: ["--jetstream"]

  chain-indexer:
    image: midnightntwrk/chain-indexer
    depends_on: [postgres, nats]
    environment:
      APP__INFRA__STORAGE__HOST: postgres
      APP__INFRA__STORAGE__PASSWORD: ${DB_PASSWORD}
      APP__INFRA__PUB_SUB__URL: nats:4222
      APP__INFRA__NODE__URL: ws://midnight-node:9944

  indexer-api:
    image: midnightntwrk/indexer-api
    depends_on: [postgres, nats]
    ports:
      - "8088:8088"
    environment:
      APP__INFRA__STORAGE__HOST: postgres
      APP__INFRA__STORAGE__PASSWORD: ${DB_PASSWORD}
      APP__INFRA__PUB_SUB__URL: nats:4222
      APP__INFRA__SECRET: ${INDEXER_SECRET}

  wallet-indexer:
    image: midnightntwrk/wallet-indexer
    depends_on: [postgres, nats]
    environment:
      APP__INFRA__STORAGE__HOST: postgres
      APP__INFRA__STORAGE__PASSWORD: ${DB_PASSWORD}
      APP__INFRA__PUB_SUB__URL: nats:4222
      APP__INFRA__SECRET: ${INDEXER_SECRET}

volumes:
  postgres-data:
```

### GraphQL API

Indexer は GraphQL API を提供します。

**エンドポイント:**
- HTTP: `http://localhost:8088/graphql`
- WebSocket: `ws://localhost:8088/graphql`

**クエリ例:**

```graphql
# ブロック情報取得
query GetBlock($hash: HexString!) {
  block(hash: $hash) {
    height
    hash
    parentHash
    timestamp
    transactions {
      hash
      status
    }
  }
}

# 最新ブロック取得
query GetLatestBlocks($limit: Int!) {
  blocks(first: $limit, orderBy: HEIGHT_DESC) {
    nodes {
      height
      hash
      timestamp
    }
  }
}

# コントラクトアクション取得
query GetContractActions($address: HexString!) {
  contractActions(contractAddress: $address) {
    nodes {
      txHash
      blockHeight
      entryPoint
      status
    }
  }
}
```

**サブスクリプション例:**

```graphql
# 新規ブロック監視
subscription OnNewBlock {
  newBlock {
    height
    hash
    timestamp
  }
}

# コントラクトアクション監視
subscription OnContractAction($address: HexString!) {
  contractAction(contractAddress: $address) {
    txHash
    entryPoint
    status
  }
}
```

## Proof Server

証明生成サーバー。計算集約的なため、別プロセスで実行します。

### 起動

```bash
docker run -d \
  --name proof-server \
  -p 6300:6300 \
  -v zk-keys:/keys \
  midnightntwrk/proof-server \
  --key-dir /keys
```

### API

```typescript
// POST /prove
const response = await fetch('http://localhost:6300/prove', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    circuit: 'counter/increment',
    inputs: { /* ... */ },
  }),
});

const { proof, publicInputs } = await response.json();
```

## 開発環境構築

### docker-compose による完全な開発環境

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  midnight-node:
    image: midnightntwrk/midnight-node:latest
    ports:
      - "9944:9944"
      - "30333:30333"
    environment:
      - CHAIN=local
      - VALIDATOR=true
      - CFG_PRESET=dev
    volumes:
      - node-data:/data
    command: >
      --dev
      --ws-external
      --rpc-external
      --rpc-cors all

  midnight-indexer:
    image: midnightntwrk/indexer-standalone:latest
    depends_on:
      - midnight-node
    ports:
      - "8088:8088"
    environment:
      APP__INFRA__NODE__URL: ws://midnight-node:9944
      APP__INFRA__SECRET: 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20
    volumes:
      - indexer-data:/data

  proof-server:
    image: midnightntwrk/proof-server:latest
    ports:
      - "6300:6300"
    volumes:
      - zk-keys:/keys

volumes:
  node-data:
  indexer-data:
  zk-keys:
```

### 起動と確認

```bash
# 起動
docker-compose -f docker-compose.dev.yml up -d

# ログ確認
docker-compose -f docker-compose.dev.yml logs -f

# 健康チェック
curl http://localhost:9944/health          # Node
curl http://localhost:8088/graphql         # Indexer (GraphQL Playground)
curl http://localhost:6300/health          # Proof Server
```

## 監視とトラブルシューティング

### ヘルスチェック

```bash
# Node の健康状態
curl -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"system_health","params":[]}'

# 期待されるレスポンス
# {"jsonrpc":"2.0","result":{"peers":2,"isSyncing":false,"shouldHavePeers":true},"id":1}
```

### 一般的な問題

| 問題 | 原因 | 対処 |
|------|------|------|
| Node に接続できない | ポートが閉じている | `--ws-external --rpc-external` を追加 |
| Indexer が同期しない | Node URL が間違っている | `APP__INFRA__NODE__URL` を確認 |
| 証明生成が遅い | リソース不足 | CPU/メモリを増やす、専用サーバー |
| トランザクション失敗 | Nonce ずれ | Node を再起動、状態をリセット |

### ログレベル設定

```bash
# Node のログレベル
RUST_LOG=info,midnight=debug ./midnight-node

# Indexer のログレベル
docker run -e RUST_LOG=debug midnightntwrk/indexer-standalone
```

## 本番環境への移行

### チェックリスト

- [ ] **セキュリティ**
  - シークレットの安全な管理 (Vault, AWS Secrets Manager)
  - ファイアウォール設定 (RPC は内部ネットワークのみ)
  - TLS 終端

- [ ] **スケーリング**
  - Node クラスターの設定
  - Indexer API の水平スケーリング
  - PostgreSQL のレプリケーション

- [ ] **監視**
  - メトリクス収集 (Prometheus)
  - ダッシュボード (Grafana)
  - アラート設定

- [ ] **バックアップ**
  - 定期的な DB バックアップ
  - Node データのスナップショット

### 推奨構成

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Load Balancer                              │
│                         (TLS Termination)                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐         ┌──────────┐         ┌──────────┐
   │ Indexer  │         │ Indexer  │         │ Indexer  │
   │   API    │         │   API    │         │   API    │
   │  (Pod 1) │         │  (Pod 2) │         │  (Pod 3) │
   └──────────┘         └──────────┘         └──────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    PostgreSQL    │
                    │   (HA Cluster)   │
                    └──────────────────┘
```

---

**次章**: [06-comparison](./06-comparison.md) - EVM/Solana との詳細比較

