# Midnight and Cross-Chain Interoperability: Current State and Outlook

> **Target audience**: Developers with EVM/Solana experience who want to understand how Midnight relates to other chains.
>
> **Prerequisites**: Understanding of [10-zkloan-deep-dive.md](./10-zkloan-deep-dive.md).

---

## The Naive Question: Can Midnight's ZK Proofs Be Used on Other Chains?

Having understood from the ZK Loan example that "you can pass loan underwriting while keeping your credit score hidden," the next natural question is:

> Can a Midnight ZK proof be used on an Ethereum DeFi protocol to prove "this person qualifies for Tier 1"?

The short answer: **there is no direct mechanism as of April 2026**. However, Midnight's roadmap includes plans to make this possible.

---

## Midnight's Current Position

Midnight operates as an independent L1 blockchain and a **Partner Chain** of Cardano.

```
┌──────────────────────────────────────────────┐
│  Cardano (Main Chain)                         │
│  - Security foundation                        │
│  - NIGHT token origin (cNIGHT)                │
└──────────────────┬───────────────────────────┘
                   │ Partner Chain connection
                   ▼
┌──────────────────────────────────────────────┐
│  Midnight                                     │
│  - Independent consensus (AURA + GRANDPA)     │
│  - ZK smart contracts in Compact language     │
│  - Privacy-preserving execution environment   │
└──────────────────────────────────────────────┘
```

Currently, Midnight is directly bridged to **Cardano only**. cNIGHT on Cardano can be bridged to DUST on Midnight.

```
Cardano (cNIGHT) ←→ Via Partner Chain ←→ Midnight (DUST)
```

**Direct bridges to Ethereum, Solana, or ZK proof sharing with these chains are not yet implemented.**

---

## Why "Just Using It" Is Difficult

### Proof System Compatibility

Midnight's ZK proofs are generated using Plonk + KZG over BLS12-381. To verify these proofs on Ethereum:

- Ethereum needs BLS12-381 verification logic (planned via EIP-2537 but not yet complete)
- A Verifier contract understanding Midnight's circuit structure must be written in Solidity
- Proof format conversion is needed

Technically not impossible, but **unless Midnight officially supports it, each team would need to write their own Verifier, which is impractical**.

### State Fragmentation

In the ZK Loan example:

- Loan state (approved/rejected, amount) lives on Midnight's chain
- Ethereum DeFi protocols cannot directly read this state
- There is no mechanism to relay the fact "approved on Midnight" to Ethereum

---

## Midnight's Roadmap: Four Phases

Midnight is progressively expanding cross-chain support.

| Phase | Timeline | Content |
|---|---|---|
| **Hilo** | 2025~ | Mainnet launch. Partner Chain connection with Cardano. NIGHT token circulation begins |
| **Kukolu** | Mid-2026 | Federated mainnet. Stable operation by trusted validators (Worldpay, Bullish, etc.) |
| **Hua** | Late 2026 (planned) | **Cross-chain interoperability. Bridges to Ethereum, Solana, etc. Hybrid dApp realization** |
| Full decentralization | Future | Transition to Cardano SPO validation |

**The Hua phase is the "cross-chain interoperability" milestone**, planned for late 2026.

---

## Hybrid dApp: Midnight's Target Interoperability Model

The **Hybrid dApp** concept, targeting realization in the Hua phase, uses Midnight as a "privacy layer" for other chains.

### Concept

```
┌─────────────────────────────────────┐
│  Ethereum                            │
│  - Public smart contracts            │
│  - DeFi protocols                    │
│  - Tokens, liquidity                 │
└──────────────┬──────────────────────┘
               │ Bridge / LayerZero
               ▼
┌─────────────────────────────────────┐
│  Midnight (Privacy Layer)            │
│  - Confidential data processing      │
│  - ZK proof generation               │
│  - Selective disclosure              │
└─────────────────────────────────────┘
```

Ethereum DeFi protocols remain as-is, with **only privacy-sensitive operations delegated to Midnight**. Midnight generates ZK proofs, and the results are sent back to Ethereum via bridge.

### Applied to ZK Loan

