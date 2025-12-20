# リソースと次のステップ

## 公式リソース

### ドキュメント

| リソース | URL | 説明 |
|----------|-----|------|
| Midnight Docs | https://docs.midnight.network/ | 公式ドキュメント |
| Midnight Foundation | https://midnight.network/ | 財団公式サイト |
| Midnight Blog | https://midnight.network/blog | 技術ブログ |

### GitHub リポジトリ

| リポジトリ | 説明 |
|-----------|------|
| [midnight-node](https://github.com/midnightntwrk/midnight-node) | ブロックチェーンノード実装 |
| [midnight-ledger](https://github.com/midnightntwrk/midnight-ledger) | 台帳・トランザクション処理 |
| [midnight-zk](https://github.com/midnightntwrk/midnight-zk) | ゼロ知識証明システム |
| [midnight-indexer](https://github.com/midnightntwrk/midnight-indexer) | インデクサー |
| [midnight-wallet](https://github.com/midnightntwrk/midnight-wallet) | ウォレット SDK |
| [midnight-js](https://github.com/midnightntwrk/midnight-js) | dApp 開発フレームワーク |
| [partner-chains](https://github.com/input-output-hk/partner-chains) | Cardano Partner Chain |
| [midnight-docs](https://github.com/midnightntwrk/midnight-docs) | ドキュメントソース |

### サンプルプロジェクト

| リポジトリ | 説明 |
|-----------|------|
| [example-counter](https://github.com/midnightntwrk/example-counter) | シンプルなカウンター例 |
| [example-bboard](https://github.com/midnightntwrk/example-bboard) | 掲示板 dApp (React UI 付き) |
| [midnight-awesome-dapps](https://github.com/midnightntwrk/midnight-awesome-dapps) | コミュニティ dApp 集 |
| [create-mn-app](https://github.com/midnightntwrk/create-mn-app) | dApp スキャフォールド CLI |

### 開発ツール

| ツール | 説明 |
|--------|------|
| [compact-tree-sitter](https://github.com/midnightntwrk/compact-tree-sitter) | Compact 言語パーサー |
| [compact-zed](https://github.com/midnightntwrk/compact-zed) | Zed エディタ拡張 |
| [midnight-trusted-setup](https://github.com/midnightntwrk/midnight-trusted-setup) | Trusted Setup |
| [midnight-node-docker](https://github.com/midnightntwrk/midnight-node-docker) | Docker 環境 |
| [midnight-dapp-connector-api](https://github.com/midnightntwrk/midnight-dapp-connector-api) | dApp コネクタ API |

## npm パッケージ

### コア SDK

```bash
# dApp 開発用
pnpm add @midnight-ntwrk/midnight-js-contracts@latest
pnpm add @midnight-ntwrk/midnight-js-types@latest
pnpm add @midnight-ntwrk/compact-runtime@latest
```

### プロバイダー

```bash
# データプロバイダー
pnpm add @midnight-ntwrk/midnight-js-indexer-public-data-provider@latest

# 証明プロバイダー
pnpm add @midnight-ntwrk/midnight-js-http-client-proof-provider@latest

# プライベート状態
pnpm add @midnight-ntwrk/midnight-js-level-private-state-provider@latest

# ZK アーティファクト
pnpm add @midnight-ntwrk/midnight-js-fetch-zk-config-provider@latest
pnpm add @midnight-ntwrk/midnight-js-node-zk-config-provider@latest
```

### ウォレット連携

```bash
# ウォレット SDK
pnpm add @midnight-ntwrk/wallet@latest
pnpm add @midnight-ntwrk/dapp-connector-api@latest
```

### ランタイム

```bash
# Ledger WASM
pnpm add @midnight-ntwrk/ledger@latest

# オンチェーンランタイム
pnpm add @midnight-ntwrk/onchain-runtime@latest
```

## 学習ロードマップ

### Week 1: 基礎理解

```
Day 1-2: Midnight の概念理解
├── 本ガイドブック 00-02 を読む
├── 公式ドキュメント概要を確認
└── EVM/Solana との違いを理解

Day 3-4: Compact 言語の習得
├── 本ガイドブック 03 を読む
├── example-counter を動かす
└── 簡単なコントラクトを書く

Day 5-7: 開発環境構築
├── Docker 環境のセットアップ
├── ローカルノードの起動
└── Indexer の接続確認
```

### Week 2: 実践開発

```
Day 1-3: SDK の習得
├── 本ガイドブック 04 を読む
├── example-bboard を動かす
└── コントラクト連携を実装

Day 4-5: プライバシー機能
├── witness の実装
├── プライベート状態の管理
└── ZK 証明の理解

Day 6-7: 統合テスト
├── E2E テストの作成
├── ウォレット連携
└── 本番環境への準備
```

### Week 3: 応用開発

```
Day 1-3: 複雑な dApp
├── 複数コントラクトの連携
├── Zswap の活用
└── パフォーマンス最適化

Day 4-5: 本番準備
├── セキュリティレビュー
├── インフラ構築
└── 監視・ログ設定

Day 6-7: デプロイ
├── テストネットデプロイ
├── UI/UX 調整
└── ドキュメント整備
```

## クイックスタート

### 1. サンプルプロジェクトの実行

```bash
# example-counter をクローン
git clone https://github.com/midnightntwrk/example-counter
cd example-counter

# 依存関係インストール
pnpm install

# ローカル環境起動
docker-compose up -d

# ビルドと実行
pnpm build
pnpm start
```

### 2. create-mn-app でプロジェクト作成

```bash
# プロジェクト生成
npx create-mn-app@latest my-dapp

# セットアップ
cd my-dapp
pnpm install

# 開発開始
pnpm dev
```

### 3. 既存コントラクトへの接続

```typescript
import { findContract } from '@midnight-ntwrk/midnight-js-contracts';

const contract = await findContract({
  runtime: myContractRuntime,
  witnesses: myWitnesses,
  publicDataProvider,
  proofProvider,
  privateStateProvider,
  zkConfigProvider,
  contractAddress: '0x...',
});

// circuit を呼び出し
const result = await contract.call('myCircuit', { arg1: 42n });
```

## トラブルシューティング

### よくある問題

| 問題 | 解決策 |
|------|--------|
| コンパイルエラー | `compactc` のバージョン確認 |
| 証明生成失敗 | Proof Server のログ確認 |
| 接続エラー | Node/Indexer の URL 確認 |
| タイムアウト | タイムアウト値の増加 |

### デバッグのヒント

```bash
# Node のログ
docker logs -f midnight-node

# Indexer のログ  
docker logs -f midnight-indexer

# Proof Server のログ
docker logs -f proof-server
```

## コミュニティ

### サポート

| チャンネル | 用途 |
|-----------|------|
| GitHub Issues | バグ報告、機能リクエスト |
| Discord | 一般的な質問、ディスカッション |
| Twitter/X | アナウンス、アップデート |

### 貢献

1. **コード貢献**: GitHub でプルリクエスト
2. **ドキュメント改善**: midnight-docs リポジトリ
3. **サンプル作成**: midnight-awesome-dapps への追加
4. **コミュニティサポート**: Discord での質問回答

## 本ガイドブックのサマリー

| 章 | 内容 |
|----|------|
| [00-introduction](./00-introduction.md) | Midnight の概要、なぜ選ぶべきか |
| [01-architecture](./01-architecture.md) | コンポーネント構成、データフロー |
| [02-core-concepts](./02-core-concepts.md) | ZK、Zswap、状態管理の詳細 |
| [03-compact-language](./03-compact-language.md) | Compact 言語による開発 |
| [04-sdk-development](./04-sdk-development.md) | midnight-js、ウォレット連携 |
| [05-infrastructure](./05-infrastructure.md) | Node、Indexer の運用 |
| [06-comparison](./06-comparison.md) | EVM/Solana との詳細比較 |
| [07-resources](./07-resources.md) | リソース、次のステップ |

## 用語集

| 用語 | 説明 |
|------|------|
| **Compact** | Midnight のスマートコントラクト言語 |
| **Circuit** | Compact の関数（ZK 回路として実行） |
| **Witness** | プライベートな計算を行う関数 |
| **Ledger** | パブリックなオンチェーン状態 |
| **DUST** | シールド（秘匿）されたネイティブトークン |
| **Night** | アンシールドなネイティブトークン |
| **Zswap** | シールドトークンのプロトコル |
| **ZKIR** | ゼロ知識中間表現 |
| **Commitment** | コインの存在証明 |
| **Nullifier** | コインの使用証明（二重使用防止） |
| **Impact VM** | オンチェーン仮想マシン |
| **Partner Chain** | Cardano のサイドチェーン |

---

**ガイドブック完了！** 

質問やフィードバックがあれば、GitHub Issues または Discord でお知らせください。

Happy Building on Midnight! 🌙

