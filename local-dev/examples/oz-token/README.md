# OpenZeppelin Compact Contracts Example

OpenZeppelinのCompact Contractsライブラリを使用したトークンコントラクトの例です。
Ownable、Pausable、FungibleTokenモジュールを組み合わせて、オーナー管理、一時停止機能、トークン機能を持つコントラクトを実装しています。

## 構造

```
oz-token/
├── contract/
│   ├── oz-token.compact     # ソースファイル
│   ├── contract/             # 生成された TypeScript
│   ├── keys/                 # Prover/Verifier キー
│   └── zkir/                 # ZK IR ファイル
├── src/
│   ├── deploy.ts             # デプロイスクリプト
│   └── run-circuit.ts        # サーキット実行
└── package.json
```

## セットアップ

```bash
bun install
bun run build
```

## 使用方法

### コンパイル

```bash
compact compile contract/oz-token.compact contract/oz-token
```

### デプロイ

```bash
bun run deploy
```

### サーキット実行

```bash
# トークンを転送
bun run run transfer <to> <amount>

# トークンを発行（オーナーのみ）
bun run run mint <to> <amount>

# トークンをバーン
bun run run burn <account> <amount>

# コントラクトを一時停止（オーナーのみ）
bun run run pause

# 一時停止を解除（オーナーのみ）
bun run run unpause

# 残高を取得
bun run run balanceOf <account>

# 総供給量を取得
bun run run totalSupply

# オーナーを取得
bun run run owner

# 一時停止状態を取得
bun run run isPaused
```

## コントラクト

`contract/oz-token.compact` のサーキット：

### 使用しているOpenZeppelinモジュール

- **Ownable**: オーナー管理機能
  - `initialize()` - オーナーを設定（constructorで呼び出し）
  - `owner()` - 現在のオーナーを取得
  - `assertOnlyOwner()` - オーナーのみが実行可能なチェック

- **Pausable**: 一時停止機能
  - `isPaused()` - 一時停止状態を取得
  - `assertNotPaused()` - 一時停止されていないことをチェック
  - `_pause()` - 一時停止
  - `_unpause()` - 一時停止解除

- **FungibleToken**: トークン機能
  - `initialize()` - トークンを初期化（constructorで呼び出し）
  - `transfer()` - トークンを転送
  - `_mint()` - トークンを発行
  - `_burn()` - トークンをバーン
  - `balanceOf()` - 残高を取得
  - `totalSupply()` - 総供給量を取得

### 実装されているサーキット

- `transfer(to, value)` - トークンを転送（一時停止チェック付き）
- `mint(to, amount)` - トークンを発行（オーナーのみ、一時停止チェック付き）
- `burn(amount)` - トークンをバーン（一時停止チェック付き）
- `pause()` - コントラクトを一時停止（オーナーのみ）
- `unpause()` - 一時停止を解除（オーナーのみ）
- `balanceOf(account)` - 残高を取得
- `totalSupply()` - 総供給量を取得
- `owner()` - オーナーを取得
- `isPaused()` - 一時停止状態を取得

## 注意事項

- このコントラクトはOpenZeppelin Compact Contractsの実験的なバージョンを使用しています
- 本番環境での使用は推奨されません
- 詳細は [OpenZeppelin Compact Contracts](https://github.com/OpenZeppelin/compact-contracts) を参照してください