```
Current (Midnight standalone):
  Borrower → Generate ZK proof on Midnight → Loan underwriting on Midnight contract

Hybrid dApp (future vision):
  Borrower → Generate ZK proof on Midnight (credit score verification)
           → Bridge proof result to Ethereum
           → Ethereum DeFi lending protocol consumes the proof
           → Receive uncollateralized loan on Aave etc. as "Tier 1 qualified"
```

If realized, this would leverage Ethereum's liquidity and Midnight's privacy simultaneously.

### LayerZero Integration

The Hua phase plans integration with **LayerZero**, a cross-chain messaging protocol connecting over 160 blockchains.

```
Midnight ←→ LayerZero ←→ Ethereum / Solana / Avalanche / ...
```

Via LayerZero, Midnight's ZK proofs and selective disclosure results could potentially be propagated to multiple chains **without building individual bridges**.

---

## What's Currently Possible and What's Not

| | Current (April 2026) | After Hua Phase (Late 2026~) |
|---|---|---|
| Cardano ↔ Midnight token bridge | Possible | Possible |
| ZK dApp on Midnight standalone | Possible | Possible |
| Verify Midnight ZK proofs from Ethereum | **Not possible** | Possible via LayerZero (planned) |
| Embed as privacy layer in Ethereum dApp | **Not possible** | Possible as Hybrid dApp (planned) |
| Integration with Solana/other chains | **Not possible** | Possible for LayerZero-supported chains (planned) |

---

## Cross-Chain Expansion of ZK Loan Use Cases

If Hybrid dApp becomes reality, the ZK Loan pattern can be extended as follows.

### Pattern 1: Prove on Midnight, Consume on Ethereum

```
1. Obtain signature from provider (unchanged)
2. Generate ZK proof on Midnight (unchanged)
3. Send proof result to Ethereum via LayerZero (new)
4. Ethereum DeFi protocol consumes the proof
```

### Pattern 2: Reuse of Attestation Signatures

The provider's Schnorr signature itself is chain-agnostic. If the same signature can be verified on contracts across different chains:

```
With a single attestation:
  → Use on Midnight's loan protocol A
  → Also use on Ethereum's lending protocol B (different criteria)
  → Also use on Solana's insurance protocol C
```

However, this requires Schnorr signature verification logic and ZK circuits on each chain, and Midnight's Compact contracts cannot be directly ported.

### Pattern 3: Use Midnight as a Privacy Oracle

```
Ethereum contract:
  "Does this person qualify for Tier 1?"

Midnight (Privacy Oracle):
  Verify in ZK circuit → Return only true/false → Relay to Ethereum
```

This resembles the "underwrite off-chain and only put results on-chain" design, but differs from a simple black-box oracle in that the underwriting logic is published and fixed as a Midnight contract.

---

## Does Bridging Even Make Sense?

### Ethereum Can Do the Same Thing on Its Own

What ZK Loan does can be **directly achieved on Ethereum**.

```
ZK Loan on Ethereum alone:
  1. Write ZK circuits in Circom or Noir (tier determination + signature verification)
  2. Deploy Groth16 / Plonk Verifier contract in Solidity
  3. User generates proof locally → Submits directly to Ethereum
  4. Verifier contract verifies proof → DeFi protocol consumes the result
```

No bridge needed. The cryptographic trust of ZK is fully self-contained on Ethereum.

### Bridging Degrades ZK's Value

Within Midnight, trust was "tamper-proof via ZK proof," but the moment you cross chains, it becomes "did the bridge relay the message correctly" — a different kind of trust.

```
Within Midnight:     Cryptographically guaranteed by ZK proof ← Strong
Via bridge:          Depends on bridge honesty ← Weaker than ZK
Directly on Ethereum: Cryptographically guaranteed by ZK proof ← Strong
```

If you want to leverage Ethereum's ecosystem (liquidity, DeFi, user base), **writing Circom/Noir + Verifier contracts on Ethereum is technically more straightforward**.

### Midnight's True Differentiation Is Not Cross-Chain

| | Build ZK on Ethereum | Midnight |
|---|---|---|
| ZK circuits | Hand-write in Circom / Noir | Auto-generated from Compact |
| Private state management | Build everything yourself | Native support (witness + local storage) |
| Proof Server | Build yourself | Built into SDK |
| Token privacy | None (needs separate solution) | Native via Zswap |
| Development difficulty | High (cryptographic knowledge needed) | Low (TypeScript-based Compact) |
| Liquidity & ecosystem | **Massive** | **Small** |

