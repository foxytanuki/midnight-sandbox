# 03. Compact 言語入門

Midnight のスマートコントラクト言語 **Compact** の基本を説明します。

## Compact とは

Compact は Midnight 専用のスマートコントラクト言語です。以下の特徴があります：

- **プライバシー保護**: ゼロ知識証明を自動生成
- **型安全**: 静的型付け
- **シンプル**: 学習しやすい構文

## インストール

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/download/compact-v0.3.0/compact-installer.sh | sh
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
compactc counter.compact out/

# 出力ファイル
# out/
# ├── index.js          # コントラクトランタイム
# ├── index.d.ts        # TypeScript 型定義
# ├── witnesses.js      # ウィットネス定義
# └── managed/          # ZK キー等
```

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

