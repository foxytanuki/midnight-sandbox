# 04. コントラクトデプロイ

ローカルチェーンへのコントラクトデプロイ方法を説明します。

## 前提条件

- ローカル環境が起動していること (`make up`)
- Compact コントラクトがコンパイル済みであること

## 方法1: midnight-js を使用（推奨）

dApp 開発時はこの方法を使います。

### 1. プロジェクトセットアップ

```bash
mkdir my-dapp && cd my-dapp
npm init -y
npm install @midnight-ntwrk/midnight-js-contracts \
            @midnight-ntwrk/midnight-js-types \
            @midnight-ntwrk/midnight-js-level-private-state-provider \
            @midnight-ntwrk/midnight-js-indexer-public-data-provider \
            @midnight-ntwrk/midnight-js-http-client-proof-provider \
            @midnight-ntwrk/midnight-js-node-zk-config-provider \
            @midnight-ntwrk/midnight-js-network-id \
            @midnight-ntwrk/wallet \
            @midnight-ntwrk/ledger \
            @midnight-ntwrk/zswap \
            rxjs \
            ws
```

### 2. デプロイスクリプトの作成

```typescript
import * as fs from "fs";
import * as path from "path";
import * as Rx from "rxjs";
import WebSocket from "ws";

import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { createBalancedTx } from "@midnight-ntwrk/midnight-js-types";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { 
  setNetworkId, 
  NetworkId,
  getLedgerNetworkId,
  getZswapNetworkId 
} from "@midnight-ntwrk/midnight-js-network-id";
import { WalletBuilder } from "@midnight-ntwrk/wallet";
import { nativeToken, Transaction } from "@midnight-ntwrk/ledger";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";

// Fix WebSocket for Node.js environment
// @ts-ignore
globalThis.WebSocket = WebSocket;

// ローカル環境用の設定
const LOCAL_CONFIG = {
  indexer: "http://localhost:8088/api/v1/graphql",
  indexerWS: "ws://localhost:8088/api/v1/graphql/ws",
  node: "http://localhost:9944",
  proofServer: "http://localhost:6300"
};

// ジェネシスシード（ローカル開発用）
const GENESIS_SEED = "0000000000000000000000000000000000000000000000000000000000000001";

const waitForFunds = (wallet: any) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.tap((state: any) => {
        if (state.syncProgress) {
          console.log(
            `Sync progress: synced=${state.syncProgress.synced}, sourceGap=${state.syncProgress.lag.sourceGap}`
          );
        }
      }),
      Rx.filter((state: any) => state.syncProgress?.synced === true),
      Rx.map((s: any) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance: bigint) => balance > 0n),
      Rx.tap((balance: bigint) => console.log(`Wallet funded with balance: ${balance}`))
    )
  );

async function main() {
  console.log("=== Contract Deployment ===\n");

  // Configure for local devnet
  setNetworkId(NetworkId.Undeployed);

  // Load compiled contract
  console.log("Loading contract...");
  const contractPath = path.join(process.cwd(), "contract");
  const contractModulePath = path.join(contractPath, "contract", "index.cjs");

  if (!fs.existsSync(contractModulePath)) {
    console.error("Contract not found! Make sure contract is compiled.");
    console.error(`Expected path: ${contractModulePath}`);
    process.exit(1);
  }

  const ContractModule = await import(contractModulePath);
  const contractInstance = new ContractModule.Contract({});

  console.log("Contract loaded successfully");

  // Build wallet
  console.log("\nBuilding wallet from genesis seed...");
  const wallet = await WalletBuilder.buildFromSeed(
    LOCAL_CONFIG.indexer,
    LOCAL_CONFIG.indexerWS,
    LOCAL_CONFIG.proofServer,
    LOCAL_CONFIG.node,
    GENESIS_SEED,
    getZswapNetworkId(),
    "info"
  );

  console.log("Wallet built, starting sync...");
  await wallet.start();

  // Wait for wallet to sync and have funds
  console.log("Waiting for wallet sync and funds...");
  await waitForFunds(wallet);

  // Create wallet provider
  const walletState: any = await Rx.firstValueFrom(wallet.state());

  const walletProvider = {
    coinPublicKey: walletState.coinPublicKey,
    encryptionPublicKey: walletState.encryptionPublicKey,
    balanceTx(tx: any, newCoins: any): Promise<any> {
      return wallet
        .balanceTransaction(
          ZswapTransaction.deserialize(
            tx.serialize(getLedgerNetworkId()),
            getZswapNetworkId()
          ),
          newCoins
        )
        .then((result: any) => wallet.proveTransaction(result))
        .then((zswapTx: any) =>
          Transaction.deserialize(
            zswapTx.serialize(getZswapNetworkId()),
            getLedgerNetworkId()
          )
        )
        .then(createBalancedTx);
    },
    submitTx(tx: any): Promise<any> {
      return wallet.submitTransaction(tx);
    }
  };

  // Configure providers
  console.log("\nSetting up providers...");
  const zkConfigPath = path.join(contractPath);
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: "my-contract-state"
    }),
    publicDataProvider: indexerPublicDataProvider(
      LOCAL_CONFIG.indexer,
      LOCAL_CONFIG.indexerWS
    ),
    zkConfigProvider: new NodeZkConfigProvider(zkConfigPath),
    proofProvider: httpClientProofProvider(LOCAL_CONFIG.proofServer),
    walletProvider: walletProvider,
    midnightProvider: walletProvider
  };

  // Deploy contract
  console.log("\nDeploying contract (this may take a while)...");

  const deployed = await deployContract(providers, {
    contract: contractInstance,
    privateStateId: "myContractState",
    initialPrivateState: {}
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;

  // Save deployment info
  console.log("\n✅ DEPLOYED!");
  console.log(`Contract address: ${contractAddress}`);

  const info = {
    contractAddress,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync("deployment.json", JSON.stringify(info, null, 2));
  console.log("\nSaved to deployment.json");

  // Close wallet
  await wallet.close();
  console.log("\nWallet closed. Deployment complete!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
```

