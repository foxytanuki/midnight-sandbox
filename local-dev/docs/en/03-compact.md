# 03. Compact Language Introduction

This guide explains the basics of **Compact**, Midnight's smart contract language.

## What is Compact

Compact is a smart contract language designed specifically for Midnight. It has the following features:

- **Privacy Protection**: Automatically generates zero-knowledge proofs
- **Type Safety**: Statically typed
- **Simple**: Easy-to-learn syntax

## Installation

Install the latest Compact development tools:

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
```

After installation, you need to add it to your PATH (the installer will show instructions):

```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

After opening a new terminal or reloading your shell configuration, update to the latest toolchain:

```bash
compact update
```

Verify installation:

```bash
compact compile --version
```

## Hello World: Counter Contract

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

## Compilation

```bash
# Compile
compact compile counter.compact counter/

# Output file structure
# counter/
# ├── contract/
# │   ├── index.cjs          # Contract runtime
# │   ├── index.d.cts        # TypeScript type definitions
# │   └── ...
# ├── keys/                  # ZK proof keys
# │   ├── increment.prover
# │   ├── increment.verifier
# │   └── ...
# └── zkir/                  # ZK intermediate representation
#     ├── increment.zkir
#     └── ...
```

After compilation, `counter/contract/index.cjs` is generated. Import and use this file with midnight-js.

## Key Concepts

### Ledger (On-chain State)

```compact
ledger {
  owner: Bytes<32>;
  balance: Unsigned Integer;
  is_active: Boolean;
}
```

This is the **public state** visible to all participants.

### Witness (Private Computation)

```compact
witness local_data(): Bytes<32>;
```

This is **private computation** that runs only on the user's device.
You provide the implementation in TypeScript.

### Circuit (Function)

```compact
export circuit transfer(to: Bytes<32>, amount: Unsigned Integer): [] {
  // ...
}
```

This is the contract's entry point.

## Type System

| Type | Description | Example |
|------|-------------|---------|
| `Boolean` | Boolean value | `true`, `false` |
| `Unsigned Integer` | Unsigned integer | `0`, `100` |
| `Bytes<N>` | Fixed-length byte array | `Bytes<32>` |
| `Vector<T, N>` | Fixed-length array | `Vector<Unsigned Integer, 10>` |
| `Map<K, V>` | Map | `Map<Bytes<32>, Unsigned Integer>` |

## Editor Support

- **Zed**: [compact-zed](https://github.com/midnightntwrk/compact-zed)
- **Vim/Neovim**: [compact.vim](https://github.com/1NickPappas/compact.vim)

## Reference Links

- [Midnight Docs - Compact](https://docs.midnight.network/)
- [example-counter](https://github.com/midnightntwrk/example-counter)
- [example-bboard](https://github.com/midnightntwrk/example-bboard)

## Next Steps

- [04-deploy.md](04-deploy.md) - Contract deployment

