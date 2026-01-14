# UREJESHO → Salvation: Pivot Document

## Overview

This document outlines the strategic pivot from UREJESHO (micro-donation platform) to Salvation (infrastructure bond + prediction market platform) for the Mantle Global Hackathon 2025.

**TL;DR:** We're keeping the Africa narrative but transforming from charity to investment. Donations become bonds. Hope becomes yield. Trust becomes prediction markets.

---

## What UREJESHO Was

### Core Concept
UREJESHO ("regeneration" in Swahili) was an invisible charity layer for Web3 that automatically donated micro-amounts from every transaction to African infrastructure projects.

### How It Worked

```
User transacts on any dApp
    → UREJESHO hook/snap detects transaction
    → Automatically donates <1% or $0.001
    → Funds pool for African development
    → User earns impact badges/NFTs
```

### Key Features (Old Model)

| Feature | Description |
|---------|-------------|
| Invisible donations | Sub-1% fee on every transaction |
| DID identity | Non-transferable identity tracking donations |
| Gamification | Milestone NFTs, leaderboards, badges |
| NGO funding | AI-analyzed proposals, community voting |
| Milestone release | Funds released upon verified completion |

### What Won the Hedera Hackathon
- Novel "invisible giving" UX
- African diaspora narrative
- Pan-African solidarity angle
- Technical implementation with HBAR allowances

---

## Why We're Pivoting

### Problem 1: Wrong Track

| UREJESHO Model | Hackathon Track Fit |
|----------------|---------------------|
| Donation-based | ❌ Not RWA/RealFi |
| No yield | ❌ Not DeFi |
| Pure charity | ❌ Weak for "Top Priority" track |

**The Mantle hackathon explicitly prioritizes RWA/RealFi.** Donation mechanics don't qualify.

### Problem 2: No Financial Incentive

```
Donation Model:
    Investor gives $100 → Feels good → Gets badge → End

Bond Model:
    Investor puts $100 → Earns 12% APY → Gets yield + impact → Compounds
```

**Real yield > warm feelings** for attracting capital at scale.

### Problem 3: No Accountability Mechanism

Old model relied on:
- AI analysis (can be gamed)
- Community voting (low engagement)
- Milestone reports (self-reported)

**Prediction markets create financial accountability.** People with money on the line verify harder than volunteers.

### Problem 4: Differentiation

"Micro-donations for Africa" is:
- Hard to demo (invisible by design)
- Similar to existing charity platforms
- Not technically novel

"Infrastructure bonds with prediction markets" is:
- Highly demonstrable
- Genuinely novel combination
- Multiple technical components to showcase

---

## What's Changing

### From → To

