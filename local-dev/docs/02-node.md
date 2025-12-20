# 02. ローカルノードの起動

Midnight ノードの起動と設定について説明します。

## Docker Compose での起動

```bash
# 起動
make up

# ログ確認
make node-logs

# 停止
make down
```

## ノードの構成

ローカル開発では以下の3つのサービスが起動します：

| サービス | ポート | 説明 |
|----------|--------|------|
| Node | 9944 | ブロックチェーンノード (WebSocket RPC) |
| Indexer | 8088 | GraphQL API |
| Proof Server | 6300 | ZK証明生成サーバー |

## ノード RPC の確認

```bash
# WebSocket 接続テスト (websocat が必要)
echo '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}' | \
  websocat ws://localhost:9944

# curl でヘルスチェック
curl http://localhost:9944/health
```

## Indexer GraphQL の確認

```bash
# GraphQL クエリ (現在のブロック高を取得)
curl -X POST http://localhost:8088/api/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ block { height } }"}'

# ヘルスチェック
curl http://localhost:8088/health
```

## 開発用設定

`compose.yaml` の環境変数で設定を変更できます：

```yaml
node:
  environment:
    CFG_PRESET: dev        # 開発用プリセット
    RUST_LOG: debug        # ログレベル（debug で詳細ログ）
```

## トラブルシューティング

### ノードが起動しない

```bash
# コンテナの状態確認
docker compose ps

# ログ確認
docker compose logs node
```

### ポートが使用中

```bash
# 9944 ポートを使用しているプロセスを確認
lsof -i :9944

# 別のポートを使用
# compose.yaml の ports を変更
ports:
  - "19944:9944"
```

### データをリセット

```bash
make clean
```

## 次のステップ

- [03-compact.md](03-compact.md) - Compact 言語入門

