# Midnight Local Development Environment

A setup guide for Midnight dApp development on a local chain.

## Quick Start

```bash
# 1. Start local node
make up

# 2. Check status
make status

# 3. Stop
make down
```

## Required Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| direnv | Automatic environment variable setup | [direnv.net](https://direnv.net/) |
| Docker | Node and indexer execution | [docker.com](https://docker.com) |
| Node.js 20+ | dApp development | [nvm](https://github.com/nvm-sh/nvm) |
| compact | Compact compilation | [See below](#compact-compiler) |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your dApp                              │
│                   (midnight-js)                             │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Proof Server   │  │    Indexer      │  │     Node        │  │   Faucet API   │
│  localhost:6300 │  │ localhost:8088  │  │ localhost:9944  │  │ localhost:3000  │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                    ┌─────────────────┐
                    │  Local Chain    │
                    │   (Docker)      │
                    └─────────────────┘
```

## Documentation

| Document | Content |
|----------|---------|
| [01-setup.md](docs/en/01-setup.md) | Environment setup |
| [02-node.md](docs/en/02-node.md) | Starting the local node |
| [03-compact.md](docs/en/03-compact.md) | Compact language introduction |
| [04-deploy.md](docs/en/04-deploy.md) | Contract deployment |
| [05-dapp.md](docs/en/05-dapp.md) | dApp development with midnight-js |
| [06-toolkit.md](docs/en/06-toolkit.md) | Toolkit usage |

## Compact Compiler

```bash
# Install
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/download/compact-v0.3.0/compact-installer.sh | sh

# Verify
compact -V
```

## Endpoint List

| Service | URL | Purpose |
|---------|-----|---------|
| Node RPC | `ws://localhost:9944` | Transaction submission |
| Indexer GraphQL | `http://localhost:8088/graphql` | State queries |
| Proof Server | `http://localhost:6300` | ZK proof generation |
| Faucet API | `http://localhost:3000` | Fund shielded/unshielded addresses |

## Faucet API

The Faucet API allows you to fund shielded and unshielded addresses on the local network.

### Using the Script

```bash
# Fund using mnemonic (derives both shielded and unshielded addresses)
make fund ADDRESS="your twelve word mnemonic phrase here"

# Fund a shielded address
make fund ADDRESS=mn_shield-addr_undeployed1q...

# Fund an unshielded address
make fund ADDRESS=mn_addr_undeployed1q...
```

Or use the script directly:

```bash
./scripts/fund.sh "your mnemonic here"
./scripts/fund.sh mn_shield-addr_undeployed1q...
./scripts/fund.sh mn_addr_undeployed1q...
```

For more details, see [faucet-api/README.md](faucet-api/README.md).

## Directory Structure

```
local-dev/
├── README.md              # This file (English)
├── README.ja.md          # Japanese version
├── Makefile               # Command collection
├── compose.yaml           # Local environment definition
├── faucet-api/            # Faucet API service
│   ├── src/               # Source code
│   ├── Dockerfile
│   └── README.md
├── docs/                  # Documentation
│   ├── ja/                # Japanese version
│   │   ├── 01-setup.md
│   │   ├── 02-node.md
│   │   ├── 03-compact.md
│   │   ├── 04-deploy.md
│   │   ├── 05-dapp.md
│   │   └── 06-toolkit.md
│   └── en/                # English version
│       ├── 01-setup.md
│       ├── 02-node.md
│       ├── 03-compact.md
│       ├── 04-deploy.md
│       ├── 05-dapp.md
│       └── 06-toolkit.md
├── scripts/               # Utility scripts
│   ├── wait-for-node.sh
│   ├── check-health.sh
│   └── fund.sh            # Faucet API script
└── examples/              # Sample code
    └── counter/
```

## Related Resources

- [Midnight Documentation](https://docs.midnight.network/)
- [example-counter](../example-counter/) - Sample dApp
- [submodules/README.md](../submodules/README.md) - Repository overview
