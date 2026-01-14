# Salvation - Yield-Generating African Infrastructure Bonds

**"Investment, Not Charity. Yield, Not Hope."**

Salvation tokenizes African infrastructure projects as yield-bearing bonds with integrated prediction markets for accountability. Investors earn real yield from operational infrastructure (water wells, solar installations, schools), while prediction markets create price discovery for project success probability.

**Built for Mantle Global Hackathon 2025**

---

## Live Deployments (Mantle Sepolia)

### Smart Contracts

| Contract | Address |
|----------|---------|
| ProjectRegistry | `0x7b26647372E10B7e363A8A857FF88C0C0b63913b` |
| BondFactory | `0x9ED03b9a9Fb743ac36EFb35B72a2db31DE525821` |
| MarketFactory | `0xCEF696B36e24945f45166548B1632c7585e3F0DB` |
| YieldVault | `0xe05dC9467de459adFc5c31Ce4746579d29B65ba2` |
| OracleAggregator | `0x11191A01670643f2BE3BD8965a16F59556258c2d` |

---

## Project Structure

```
salvation/
├── frontend/                # Next.js 15 web application
│   ├── app/                # App router pages
│   ├── components/         # React components
│   └── lib/                # Utilities and integrations
│
├── contracts/              # Solidity smart contracts
│   └── src/
│       ├── core/           # ProjectRegistry, BondFactory, BondToken, YieldVault
│       ├── prediction/     # MarketFactory, BinaryMarket, MarketResolver
│       ├── oracle/         # OracleAggregator
│       ├── compliance/     # IdentityRegistry, ComplianceModule
│       └── insurance/      # InsurancePool
│
├── agents/                 # AI verification agents (A2A SDK)
│   └── src/               # LangChain-powered agents
│
├── subgraph/              # The Graph indexer for Mantle
│
├── docs/                  # Documentation
│   └── DEMO.md           # Demo walkthrough guide
│
├── PRD.md                 # Product Requirements Document
└── PIVOT.md               # Strategic pivot documentation
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 - includes demo mode with 5 sample projects.

### Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Add your private key
npx hardhat run scripts/deploy.ts --network mantleSepolia
```

### Subgraph

```bash
cd subgraph
npm install
npm run codegen
npm run build
npm run deploy:goldsky  # Recommended for Mantle
```

---

## Core Features

### 1. Infrastructure Bond Tokenization

Each project becomes a tokenized bond with yield rights:

- **ERC-3643-Lite** compliant (regulatory-ready)
- Transferable on secondary markets
- Pro-rata yield distribution from project revenue

```
Example: Water Well - Kisumu, Kenya
├── Funding Goal: $10,000
├── Token Supply: 10,000 WELL-KIS @ $1 each
├── Revenue Model: $0.02/liter usage fee
├── Projected APY: 12.5%
└── Maturity: 5 years
```

### 2. Prediction Markets for Accountability

Binary markets create price discovery for project outcomes:

| Market Type | Question | Resolution |
|-------------|----------|------------|
| Completion | "Will this project be operational by [date]?" | YES/NO |
| Performance | "Will revenue exceed $X in Y months?" | YES/NO |
| Milestone | "Will milestone N complete by [date]?" | YES/NO |

**Why It Matters:**
- Price discovery for project risk
- Hedge bond positions by buying NO
- Speculators reveal information
- Market prices = early warning system

### 3. ERC-4626 Yield Vaults

Revenue distribution follows the tokenized vault standard:

```
Project Revenue (fiat)
    → Converted to stablecoin
    → Deposited to YieldVault
    → Distributed pro-rata to bond holders
    → Claimable anytime or auto-compound
```

### 4. Multi-Source Oracle Verification

| Method | Use Case | Trust Level |
|--------|----------|-------------|
| Satellite Imagery | Construction progress | High |
| IoT Sensors | Water flow, energy generation | High |
| AI Agents | Evidence analysis | Medium |
| Local Verifiers | On-ground verification | Medium |

### 5. Insurance Pool

Protocol-owned insurance for failed projects:
- 5% of bond purchases → Insurance Pool
- Partial refunds if project fails
- NO token holders paid out on failure

---

## Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.3+
- **Styling:** TailwindCSS 4.0 + Shadcn UI
- **State:** Zustand + React Query
- **Auth:** Privy (embedded wallets)
- **Web3:** wagmi + viem

### Smart Contracts
- **Language:** Solidity 0.8.24
- **Framework:** Hardhat + Foundry
- **Standards:** ERC-3643-Lite, ERC-4626, ERC-20
- **Network:** Mantle Sepolia → Mainnet

### Agents
- **Framework:** LangChain + LangGraph
- **Protocol:** A2A SDK
- **Runtime:** Express.js + TypeScript

### Indexing
- **Protocol:** The Graph
- **Deployment:** Goldsky (recommended for Mantle)

---

## Demo Projects

| Project | Category | Funding | APY | Status |
|---------|----------|---------|-----|--------|
| Kisumu Water Well | Water | 75% | 12.5% | Active |
| Lagos Solar Microgrid | Solar | 65% | 15.2% | Funding |
| Accra Tech Academy | Education | 100% | 8.5% | Active |
| Nairobi Health Clinic | Healthcare | 40% | 10% | Funding |
| Sidama Coffee Coop | Agriculture | 100% | 14% | Completed |

---

## Target Hackathon Tracks

**Primary:** RWA / RealFi ($15,000)
- Infrastructure bonds = textbook RWA
- ERC-3643 compliance hooks
- Real yield from operations

**Secondary:** DeFi & Composability ($15,000)
- ERC-4626 yield vaults
- Prediction market AMM (LMSR)
- Composable bond tokens

**Tertiary:** AI & Oracles ($15,000)
- Multi-source oracle aggregation
- AI agents for verification
- Satellite imagery analysis

---

## Documentation

- [Product Requirements](./PRD.md) - Full technical specification
- [Demo Guide](./docs/DEMO.md) - Hackathon demo walkthrough
- [Pivot Document](./PIVOT.md) - Strategic evolution from donation model

---

## Why Salvation?

| Traditional Aid | Salvation |
|-----------------|-----------|
| Donations | Investments |
| Zero returns | 8-15% APY |
| Trust-based | Market-verified |
| Hope for impact | Measured outcomes |
| Opaque allocation | On-chain transparency |

**Africa needs $100B+ annually in infrastructure investment. Traditional aid is failing. DeFi can do better.**

---

**Built for Mantle Global Hackathon 2025**
