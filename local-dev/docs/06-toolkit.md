# 06. Toolkit の使い方

`midnight-node-toolkit` の使い方を説明します。

## Toolkit とは

ローカル開発・テスト・CI/CD 向けの CLI ツールです。

| 機能 | 説明 |
|------|------|
| トランザクション生成 | バッチ生成、性能テスト |
| ウォレット操作 | 残高確認、アドレス表示 |
| コントラクト操作 | デプロイ、呼び出し |
| ユーティリティ | ジェネシス生成、TX解析 |

## インストール

```bash
# Docker イメージを使用（推奨）
# 最新の安定版を使用
docker pull midnightntwrk/midnight-node-toolkit:latest-main

# エイリアス設定
alias toolkit='docker run --network host -v $(pwd):/work -w /work midnightntwrk/midnight-node-toolkit:latest-main'
```

特定のバージョンを使用する場合：

```bash
# 例: バージョン 0.18.0-rc.7
docker pull midnightntwrk/midnight-node-toolkit:0.18.0-rc.7
alias toolkit='docker run --network host -v $(pwd):/work -w /work midnightntwrk/midnight-node-toolkit:0.18.0-rc.7'
```

## 基本コマンド

### バージョン確認

```bash
toolkit version
# Node: x.x.x
# Ledger: x.x.x
# Compactc: x.x.x
```

### ウォレット残高確認

```bash
toolkit show-wallet \
  --src-url ws://localhost:9944 \
  --seed 0000000000000000000000000000000000000000000000000000000000000001
```

### アドレス表示

```bash
# Shielded アドレス
toolkit show-address \
  --network undeployed \
  --shielded \
  --seed YOUR_SEED

# Unshielded アドレス
toolkit show-address \
  --network undeployed \
  --seed YOUR_SEED
```

## トランザクション生成

### シンプル送金

```bash
toolkit generate-txs \
  --src-url ws://localhost:9944 \
  --dest-url ws://localhost:9944 \
  single-tx \
  --shielded-amount 100 \
  --source-seed SOURCE_SEED \
  --destination-address DEST_ADDRESS
```

### バッチ生成（性能テスト用）

```bash
toolkit generate-txs \
  --src-url ws://localhost:9944 \
  --dest-url ws://localhost:9944 \
  batches -n 10 -b 5
```

## コントラクト操作

### デプロイ（ビルトイン）

```bash
toolkit generate-txs \
  --src-url ws://localhost:9944 \
  --dest-url ws://localhost:9944 \
  contract-simple deploy \
  --rng-seed YOUR_RNG_SEED
```

### デプロイ（カスタム）

```bash
# 1. Intent 生成
toolkit generate-intent deploy \
  -c ./contract.config.ts \
  --toolkit-js-path /path/to/toolkit-js \
  --coin-public YOUR_COIN_PUBLIC \
  --output-intent out/deploy.bin \
  --output-private-state out/ps.json \
  --output-zswap-state out/zswap.json \
  0

# 2. トランザクション送信
toolkit send-intent \
  --intent-file out/deploy.bin \
  --compiled-contract-dir ./contract/out
```

### Circuit 呼び出し

```bash
toolkit generate-intent circuit \
  -c ./contract.config.ts \
  --toolkit-js-path /path/to/toolkit-js \
  --coin-public YOUR_COIN_PUBLIC \
  --input-onchain-state ./contract_state.mn \
  --input-private-state ./ps.json \
  --contract-address CONTRACT_ADDRESS \
  --output-intent out/call.bin \
  --output-private-state out/ps_new.json \
  --output-zswap-state out/zswap.json \
  increment  # circuit 名
```

### コントラクトアドレス取得

```bash
toolkit contract-address \
  --src-file ./deploy_tx.mn
```

### コントラクト状態取得

```bash
toolkit contract-state \
  --src-url ws://localhost:9944 \
  --contract-address CONTRACT_ADDRESS \
  --dest-file out/state.bin
```

## ユーティリティ

### DUST 残高確認

```bash
toolkit dust-balance \
  --src-url ws://localhost:9944 \
  --seed YOUR_SEED
```

### トランザクション表示

```bash
toolkit show-transaction \
  --from-bytes \
  --src-file ./tx.mn
```

## Source と Destination

Toolkit は様々な入力/出力の組み合わせをサポートしています：

| パターン | 説明 |
|----------|------|
| Chain → Chain | チェーンから読み取り、チェーンに送信 |
| Chain → File | チェーンから読み取り、ファイルに保存 |
| File → Chain | ファイルから読み取り、チェーンに送信 |
| File → File | ファイルから読み取り、ファイルに保存 |

```bash
# ファイル入出力
toolkit generate-txs \
  --src-file genesis.mn \
  --dest-file output.mn \
  --to-bytes \
  ...
```

## 参考

- [Toolkit README](../submodules/midnight-node/util/toolkit/README.md)
- [Toolkit-JS README](../submodules/midnight-node/util/toolkit-js/README.md)


