# Faucet API

Midnightローカル開発環境用のFaucet APIです。shielded/unshieldedアドレスにネイティブトークンを送金できます。

## 概要

このAPIはローカルの"Undeployed"ネットワークで動作するMidnight Lace Walletのアドレスに資金を供給するREST APIです。

## エンドポイント

### GET /health

ヘルスチェックエンドポイント

**レスポンス:**
```json
{
  "status": "ok",
  "service": "faucet-api"
}
```

### POST /fund

アドレスに資金を送金します。

**リクエストボディ:**
```json
{
  "mnemonic": "word1 word2 word3 ...",  // オプション: BIP-39ニーモニック（12語または24語）
  "shieldedAddress": "mn_shield-addr_undeployed1...",  // オプション: Shieldedアドレス
  "unshieldedAddress": "mn_addr_undeployed1..."  // オプション: Unshieldedアドレス
}
```

**注意:** 少なくとも1つのパラメータ（`mnemonic`、`shieldedAddress`、または`unshieldedAddress`）が必要です。

**レスポンス（成功）:**
```json
{
  "success": true,
  "txHash": "0x...",
  "shieldedAddress": "mn_shield-addr_undeployed1...",  // mnemonic指定時のみ
  "unshieldedAddress": "mn_addr_undeployed1..."  // mnemonic指定時のみ
}
```

**レスポンス（エラー）:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## 使用例

### 1. ニーモニックからアドレスを導出して送金

```bash
curl -X POST http://localhost:3000/fund \
  -H "Content-Type: application/json" \
  -d '{
    "mnemonic": "example word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11"
  }'
```

### 2. Shieldedアドレスに送金

```bash
curl -X POST http://localhost:3000/fund \
  -H "Content-Type: application/json" \
  -d '{
    "shieldedAddress": "mn_shield-addr_undeployed1q..."
  }'
```

### 3. Unshieldedアドレスに送金

```bash
curl -X POST http://localhost:3000/fund \
  -H "Content-Type: application/json" \
  -d '{
    "unshieldedAddress": "mn_addr_undeployed1q..."
  }'
```

### 4. 両方のアドレスに送金

```bash
curl -X POST http://localhost:3000/fund \
  -H "Content-Type: application/json" \
  -d '{
    "shieldedAddress": "mn_shield-addr_undeployed1q...",
    "unshieldedAddress": "mn_addr_undeployed1q..."
  }'
```

## 送金額

デフォルトの送金額は `1,000,000,000` トークン（1e9）です。環境変数`TRANSFER_AMOUNT`で変更可能です。

## 技術仕様

- **ランタイム**: Bun
- **フレームワーク**: Hono
- **ポート**: 3000
- **ネットワーク**: undeployed（ローカルのみ）

## 環境変数

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `NODE_URL` | `ws://node:9944` | Node RPCエンドポイント |
| `INDEXER_HTTP_URL` | `http://indexer:8088/api/v3/graphql` | Indexer HTTPエンドポイント |
| `INDEXER_WS_URL` | `ws://indexer:8088/api/v3/graphql/ws` | Indexer WebSocketエンドポイント |
| `PROOF_SERVER_URL` | `http://proof-server:6300` | Proof Serverエンドポイント |
| `PORT` | `3000` | APIサーバーのポート |
| `HOSTNAME` | `0.0.0.0` | APIサーバーのホスト名 |
| `TRANSFER_AMOUNT` | `1000000000` | 送金額（デフォルト: 1e9） |

## ローカル開発

```bash
# 依存関係のインストール
bun install

# 開発サーバーの起動
bun run dev
```

## Docker Compose

このAPIは`local-dev/compose.yaml`に含まれており、他のサービスと一緒に起動されます：

```bash
cd local-dev
make up
```

## 関連リソース

- [Midnight Documentation](https://docs.midnight.network/)

