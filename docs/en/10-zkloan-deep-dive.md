# Understanding "Why ZK Is Needed" Through ZK Loan

> **Target audience**: Developers with smart contract experience who want to conceptually understand the necessity of ZK. Deep cryptographic knowledge is not required.
>
> **Reference repository**: [midnightntwrk/example-zkloan](https://github.com/midnightntwrk/example-zkloan) — All code examples in this document are based on this repository.

---

## Background: The Privacy Problem in Loan Underwriting

To borrow a loan, you need to disclose your credit score, income, and employment history to the lender. Doing this on a blockchain means all personal information gets recorded on a public ledger, visible to everyone.

**Options without ZK:**

- Put raw data on-chain → No privacy
- Underwrite off-chain and only put results on-chain → Underwriting becomes a black box

ZK breaks this dichotomy, making it possible to **prove the correctness of the underwriting while keeping the data hidden**.

---

## Actor Structure and Trust Model

### Participants

```
┌─────────────┐    Signature request   ┌──────────────────┐
│  Borrower    │ ────────────────────→  │  Data Provider    │
│ (Applicant)  │ ←──────────────────── │  (Attestation)    │
│              │    Signed data         │                   │
└──────┬──────┘                        └──────────────────┘
       │                                  ↑ Register/Remove
       │ Loan application                 │
       │ (with ZK proof)                  │
       ▼                                  │
┌──────────────────────────────────────┴──┐
│         Contract (on-chain)              │
│  - Underwriting logic (tier) is fixed    │
│  - Provider management                   │
│  - Loan records                          │
└──────────────────┬───────────────────────┘
                   │ Deploy & manage
                   ▼
             ┌───────────┐
             │  Lender    │
             │  (Admin)   │
             └───────────┘
```

### Each Actor's Role, What They Know, and What They Don't

| Actor | Role | What they know | What they don't know |
|---|---|---|---|
| **Lender (Admin)** | Deploy & manage the contract, register trusted providers | Approval/rejection, loan amount | Credit score, income, employment history |
| **Data Provider** | Issue credit data and guarantee its authenticity via signature | Borrower's raw data (score, income, etc.) | Whether/when/how much a loan was applied for |
| **Borrower** | Obtain a signature from the provider and apply for a loan | All of their own data | — |

**Difference from traditional finance**: Traditionally, not only the credit bureau but also the lender sees the underwriting information. In this design, "the provider sees the information, but the lender only sees the result" holds true.

---

## Infrastructure: Distinguishing the Two Servers

This system involves **two servers operated by different parties**. They are easily confused, so let's clearly distinguish them.

### Attestation API (Operated by the Provider)

An API server operated by the credit data provider (e.g., a credit bureau).

```
Borrower → POST /attest → Provider fetches & verifies score from their DB → Returns signature
```

- The provider is the **originator** of credit data; seeing the borrower's raw data is by design
- The signature is the provider's endorsement that "this data is correct"
- This is a **one-time preparation step before** the loan application

> **Note**: The sample code's `POST /attest` has the borrower sending data, but in production, the provider would fetch data from their own DB and sign it. This is a sample simplification.

### Proof Server (Operated by the Borrower)

A local server running on the borrower's machine (`http://localhost:6300`). A computation engine specialized for ZK proof generation.

```
dApp → [Signed credit data + wallet key + PIN + loan amount] → Proof Server → ZK proof
```

The reason it runs on the borrower's side is that proof generation requires **the borrower's secret information**:

| Proof input | Owner | Can it be shared? |
|---|---|---|
| Signed credit data | Issued by provider → held by borrower | Sharing breaks privacy |
| Wallet secret key | Borrower | Sharing means assets can be stolen |
| Secret PIN | Borrower | Sharing breaks identity verification |
| Loan amount | Borrower | Sharing reveals loan application |

### Overall Flow

```
[Preparation]                           [Loan Application]
Provider's Attestation API              Borrower's local Proof Server

  Borrower → Provider                    On the borrower's machine:
  "Please sign my data"                    Signed credit data
        ↓                                + wallet key + PIN + loan amount
  Provider: Verifies against own DB              ↓
  → Returns signature                    Proof Server: Generates ZK proof
                                                ↓
  (Provider's job ends here)             Submit ZK proof on-chain
                                                ↓
                                         Node: Verifies proof → Records result
                                         (Lender only sees the result)
```

---

## Three Things ZK Solves

### 1. Privacy Protection

Raw data like credit score and income is used only within the ZK circuit (witness) and never appears on-chain.

```
Information disclosed on-chain:
  - Loan status: Approved / Rejected / Proposed
  - Approved amount: 10000

Information NOT on-chain:
  - Credit score: 720
  - Monthly income: $2,500
  - Months as customer: 24
  - PIN
```

However, there is a trade-off where the tier can be inferred from the approved amount (discussed later).

### 2. Transparency of Evaluation Logic

The underwriting criteria (tier determination) are fixed in the contract (`zkloan-credit-scorer.compact` L103-118).

```
Tier 1: Score ≥ 700 AND Income ≥ $2,000 AND Tenure ≥ 24 months → Max $10,000
Tier 2: Score ≥ 600 AND Income ≥ $1,500                        → Max $7,000
Tier 3: Score ≥ 580                                             → Max $3,000
Otherwise → Rejected
```

If the provider directly returned approve/reject, this determination would be a black box inside the provider. By using ZK, a **separation of responsibilities** is achieved: **the provider guarantees data authenticity, and the contract makes the evaluation logic public and fixed**.

### 3. Cryptographic Guarantee of Computation Correctness

The ZK proof guarantees that "the logic written in the contract was executed correctly without tampering."

The borrower generates the proof locally, but data tampering is impossible. The ZK circuit verifies the provider's Schnorr signature (`compact` L101), and a valid proof cannot be generated with inputs different from what the provider signed.

```
If the borrower tries to create a proof with a false score:
  Input: creditScore=800, signature=provider issued for creditScore=600
  → Signature verification in circuit → Message and signature mismatch → Proof generation fails

If the borrower tries to forge the signature:
  → Cannot forge Schnorr signature without the provider's secret key
```

---

## What ZK Does NOT Solve

### Data Authenticity Relies on Trust in the Provider

"Is the credit score really 720?" cannot be guaranteed by ZK. If the provider signs a false score, the contract cannot detect it.

```
What ZK guarantees:
  ✓ Whether the signature is from the provider (Schnorr signature verification)
  ✓ Whether data has been tampered with (tied to the signature)
  ✓ Whether tier determination was correctly executed (ZK circuit)
  ✗ Whether the score is really 720 → Must trust the provider
```

This is the same structure as traditional finance. Banks trust and use scores from credit bureaus. The difference in this system is that it cryptographically guarantees **privacy** and **evaluation transparency** beyond that trust.

As a mitigation, the design allows registering multiple providers, and the admin can remove dishonest providers.

### Information Leakage from Approved Amounts

Since the approved amount and tier determination logic are public, the **range** of the borrower's attributes can be inferred from the approved amount.

```
Approved $10,000 → Tier 1 → Score≥700, Income≥$2,000, Tenure≥24 months
Approved $7,000  → Tier 2 → Score≥600, Income≥$1,500
Approved $3,000  → Tier 3 → Score≥580
```

However, exact values remain unknown (whether the score is 700 or 800 is unclear). Also, when the requested amount ≤ maximum limit, the requested amount becomes the approved amount, making even the tier indeterminate ($5,000 approved → Tier 1 or Tier 2 is unclear).

This is a contract design trade-off about what to `disclose`. For stronger privacy, a design that only returns approve/reject without disclosing the approved amount is also possible.

---

## Conditions for This System to Be Meaningful

ZK Loan's three values (privacy, transparency, computation correctness) are independent, and not all are always necessary.

| Case | Privacy | Transparency | Computation correctness |
|---|---|---|---|
| **All actors are separate entities** | Effective | Effective | Effective |
| **Provider and lender are the same** | Diminished (lender already has data) | **Still effective** (guarantees fair underwriting to borrower) | Effective |
| **No trusted provider available** | Effective | Effective | Effective but **meaningless if inputs are false** |
| **Underwriting criteria are dynamic/subjective** | Effective | **Not possible** (cannot fix in ZK circuit) | Effective |

**Prerequisites for maximum effectiveness:**
1. A trusted data issuer exists
2. Evaluation criteria can be mechanically fixed
3. Data issuer and lender are separate entities (privacy value is maximized)

---

## Contract Underwriting Logic

The actual tier determination code (`contract/src/zkloan-credit-scorer.compact` L85-119):

```compact
circuit evaluateApplicant(userPubKeyHash: Field): [Uint<16>, LoanStatus] {
    // Get borrower's credit info, signature, and provider ID from witness (inside ZK circuit, not on-chain)
    const [profile, signature, providerId] = getAttestedScoringWitness();

    // Verify provider is registered with admin
    assert(providers.member(disclose(providerId)), "Attestation provider not registered");
    const providerPk = providers.lookup(disclose(providerId));

    // Message for signature verification: [creditScore, monthlyIncome, monthsAsCustomer, userPubKeyHash]
    const msg: Vector<4, Field> = [
        profile.creditScore as Field,
        profile.monthlyIncome as Field,
        profile.monthsAsCustomer as Field,
        userPubKeyHash
    ];

    // Verify provider's Schnorr signature — prevents data tampering
    Schnorr_schnorrVerify<4>(msg, signature, providerPk);

    // Tier 1: Best applicants
    if (profile.creditScore >= 700 && profile.monthlyIncome >= 2000 && profile.monthsAsCustomer >= 24) {
        return [10000, LoanStatus.Approved];
    }
    // Tier 2: Good applicants
    else if (profile.creditScore >= 600 && profile.monthlyIncome >= 1500) {
        return [7000, LoanStatus.Approved];
    }
    // Tier 3: Basic eligibility
    else if (profile.creditScore >= 580) {
        return [3000, LoanStatus.Approved];
    }
    else {
        return [0, LoanStatus.Rejected];
    }
}
```

Processing flow:

1. Retrieve credit data from `witness` (off-chain, secret)
2. Verify provider registration
3. Schnorr signature verification (cryptographically confirm data authenticity within the ZK circuit)
4. Tier determination (uses raw data for evaluation, but since it's not `disclose`d, it doesn't appear on-chain)

In the calling `requestLoan` (L49-62), only the returned approved amount and status are `disclose`d and made public.

---

## Contract Management Structure

```compact
constructor() {
    admin = ownPublicKey();  // Deployer becomes initial admin
}
```

What the admin (= lender) can do:

| Operation | Circuit |
|---|---|
| Register a provider | `registerProvider(providerId, providerPk)` |
| Remove a provider | `removeProvider(providerId)` |
| Blacklist a user | `blacklistUser(account)` |
| Remove from blacklist | `removeBlacklistUser(account)` |
| Transfer admin rights | `transferAdmin(newAdmin)` |

The lender decides "which providers to trust," and the underwriting criteria are fixed in the contract.

---

## Summary

```
Traditional on-chain loan:
  Borrower → [Raw data disclosed] → Contract → Lender sees everything

ZK Loan:
  Borrower → [Get signature from provider] → [Generate ZK proof locally] → Contract → Lender only sees the result
```

| Aspect | Traditional | ZK Loan |
|---|---|---|
| Information visible to lender | Everything | Only approval result and amount |
| Underwriting logic | Lender or provider's black box | Public and fixed in contract |
| Computation correctness | Trust-based | Cryptographically proven |
| Data correctness | Trust the provider | Trust the provider (same) |
| Data tampering prevention | None | Signature verification built into ZK circuit |

ZK is not a silver bullet. But it is the only means to simultaneously achieve "privacy," "transparency," and "computation correctness," fundamentally changing the traditional constraint of "having to disclose information for transparency."
