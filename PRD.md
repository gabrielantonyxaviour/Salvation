# Salvation - Product Requirements Document

## Executive Summary

Salvation is a decentralized platform that tokenizes African infrastructure projects as yield-bearing bonds, with integrated prediction markets for outcome accountability. Investors earn real yield from operational infrastructure (water wells, solar installations, schools), while prediction markets create price discovery for project success probability and enable hedging mechanisms.

**Target Hackathon Track:** RWA / RealFi (Primary), DeFi & Composability (Secondary), AI & Oracles (Tertiary)

---

## Problem Statement

### Traditional Development Funding is Broken

1. **Zero Accountability:** Billions flow into African infrastructure with no mechanism to verify outcomes
2. **No Financial Returns:** Donors give money and hope for the best—no yield, no skin in the game
3. **Opaque Allocation:** Funds disappear into bureaucratic black holes
4. **No Risk Pricing:** All projects treated equally regardless of feasibility
5. **Verification Theater:** Progress reports are self-reported, unverifiable

### The Opportunity

Africa needs $100B+ annually in infrastructure investment. Traditional aid is failing. DeFi can create transparent, yield-generating, accountable infrastructure financing.

---

## Solution Overview

Salvation transforms infrastructure funding from charity into investment:

```
┌─────────────────────────────────────────────────────────────────┐
│                      SALVATION PROTOCOL                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   PROJECT    │───▶│    BOND      │───▶│    YIELD     │      │
│  │  SUBMISSION  │    │  TOKENIZATION│    │ DISTRIBUTION │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   ▲               │
│         ▼                   ▼                   │               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │     KYC      │    │  PREDICTION  │───▶│   ORACLE     │      │
│  │ VERIFICATION │    │    MARKET    │    │ VERIFICATION │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Target Users

### Primary Users

| User Type | Description | Motivation |
|-----------|-------------|------------|
| **Yield Investors** | DeFi users seeking real-world yield | 8-15% APY backed by real cash flows |
| **Impact Investors** | Diaspora, ESG funds, impact-focused capital | Measurable African development impact |
| **Speculators** | Prediction market traders | Profit from outcome predictions |
| **Project Sponsors** | NGOs, local governments, social enterprises | Access to decentralized funding |

### Secondary Users

| User Type | Description | Role |
|-----------|-------------|------|
| **Verifiers** | Local agents, IoT devices, satellite providers | Confirm project milestones |
| **Liquidity Providers** | DeFi LPs | Provide liquidity for bond/prediction markets |

---

## Core Features

### 1. Infrastructure Bond Tokenization

**What:** Each infrastructure project becomes a tokenized bond with yield rights.

**Mechanics:**
- Project submitted with funding goal, timeline, revenue model
- Bond tokens minted representing pro-rata yield rights
- Investors purchase tokens during funding round
- Tokens are transferable (secondary market enabled)

**Example - Water Well Project:**
```
Project: Community Water Well - Kisumu, Kenya
Funding Goal: $10,000
Token Supply: 10,000 WELL-KIS tokens @ $1 each
Revenue Model: $0.02/liter usage fee
Projected Yield: 12% APY based on 500L/day utilization
Maturity: 5 years (or perpetual with buyback option)
```

### 2. Prediction Markets for Accountability

**What:** Each project has an associated prediction market for outcome betting.

**Market Types:**

| Market | Question | Resolution |
|--------|----------|------------|
| **Completion Market** | "Will this project be operational by [date]?" | Binary YES/NO |
| **Performance Market** | "Will this project generate >$X revenue in Y months?" | Binary YES/NO |
| **Milestone Markets** | "Will milestone N be completed by [date]?" | Binary per milestone |

**Why This Matters:**
- Creates price discovery for project risk
- Allows investors to hedge bond positions
- Incentivizes accurate information revelation
- Failed predictions = early warning system

**Example:**
```
Bond: WELL-KIS (Water Well Kisumu)
Prediction Market: "Operational by Q2 2026?"
Current Price: YES @ $0.78 / NO @ $0.22
Implied Probability: 78% success rate

Investor Strategy:
- Bullish: Buy bond + buy YES
- Hedged: Buy bond + buy NO (insurance)
- Speculator: Just trade YES/NO based on intel
```

### 3. Yield Distribution Engine

**What:** Automated distribution of project revenue to bond holders.

**Flow:**
```
Project Revenue (fiat) 
    → Converted to stablecoin via partner
    → Deposited to Yield Vault contract
    → Distributed pro-rata to bond token holders
    → Claimable anytime or auto-compound
