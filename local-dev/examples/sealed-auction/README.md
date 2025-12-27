# Sealed Auction dApp Example

A **true sealed-bid auction** dApp example using commitment schemes. Bid amounts remain secret until the reveal phase.

## Structure

```
sealed-auction/
├── contract/              # Compiled Compact contract
│   ├── auction.compact    # Source file
│   ├── auction/           # Compiled output
│   │   ├── contract/      # Generated TypeScript
│   │   ├── keys/         # Prover/Verifier keys
│   │   └── zkir/         # ZK IR files
│   └── contract/         # Legacy compiled output
├── src/
│   ├── deploy.ts          # Deployment script
│   └── run-circuit.ts     # Circuit execution
├── deployment.json        # Deployment result
├── bid-secrets.json       # Saved bid secrets (local only)
└── package.json
```

## Prerequisites

- Local environment is running (`make up` in `local-dev/`)
- Node.js 18+
- Compact compiler installed (`compact` command)

## Setup

```bash
bun install
bun run build

# Compile the contract
cd contract
compact compile auction.compact auction
cd ..
```

## Usage

### Deploy

```bash
bun run deploy
```

### Execute Circuits

```bash
# Phase 1: Commit Phase - Place bids (amounts are secret)
bun run run bid 100          # Place a bid with amount 100 (commitment only)
bun run run bid 200          # Place another bid with amount 200
bun run run bid 150          # Place another bid with amount 150

# Phase 2: Close bidding
bun run run close_bidding    # Close the bidding phase

# Phase 3: Reveal Phase - Reveal bids
# Note: Use the commitment hex from bid-secrets.json
bun run run reveal <commitment_hex>  # Reveal a bid

# Query functions
bun run run get_highest_bid  # Get highest bid (after reveal)
bun run run get_bid_count    # Get bid count
bun run run is_revealed      # Check if revealed
```

## Contract

Circuits in `contract/auction.compact`:

- `bid(commitment: Bytes<32>)` - Place a bid commitment (amount is secret)
- `close_bidding()` - Close the bidding phase
- `reveal(amount: Uint<64>, secret: Bytes<32>)` - Reveal a bid with amount and secret
- `get_highest_bid()` - Get highest bid amount (after reveal)
- `get_bid_count()` - Get bid count
- `is_revealed()` - Get reveal flag

## How It Works: True Sealed-Bid Auction

This implementation uses a **commitment scheme** to keep bid amounts secret during the bidding phase.

### Commitment Scheme

A commitment scheme allows you to commit to a value without revealing it, and later reveal it with proof that it matches the commitment.

1. **Commit**: `commitment = persistentCommit(amount, secret)`
   - `amount`: The bid amount (secret)
   - `secret`: Random 32-byte value (secret)
   - `commitment`: 32-byte hash (public)

2. **Reveal**: Verify that `persistentCommit(amount, secret) == commitment`
   - Reveal both `amount` and `secret`
   - The contract verifies the commitment matches

### Processing Flow and Information Disclosure

#### 1. Deployment (`deploy.ts`)

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

#### 2. Bidding Phase (`bid(commitment)`)

**Client-Side Processing:**
1. Generate random 32-byte `secret`
2. Create `commitment = persistentCommit(amount, secret)`
3. Save `(commitment, amount, secret)` to `bid-secrets.json`
4. Call `bid(commitment)`

**Contract Processing:**
```compact
export circuit bid(commitment: Bytes<32>): [] {
  assert(isOpen, "auction is closed");
  assert(!bidCommitments.member(disclose(commitment)), "duplicate commitment");
  
  // コミットメントを保存（公開されるが、中身は秘密）
  bidCommitments.insert(disclose(commitment));
  bidCount = (bidCount + 1) as Uint<64>;
}
```

**Information Disclosure:**
- 🔒 **Private (verified in zk proof)**: 
  - `commitment` parameter (before `disclose()` call)
  - Bidder's wallet information
- 🔓 **Public (on-chain)**: 
  - `commitment` (disclosed via `disclose(commitment)`)
  - `bidCount` (bid count)
  - `isOpen` (auction state)
- 🔒 **Never disclosed**: 
  - `amount` (bid amount) - **remains secret**
  - `secret` (random value) - **remains secret**

**Key Point**: The commitment is just a hash. Without the `secret`, it's computationally infeasible to determine the `amount` from the commitment.

#### 3. Close Bidding (`close_bidding()`)

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

#### 4. Reveal Phase (`reveal(amount, secret)`)

**Client-Side Processing:**
1. Load `(amount, secret)` from `bid-secrets.json` using `commitment`
2. Call `reveal(amount, secret)`

**Contract Processing:**
```compact
export circuit reveal(amount: Uint<64>, secret: Bytes<32>): [] {
  assert(!isOpen, "bidding is still open");
  
  // コミットメントを再計算して検証
  const commitment = persistentCommit<Uint<64>>(amount, secret);
  assert(bidCommitments.member(disclose(commitment)), "invalid commitment");
  
  // 最高額を更新（disclose()で公開）
  if (disclose(amount) > highestBid) {
    highestBid = disclose(amount);
  }
  
  isRevealed = true;
}
```

