# Midnight Network RPC API リファレンス

Midnight NetworkはPolkadot RPCに準拠したJSON-RPCインターフェースを提供しています。このドキュメントでは、Polkadot標準のRPCメソッドと、Midnight固有のRPCメソッドについて説明します。

## 目次

* [基本情報](#基本情報)
* [Polkadot標準RPCメソッド](#polkadot標準rpcメソッド)
* [Midnight固有RPCメソッド](#midnight固有rpcメソッド)
* [使用例](#使用例)

## 基本情報

### エンドポイント

* **Testnet**: `https://rpc.testnet-02.midnight.network/`

### JSON-RPC形式

Midnight NetworkはJSON-RPC 2.0標準に準拠しています。すべてのリクエストは以下の形式で送信します:

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": [],
  "id": 1
}
```

### リクエスト例

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "system_chain",
    "params": [],
    "id": 1
  }' \
  https://rpc.testnet-02.midnight.network/
```

## Polkadot標準RPCメソッド

Midnight NetworkはPolkadot RPC標準に準拠しており、以下のカテゴリのメソッドをサポートしています。

### author

トランザクションの送信と管理に関するメソッド。

* `author_pendingExtrinsics()`: 保留中のextrinsicを取得
* `author_submitExtrinsic(extrinsic: Extrinsic)`: extrinsicを送信
* `author_submitAndWatchExtrinsic(extrinsic: Extrinsic)`: extrinsicを送信して監視

### chain

ブロックチェーンの状態とブロック情報を取得するメソッド。

* `chain_getBlock(hash?: BlockHash)`: ブロックのヘッダーとボディを取得（ブロック内のextrinsicを含む）
* `chain_getBlockHash(blockNumber?: BlockNumber)`: 特定のブロックのハッシュを取得
* `chain_getFinalizedHead()`: 最終確定されたブロックのハッシュを取得
* `chain_getHeader(hash?: BlockHash)`: 特定のブロックのヘッダーを取得
* `chain_subscribeNewHeads()`: 新しいブロックヘッダーを購読
* `chain_subscribeFinalizedHeads()`: 最終確定されたブロックヘッダーを購読

**注意**: Polkadot/Substrateでは、Ethereumのような直接のトランザクションハッシュ検索メソッドは標準RPCに含まれていません。トランザクション（extrinsic）はブロック内に含まれるため、`chain_getBlock`でブロックを取得し、その中のextrinsicを検索する必要があります。

### state

ストレージとランタイム状態をクエリするメソッド。

* `state_getStorage(key: StorageKey, at?: BlockHash)`: ストレージエントリを取得
* `state_getStorageHash(key: StorageKey, at?: BlockHash)`: ストレージエントリのハッシュを取得
* `state_getStorageSize(key: StorageKey, at?: BlockHash)`: ストレージエントリのサイズを取得
* `state_getKeys(key: StorageKey, at?: BlockHash)`: プレフィックスに一致するキーを取得
* `state_getKeysPaged(key: StorageKey, count: u32, startKey?: StorageKey, at?: BlockHash)`: ページネーション付きでキーを取得
* `state_getMetadata(at?: BlockHash)`: ランタイムメタデータを取得
* `state_getRuntimeVersion(at?: BlockHash)`: ランタイムバージョンを取得
* `state_queryStorage(keys: Vec<StorageKey>, fromBlock: Hash, toBlock?: BlockHash)`: 複数のブロックにわたるストレージ変更をクエリ
* `state_subscribeStorage(keys?: Vec<StorageKey>)`: ストレージ変更を購読

### system

ノードのシステム情報を取得するメソッド。

* `system_chain()`: チェーン名を取得
* `system_name()`: ノード名を取得
* `system_version()`: ノードバージョンを取得
* `system_health()`: ノードのヘルス状態を取得
* `system_peers()`: 接続されているピアのリストを取得
* `system_properties()`: チェーンのプロパティを取得
* `system_accountNextIndex(accountId: AccountId)`: アカウントの次のトランザクションインデックスを取得

### payment

トランザクション手数料に関するメソッド。

* `payment_queryInfo(extrinsic: Bytes, at?: BlockHash)`: extrinsicの手数料情報を取得
* `payment_queryFeeDetails(extrinsic: Bytes, at?: BlockHash)`: extrinsicの手数料詳細を取得

### rpc

RPCメソッドの情報を取得するメソッド。

* `rpc_methods()`: 利用可能なRPCメソッドのリストを取得

詳細なメソッド一覧については、[Polkadot.js RPC ドキュメント](https://polkadot.js.org/docs/substrate/rpc/)を参照してください。

## Midnight固有RPCメソッド

Midnight Networkは、スマートコントラクトの状態管理とゼロ知識証明に関連する独自のRPCメソッドを提供しています。

### midnight\_jsonContractState

JSONエンコードされたスマートコントラクトの状態を取得します。

**メソッド名**: `midnight_jsonContractState`

**パラメータ**:

* `contract_address: String` - コントラクトアドレス
* `at: Option<BlockHash>` - ブロックハッシュ（オプション、指定しない場合は最新ブロック）

**戻り値**: `String` - JSONエンコードされたコントラクト状態

**エラー**: `StateRpcError`

**例**:

```json
{
  "jsonrpc": "2.0",
  "method": "midnight_jsonContractState",
  "params": ["contract_address_here"],
  "id": 1
}
```

### midnight\_contractState

生の（バイナリエンコードされた）コントラクト状態を取得します。

**メソッド名**: `midnight_contractState`

**パラメータ**:

* `contract_address: String` - コントラクトアドレス
* `at: Option<BlockHash>` - ブロックハッシュ（オプション、指定しない場合は最新ブロック）

**戻り値**: `String` - 生の（バイナリエンコードされた）コントラクト状態

**エラー**: `StateRpcError`

**例**:

```json
{
  "jsonrpc": "2.0",
  "method": "midnight_contractState",
  "params": ["contract_address_here"],
  "id": 1
}
```

### midnight\_unclaimedAmount

受益者アドレスの未請求トークンまたは報酬の額を取得します。

**メソッド名**: `midnight_unclaimedAmount`

**パラメータ**:

* `beneficiary: String` - 受益者アドレス
* `at: Option<BlockHash>` - ブロックハッシュ（オプション、指定しない場合は最新ブロック）

**戻り値**: `u128` - 未請求の額

**エラー**: `StateRpcError`

**例**:

```json
{
  "jsonrpc": "2.0",
  "method": "midnight_unclaimedAmount",
  "params": ["beneficiary_address_here"],
  "id": 1
}
```

### midnight\_zswapChainState

ZSwapチェーンの状態を取得します。ゼロ知識状態ロールアップに使用されます。

**メソッド名**: `midnight_zswapChainState`

**パラメータ**:

* `contract_address: String` - コントラクトアドレス
* `at: Option<BlockHash>` - ブロックハッシュ（オプション、指定しない場合は最新ブロック）

**戻り値**: `String` - ZSwapチェーン状態

**エラー**: `StateRpcError`

**例**:

```json
{
  "jsonrpc": "2.0",
  "method": "midnight_zswapChainState",
  "params": ["contract_address_here"],
  "id": 1
}
```

### midnight\_apiVersions

サポートされているRPC APIバージョンのリストを取得します。ツールの互換性チェックに有用です。

**メソッド名**: `midnight_apiVersions`

**パラメータ**: なし

**戻り値**: `Vec<u32>` - サポートされているAPIバージョンのリスト

**エラー**: なし

**例**:

```json
{
  "jsonrpc": "2.0",
  "method": "midnight_apiVersions",
  "params": [],
  "id": 1
}
```

### midnight\_ledgerVersion

指定されたブロックでのレジャーの完全な状態のスナップショットを提供します。

**メソッド名**: `midnight_ledgerVersion`

**パラメータ**:

* `at: Option<BlockHash>` - ブロックハッシュ（オプション、指定しない場合は最新ブロック）

**戻り値**: `String` - レジャーバージョン

**エラー**: `BlockRpcError`

**例**:

```json
{
  "jsonrpc": "2.0",
  "method": "midnight_ledgerVersion",
  "params": [],
  "id": 1
}
```

### midnight\_jsonBlock

JSONエンコードされたブロック情報を取得します。ブロック内のextrinsic（トランザクション）を含みます。

**メソッド名**: `midnight_jsonBlock`

**パラメータ**:

* `at: Option<BlockHash>` - ブロックハッシュ（オプション、指定しない場合は最新ブロック）

**戻り値**: `String` - JSONエンコードされたブロック情報

**エラー**: `BlockRpcError`

**例**:

```json
{
  "jsonrpc": "2.0",
  "method": "midnight_jsonBlock",
  "params": [],
  "id": 1
}
```

**注意**: このメソッドを使用してブロックを取得し、その中のextrinsicを検索することで、トランザクション（extrinsic）を検索できます。

### midnight\_decodeEvents

イベントをデコードします。

**メソッド名**: `midnight_decodeEvents`

**パラメータ**:

* `events: String` - エンコードされたイベントデータ

**戻り値**: `String` - デコードされたイベント情報

**エラー**: `StateRpcError`

**例**:

```json
{
  "jsonrpc": "2.0",
  "method": "midnight_decodeEvents",
  "params": ["encoded_events_here"],
  "id": 1
}
```

### midnight\_zswapStateRoot

ZSwap状態ルートを取得します。

**メソッド名**: `midnight_zswapStateRoot`

**パラメータ**:

* `at: Option<BlockHash>` - ブロックハッシュ（オプション、指定しない場合は最新ブロック）

**戻り値**: `String` - ZSwap状態ルート

**エラー**: `StateRpcError`

**例**:

```json
{
  "jsonrpc": "2.0",
  "method": "midnight_zswapStateRoot",
  "params": [],
  "id": 1
}
```

## トランザクション（Extrinsic）の検索について

Polkadot/Substrateでは、Ethereumのような直接のトランザクションハッシュ検索メソッドは標準RPCに含まれていません。これは、SubstrateのアーキテクチャがEthereumとは異なるためです。

### トランザクションを検索する方法

1. **ブロックを取得してextrinsicを検索**: `chain_getBlock`または`midnight_jsonBlock`でブロックを取得し、その中のextrinsicを検索します。

2. **ブロック範囲を検索**: 複数のブロックを順次取得し、各ブロック内のextrinsicを検索します。

3. **Indexerを使用**: Midnight Networkのindexerを使用してトランザクションを検索する方法もあります。

### 実装例

```bash
# 1. 最新ブロックを取得
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "midnight_jsonBlock",
    "params": [],
    "id": 1
  }' \
  https://rpc.testnet-02.midnight.network/

# 2. 特定のブロックを取得
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "chain_getBlock",
    "params": ["block_hash_here"],
    "id": 1
  }' \
  https://rpc.testnet-02.midnight.network/
```

取得したブロックの`extrinsics`フィールドに、そのブロックに含まれるすべてのextrinsic（トランザクション）が含まれています。

## 使用例

### チェーン名を取得

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "system_chain",
    "params": [],
    "id": 1
  }' \
  https://rpc.testnet-02.midnight.network/
```

### コントラクト状態を取得

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "midnight_jsonContractState",
    "params": ["your_contract_address"],
    "id": 1
  }' \
  https://rpc.testnet-02.midnight.network/
```

### サポートされているAPIバージョンを取得

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "midnight_apiVersions",
    "params": [],
    "id": 1
  }' \
  https://rpc.testnet-02.midnight.network/
```

## エラーハンドリング

RPCリクエストが失敗した場合、以下の形式でエラーが返されます:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  },
  "id": 1
}
```

一般的なエラーコード:

* `-32600`: Invalid Request
* `-32601`: Method not found
* `-32602`: Invalid params
* `-32603`: Internal error

Midnight固有のエラー:

* `StateRpcError`: 状態関連のRPCエラー
* `BlockRpcError`: ブロック関連のRPCエラー

## 参考資料

* [Polkadot.js RPC ドキュメント](https://polkadot.js.org/docs/substrate/rpc/)
* [JSON-RPC 2.0 仕様](https://www.jsonrpc.org/specification)
* [Midnight Network ドキュメント](https://docs.midnight.network/)
