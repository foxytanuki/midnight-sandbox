# 01. 環境セットアップ

ローカル dApp 開発環境のセットアップガイドです。

## 必須ツール

### 1. direnv

プロジェクトディレクトリに入った際に自動的に環境変数を設定するために必要です。

```bash
# Ubuntu/Debian
sudo apt-get install direnv

# macOS
brew install direnv
```

シェルへのフック設定（`~/.zshrc` または `~/.bashrc` に追加）:

```bash
# zsh の場合
eval "$(direnv hook zsh)"

# bash の場合
eval "$(direnv hook bash)"
```

設定後、シェルを再起動するか `source ~/.zshrc` を実行してください。

### 2. Docker

ノード、インデクサー、Proof Server を実行するために必要です。

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# macOS
brew install --cask docker
```

### 3. Node.js (v20+)

midnight-js を使った dApp 開発に必要です。

```bash
# nvm を使用（推奨）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# 確認
node --version  # v20.x.x
```

### 4. Compact コンパイラ

Compact 言語でスマートコントラクトを書くために必要です。

```bash
# インストール
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/download/compact-v0.3.0/compact-installer.sh | sh

# 確認
compact -V
```

## ローカル環境の起動

```bash
cd local-dev

# 起動
make up

# 状態確認
make status

# ヘルスチェック
make health
```

## 環境変数

以下の環境変数で各サービスの URL を設定できます：

```bash
export MIDNIGHT_NODE_URL="ws://localhost:9944"
export MIDNIGHT_INDEXER_URL="http://localhost:8088/graphql"
export MIDNIGHT_PROOF_SERVER_URL="http://localhost:6300"
```

## 次のステップ

- [02-node.md](02-node.md) - ノードの詳細設定
- [03-compact.md](03-compact.md) - Compact 言語入門

