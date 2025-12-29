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
| compact | Compact コンパイル | [後述](#compact-コンパイラ) |

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                      Your dApp                              │
│                   (midnight-js)                             │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Proof Server   │  │    Indexer      │  │     Node        │  │   Faucet API   │
│  localhost:6300 │  │ localhost:8088  │  │ localhost:9944  │  │ localhost:3000  │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
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
| [01-setup.md](docs/ja/01-setup.md) | 環境セットアップ |
| [02-node.md](docs/ja/02-node.md) | ローカルノードの起動 |
| [03-compact.md](docs/ja/03-compact.md) | Compact 言語入門 |
| [04-deploy.md](docs/ja/04-deploy.md) | コントラクトデプロイ |
| [05-dapp.md](docs/ja/05-dapp.md) | midnight-js で dApp 開発 |
| [06-toolkit.md](docs/ja/06-toolkit.md) | Toolkit の使い方 |

## Compact コンパイラ

```bash
# インストール
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/download/compact-v0.3.0/compact-installer.sh | sh

# 確認
compact -V
```

## エンドポイント一覧

| サービス | URL | 用途 |
|----------|-----|------|
| Node RPC | `ws://localhost:9944` | トランザクション送信 |
| Indexer GraphQL | `http://localhost:8088/graphql` | 状態クエリ |
| Proof Server | `http://localhost:6300` | ZK証明生成 |
| Faucet API | `http://localhost:3000` | Shielded/Unshieldedアドレスへの資金供給 |

## Faucet API

Faucet APIを使用してローカルネットワーク上のshielded/unshieldedアドレスに資金を供給できます。

### スクリプトの使用

```bash
# ニーモニックを使用して送金（shieldedとunshieldedの両方のアドレスを導出）
make fund ADDRESS="your twelve word mnemonic phrase here"

# Shieldedアドレスに送金
make fund ADDRESS=mn_shield-addr_undeployed1q...

# Unshieldedアドレスに送金
make fund ADDRESS=mn_addr_undeployed1q...
```

または、スクリプトを直接使用：

```bash
./scripts/fund.sh "your mnemonic here"
./scripts/fund.sh mn_shield-addr_undeployed1q...
./scripts/fund.sh mn_addr_undeployed1q...
```

詳細は [faucet-api/README.md](faucet-api/README.md) を参照してください。

## ディレクトリ構成

```
local-dev/
├── README.md              # このファイル（英語版）
├── README.ja.md          # 日本語版
├── Makefile               # コマンド集
├── compose.yaml           # ローカル環境定義
├── faucet-api/            # Faucet APIサービス
│   ├── src/               # ソースコード
│   ├── Dockerfile
│   └── README.md
├── docs/                  # ドキュメント
│   ├── ja/                # 日本語版
│   │   ├── 01-setup.md
│   │   ├── 02-node.md
│   │   ├── 03-compact.md
│   │   ├── 04-deploy.md
│   │   ├── 05-dapp.md
│   │   └── 06-toolkit.md
│   └── en/                # 英語版
│       ├── 01-setup.md
│       ├── 02-node.md
│       ├── 03-compact.md
│       ├── 04-deploy.md
│       ├── 05-dapp.md
│       └── 06-toolkit.md
├── scripts/               # ユーティリティスクリプト
│   ├── wait-for-node.sh
│   ├── check-health.sh
│   └── fund.sh            # Faucet APIスクリプト
└── examples/              # サンプルコード
    └── counter/
```

## 関連リソース

- [Midnight Documentation](https://docs.midnight.network/)
- [example-counter](../example-counter/) - サンプル dApp
- [submodules/README.md](../submodules/README.md) - リポジトリ概要