```

**Fee Structure:**
- Protocol fee: 2% of yield
- Verification fee: 1% of yield
- Project operator fee: 10-20% (configurable per project)

### 4. Oracle & Verification Layer

**What:** Multi-source verification for project milestones and revenue.

**Verification Methods:**

| Method | Use Case | Trust Level |
|--------|----------|-------------|
| **Satellite Imagery** | Construction progress, solar installation | High |
| **IoT Sensors** | Water flow, energy generation | High |
| **Local Verifiers** | Staked human agents with reputation | Medium |
| **Photo/Video Proof** | Milestone documentation | Medium |
| **Financial Oracles** | Revenue verification via payment rails | High |

**Resolution Process:**
1. Milestone deadline approaches
2. Multiple verification sources submit data
3. Oracle aggregates and reaches consensus
4. Prediction market resolves
5. Bond yield adjusts based on performance

### 5. Insurance Pool

**What:** Protocol-owned insurance for failed projects.

**Mechanics:**
- 5% of all bond purchases go to Insurance Pool
- If project fails (verified by oracle), bond holders can claim partial refund
- Prediction market NO holders also paid out
- Creates systemic risk buffer

---

## Technical Architecture

### RWA Token Standards

Salvation implements a pragmatic subset of RWA standards to balance compliance credibility with development velocity.

#### Bond Tokens: ERC-3643-Lite

Full ERC-3643 is overkill for MVP, but we implement the critical compliance hooks:

**Implemented from ERC-3643:**

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| Identity Registry | Track verified investors | `IdentityRegistry.sol` - allowlist mapping |
| Transfer Restrictions | Compliance checks | `canTransfer()` hook on every transfer |
| Compliance Module | Pluggable rules | Single module for MVP, interface for extensibility |
| Forced Transfer | Regulatory recovery | Admin function for legal compliance |
| Freeze | Regulatory holds | Per-address and global freeze capability |

**Deferred for Post-Hackathon:**

| Component | Reason |
|-----------|--------|
| ONCHAINID integration | Complex identity claim system |
| Multiple compliance modules | Single module sufficient for demo |
| Claim topics/issuers | Enterprise feature |
| Full recovery mechanisms | Edge case handling |

**Bond Token Interface:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IIdentityRegistry {
    function isVerified(address investor) external view returns (bool);
    function registerIdentity(address investor, bytes32 kycHash) external;
    function removeIdentity(address investor) external;
}

interface IComplianceModule {
    function canTransfer(address from, address to, uint256 amount) external view returns (bool);
    function transferred(address from, address to, uint256 amount) external;
}

abstract contract ERC3643Lite is ERC20 {
    IIdentityRegistry public identityRegistry;
    IComplianceModule public compliance;
    
    mapping(address => bool) public frozen;
    bool public globalFreeze;
    
    error IdentityNotVerified(address investor);
    error TransferNotCompliant(address from, address to, uint256 amount);
    error AddressFrozen(address account);
    error GloballyFrozen();
    
    modifier notFrozen(address account) {
        if (globalFreeze) revert GloballyFrozen();
        if (frozen[account]) revert AddressFrozen(account);
        _;
    }
    
    function _update(address from, address to, uint256 amount) internal virtual override {
        // Skip checks for minting/burning
        if (from != address(0) && to != address(0)) {
            if (!identityRegistry.isVerified(to)) 
                revert IdentityNotVerified(to);
            if (!compliance.canTransfer(from, to, amount)) 
                revert TransferNotCompliant(from, to, amount);
        }
        super._update(from, to, amount);
        
        if (from != address(0) && to != address(0)) {
            compliance.transferred(from, to, amount);
        }
    }
    
    function setFrozen(address account, bool status) external virtual;
    function setGlobalFreeze(bool status) external virtual;
    function forcedTransfer(address from, address to, uint256 amount) external virtual;
}
```

#### Yield Vault: ERC-4626

Revenue distribution follows the ERC-4626 tokenized vault standard for DeFi composability:

```solidity
interface ISalvationYieldVault is IERC4626 {
    // Standard ERC-4626
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function totalAssets() external view returns (uint256);
    
    // Salvation extensions
    function depositRevenue(uint256 amount) external;                    // Project revenue inflow
    function claimableYield(address holder) external view returns (uint256);
    function claimYield() external returns (uint256);
    function projectId() external view returns (bytes32);
}
```

**Why ERC-4626:**
- Industry standard for yield-bearing tokens
- Composable with other DeFi protocols (Yearn, Aave, etc.)
- Well-audited reference implementations available
- Judges recognize it immediately

#### Prediction Market Tokens: Plain ERC-20

