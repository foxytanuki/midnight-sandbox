# Token dApp Example

シンプルなトークン dApp の例です。トークンの発行（mint）とバーン（burn）ができます。

## 構造

```
token/
├── contract/
│   ├── token.compact     # ソースファイル
│   ├── contract/         # 生成された TypeScript
│   ├── keys/             # Prover/Verifier キー
│   └── zkir/             # ZK IR ファイル
├── src/
│   ├── deploy.ts         # デプロイスクリプト
│   └── run-circuit.ts    # サーキット実行
└── package.json
```

## セットアップ

```bash
pnpm install
pnpm run build
```

## 使用方法

### デプロイ

```bash
pnpm run deploy
```

### サーキット実行

```bash
pnpm run run mint 1000        # 1000 トークンを発行
pnpm run run burn 500         # 500 トークンをバーン
pnpm run run get_balance      # 残高を取得
pnpm run run get_total_supply # 総供給量を取得
```

## コントラクト

`contract/token.compact` のサーキット：

- `mint(amount)` - トークンを発行
- `burn(amount)` - トークンをバーン
- `get_balance()` - オーナーの残高を取得
- `get_total_supply()` - 総供給量を取得
