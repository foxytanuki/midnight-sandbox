# 03. Compact 言語入門

Midnight のスマートコントラクト言語 **Compact** の基本を説明します。

## Compact とは

Compact は Midnight 専用のスマートコントラクト言語です。以下の特徴があります：

- **プライバシー保護**: ゼロ知識証明を自動生成
- **型安全**: 静的型付け
- **シンプル**: 学習しやすい構文

## インストール

最新の Compact 開発ツールをインストール：

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
```

インストール後、PATH に追加する必要があります（インストーラーが指示を表示します）：

```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

新しいターミナルを開くか、シェル設定を再読み込み後、最新のツールチェーンを更新：

```bash
compact update
```

インストール確認：

```bash
compact compile --version
```

## Hello World: Counter コントラクト

```compact
// counter.compact
pragma midnight 0.3.0;

ledger {
  count: Unsigned Integer;
}

export circuit increment(): [] {
  ledger.count = ledger.count + 1;
}

export circuit decrement(): [] {
  ledger.count = ledger.count - 1;
}

export circuit get_count(): Unsigned Integer {
  return ledger.count;
}
```

## コンパイル

```bash
# コンパイル
compact compile counter.compact counter/

# 出力ファイル構造
# counter/
# ├── contract/
# │   ├── index.cjs          # コントラクトランタイム
# │   ├── index.d.cts        # TypeScript 型定義
# │   └── ...
# ├── keys/                  # ZK 証明キー
# │   ├── increment.prover
# │   ├── increment.verifier
# │   └── ...
# └── zkir/                  # ZK 中間表現
#     ├── increment.zkir
#     └── ...
```

コンパイル後、`counter/contract/index.cjs` が生成されます。このファイルを midnight-js でインポートして使用します。

## 主要な概念

### Ledger（オンチェーン状態）

```compact
ledger {
  owner: Bytes<32>;
  balance: Unsigned Integer;
  is_active: Boolean;
}
```

すべての参加者が見える**公開状態**です。

### Witness（プライベート計算）

```compact
witness local_data(): Bytes<32>;
```

ユーザーのデバイス上でのみ実行される**プライベート計算**です。
TypeScript で実装を提供します。

### Circuit（関数）

```compact
export circuit transfer(to: Bytes<32>, amount: Unsigned Integer): [] {
  // ...
}
```

コントラクトのエントリーポイントです。

## 型システム

| 型 | 説明 | 例 |
|----|------|-----|
| `Boolean` | 真偽値 | `true`, `false` |
| `Unsigned Integer` | 符号なし整数 | `0`, `100` |
| `Bytes<N>` | 固定長バイト列 | `Bytes<32>` |
| `Vector<T, N>` | 固定長配列 | `Vector<Unsigned Integer, 10>` |
| `Map<K, V>` | マップ | `Map<Bytes<32>, Unsigned Integer>` |

## エディタサポート

- **Zed**: [compact-zed](https://github.com/midnightntwrk/compact-zed)
- **Vim/Neovim**: [compact.vim](https://github.com/1NickPappas/compact.vim)

## 参考リンク

- [Midnight Docs - Compact](https://docs.midnight.network/)
- [example-counter](https://github.com/midnightntwrk/example-counter)
- [example-bboard](https://github.com/midnightntwrk/example-bboard)

## 次のステップ

- [04-deploy.md](04-deploy.md) - コントラクトデプロイ

