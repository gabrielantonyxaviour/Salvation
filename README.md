# SALVATION - Regenerating Africa Through Web3

![Salvation Hero](./images/hero.png)

**"Every Transaction Builds Africa"**

Salvation (meaning "regeneration" in Swahili) seamlessly integrates micro-donations into Web3 transactions to rebuild African infrastructure and support African communities, creating a verifiable impact identity while democratically funding continent-wide development projects.

**Built for Hedera Africa 2025 Hackathon** 🌍

> **📋 For comprehensive project details, see [SALVATION.md](./docs/SALVATION.md)**

---

## 🔗 Live Deployments (Hedera Testnet)

### Smart Contracts
- **GlobalPoolV2**: [`0.0.7179929`](https://hashscan.io/testnet/contract/0.0.7179929) - Main governance contract (29/29 tests passed)
- **GlobalPool (Deprecated)**: [`0.0.7159418`](https://hashscan.io/testnet/contract/0.0.7159418)

### Tokens
- **URD Token**: [`0.0.7159388`](https://hashscan.io/testnet/token/0.0.7159388) - Universal HBAR (donation tracking & governance)
- **Impact Badge NFT**: [`0.0.7159392`](https://hashscan.io/testnet/token/0.0.7159392) - Achievement badges (5 tiers)

### Accounts
- **Treasury**: [`0.0.7130325`](https://hashscan.io/testnet/account/0.0.7130325)
- **Global Pool**: [`0.0.7159387`](https://hashscan.io/testnet/account/0.0.7159387)

### HCS Topics
- **Voting**: [`0.0.7159389`](https://hashscan.io/testnet/topic/0.0.7159389) - Vote messages & proposal creation
- **Milestone**: [`0.0.7159390`](https://hashscan.io/testnet/topic/0.0.7159390) - Milestone submissions & verifications
- **Audit Trail**: [`0.0.7159391`](https://hashscan.io/testnet/topic/0.0.7159391) - Platform-wide audit log
- **DID Registry**: [`0.0.7159619`](https://hashscan.io/testnet/topic/0.0.7159619) - Pan-African identity system
- **Credentials**: [`0.0.7159621`](https://hashscan.io/testnet/topic/0.0.7159621) - Verifiable credentials
- **Provenance**: [`0.0.7159622`](https://hashscan.io/testnet/topic/0.0.7159622) - File & document tracking

### HCS-10 AI Agents
- **Agent Registry**: [`0.0.7177347`](https://hashscan.io/testnet/topic/0.0.7177347)
- **Proposal Analyzer**: Inbound `0.0.7177349` | Outbound `0.0.7177350`
- **Re-Analyzer**: Inbound `0.0.7177352` | Outbound `0.0.7177354`
- **Milestone Verifier**: Inbound `0.0.7177356` | Outbound `0.0.7177358`

---

## 📁 Project Structure

```
salvation/
├── docs/                           # Specification documents
│   ├── SALVATION.md                # Product overview
│   ├── SALVATION-SPECIFICATION.md  # Technical architecture
│   ├── SALVATION-UI-SPECIFICATION.md # Design system
│   └── SALVATION-IMPLEMENTATION-PLAN.md # Development roadmap
│
├── frontend/                       # Next.js 15 web application
│   ├── app/                       # App router pages
│   ├── components/                # React components
│   ├── lib/                       # Utilities and integrations
│   └── public/                    # Static assets
│
├── contracts/                      # Solidity smart contracts
│   └── FundPool.sol               # Milestone-based fund distribution
│
├── snap/                          # MetaMask Snap
│   └── packages/snap/             # Snap package
│
├── guardian/                      # Guardian policy schemas
│   └── policies/                  # MRV workflow definitions
│
├── scripts/                       # Deployment and utility scripts
│   └── hedera/                    # Hedera setup scripts
│
└── tests/                         # Test suites
    ├── e2e/                       # End-to-end tests
    └── integration/               # Integration tests
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Hedera testnet account (get one at [portal.hedera.com](https://portal.hedera.com))
- Supabase account (for database)

### Environment Setup

Create `.env` files in respective directories with:

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_GLOBAL_POOL_CONTRACT=0.0.7179929
NEXT_PUBLIC_URD_TOKEN_ID=0.0.7159388
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

**Agents** (`agents/.env`):
```env
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=your_account_id
HEDERA_PRIVATE_KEY=your_private_key
REGISTRY_TOPIC_ID=0.0.7177347
OPENAI_API_KEY=your_openai_key
```

### Running Locally

#### 1. Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:3000`

#### 2. HCS-10 AI Agents
```bash
cd agents
npm install
npm run start:all  # Starts all agents (analyzer, re-analyzer, verifier)
```

Or start individual agents:
```bash
npm run start:analyzer    # Proposal analyzer
npm run start:reanalyzer  # Re-analyzer for vote updates
npm run start:verifier    # Milestone verifier
```

#### 3. MetaMask Snap (Optional)
```bash
cd snap
npm install
npm run start
```
Visit `http://localhost:8000` to test the snap

### Testing Smart Contracts

#### Run Full Test Suite
```bash
cd contracts
npm install
npm test  # Runs all tests for GlobalPoolV2
```

#### Test Specific Functionality
```bash
# Test governance functions
node test-governance.js

# Test project creation
node scripts/test-create-project.js

# Test voting
node scripts/test-voting.js

# Test milestone release
node scripts/test-milestone.js
```

#### Deploy New Contract Instance
```bash
node scripts/deploy-global-pool-v2.js
```

All contract tests should pass (29/29 for GlobalPoolV2). Test results verify:
- Quadratic voting calculation
- Project creation & updates
- Milestone-based fund release
- Multi-option voting (Accept/Reject/Increase/Decrease)
- Token balance & voting power tracking

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router, Server Components)
- **Language**: TypeScript 5.3+
- **Styling**: TailwindCSS 4.0
- **Components**: Shadcn UI (Radix primitives)
- **State**: Zustand + React Query
- **Maps**: Mapbox GL JS
- **Fonts**: Outfit (headings), Ubuntu (body)

### Backend
- **API**: Next.js 15 API Routes (Edge Runtime)
- **Database**: Supabase PostgreSQL 15 with PostGIS
- **Auth**: Supabase Auth + Hedera DID
- **Real-time**: Supabase subscriptions

### Blockchain
- **Network**: Hedera Testnet → Mainnet
- **SDK**: @hashgraph/sdk
- **Smart Contracts**: Solidity 0.8.24
- **Wallets**: MetaMask Snap + HashConnect

### Storage
- **Small files**: HFS (<4KB)
- **Large files**: IPFS via Pinata (>4KB)
- **Database**: Supabase PostgreSQL

### External APIs
- **Satellite**: Sentinel Hub API
- **Maps**: Mapbox GL JS
- **Guardian**: Hedera Guardian REST API

---

## 📖 Documentation

- [Product Overview](./docs/SALVATION.md)
- [Technical Specification](./docs/SALVATION-SPECIFICATION.md)
- [UI/UX Specification](./docs/SALVATION-UI-SPECIFICATION.md)
- [Implementation Plan](./docs/SALVATION-IMPLEMENTATION-PLAN.md)

---

## 🎯 Core Features

### 1. Automatic Micro-Donations
MetaMask Snap that adds tiny donations (<1% or $0.001 minimum) to every Web3 transaction.

### 2. Democratic Voting
Community votes on project proposals with voting power based on contribution and local multiplier.

### 3. Satellite Verification
Real infrastructure progress verified via Sentinel Hub satellite imagery.

### 4. Guardian Workflow
Milestone-based fund distribution with MRV (Monitoring, Reporting, Verification) framework.

### 5. Impact Badges
NFT badges celebrating contribution levels and African heritage (5 tiers).

### 6. Pan-African DID
Identity system tracking contribution across all 54 African countries.

### 7. Interactive Map
Visualize all projects across Africa with real-time updates and filtering.

---

## 🌍 Mission

Restore Africa to its historical greatness through technology-enabled collective action, channeling the global African diaspora and allies toward systematic infrastructure development and community empowerment across the continent.

---

## 📦 Development Phases

- [x] **Phase 1**: Foundation & Setup
- [ ] **Phase 2**: Core User Features
- [ ] **Phase 3**: Interactive Map & Visualization
- [ ] **Phase 4**: Donation System
- [ ] **Phase 5**: Voting System
- [ ] **Phase 6**: NFT Badges & DID
- [ ] **Phase 7**: Guardian Integration
- [ ] **Phase 8**: Satellite Verification
- [ ] **Phase 9**: NGO Portal
- [ ] **Phase 10**: Testing & Polish

---

## 🤝 Contributing

This project is part of a larger initiative to empower African development through Web3 technology. Contributions are welcome following our development guidelines.

---

## 📄 License

[Add license information]

---

## 🔗 Important Links

### Documentation
- [Product Overview](./docs/SALVATION.md) - Complete project vision & specifications
- [Technical Architecture](./docs/SALVATION-SPECIFICATION.md)
- [UI/UX Design System](./docs/SALVATION-UI-SPECIFICATION.md)
- [Implementation Roadmap](./docs/SALVATION-IMPLEMENTATION-PLAN.md)
- [Deployment Config](./deployment-config.json) - All contract addresses & topic IDs

### Hedera Resources
- [Hedera Portal](https://portal.hedera.com) - Get testnet account
- [Hedera Docs](https://docs.hedera.com)
- [HashScan Explorer](https://hashscan.io/testnet) - View all transactions
- [Guardian Documentation](https://docs.hedera.com/guardian)

### Technologies
- [Next.js 15](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Mapbox](https://www.mapbox.com/)
- [MetaMask Snaps](https://metamask.io/snaps/)

---

## 📊 Governance System

This project implements **Quadratic Voting** on Hedera:
- Voting power = √(URD token balance)
- Four vote options: Accept, Reject, Increase, Decrease
- Milestone-based fund release
- HCS-10 AI agents for autonomous verification

See [deployment-config.json](./deployment-config.json) for complete governance function signatures.

---

**Built with ❤️ for Africa | Hedera Africa 2025 Hackathon**
