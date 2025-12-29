# 07. リモートアクセス設定

Vercel などのクラウド環境からローカルの Midnight Node にアクセスする方法を説明します。

## 概要

Vercel にホスティングされている開発ツールから、ローカルの Midnight Node にアクセスするには、ローカル環境を一時的にインターネットに公開する必要があります。

## Cloudflare Tunnel (cloudflared) を使用

Cloudflare Tunnel は無料で、ローカルサーバーを安全にインターネットに公開するツールです。

### Ubuntu でのインストール

```bash
# 最新の cloudflared をダウンロード
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# インストール
sudo dpkg -i cloudflared-linux-amd64.deb

# 確認
cloudflared --version
```

または、apt リポジトリからインストール：

```bash
# リポジトリを追加
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 確認
cloudflared --version
```

### 使用方法

Midnight Node の各サービスを公開するには、複数の cloudflared トンネルを起動します：

```bash
# ターミナル1: Node RPC (WebSocket/HTTP)
cloudflared tunnel --url ws://localhost:9944

# ターミナル2: Indexer GraphQL
cloudflared tunnel --url http://localhost:8088

# ターミナル3: Proof Server
cloudflared tunnel --url http://localhost:6300
```

各トンネルが起動すると、以下のような URL が表示されます：

```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://xxxx-xxx-xxx-xxx.trycloudflare.com                                                |
+--------------------------------------------------------------------------------------------+
```

### 環境変数の設定

Vercel の環境変数に、cloudflared で生成された URL を設定します：

```bash
# Vercel の環境変数設定例
MIDNIGHT_NODE_URL=wss://xxxx-xxx-xxx-xxx.trycloudflare.com
MIDNIGHT_INDEXER_URL=https://yyyy-yyy-yyy-yyy.trycloudflare.com/api/v1/graphql
MIDNIGHT_PROOF_SERVER_URL=https://zzzz-zzz-zzz-zzz.trycloudflare.com
```

**注意**: クイックトンネル（`--url` オプション）を使用する場合、URL はセッションごとに変わります。毎回環境変数を更新する必要があります。

### 複数トンネルを同時に起動するスクリプト

`scripts/start-cloudflared-tunnels.sh` を作成：

```bash
#!/bin/bash
# Midnight Node 用の cloudflared トンネルを起動

# 各トンネルをバックグラウンドで起動
cloudflared tunnel --url ws://localhost:9944 > /tmp/cloudflared-node.log 2>&1 &
NODE_PID=$!

cloudflared tunnel --url http://localhost:8088 > /tmp/cloudflared-indexer.log 2>&1 &
INDEXER_PID=$!

cloudflared tunnel --url http://localhost:6300 > /tmp/cloudflared-proof.log 2>&1 &
PROOF_PID=$!

echo "Cloudflared tunnels started!"
echo "Node PID: $NODE_PID"
echo "Indexer PID: $INDEXER_PID"
echo "Proof Server PID: $PROOF_PID"
echo ""
echo "Check logs:"
echo "  tail -f /tmp/cloudflared-node.log"
echo "  tail -f /tmp/cloudflared-indexer.log"
echo "  tail -f /tmp/cloudflared-proof.log"
echo ""
echo "To stop tunnels:"
echo "  kill $NODE_PID $INDEXER_PID $PROOF_PID"
```

実行権限を付与：

```bash
chmod +x scripts/start-cloudflared-tunnels.sh
```

## セキュリティに関する注意事項

1. **一時的な使用に限定**: これらのツールは開発・テスト目的でのみ使用してください
2. **認証の追加**: 本番環境では適切な認証を実装してください
3. **HTTPS の使用**: Cloudflare Tunnel は自動的に HTTPS/WSS を提供します
4. **環境変数の管理**: 機密情報は環境変数で管理し、リポジトリにコミットしないでください

## トラブルシューティング

### WebSocket 接続エラー

- Node RPC の URL は `wss://` (WebSocket Secure) を使用してください
- cloudflared は自動的に WebSocket をサポートします

### CORS エラー

- Indexer の GraphQL エンドポイントにアクセスする際、CORS 設定が必要な場合があります

### 接続タイムアウト

- ローカルの Midnight Node が起動していることを確認してください
- ファイアウォール設定を確認してください
- cloudflared のログを確認してください：`tail -f /tmp/cloudflared-*.log`

### URL が取得できない

- ログファイルを確認して URL を探してください
- 各トンネルは起動時に URL を表示します

## 次のステップ

- [02-node.md](02-node.md) - ノードの詳細設定
- [05-dapp.md](05-dapp.md) - dApp 開発
