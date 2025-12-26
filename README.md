# midnight-sandbox

[Midnight](https://midnight.network/) Hands-on Notes

This repository is a sandbox that consolidates development environments and tools for Midnight Network.

## Project Structure

```
midnight-sandbox/
├── rpc/                    # RPC CLI Tool
│   ├── README.md           # RPC CLI Usage
│   ├── RPC_API.md         # RPC API Reference
│   └── INDEXER.md         # Indexer Details
├── frontend/               # RPC Explorer (Web UI)
│   └── README.md          # Frontend Usage
├── local-dev/             # Local Development Environment
│   ├── README.md          # Local Development Setup
│   ├── compose.yaml       # Docker Compose Configuration
│   └── examples/          # Sample Code
├── docs/                  # Documentation
│   ├── en/                # English Version
│   └── ja/                # Japanese Version
└── submodules/            # Midnight-related Submodules
```

## Setup Prerequisites

```
❯ docker --version
Docker version 28.3.3, build 980b856

❯ docker search midnightnetwork
NAME                                      DESCRIPTION   STARS     OFFICIAL
midnightnetwork/proof-server                            4
midnightnetwork/midnight-node                           3
midnightnetwork/midnight-pubsub-indexer                 1
midnightnetwork/compactc                                3
```

### Setup Lace Wallet and Get Testnet Tokens

> You must use the Chrome web browser or its derivatives to complete web-based transactions on the Midnight testnet.

https://chromewebstore.google.com/detail/lace-midnight-preview/hgeekaiplokcnmakghbdfbgnlfheichg

I followed the instruction in [the tutorial](https://docs.midnight.network/develop/tutorial/using/chrome-ext) and generated the wallet address like the below:


`mn_shield-addr_test187fpj5ryfsea7gwaa8d0rr6kpruq44kt9s0e2f6unqnngj73q2asxq86hc8q56dm4snlxeanet6hy39rrp0fet8rxtfwrjtkgq5mxve95yzdl8yv`

Then, got test tokens from [a faucet](https://midnight.network/test-faucet) 

Here's a tx hash of the transfer: `00000000f58097d65ae3670c308fff5529c3c7ac83f5122b841589b98453ebd4becb4bba`, but I couldn't find any links of explorers for now.

### Setup Proof Server

> ZK functionality provided by a Midnight proof server, which generates proofs locally that will be verified on-chain.

https://docs.midnight.network/develop/tutorial/using/proof-server

**Note:** The proof-server should be run on the same machine where the Chrome extension (Lace Wallet) is installed. Running the proof-server on a remote development machine may cause connectivity issues with the extension.

Pull the proof-server image:

```
docker pull midnightnetwork/proof-server:latest
```

Run proof-server:

```
docker run -p 6300:6300 midnightnetwork/proof-server -- 'midnight-proof-server --network testnet'
```

### Setup Indexer

The Midnight Network indexer efficiently collects and indexes blockchain data, making it accessible through a GraphQL API.

For detailed setup instructions, see [local-dev/README.md](./local-dev/README.md) and [rpc/INDEXER.md](./rpc/INDEXER.md).

## Tools and Components in This Project

### RPC CLI Tool (`rpc/`)

A command-line interface tool for interacting with Midnight Network RPC endpoints.

**Key Features:**
- Call all RPC methods from the command line
- Transaction search functionality (`search-tx`)
- Account address transaction search (`search-account`)

**Usage:**

```bash
cd rpc
pnpm install
pnpm run dev -- system_chain
pnpm run dev -- search-tx <transaction_hash>
```

See [rpc/README.md](./rpc/README.md) for details.

### Frontend RPC Explorer (`frontend/`)

A web interface for interacting with Midnight Network RPC endpoints.

**Key Features:**
- Call all RPC methods from the browser
- Parameter input forms
- JSON response display

**Usage:**

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:5173` in your browser.

See [frontend/README.md](./frontend/README.md) for details.

### Local Development Environment (`local-dev/`)

A complete environment for developing Midnight dApps locally.

**Included Components:**
- Midnight Node (localhost:9944)
- Indexer (localhost:8088)
- Proof Server (localhost:6300)

**Usage:**

```bash
cd local-dev
make up      # Start the environment
make status  # Check status
make down    # Stop the environment
```

See [local-dev/README.md](./local-dev/README.md) for details.

### Documentation (`docs/`)

Technical documentation for Midnight Network, designed for EVM/Solana developers.

**Contents:**
- Architecture overview
- Core concepts (zero-knowledge proofs, Zswap, state management)
- Complete guide to Compact language
- SDK development guide
- Infrastructure setup and operations

See [docs/README.md](./docs/README.md) for details.

## Build a DApp

### Required Tools

```
❯ node -v
v22.15.1
```

### Install Compact Compiler

```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
```

**Update:**

```bash
compact update
compact compile --version
```

### Sample Projects

Clone the example repository as described in the official documentation:

https://docs.midnight.network/develop/tutorial/building/examples-repo

**Note:** The official documentation mentions using Yarn, but the tutorial documents use npm, so we recommend using npm.

### Build the Counter DApp

https://docs.midnight.network/develop/tutorial/building/counter-build

**Note:** The official documentation instructs to run `npm run compile` in the `contract` folder, but there is no `compile` script defined. Instead, use the following command:

```bash
npm run compact && npm run build
```

## RPC API Usage Examples

### Get Chain Name

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

See [rpc/RPC_API.md](./rpc/RPC_API.md) for detailed RPC API reference.

## Reference Links

- [Midnight Network Official Site](https://midnight.network/)
- [Midnight Network Official Documentation](https://docs.midnight.network/)
- [Midnight Network GitHub](https://github.com/midnightntwrk)