**Information Disclosure:**
- 🔒 **Private (verified in zk proof)**: 
  - `amount` parameter (before `disclose()` call)
  - `secret` parameter (never disclosed, only used for verification)
  - Bidder's wallet information
- 🔓 **Public (on-chain)**: 
  - `amount` (disclosed via `disclose(amount)`)
  - `highestBid` (updated highest bid)
  - `isRevealed = true` (indicates results are revealed)

**Key Point**: The contract verifies that `persistentCommit(amount, secret)` matches a stored commitment, proving the bidder knew the amount when they placed the bid, without revealing it until now.

#### 5. Get Highest Bid (`get_highest_bid()`)

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

#### 6. Get Bid Count (`get_bid_count()`)

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

#### 7. Check Reveal Flag (`is_revealed()`)

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

## Commitment Scheme Details

### `persistentCommit<T>(value: T, opening: Bytes<32>): Bytes<32]`

This function creates a cryptographic commitment:
- **Input**: `value` (the secret data) + `opening` (random 32-byte secret)
- **Output**: 32-byte commitment hash
- **Properties**:
  - **Hiding**: The commitment reveals nothing about `value` without `opening`
  - **Binding**: It's computationally infeasible to find different `(value, opening)` pairs that produce the same commitment

### Why This Works

1. **During Bidding**: Only the commitment is stored on-chain. The `amount` and `secret` remain private.
2. **During Reveal**: The bidder reveals `amount` and `secret`. The contract verifies:
   - `persistentCommit(amount, secret) == stored_commitment`
   - This proves the bidder knew the amount when bidding, without revealing it until now.

### Security Considerations

- **Secret Management**: The `secret` must be kept secure. If lost, the bid cannot be revealed.
- **Secret Uniqueness**: Each bid must use a unique `secret`. Reusing secrets can compromise privacy.
- **Commitment Storage**: Commitments are stored in a `Set`, preventing duplicate commitments.

## Important Points: Secret Management and Reveal

### Where is `amount` stored?

- **During bidding**: `amount` is stored **off-chain** (client-side) in `bid-secrets.json`
- **On-chain**: Only the `commitment` (hash) is stored, not the `amount` or `secret`
- **During reveal**: `amount` and `secret` are loaded from `bid-secrets.json` and used to generate the ZK proof

### Who can reveal?

- **Technically**: Anyone who knows both `amount` and `secret` can reveal
- **Practically**: Usually the bidder who has `bid-secrets.json`
- **Note**: The contract does not verify who placed the bid, only that `persistentCommit(amount, secret)` matches a stored commitment

### What happens if `amount` is changed?

- **Cannot reveal**: If you change `amount` but keep the same `secret`, a different commitment is generated
- **Verification fails**: The new commitment won't match the stored one, so `reveal` will fail with "invalid commitment"
- **Both required**: Both `amount` and `secret` must match exactly what was used during bidding

### Secret storage requirements

- **Must store**: The `secret` must be stored separately (it's not on-chain)
- **Current implementation**: Uses `bid-secrets.json` (local file)
- **Alternative methods**: Database, encrypted storage, wallet integration, etc. are all possible
- **If lost**: If `secret` is lost, the bid cannot be revealed and becomes invalid
- **Security**: If `secret` is leaked, anyone who knows both `amount` and `secret` can reveal the bid

## Example Workflow

```bash
# 1. Deploy contract
bun run deploy

# 2. Place bids (commitments only)
bun run run bid 100    # Creates commitment, saves secret locally
bun run run bid 200    # Creates another commitment
bun run run bid 150    # Creates another commitment

# 3. Close bidding
bun run run close_bidding

# 4. Reveal bids (check bid-secrets.json for commitment hexes)
bun run run reveal ca15bee0342d16fc0bac04a2edd77f9d1c3470e79d3fa0e3cd91309b15aa5b8e

# 5. Check results
bun run run get_highest_bid
bun run run get_bid_count
```

## Files

- `bid-secrets.json`: Stores bid secrets locally (DO NOT commit to git!)
  - Format: `{ "commitment_hex": { "amount": "100", "secret": [36, 105, ...] } }`
  - This file is required to reveal bids later

## Comparison: Old vs New Implementation

### Old Implementation (Not Truly Sealed)
- `bid(amount)` immediately disclosed the amount via `disclose(amount)`
- All bids were visible on-chain immediately
- No privacy protection

### New Implementation (True Sealed Auction)
- `bid(commitment)` stores only a commitment hash
- `amount` remains secret until `reveal(amount, secret)` is called
- Uses cryptographic commitment scheme for privacy
- Follows the commit-reveal pattern used in sealed-bid auctions
