# Sealed Auction dApp Example

A bidding auction dApp example.

## Structure

```
sealed-auction/
├── contract/              # Compiled Compact contract
│   ├── auction.compact    # Source file
│   ├── contract/          # Generated TypeScript
│   ├── keys/              # Prover/Verifier keys
│   └── zkir/              # ZK IR files
├── src/
│   ├── deploy.ts          # Deployment script
│   └── run-circuit.ts     # Circuit execution
├── deployment.json        # Deployment result
└── package.json
```

## Prerequisites

- Local environment is running (`make up` in `local-dev/`)
- Node.js 18+

## Setup

```bash
bun install
bun run build
```

## Usage

### Deploy

```bash
bun run deploy
```

### Execute Circuits

```bash
bun run run bid 100          # Bid with 100
bun run run bid 200          # Bid with 200 (higher amount)
bun run run close_bidding    # Close bidding
bun run run reveal           # Reveal results
bun run run get_highest_bid  # Get highest bid
bun run run get_bid_count    # Get bid count
bun run run is_revealed      # Check if revealed
```

## Contract

Circuits in `contract/auction.compact`:

- `bid(amount)` - Place a bid (must be higher than current highest)
- `close_bidding()` - Close bidding
- `reveal()` - Reveal results
- `get_highest_bid()` - Get highest bid amount
- `get_bid_count()` - Get bid count
- `is_revealed()` - Get reveal flag

## Processing Flow and Information Disclosure

### 1. Deployment (`deploy.ts`)

**Processing Flow:**
1. Load contract
2. Build wallet (from genesis seed)
3. Wait for wallet sync
4. Configure providers (privateStateProvider, publicDataProvider, zkConfigProvider, proofProvider)
5. Deploy contract
6. Save deployment info to `deployment.json`

**Information Disclosure:**
- 🔒 **Private**: Wallet private keys, private state
- 🔓 **Public**: Contract address, deployment transaction

### 2. Bidding (`bid(amount)`)

**Processing Flow:**
1. Execute `bid` circuit via `run-circuit.ts`
2. Connect to contract (`findDeployedContract`)
3. Call `deployed.callTx.bid(amount)`
4. Proof Server generates zk proof
5. Submit transaction

**Contract Processing:**
```compact
export circuit bid(amount: Uint<64>): [] {
  assert(isOpen, "auction is closed");
  bidCount = (bidCount + 1) as Uint<64>;
  assert(disclose(amount) > highestBid, "bid too low");
  highestBid = disclose(amount);
}
```

**Information Disclosure:**
- 🔒 **Private (verified in zk proof)**: 
  - `amount` parameter (before `disclose()` call)
  - Bidder's wallet information
- 🔓 **Public (on-chain)**: 
  - Bid amount disclosed via `disclose(amount)`
  - `highestBid` (updated highest bid)
  - `bidCount` (bid count)
  - `isOpen` (auction state)

**Note**: The current implementation uses `disclose(amount)`, so bid amounts are immediately disclosed. To create a true sealed auction, you need to verify without using `disclose()` to keep the amount secret.

### 3. Close Bidding (`close_bidding()`)

**Processing Flow:**
1. Call `deployed.callTx.close_bidding()`
2. Proof Server generates zk proof
3. Submit transaction

**Contract Processing:**
```compact
export circuit close_bidding(): [] {
  isOpen = false;
}
```

**Information Disclosure:**
- 🔒 **Private**: None
- 🔓 **Public**: `isOpen = false` (indicates auction is closed)

### 4. Reveal Results (`reveal()`)

**Processing Flow:**
1. Call `deployed.callTx.reveal()`
2. Proof Server generates zk proof
3. Submit transaction

**Contract Processing:**
```compact
export circuit reveal(): [] {
  assert(!isOpen, "bidding is still open");
  isRevealed = true;
}
```

**Information Disclosure:**
- 🔒 **Private**: None
- 🔓 **Public**: `isRevealed = true` (indicates results are revealed)

### 5. Get Highest Bid (`get_highest_bid()`)

**Processing Flow:**
1. Call `deployed.callTx.get_highest_bid()`
2. Proof Server generates zk proof
3. Retrieve result

**Contract Processing:**
```compact
export circuit get_highest_bid(): Uint<64> {
  assert(isRevealed, "not revealed yet");
  return highestBid;
}
```

**Information Disclosure:**
- 🔒 **Private**: None (retrieving already public information)
- 🔓 **Public**: `highestBid` (highest bid amount)

### 6. Get Bid Count (`get_bid_count()`)

**Processing Flow:**
1. Call `deployed.callTx.get_bid_count()`
2. Proof Server generates zk proof
3. Retrieve result

**Contract Processing:**
```compact
export circuit get_bid_count(): Uint<64> {
  return bidCount;
}
```

**Information Disclosure:**
- 🔒 **Private**: None (retrieving already public information)
- 🔓 **Public**: `bidCount` (bid count)

### 7. Check Reveal Flag (`is_revealed()`)

**Processing Flow:**
1. Call `deployed.callTx.is_revealed()`
2. Proof Server generates zk proof
3. Retrieve result

**Contract Processing:**
```compact
export circuit is_revealed(): Boolean {
  return isRevealed;
}
```

**Information Disclosure:**
- 🔒 **Private**: None (retrieving already public information)
- 🔓 **Public**: `isRevealed` (reveal flag)

## Zero-Knowledge Proof Mechanism

In Midnight Network, all circuit function parameters are treated as **private (secret)** by default.

- **Before using `disclose()`**: Values are only verified within the zk proof and are not disclosed on-chain
- **After using `disclose()`**: Values are disclosed on-chain and can be viewed by anyone

If you try to disclose private data without using `disclose()`, the compiler will error. This prevents unintentional information leakage.