Prediction market YES/NO tokens are **not RWAs**—they're betting positions. No compliance overhead needed:

```solidity
// Simple ERC-20, no restrictions
contract OutcomeToken is ERC20 {
    address public market;
    bool public isYesToken;
    
    constructor(string memory name, string memory symbol, address _market, bool _isYes) 
        ERC20(name, symbol) {
        market = _market;
        isYesToken = _isYes;
    }
    
    function mint(address to, uint256 amount) external onlyMarket { _mint(to, amount); }
    function burn(address from, uint256 amount) external onlyMarket { _burn(from, amount); }
}
```

#### Standards Summary

| Token Type | Standard | Transferable | Compliance | Yield |
|------------|----------|--------------|------------|-------|
| Bond Token | ERC-3643-Lite | Yes (restricted) | KYC required | Yes |
| Yield Vault Shares | ERC-4626 | Yes | Inherits from bond | Claimable |
| YES/NO Tokens | ERC-20 | Yes (unrestricted) | None | No |

#### Future Migration Path

Post-hackathon, we can upgrade to:
- **Full ERC-3643** with ONCHAINID for institutional compliance
- **EIP-7943 (uRWA)** once tooling matures—its minimal hook design aligns with our architecture

### Smart Contracts (Solidity - Mantle Network)

```
contracts/
├── core/
│   ├── ProjectRegistry.sol      # Project submission & metadata
│   ├── BondFactory.sol          # Mints bond tokens per project
│   ├── BondToken.sol            # ERC-3643-Lite yield-bearing token
│   └── YieldVault.sol           # ERC-4626 revenue distribution
├── compliance/
│   ├── IdentityRegistry.sol     # KYC allowlist registry
│   └── ComplianceModule.sol     # Transfer rule enforcement
├── prediction/
│   ├── MarketFactory.sol        # Creates prediction markets
│   ├── BinaryMarket.sol         # YES/NO outcome markets
│   └── MarketResolver.sol       # Oracle integration for resolution
├── verification/
│   ├── OracleAggregator.sol     # Multi-source oracle consensus
│   ├── VerifierRegistry.sol     # Staked human verifiers
│   └── MilestoneTracker.sol     # Project milestone state machine
├── insurance/
│   └── InsurancePool.sol        # Failed project compensation
└── governance/
    └── SalvationDAO.sol         # Protocol governance
```

### Key Contract Interactions

```
User buys bond
    → BondFactory.mint(projectId, amount)
    → 95% to ProjectRegistry.fundProject()
    → 5% to InsurancePool.deposit()
    → MarketFactory.createMarket(projectId) [if first purchase]

Project generates revenue
    → YieldVault.depositRevenue(projectId, amount)
    → YieldVault.distribute() [callable by anyone]
    → BondToken holders claim yield

Milestone verification
    → OracleAggregator.submitVerification(projectId, milestoneId, data)
    → MilestoneTracker.updateState()
    → MarketResolver.resolve(marketId, outcome)
    → Prediction market payouts executed
```

### Off-Chain Components

```
backend/
├── indexer/                # Index on-chain events
├── api/                    # REST API for frontend
├── oracle-service/         # Aggregate verification data
├── satellite-integration/  # Planet Labs, Sentinel API
├── iot-bridge/            # IoT device data ingestion
└── notification-service/  # Alerts for milestones, yields
```

---

## User Flows

### Flow 1: Investor Purchases Bond

```
1. Browse active projects on marketplace
2. View project details (location, revenue model, risk score, prediction market odds)
3. Connect wallet (MetaMask, WalletConnect)
4. Complete KYC (if required for jurisdiction)
5. Purchase bond tokens with USDT/USDC
6. Optionally hedge with prediction market position
7. Track yield accrual in dashboard
8. Claim yield or auto-compound
```

### Flow 2: Project Sponsor Submits Project

```
1. Complete KYB verification
2. Submit project proposal:
   - Location, description, photos
   - Funding goal and timeline
   - Revenue model and projections
   - Milestone breakdown
3. Proposal reviewed by DAO or automated scoring
4. If approved, bond tokens minted and funding round opens
5. Receive funds at milestones upon verification
6. Submit revenue reports for yield distribution
```

### Flow 3: Speculator Trades Prediction Market

```
1. Browse open prediction markets
2. Research project (satellite images, verifier reports, news)
3. Buy YES or NO tokens based on conviction
4. Trade positions as new information emerges
5. Hold until resolution or exit early
6. Collect payout if correct
```

---

## Data Models

