# Resources and Next Steps

## Official Resources

### Documentation

| Resource | URL | Description |
|----------|-----|-------------|
| Midnight Docs | https://docs.midnight.network/ | Official documentation |
| Midnight Foundation | https://midnight.network/ | Foundation official site |
| Midnight Blog | https://midnight.network/blog | Technical blog |

### GitHub Repositories

| Repository | Description |
|-----------|-------------|
| [midnight-node](https://github.com/midnightntwrk/midnight-node) | Blockchain node implementation |
| [midnight-ledger](https://github.com/midnightntwrk/midnight-ledger) | Ledger & transaction processing |
| [midnight-zk](https://github.com/midnightntwrk/midnight-zk) | Zero-knowledge proof system |
| [midnight-indexer](https://github.com/midnightntwrk/midnight-indexer) | Indexer |
| [midnight-wallet](https://github.com/midnightntwrk/midnight-wallet) | Wallet SDK |
| [midnight-js](https://github.com/midnightntwrk/midnight-js) | dApp development framework |
| [partner-chains](https://github.com/input-output-hk/partner-chains) | Cardano Partner Chain |
| [midnight-docs](https://github.com/midnightntwrk/midnight-docs) | Documentation source |

### Sample Projects

| Repository | Description |
|-----------|-------------|
| [example-counter](https://github.com/midnightntwrk/example-counter) | Simple counter example |
| [example-bboard](https://github.com/midnightntwrk/example-bboard) | Bulletin board dApp (with React UI) |
| [midnight-awesome-dapps](https://github.com/midnightntwrk/midnight-awesome-dapps) | Community dApp collection |
| [create-mn-app](https://github.com/midnightntwrk/create-mn-app) | dApp scaffold CLI |

### Development Tools

| Tool | Description |
|------|-------------|
| [compact-tree-sitter](https://github.com/midnightntwrk/compact-tree-sitter) | Compact language parser |
| [compact-zed](https://github.com/midnightntwrk/compact-zed) | Zed editor extension |
| [midnight-trusted-setup](https://github.com/midnightntwrk/midnight-trusted-setup) | Trusted Setup |
| [midnight-node-docker](https://github.com/midnightntwrk/midnight-node-docker) | Docker environment |
| [midnight-dapp-connector-api](https://github.com/midnightntwrk/midnight-dapp-connector-api) | dApp connector API |

## npm Packages

### Core SDK

```bash
# For dApp development
pnpm add @midnight-ntwrk/midnight-js-contracts@latest
pnpm add @midnight-ntwrk/midnight-js-types@latest
pnpm add @midnight-ntwrk/compact-runtime@latest
```

### Providers

```bash
# Data provider
pnpm add @midnight-ntwrk/midnight-js-indexer-public-data-provider@latest

# Proof provider
pnpm add @midnight-ntwrk/midnight-js-http-client-proof-provider@latest

# Private state
pnpm add @midnight-ntwrk/midnight-js-level-private-state-provider@latest

# ZK artifacts
pnpm add @midnight-ntwrk/midnight-js-fetch-zk-config-provider@latest
pnpm add @midnight-ntwrk/midnight-js-node-zk-config-provider@latest
```

### Wallet Integration

```bash
# Browser wallet connector
pnpm add @midnight-ntwrk/dapp-connector-api@latest
```

For lower-level wallet SDK building blocks, choose the specific `@midnight-ntwrk/wallet-sdk-*` packages you need from the wallet monorepo.

### Runtime

```bash
# Ledger WASM
pnpm add @midnight-ntwrk/ledger@latest

# On-chain runtime
pnpm add @midnight-ntwrk/onchain-runtime@latest
```

## Learning Roadmap

### Week 1: Foundation Understanding

```
Day 1-2: Understanding Midnight Concepts
├── Read this guidebook chapters 00-02
├── Review official documentation overview
└── Understand differences from EVM/Solana

Day 3-4: Learning Compact Language
├── Read this guidebook chapter 03
├── Run example-counter
└── Write a simple contract

Day 5-7: Development Environment Setup
├── Docker environment setup
├── Start local node
└── Verify Indexer connection
```

### Week 2: Practical Development

```
Day 1-3: Learning SDK
├── Read this guidebook chapter 04
├── Run example-bboard
└── Implement contract integration

Day 4-5: Privacy Features
├── Implement witnesses
├── Manage private state
└── Understand ZK proofs

Day 6-7: Integration Testing
├── Create E2E tests
├── Wallet integration
└── Prepare for production
```

### Week 3: Advanced Development

```
Day 1-3: Complex dApp
├── Multiple contract integration
├── Utilize Zswap
└── Performance optimization

Day 4-5: Production Preparation
├── Security review
├── Infrastructure setup
└── Monitoring & logging configuration

Day 6-7: Deployment
├── Testnet deployment
├── UI/UX adjustments
└── Documentation
```

## Quick Start

### 1. Create a new app with create-mn-app

```bash
npx create-mn-app@latest my-dapp
cd my-dapp
npm run setup
```

This is the safest starting path for a fresh Midnight app. It sets up the proof server, compiles the Compact contract, and deploys to Preprod.

### 2. Explore the sample projects

If you want to study an example app, use the sample repository README for its current commands.
For example, `example-counter` has its own Preprod/Standalone instructions and should not be followed with a generic `pnpm build && pnpm start` flow.

### 3. Connect to an existing contract

```typescript
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';

const contract = await findDeployedContract({
  runtime: myContractRuntime,
  witnesses: myWitnesses,
  publicDataProvider,
  proofProvider,
  privateStateProvider,
  zkConfigProvider,
  contractAddress: '0x...',
});

// Use the generated contract API to call circuits.
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Compilation error | Check version with `compact -V` |
| Proof generation failed | Check Proof Server logs |
| Connection error | Verify Node/Indexer URLs |
| Timeout | Increase timeout value |

### Debugging Tips

```bash
# Node logs
docker logs -f midnight-node

# Indexer logs  
docker logs -f midnight-indexer

# Proof Server logs
docker logs -f proof-server
```

## Community

### Support

| Channel | Purpose |
|---------|---------|
| GitHub Issues | Bug reports, feature requests |
| Discord | General questions, discussions |
| Twitter/X | Announcements, updates |

### Contributing

1. **Code Contribution**: Pull requests on GitHub
2. **Documentation Improvement**: midnight-docs repository
3. **Sample Creation**: Add to midnight-awesome-dapps
4. **Community Support**: Answer questions on Discord

## Guidebook Summary

| Chapter | Content |
|---------|---------|
| [00-introduction](./00-introduction.md) | Midnight overview, why choose it |
| [01-architecture](./01-architecture.md) | Component structure, data flow |
| [02-core-concepts](./02-core-concepts.md) | Details on ZK, Zswap, state management |
| [03-compact-language](./03-compact-language.md) | Development with Compact language |
| [04-sdk-development](./04-sdk-development.md) | midnight-js, wallet integration |
| [05-infrastructure](./05-infrastructure.md) | Node and Indexer operations |
| [06-comparison](./06-comparison.md) | Detailed comparison with EVM/Solana |
| [07-resources](./07-resources.md) | Resources, next steps |

## Glossary

| Term | Description |
|------|-------------|
| **Compact** | Midnight's smart contract language |
| **Circuit** | Compact function (executed as ZK circuit) |
| **Witness** | Function that performs private computation |
| **Ledger** | Public on-chain state |
| **DUST** | Shielded (private) native token |
| **Night** | Unshielded native token |
| **Zswap** | Shielded token protocol |
| **ZKIR** | Zero-knowledge intermediate representation |
| **Commitment** | Coin existence proof |
| **Nullifier** | Coin usage proof (prevents double spending) |
| **Impact VM** | On-chain virtual machine |
| **Partner Chain** | Cardano sidechain |

---

**Guidebook Complete!** 

If you have questions or feedback, please let us know via GitHub Issues or Discord.

Happy Building on Midnight! 🌙
