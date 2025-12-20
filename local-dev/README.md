# Midnight Local Development Environment

ローカルチェーンでの Midnight dApp 開発環境のセットアップガイドです。

## クイックスタート

```bash
# 1. ローカルノード起動
make up

# 2. 状態確認
make status

# 3. 停止
make down
```

## 必要なツール

| ツール | 用途 | インストール |
|--------|------|-------------|
| direnv | 環境変数の自動設定 | [direnv.net](https://direnv.net/) |
| Docker | ノード・インデクサー実行 | [docker.com](https://docker.com) |
| Node.js 20+ | dApp 開発 | [nvm](https://github.com/nvm-sh/nvm) |
| compactc | Compact コンパイル | [後述](#compact-コンパイラ) |

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                      Your dApp                              │
│                   (midnight-js)                             │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Proof Server   │  │    Indexer      │  │     Node        │
│  localhost:6300 │  │ localhost:8088  │  │ localhost:9944  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                    ┌─────────────────┐
                    │  Local Chain    │
                    │   (Docker)      │
                    └─────────────────┘
```

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [01-setup.md](docs/01-setup.md) | 環境セットアップ |
| [02-node.md](docs/02-node.md) | ローカルノードの起動 |
| [03-compact.md](docs/03-compact.md) | Compact 言語入門 |
| [04-deploy.md](docs/04-deploy.md) | コントラクトデプロイ |
| [05-dapp.md](docs/05-dapp.md) | midnight-js で dApp 開発 |
| [06-toolkit.md](docs/06-toolkit.md) | Toolkit の使い方 |

## Compact コンパイラ

```bash
# インストール
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/download/compact-v0.3.0/compact-installer.sh | sh

# 確認
compactc --version
```

## エンドポイント一覧

| サービス | URL | 用途 |
|----------|-----|------|
| Node RPC | `ws://localhost:9944` | トランザクション送信 |
| Indexer GraphQL | `http://localhost:8088/graphql` | 状態クエリ |
| Proof Server | `http://localhost:6300` | ZK証明生成 |

## ディレクトリ構成

```
local-dev/
├── README.md              # このファイル
├── Makefile               # コマンド集
├── compose.yaml           # ローカル環境定義
├── docs/                  # ドキュメント
│   ├── 01-setup.md
│   ├── 02-node.md
│   ├── 03-compact.md
│   ├── 04-deploy.md
│   ├── 05-dapp.md
│   └── 06-toolkit.md
├── scripts/               # ユーティリティスクリプト
│   ├── wait-for-node.sh
│   └── check-health.sh
└── examples/              # サンプルコード
    └── counter/
```

## 関連リソース

- [Midnight Documentation](https://docs.midnight.network/)
- [example-counter](../example-counter/) - サンプル dApp
- [submodules/README.md](../submodules/README.md) - リポジトリ概要