## 方法2: Toolkit を使用

テストやスクリプトでの自動化に適しています。

### 1. シンプルなデプロイ（ビルトインコントラクト）

```bash
# ビルトインコントラクト（テスト用）
midnight-node-toolkit generate-txs \
  --src-url ws://localhost:9944 \
  --dest-url ws://localhost:9944 \
  contract-simple deploy \
  --rng-seed '0000000000000000000000000000000000000000000000000000000000000037'
```

### 2. カスタムコントラクト

```bash
# 1. Intent を生成
midnight-node-toolkit generate-intent deploy \
  -c ./contract.config.ts \
  --toolkit-js-path /path/to/toolkit-js \
  --coin-public YOUR_COIN_PUBLIC_KEY \
  --output-intent out/deploy.bin \
  --output-private-state out/ps.json \
  --output-zswap-state out/zswap.json \
  0

# 2. トランザクション送信
midnight-node-toolkit send-intent \
  --intent-file out/deploy.bin \
  --compiled-contract-dir ./contract/out
```

### 3. コントラクトアドレス取得

```bash
midnight-node-toolkit contract-address \
  --src-file ./deploy_tx.mn
```

詳細は [06-toolkit.md](06-toolkit.md) を参照してください。

## デプロイの確認

### deployment.json で確認

デプロイが成功すると、`deployment.json` ファイルが作成されます：

```json
{
  "contractAddress": "YOUR_CONTRACT_ADDRESS",
  "deployedAt": "2024-01-01T00:00:00.000Z"
}
```

### Indexer でクエリ

```graphql
query {
  contractState(address: "YOUR_CONTRACT_ADDRESS") {
    state
  }
}
```

### Toolkit でウォレット確認

```bash
midnight-node-toolkit show-wallet \
  --src-url ws://localhost:9944 \
  --seed 0000000000000000000000000000000000000000000000000000000000000001
```

## トラブルシューティング

### "Insufficient funds" エラー

ジェネシスウォレットを使用していることを確認してください。ローカル開発環境では、ジェネシスシードが自動的に資金を持っています。

```typescript
// ジェネシスシード（ローカル開発用）
const GENESIS_SEED = "0000000000000000000000000000000000000000000000000000000000000001";
```

ウォレットの同期が完了し、資金が確認されるまで待機する必要があります。

### "Contract not found" エラー

コントラクトがコンパイルされていることを確認してください：

```bash
# コントラクトディレクトリで
compact compile counter.compact counter/
```

コンパイル後、`contract/counter/contract/index.cjs` が存在することを確認してください。

### "Proof generation failed"

Proof Server が起動しているか確認：

```bash
curl http://localhost:6300/health
```

### ウォレットの同期が完了しない

ローカル環境が完全に起動していることを確認：

```bash
# すべてのサービスが起動しているか確認
make status
```

## 次のステップ

- [05-dapp.md](05-dapp.md) - midnight-js で dApp 開発


