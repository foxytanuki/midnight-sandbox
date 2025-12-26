# 06. Toolkit Usage

This guide explains how to use `midnight-node-toolkit`.

## What is Toolkit

A CLI tool for local development, testing, and CI/CD.

| Feature | Description |
|---------|-------------|
| Transaction Generation | Batch generation, performance testing |
| Wallet Operations | Balance check, address display |
| Contract Operations | Deploy, invoke |
| Utilities | Genesis generation, TX parsing |

## Installation

```bash
# Using Docker image (recommended)
# Use latest stable version
docker pull midnightntwrk/midnight-node-toolkit:latest-main

# Set alias
alias toolkit='docker run --network host -v $(pwd):/work -w /work midnightntwrk/midnight-node-toolkit:latest-main'
```

For a specific version:

```bash
# Example: version 0.18.0-rc.7
docker pull midnightntwrk/midnight-node-toolkit:0.18.0-rc.7
alias toolkit='docker run --network host -v $(pwd):/work -w /work midnightntwrk/midnight-node-toolkit:0.18.0-rc.7'
```

## Basic Commands

### Version Check

```bash
toolkit version
# Node: x.x.x
# Ledger: x.x.x
# Compactc: x.x.x
```

### Check Wallet Balance

```bash
toolkit show-wallet \
  --src-url ws://localhost:9944 \
  --seed 0000000000000000000000000000000000000000000000000000000000000001
```

### Display Address

```bash
# Shielded address
toolkit show-address \
  --network undeployed \
  --shielded \
  --seed YOUR_SEED

# Unshielded address
toolkit show-address \
  --network undeployed \
  --seed YOUR_SEED
```

## Transaction Generation

### Simple Transfer

```bash
toolkit generate-txs \
  --src-url ws://localhost:9944 \
  --dest-url ws://localhost:9944 \
  single-tx \
  --shielded-amount 100 \
  --source-seed SOURCE_SEED \
  --destination-address DEST_ADDRESS
```

### Batch Generation (for Performance Testing)

```bash
toolkit generate-txs \
  --src-url ws://localhost:9944 \
  --dest-url ws://localhost:9944 \
  batches -n 10 -b 5
```

## Contract Operations

### Deploy (Built-in)

```bash
toolkit generate-txs \
  --src-url ws://localhost:9944 \
  --dest-url ws://localhost:9944 \
  contract-simple deploy \
  --rng-seed YOUR_RNG_SEED
```

### Deploy (Custom)

```bash
# 1. Generate Intent
toolkit generate-intent deploy \
  -c ./contract.config.ts \
  --toolkit-js-path /path/to/toolkit-js \
  --coin-public YOUR_COIN_PUBLIC \
  --output-intent out/deploy.bin \
  --output-private-state out/ps.json \
  --output-zswap-state out/zswap.json \
  0

# 2. Send Transaction
toolkit send-intent \
  --intent-file out/deploy.bin \
  --compiled-contract-dir ./contract/out
```

### Circuit Invocation

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
  increment  # circuit name
```

### Get Contract Address

```bash
toolkit contract-address \
  --src-file ./deploy_tx.mn
```

### Get Contract State

```bash
toolkit contract-state \
  --src-url ws://localhost:9944 \
  --contract-address CONTRACT_ADDRESS \
  --dest-file out/state.bin
```

## Utilities

### Check DUST Balance

```bash
toolkit dust-balance \
  --src-url ws://localhost:9944 \
  --seed YOUR_SEED
```

### Display Transaction

```bash
toolkit show-transaction \
  --from-bytes \
  --src-file ./tx.mn
```

## Source and Destination

Toolkit supports various input/output combinations:

| Pattern | Description |
|---------|-------------|
| Chain → Chain | Read from chain, send to chain |
| Chain → File | Read from chain, save to file |
| File → Chain | Read from file, send to chain |
| File → File | Read from file, save to file |

```bash
# File input/output
toolkit generate-txs \
  --src-file genesis.mn \
  --dest-file output.mn \
  --to-bytes \
  ...
```

## References

- [Toolkit README](../../../submodules/midnight-node/util/toolkit/README.md)
- [Toolkit-JS README](../../../submodules/midnight-node/util/toolkit-js/README.md)