Midnight's essential value is not "providing privacy across chains" but rather **"providing a ZK-native development experience."** Write TypeScript-like code in Compact, and ZK circuit generation, proof infrastructure, and private state management all come included. Doing this on Ethereum requires deep cryptographic knowledge and custom infrastructure.

### When Bridging Makes Sense — and When It Doesn't

The Hybrid dApp vision of "becoming a privacy layer for Ethereum and Solana" cannot be universally judged as meaningful or not. It depends on the team's situation and use case.

**Cases where bridging has little value:**
- Teams that need Ethereum's ecosystem AND can build ZK themselves. Deploying Circom/Noir + Verifier contracts directly on Ethereum avoids bridge trust degradation and is technically more straightforward
- When only single ZK proof verification is needed (e.g., just a true/false for "qualifies for Tier 1")

**Cases where bridging is reasonable:**
- Teams that chose Compact's development experience and already built apps on Midnight, later wanting access to Ethereum's liquidity. More practical than rewriting in Circom
- Teams lacking cryptographic expertise to write ZK circuits from scratch. Connecting Compact-built dApps via bridge has a lower barrier
- When the entire application needs privacy, not just a single proof. Even placing one Verifier on Ethereum leaves all other transactions fully public. Midnight protects everything including token transfers and state management

**Decision criteria:**

| Condition | Recommendation |
|---|---|
| Need Ethereum liquidity + can build ZK | Build ZK directly on Ethereum |
| Need Ethereum liquidity + no ZK expertise | Midnight + bridge is an option |
| Need application-wide privacy | Midnight standalone |
| Need ZK on Solana / Cosmos etc. | ZK tooling is immature, so Midnight + bridge has higher viability |
| Already built on Midnight + expanding to other chains | Bridging is reasonable |

### Situations Differ by Chain

"Just do it on Ethereum" works because Ethereum's ZK toolchain is mature. This doesn't hold for all chains.

| Chain | Can build ZK independently? | Current state |
|---|---|---|
| **Ethereum** | Yes | Circom, Noir, snarkjs, Groth16/Plonk Verifier. Most mature tooling |
| **Solana** | Limited | ZK Compression (Light Protocol) exists, but general-purpose ZK circuit construction/verification tools are not as developed as Ethereum's |
| **Polkadot** | Limited | ZK verification pallets possible on Substrate, but ecosystem is small |
| **Cosmos ecosystem** | Limited | ZK verification possible on CosmWasm, but toolchain is immature |
| **ZK-native L1/L2** | Different design philosophy | Aztec, Mina, Aleo, zkSync, StarkNet are ZK-first by design, but each has its own language and ecosystem |

- **Ethereum**: Mature ZK tooling → Often more rational to build directly
- **Solana / Cosmos etc.**: High barrier to self-building ZK → Midnight + bridge becomes a more realistic option
- **ZK-native L1/L2** (Aztec, Aleo, etc.): Competitive positioning with Midnight. Not a bridge relationship, but a choice between platforms

In other words, for chains other than Ethereum, the practical significance of Midnight's bridge vision becomes greater.

### But Bridging Is Meaningless Without Verification Infrastructure

A bridge only relays messages. If the receiving chain lacks the **infrastructure to verify and consume** those messages, the bridge is useless.

```
Midnight → [Bridge] → Solana
                        ↓
              "Tier 1 qualified" message arrives
              → If Solana has no logic to verify this message, it's meaningless
              → DeFi protocols also need a mechanism to trust and use this result
```

What the receiving chain needs:
- A contract to read bridge messages
- Logic to verify message authenticity (bridge signature verification, etc.)
- DeFi protocol support to consume the results

While the bridge vision has greater significance for chains with immature ZK toolchains, **if the receiving ecosystem doesn't support it, it's just a pipe dream**. Even though LayerZero connects over 160 chains, without protocols on each chain that consume Midnight's results, it won't be practical.

### The Dilemma: Chains With Verification Infrastructure Need Bridges Least

So which chains actually have verification infrastructure?

