# Midnight Network Indexer

Midnight Networkのindexerは、ブロックチェーンデータを効率的に収集・インデックス化し、DAppやサービスが迅速にアクセスできるようにするためのコンポーネントです。

## 概要

### 新しいRustベースのIndexer（推奨）

Midnight Networkは、従来のScalaベースの`midnight-pubsub-indexer`に代わる、**新しいRustベースのindexer**を導入しました。

#### 主な特徴

* **高性能と信頼性**: Rustで完全に書き直され、パフォーマンスと信頼性が向上
* **モジュラー設計**: サービス指向の設計に移行し、メンテナンス性が向上
* **GraphQL API**: クエリ、ミューテーション、リアルタイムサブスクリプションをサポート
* **柔軟なデプロイメント**: ローカルバイナリまたは分散型マイクロサービスとしてデプロイ可能
* **データベースサポート**: PostgreSQLおよびSQLiteのストレージバックエンドをサポート
* **ウォレット統合**: Midnight Wallet SDK v4以降およびLace Wallet v2.0.0以降と完全に互換性

#### 機能

* ブロック履歴の取得
* データの処理とインデックス化
* GraphQL APIを通じたクエリ
* ミューテーション
* リアルタイムサブスクリプション

### 従来のScalaベースのIndexer（非推奨）

`midnight-pubsub-indexer`は、パブリッシュ・サブスクライブ（Pub-Sub）モデルを採用したindexerでしたが、**現在は非推奨**となっており、将来的に廃止される予定です。

#### 特徴（参考）

* パブリッシュ・サブスクライブ（Pub-Sub）モデル
* ネットワーク上のイベントやトランザクションをリアルタイムでキャッチ
* データベースに格納
* Apache License V2.0の下で提供

## 使用方法

### 新しいRustベースのIndexer

詳細な使用方法、移行手順、リリースノートについては、公式ドキュメントを参照してください：

* [Midnight Network公式ドキュメント](https://docs.midnight.network)
* [Dev Diaries](https://midnight.network/blog)

### Dockerイメージ

```bash
# 従来のindexer（非推奨）
docker pull midnightnetwork/midnight-pubsub-indexer:latest
```

**注意**: 新しいRustベースのindexerのDockerイメージについては、公式ドキュメントを確認してください。

## トランザクション検索への活用

Indexerを使用することで、以下のような効率的なトランザクション検索が可能になります：

1. **トランザクションハッシュでの検索**: インデックス化されたデータから直接検索
2. **アカウントアドレスでの検索**: 特定のアカウントに関連するすべてのトランザクションを高速に取得
3. **ブロック範囲での検索**: 指定したブロック範囲内のトランザクションを効率的に検索
4. **リアルタイム監視**: GraphQLサブスクリプションを使用して、新しいトランザクションをリアルタイムで監視

## 移行について

現在`midnight-pubsub-indexer`を使用している開発者は、新しいRustベースのindexerへの移行を検討することが推奨されます。移行手順については、公式ドキュメントを参照してください。

## 参考リンク

* [Midnight Network公式サイト](https://midnight.network)
* [Midnight Network公式ドキュメント](https://docs.midnight.network)
* [GitHubリポジトリ](https://github.com/midnightntwrk/midnight-indexer)（新しいRustベースのindexer）