| Aspect | UREJESHO (Old) | Salvation (New) |
|--------|----------------|-----------------|
| **Core mechanic** | Donations | Investment bonds |
| **User motivation** | Altruism | Yield + impact |
| **Financial return** | None | 8-15% APY |
| **Accountability** | Community voting | Prediction markets |
| **Token model** | Impact badges (non-transferable) | Bond tokens (tradeable) |
| **Revenue model** | Platform fees | Protocol fees on yield |
| **Target track** | None (didn't fit) | RWA/RealFi (top priority) |
| **Verification** | AI + community | Oracles + prediction markets |

### Technical Changes

```
REMOVED:
├── Transaction hooks/snaps (invisible donation layer)
├── HBAR allowance system
├── Non-transferable DID
├── AI proposal analysis
├── Community voting contracts
└── Gamification badges

ADDED:
├── BondFactory.sol (token minting per project)
├── YieldVault.sol (revenue distribution)
├── BinaryMarket.sol (prediction markets)
├── MarketResolver.sol (oracle integration)
├── InsurancePool.sol (failure protection)
└── OracleAggregator.sol (multi-source verification)
```

### UX Changes

**Old Flow:**
```
Connect wallet → Set donation % → Use dApps normally → Check impact dashboard
```

**New Flow:**
```
Browse projects → Buy bond tokens → Optionally trade prediction market → Claim yield → Track project progress
```

---

## What's Staying the Same

### ✅ Africa Narrative

The story remains powerful:
- African infrastructure gap ($100B+ annual need)
- Diaspora connection and investment
- Underserved market = differentiation
- Concrete examples (water wells, solar, schools)

### ✅ Infrastructure Focus

Same project categories:
- Water systems
- Solar/energy
- Education facilities
- Healthcare infrastructure
- Agricultural innovation

### ✅ Transparency Ethos

Still blockchain-native transparency:
- All funds tracked on-chain
- Verifiable project progress
- Public yield distribution
- Immutable milestone records

### ✅ Milestone-Based Release

Funds still released incrementally:
- Project broken into milestones
- Verification required before next tranche
- Reduces fraud risk

### ✅ Brand Identity

"Salvation" maintains the redemption/regeneration theme:
- UREJESHO = "regeneration" (Swahili)
- Salvation = redemption, saving, restoration
- Both evoke building something better

---

## Technical Migration

### Contracts to Deprecate

```solidity
// NO LONGER NEEDED
GlobalPool.sol          // Donation aggregation
AllowanceManager.sol    // HBAR allowance tracking  
ImpactDID.sol          // Non-transferable identity
DonationTracker.sol    // Per-tx donation logging
BadgeNFT.sol           // Gamification rewards
ProposalVoting.sol     // Community governance
```

### New Contract Architecture

```solidity
// CORE
ProjectRegistry.sol     // Project metadata & state
BondFactory.sol        // Mints ERC-3643-Lite bond tokens
BondToken.sol          // Yield-bearing token with compliance hooks
YieldVault.sol         // ERC-4626 revenue distribution

// COMPLIANCE (ERC-3643-Lite)
IdentityRegistry.sol   // KYC allowlist
ComplianceModule.sol   // Transfer restrictions

// PREDICTION MARKETS  
MarketFactory.sol      // Creates markets per project
BinaryMarket.sol       // YES/NO trading logic (LMSR or CPMM)
MarketResolver.sol     // Oracle-triggered resolution

// VERIFICATION
OracleAggregator.sol   // Chainlink + custom oracles
VerifierRegistry.sol   // Staked human verifiers
MilestoneTracker.sol   // State machine for project progress

// SAFETY
InsurancePool.sol      // Protocol-owned insurance
```

### Token Standards Decision

| Token | Standard | Rationale |
|-------|----------|-----------|
| Bond tokens | ERC-3643-Lite | RWA compliance credibility without full complexity |
| Yield vault | ERC-4626 | DeFi composability, audited standard |
| YES/NO tokens | ERC-20 | Not RWAs, no compliance needed |

This signals to judges: "We know RWA standards exist and made deliberate choices."

### Frontend Changes

```
REMOVE:
├── Donation settings page
├── Impact badge gallery
├── Leaderboards
├── Voting interface
└── DID management

ADD:
├── Project marketplace (browse/filter)
├── Bond purchase flow
├── Prediction market trading UI
├── Yield dashboard (claimable, APY, history)
├── Project detail pages (milestones, verification status)
└── Portfolio view (bonds held, prediction positions)
```

---

## New User Personas

### Persona 1: Yield-Seeking DeFi User

**Name:** Alex  
**Profile:** Active DeFi user, farms yields across protocols  
**Motivation:** "I want real yield backed by something tangible, not just token emissions"  
**Journey:**
1. Discovers Salvation via CT or DeFi aggregator
2. Attracted by 10%+ APY on infrastructure bonds
3. Diversifies portfolio with 3-4 project bonds
4. Uses prediction markets to hedge riskier projects
5. Becomes advocate after receiving first yield

### Persona 2: African Diaspora Investor

**Name:** Amara  
**Profile:** Nigerian-American professional, sends remittances home  
**Motivation:** "I want to invest in Africa's future, not just donate"  
**Journey:**
1. Sees Salvation as way to have financial stake in African development
2. Invests in projects in ancestral region
3. Tracks progress via satellite imagery
4. Shares portfolio with family back home
5. Reinvests yield into new projects

### Persona 3: Prediction Market Trader

**Name:** Marcus  
**Profile:** Polymarket regular, trades on information edge  
**Motivation:** "I can research these projects and profit from my knowledge"  
**Journey:**
1. Discovers prediction markets on project outcomes
2. Researches via satellite data, local news, verifier reports
3. Takes positions on underpriced YES or NO outcomes
4. Profits from correct predictions
5. Becomes de facto investigative layer for protocol

---

## Risk Comparison

| Risk | UREJESHO (Old) | Salvation (New) |
|------|----------------|-----------------|
| **User acquisition** | Hard (invisible = no hook) | Easier (yield = clear value prop) |
| **Regulatory** | Low (donations) | Medium (securities concerns) |
| **Technical complexity** | Medium | Higher (more contracts) |
| **Fraud** | High (no financial accountability) | Lower (prediction markets + insurance) |
| **Sustainability** | Low (donation fatigue) | Higher (self-sustaining yield) |

---

## Hackathon Strategy

### Track Targeting

**Primary:** RWA / RealFi ($15,000)
- Infrastructure bonds = textbook RWA
- Yield distribution = RealFi mechanics
- KYC flows = compliance checkbox

**Secondary:** DeFi & Composability ($15,000)
- Prediction market pools = DeFi primitive
- Bond tokens composable with other protocols
- Potential synthetic assets angle

**Tertiary:** AI & Oracles ($15,000)
- Multi-source oracle aggregation
- AI for satellite imagery analysis
- On-chain/off-chain data pipelines

**Also Eligible:**
- Grand Prize ($30,000) - novel + well-executed
- Best Mantle Integration ($4,000) - leverage Mantle's L2
- Best UX / Demo ($5,000) - polish the demo flow
- Incubation Grants ($15,000) - post-hackathon potential

### Demo Priorities

1. **End-to-end bond purchase** - Buy token, see it in wallet
2. **Prediction market trade** - Buy YES/NO, see price move
3. **Mock yield claim** - Demonstrate distribution mechanism
4. **Verification simulation** - Show oracle resolution
5. **Project dashboard** - Satellite imagery, milestone progress

### Narrative for Judges

> "UREJESHO won the Hedera hackathon as a donation platform. But we realized donations don't scale—investments do. Salvation transforms African infrastructure funding from charity into yield-generating bonds, built on ERC-3643 compliance hooks and ERC-4626 yield vaults. Investors earn 8-15% APY backed by real cash flows from water wells, solar installations, and schools. Prediction markets add accountability: bet against a project if you think it'll fail, creating financial incentives for verification. It's impact investing meets DeFi meets information markets."

---

## Timeline

### Week 1-2: Foundation
- [ ] Finalize contract architecture
- [ ] Deploy BondFactory + BondToken on Mantle testnet
- [ ] Basic frontend scaffold

### Week 3-4: Core Features
- [ ] YieldVault implementation
- [ ] BinaryMarket for prediction markets
- [ ] Project submission flow

### Week 5-6: Integration
- [ ] Oracle integration (mock + Chainlink)
- [ ] Market resolution logic
- [ ] Yield distribution testing

### Week 7-8: Polish
- [ ] UI/UX refinement
- [ ] Demo video production
- [ ] Pitch deck finalization
- [ ] Documentation

---

## Open Questions

1. **KYC Scope:** Full KYC for all users or just large investors?
2. **Yield Token Standard:** ERC-20 with custom yield logic or ERC-4626 vault?
3. **Prediction Market AMM:** LMSR (Logarithmic Market Scoring Rule) or CPMM (Constant Product)?
4. **Insurance Pool Funding:** 5% of bond purchases or separate staking?
5. **Mantle-Specific:** Any Mantle-native features to leverage for bonus points?

---

## Conclusion

The pivot from UREJESHO to Salvation represents a strategic evolution:

| | UREJESHO | Salvation |
|-|----------|-----------|
| **Model** | Charity | Investment |
| **Incentive** | Altruism | Yield |
| **Accountability** | Trust | Markets |
| **Scalability** | Limited | High |
| **Track Fit** | Poor | Excellent |

The Africa narrative stays. The mission stays. The execution gets sharper.

**Let's build.**