| Chain | ZK Verification Infrastructure Status |
|---|---|
| **Ethereum** | Groth16/Plonk Verifier contracts writable in Solidity. BN254 precompiles available. zkSync, StarkNet, Scroll and other ZK Rollups in production. Thickest ecosystem |
| **Solana** | BN254 verification supported via syscall. However, deploying/using general-purpose ZK Verifiers is not as common as on Ethereum |
| **Polkadot** | Implementable as pallets, but few production ZK verification examples |
| **Cosmos ecosystem** | Verification logic writable in CosmWasm, but no precompiles means high computation cost |
| **Cardano** | BLS12-381 primitives added in Plutus V3. Good affinity with Midnight, but DeFi ecosystem smaller than Ethereum's |

Here lies a structural dilemma:

```
Chains with verification infrastructure (Ethereum)
  → Also have mature tools for building ZK directly
  → Little need to bring in Midnight results via bridge

Chains without verification infrastructure (Solana, Cosmos, etc.)
  → Even if results are bridged in, no DeFi ecosystem to consume them
  → Bridge results have nowhere to go
```

In other words, **"chains where bridge demand exists can build it themselves"** and **"chains that can't build it themselves have nowhere to consume bridged results."** This is the biggest reason why cross-chain interoperability is not Midnight's core value proposition at this point.

---

## Caveats

### Much Is Still Conceptual

Hybrid dApp and LayerZero integration are **plans on the roadmap**, not production-ready as of April 2026. Actual API specifications and developer tools have not been published.

### Trust Assumptions Increase

When a cross-chain bridge is involved, the bridge's reliability becomes a new risk. No matter how robust Midnight's ZK proofs are, if the bridge is compromised, the results cannot be trusted.

### ZK Loan's Essence Is Chain-Agnostic

The design pattern demonstrated by ZK Loan ("provider guarantees data → ZK circuit evaluates → only results disclosed") is not Midnight-specific; it is a general ZK usage pattern. The same design is possible with Circom/Groth16 on Ethereum or ZK Compression on Solana.

What Midnight provides is "a language (Compact) and infrastructure that natively supports this pattern." The difference is that on other chains, you need to build ZK circuits from scratch.

---

## Summary

| Question | Answer |
|---|---|
| Can Midnight ZK proofs be used on Ethereum? | Not currently. LayerZero integration planned for Hua phase (late 2026) |
| Can it be embedded as a privacy layer in Ethereum DeFi? | Not currently. Future vision as Hybrid dApp |
| Can attestation signatures be used on other chains? | Signatures are chain-agnostic, but verification logic must be implemented on each chain |
| Why isn't Midnight directly connected to Ethereum? | Built as a Cardano Partner Chain; EVM support is being expanded gradually |
| Can the ZK Loan pattern only be done on Midnight? | The pattern itself is universal. Directly achievable on Ethereum with Circom/Noir |
| So what's the point of bridging? | Technically, bridging degrades ZK trust, so there's little reason to actively choose it |
| Why choose Midnight then? | Not for cross-chain, but for the ZK-native development experience via Compact and its infrastructure |

**Midnight today is a "privacy-focused independent L1,"** and its value lies not in cross-chain interoperability but in the development experience that makes building ZK applications dramatically easier. The "privacy layer for other chains" vision exists on the roadmap, but it is largely framed in terms of ecosystem expansion rather than technical rationality.

---

## References

- [Midnight Official Website](https://midnight.network/)
- [Midnight Mainnet Is Live. The Privacy Stack Just Got Real.](https://dev.to/midnight-aliit/midnight-mainnet-is-live-the-privacy-stack-just-got-real-4d65)
- [Midnight Network: A Guide to Programmable Privacy (CoinGecko)](https://www.coingecko.com/learn/midnight-network-guide-programmable-privacy)
- [Midnight Network Explained: Rational Privacy for Real-World Use (BeInCrypto)](https://beincrypto.com/learn/midnight-network-explained/)
- [Midnight Protocol: Bridging the Gap in the Blockchain Ecosystem](https://marketsgonewild.com/crypto-news/2025/12/27/midnight-protocol-bridging-the-gap-in-the-blockchain-ecosystem/)
- [How Midnight Makes Privacy Useful (The Token Dispatch)](https://www.thetokendispatch.com/p/how-midnight-makes-privacy-useful)
- [Protocol-Level Bridge for Cardano to Midnight (MIP #20)](https://github.com/midnightntwrk/midnight-improvement-proposals/issues/20)
- [State of the Network - January 2026](https://midnight.network/blog/state-of-the-network-january-2026)
