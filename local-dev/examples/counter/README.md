# Counter dApp Example

Midnight の Compact コントラクトと midnight-js を使ったシンプルなカウンター dApp の例です。

## 構造

```
counter/
├── contract/              # コンパイル済み Compact コントラクト
│   ├── counter.compact    # ソースファイル
│   ├── contract/          # 生成された TypeScript
│   ├── keys/              # Prover/Verifier キー
│   └── zkir/              # ZK IR ファイル
├── src/
│   ├── deploy.ts          # デプロイスクリプト
│   ├── cli.ts             # 対話式 CLI
│   └── run-circuit.ts     # 単一コマンド実行
├── deployment.json        # デプロイ結果
└── package.json
```

## 前提条件

- ローカル環境が起動していること (`make up` in `local-dev/`)
- Node.js 18+

## セットアップ

```bash
bun install
bun run build
```

## 使用方法

### デプロイ

```bash
bun run deploy
```

### サーキット実行

```bash
# 単一コマンド
bun run run increment
bun run run decrement
bun run run add 5
bun run run get_count

# 対話式 CLI
bun run cli
```

## コントラクト

`contract/counter.compact` は以下のサーキットを持つシンプルなカウンターです：

- `increment` - カウンターを +1
- `decrement` - カウンターを -1
- `add(value)` - カウンターに value を加算
- `get_count` - 現在のカウント値を取得

## 参考

- [04-deploy.md](../../docs/04-deploy.md) - デプロイ方法
- [05-dapp.md](../../docs/05-dapp.md) - dApp 開発