### Project

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  location: {
    country: string;
    region: string;
    coordinates: [number, number];
  };
  category: 'water' | 'solar' | 'education' | 'healthcare' | 'agriculture';
  fundingGoal: number;
  fundingRaised: number;
  status: 'funding' | 'active' | 'completed' | 'failed';
  revenueModel: RevenueModel;
  milestones: Milestone[];
  bondTokenAddress: string;
  predictionMarkets: string[];
  createdAt: number;
  sponsor: string;
}
```

### Bond Token

```typescript
interface BondToken {
  address: string;
  projectId: string;
  totalSupply: number;
  pricePerToken: number;
  yieldAccrued: number;
  yieldDistributed: number;
  maturityDate: number;
  transferable: boolean;
}
```

### Prediction Market

```typescript
interface PredictionMarket {
  id: string;
  projectId: string;
  question: string;
  type: 'completion' | 'performance' | 'milestone';
  resolutionDate: number;
  resolved: boolean;
  outcome: 'YES' | 'NO' | null;
  yesPool: number;
  noPool: number;
  yesPrice: number;
  noPrice: number;
}
```

---

## Success Metrics

### Hackathon Demo Metrics

| Metric | Target |
|--------|--------|
| Projects listed | 3+ demo projects |
| Bond purchase flow | End-to-end working |
| Prediction market | Functional YES/NO trading |
| Mock yield distribution | Demonstrated |
| Verification simulation | Oracle resolution shown |

### Post-Launch Metrics

| Metric | 6-Month Target |
|--------|----------------|
| Total Value Locked (TVL) | $100,000+ |
| Projects funded | 10+ |
| Unique investors | 500+ |
| Prediction market volume | $50,000+ |
| Average bond APY | 8-15% |
| Project success rate | >70% |

---

## Roadmap

### Phase 1: Hackathon MVP (8 weeks)

- [ ] Core smart contracts deployed on Mantle testnet
- [ ] Bond tokenization for 3 sample projects
- [ ] Basic prediction market (completion markets only)
- [ ] Simple frontend with invest + trade flows
- [ ] Mock oracle for demo resolution
- [ ] Demo video and pitch deck

### Phase 2: Testnet Beta (Q1 2026)

- [ ] Full contract audit
- [ ] Real satellite/IoT oracle integration
- [ ] KYC integration (Synaps, Jumio)
- [ ] Secondary market for bonds
- [ ] Mobile-responsive UI
- [ ] Verifier staking system

### Phase 3: Mainnet Launch (Q2 2026)

- [ ] Mantle mainnet deployment
- [ ] First real projects funded
- [ ] Fiat on-ramp integration
- [ ] DAO governance activation
- [ ] Partnership with African NGOs
- [ ] Institutional investor onboarding

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Project fraud | Medium | High | KYB, staked verifiers, milestone-based release |
| Oracle manipulation | Low | High | Multi-source consensus, dispute mechanism |
| Regulatory action | Medium | Medium | Jurisdiction restrictions, legal opinion |
| Low liquidity | Medium | Medium | Liquidity mining, market maker partnerships |
| Smart contract bugs | Low | Critical | Audits, formal verification, bug bounty |

---

## Appendix

### Comparable Projects

| Project | What They Do | How We Differ |
|---------|--------------|---------------|
| Goldfinch | Emerging market lending | We do infrastructure bonds, not loans; ERC-3643 compliance |
| Centrifuge | RWA tokenization | We add prediction markets for accountability |
| Polymarket | Prediction markets | We focus on RWA outcomes, not general events |
| EthicHub | Agricultural lending | We're broader + have speculation layer |
| Ondo Finance | Tokenized treasuries | We do infrastructure, not financial instruments |

### Technical Differentiators

| Feature | Most RWA Projects | Salvation |
|---------|-------------------|-----------|
| Token Standard | Custom or ERC-20 | ERC-3643-Lite (compliance-ready) |
| Yield Mechanism | Proprietary | ERC-4626 (composable) |
| Accountability | Trust-based | Prediction markets (financial) |
| Verification | Self-reported | Multi-source oracle consensus |

### References

- Mantle Network Docs: https://docs.mantle.xyz
- ERC-3643 Specification: https://erc3643.org / EIP-3643
- ERC-4626 Tokenized Vault: https://eips.ethereum.org/EIPS/eip-4626
- EIP-7943 uRWA (Draft): https://eips.ethereum.org/EIPS/eip-7943
- Prediction Market Theory: Hanson's LMSR (Logarithmic Market Scoring Rule)
- OpenZeppelin ERC-4626 Implementation: https://github.com/OpenZeppelin/openzeppelin-contracts