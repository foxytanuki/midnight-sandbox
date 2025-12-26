# Overall Architecture

Midnight is a system where multiple components work together. Understanding the role and relationships of each component makes design decisions easier during dApp development.

## System Overview

```mermaid
graph TB
    subgraph "Application Layer"
        dapp[dApp<br/>React/Vue/Node.js]
    end

    subgraph "SDK Layer"
        js[midnight-js<br/>dApp Framework]
        wallet[midnight-wallet<br/>Wallet SDK]
    end

    subgraph "Infrastructure Layer"
        indexer[midnight-indexer<br/>GraphQL API]
        node[midnight-node<br/>Blockchain Node]
        prover[Proof Server<br/>ZK Proof Generation]
    end

    subgraph "Core Library Layer"
        ledger[midnight-ledger<br/>Ledger & Tx Processing]
        zk[midnight-zk<br/>ZK Proof System]
    end

    subgraph "Foundation Layer"
        partner[partner-chains<br/>Substrate Framework]
    end

    subgraph "Mainchain"
        cardano[Cardano<br/>Main Chain]
    end

    %% Application → SDK
    dapp --> js
    dapp --> wallet

    %% SDK → Infrastructure
    js --> indexer
    js --> prover
    js -.-> wallet
    wallet --> indexer
    wallet --> node

    %% Infrastructure dependencies
    indexer --> node
    node --> ledger
    node -.-> partner

    %% Core dependencies
    ledger --> zk

    %% SDK → Core (WASM bindings)
    js -.->|WASM| ledger
    wallet -.->|WASM| ledger

    %% Partner Chain → Cardano
    partner --> cardano
```

**Legend:**
- Solid line → Direct dependency/communication
- Dotted line → Library dependency (WASM bindings, etc.)

## Component Details

### midnight-node

**Role**: Core node implementation of the Midnight blockchain

| Item | Details |
|------|---------|
| Language | Rust |
| Base | Substrate (Polkadot SDK) |
| Consensus | AURA (block production) + GRANDPA (finality) |
| Block Time | 6 seconds |
| Ports | WebSocket RPC: 9944 / P2P: 30333 |

```mermaid
block-beta
    columns 1
    block:node["Midnight Node"]
        columns 1
        block:runtime["Runtime"]
            columns 1
            block:pallets["Pallets"]
                columns 3
                midnight["Midnight System"]
                native["Native Token Observation"]
                federated["Federated Authority"]
            end
        end
        block:services["Node Services"]
            columns 4
            rpc["RPC Server"]
            consensus["Consensus<br/>AURA/GRANDPA"]
            network["Network P2P"]
            keystore["Keystore"]
        end
    end
```

**Main Pallets:**
- `pallet-midnight`: Core transaction processing, ZK proof verification
- `pallet-midnight-system`: System transaction management
- `pallet-native-token-observation`: Cardano bridge (cNIGHT → DUST)
- `pallet-federated-authority`: Federated governance

---

### midnight-ledger

**Role**: Ledger implementation, transaction structure, state management

| Item | Details |
|------|---------|
| Language | Rust + WASM (TypeScript API) |
| Main Features | Transaction processing, ZK proof verification, contract runtime |

```mermaid
graph LR
    wasm[ledger-wasm] --> ledger
    ledger --> zswap --> runtime[onchain-runtime] --> vm[onchain-vm]
    ledger --> zkir["zkir<br/>ZK IR & Circuit Compiler"]
    ledger --> crypto["transient-crypto<br/>ZK Crypto Primitives"]
```

**Main Components:**
| Component | Role |
|-----------|------|
| `ledger` | Main transaction processing implementation |
| `zswap` | Shielded tokens (private transfer + atomic swap) |
| `zkir` | Zero-knowledge IR & circuit compiler |
| `onchain-runtime` | Contract runtime |
| `onchain-vm` | Impact VM (on-chain execution) |

---

### midnight-zk

**Role**: Zero-knowledge proof system and ZK circuit construction tools

| Item | Details |
|------|---------|
| Language | Rust |
| Proof System | Plonk + KZG commitment |
| Elliptic Curves | BLS12-381, JubJub |

**Main Components:**
| Component | Role |
|-----------|------|
| `curves` | BLS12-381 / JubJub elliptic curve implementation |
| `proof-system` | Plonk proof system (KZG-based) |
| `circuits` | ZK circuit construction toolkit |
| `aggregator` | Proof aggregation (efficient verification of multiple proofs) |

---

### midnight-indexer

**Role**: Blockchain data indexing and API provision

| Item | Details |
|------|---------|
| Language | Rust |
| API | GraphQL (Query + Subscription) |
| Storage | SQLite (standalone) / PostgreSQL (cloud) |

```mermaid
graph TB
    node[Node] -->|fetch blocks| chain[Chain Indexer]
    chain -->|save blocks| db[(Database)]
    chain -->|notify tx indexed| wallet_idx[Wallet Indexer]
    db -->|read data| api[Indexer API]
    api -->|notify wallet connected| wallet_idx
    app[Wallet / dApp] --> api
```

**Deployment Modes:**
- **Standalone**: Single binary + SQLite (development/small scale)
- **Cloud**: Distributed microservices + PostgreSQL + NATS (production)

---

### midnight-js

**Role**: TypeScript dApp development framework

| Item | Details |
|------|---------|
| Language | TypeScript |
| Similar to | Web3.js (Ethereum), polkadot.js (Polkadot) |

**Main Packages:**
| Package | Role |
|---------|------|
| `@midnight-ntwrk/midnight-js-contracts` | Contract operations |
| `@midnight-ntwrk/midnight-js-types` | Common type definitions |
| `@midnight-ntwrk/midnight-js-level-private-state-provider` | Private state persistence |
| `@midnight-ntwrk/midnight-js-http-client-proof-provider` | Proof server client |
| `@midnight-ntwrk/midnight-js-indexer-public-data-provider` | Indexer client |

**Distinctive Features (not in EVM):**
- Local smart contract execution
- Private state management and persistence
- Zero-knowledge proof generation and verification

---

### midnight-wallet

**Role**: Wallet SDK implementation

| Item | Details |
|------|---------|
| Language | TypeScript |
| Key Derivation | HD wallet (BIP-32 like) |
| Address Format | Bech32m |

**Main Packages:**
| Package | Role |
|---------|------|
| `wallet` | Wallet runtime & builder |
| `hd` | HD wallet API |
| `address-format` | Bech32m address format |
| `capabilities` | Coin selection & balance management |

---

### partner-chains

**Role**: Cardano Partner Chain framework

| Item | Details |
|------|---------|
| Language | Rust |
| Base | Substrate |

**Cardano Integration Features:**
- Block production rewards for validators
- Native token management (cNIGHT)
- Permissioned/registered validator management

## Data Flow: Transaction Lifecycle

Typical flow of a Midnight transaction:

```mermaid
flowchart TB
    user[User Action]
    
    subgraph step1["1. Local Execution (dApp + midnight-js)"]
        local["Compact Contract Execution<br/>Private State Update<br/>Witness Execution"]
    end
    
    subgraph step2["2. ZK Proof Generation (Proof Server)"]
        proof["Prove Execution Validity<br/>ZKIR → Plonk Circuit → Proof"]
    end
    
    subgraph step3["3. Transaction Construction (Wallet SDK)"]
        build["Include ZK Proof<br/>Add Zswap I/O<br/>Sign"]
    end
    
    subgraph step4["4. Submission & Verification (Node)"]
        verify["ZK Proof Verification<br/>Apply State Transition<br/>Consensus"]
    end
    
    subgraph step5["5. Indexing (Indexer)"]
        index["Save Block Information<br/>Provide GraphQL API<br/>Wallet Notification"]
    end
    
    user --> step1 --> step2 --> step3 --> step4 --> step5
```

## Network Configuration

| Network | Purpose | Connection Target |
|---------|---------|-------------------|
| local | Local development | Local Node |
| testnet | Test environment | Cardano Preview |
| mainnet | Production environment | Cardano Mainnet |

---

**Next Chapter**: [02-core-concepts](./02-core-concepts.md) - Zero-Knowledge Proofs and Core Concepts

