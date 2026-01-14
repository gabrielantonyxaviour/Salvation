# Salvation Demo Guide

Complete walkthrough for demonstrating the Salvation platform at hackathons and presentations.

---

## Quick Start (Demo Mode)

The frontend includes built-in demo data that works without deployed contracts. Simply:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 to see the full platform with 5 demo projects.

---

## Demo Flow (5-7 minutes)

### 1. Landing Page (30s)

**Show the value proposition:**

- Navigate to `/` (home page)
- Point out the hero: "Yield-Generating African Infrastructure Bonds"
- Highlight the stats bar: 5 projects, $133K TVL, 12% avg APY
- Explain: "We're transforming infrastructure funding from charity into investment"

**Key talking points:**
- DeFi meets real-world infrastructure
- Investors earn real yield from operational projects
- Prediction markets create accountability

**Action:** Click "Browse Projects"

---

### 2. Browse Projects (45s)

**Show the project marketplace:**

- Navigate to `/projects`
- Show the 5 demo projects across different categories:
  - Water (Kisumu Water Well)
  - Solar (Lagos Solar Microgrid)
  - Education (Accra Tech Academy)
  - Healthcare (Nairobi Health Clinic)
  - Agriculture (Sidama Coffee Cooperative)

**Demonstrate filtering:**
- Filter by "Water" category
- Show how funding progress, APY, and status are displayed

**Key talking points:**
- Each project is a tokenized bond with yield rights
- Categories span water, solar, education, healthcare, agriculture
- Real projects with real revenue models

**Action:** Click on "Kisumu Water Well"

---

### 3. Project Detail (60s)

**Deep dive into a single project:**

- Show the project detail page `/projects/[id]`
- Walk through each section:
  - **Hero:** Name, location (Kenya), category badge
  - **Stats bar:** 75% funded, 12.5% APY, Active status
  - **Description:** Community water well serving 5,000+ residents
  - **Revenue model:** $0.02/liter usage fee
  - **Milestones:** 2/4 complete (with verified checkmarks)
  - **Market preview:** 78% YES confidence

**Key talking points:**
- Milestones are verified by our oracle system (satellite, IoT, agents)
- The prediction market shows community confidence in success
- Bond holders earn yield from water usage fees

**Action:** Click "Buy Bonds" (or scroll to purchase panel)

---

### 4. Login with Privy (30s)

**Demonstrate seamless onboarding:**

- Click "Login to Purchase" or header login button
- Privy modal appears
- Enter email address
- Receive OTP (demo: use any valid email)
- Complete login

**Key talking points:**
- No MetaMask required - embedded wallets for mainstream users
- Email-based authentication for easy onboarding
- Wallet created automatically on first login

**Show after login:**
- Wallet address displayed in header
- Ready to transact without browser extension

---

### 5. Purchase Bonds (60s)

**Execute a bond purchase:**

- Enter amount: 100 USDC
- Show the cost breakdown:
  - 100 bonds at $1 each
  - Total cost: $100 USDC
- (Demo mode: transactions are simulated)
- Click "Approve USDC" (if needed)
- Click "Purchase Bonds"
- Show success message

**Key talking points:**
- ERC-3643 compliant tokens (regulatory-ready)
- Bonds are transferable on secondary market
- Each bond represents pro-rata yield rights

**After purchase:**
- Show updated holdings in the panel
- Point out claimable yield (from seeded revenue)

---

### 6. Prediction Market (60s)

**Trade on project outcomes:**

- Navigate to market tab or `/markets`
- Show the market question: "Will this project be operational by Q2 2026?"
- Highlight current price: 78% YES / 22% NO
- Explain LMSR pricing (Logarithmic Market Scoring Rule)

**Execute a trade:**
- Select YES
- Enter 50 shares (~$39)
- Click "Buy YES"
- Show position update

**Key talking points:**
- Prediction markets create price discovery for project risk
- Investors can hedge bond positions by buying NO
- Speculators can trade purely on information
- Market prices inform risk assessment

---

### 7. Portfolio (45s)

**Show the investor dashboard:**

- Navigate to `/portfolio`
- Show portfolio stats:
  - Total bond value
  - Claimable yield
  - Average APY
  - Prediction positions value

**Walk through tabs:**
- **Bond Holdings:** List of owned bonds by project
- **Prediction Positions:** Active and resolved market positions

**Key talking points:**
- Unified view of all investments
- Claimable yield from operational projects
- Track prediction market P&L

**Action:** Click "Claim" to collect yield

---

### 8. Sponsor Flow (60s) - Optional

**Show project submission:**

- Navigate to `/sponsor`
- Walk through the multi-step form:
  1. **Business Info:** Organization details (mock KYB)
  2. **Project Details:** Name, category, location, description
  3. **Funding:** Goal, bond price, revenue model, projected APY
  4. **Milestones:** Define verifiable milestones with dates
  5. **Review:** Summary before submission

**Key talking points:**
- Projects submit with clear milestones
- Revenue model must be realistic and verifiable
- DAO governance can approve/reject submissions (future)

---

## Demo Projects Summary

| Project | Category | Funding | APY | Status | Market |
|---------|----------|---------|-----|--------|--------|
| Kisumu Water Well | Water | 75% | 12.5% | Active (2/4) | 78% YES |
| Lagos Solar Microgrid | Solar | 65% | 15.2% | Funding | 82% YES |
| Accra Tech Academy | Education | 100% | 8.5% | Active (1/3) | 65% YES |
| Nairobi Health Clinic | Healthcare | 40% | 10% | Funding | 71% YES |
| Sidama Coffee Coop | Agriculture | 100% | 14% | Completed | Resolved YES |

---

## Technical Highlights to Mention

### Smart Contracts
- **ERC-3643-Lite** bond tokens (compliance-ready)
- **ERC-4626** yield vaults (DeFi composable)
- **LMSR** prediction markets (proven AMM design)
- Deployed on **Mantle Sepolia** (testnet)

### Frontend
- **Next.js 15** with App Router
- **Privy** for embedded wallets (no MetaMask)
- **Tailwind CSS** with dark theme
- Fully responsive (mobile-friendly)

### Oracle System
- Multi-source verification (satellite, IoT, agents)
- AI agent for evidence analysis
- On-chain milestone tracking

---

## Troubleshooting

### Demo Mode Not Working?
- Ensure you're on the latest code
- Check console for errors
- Demo data is hardcoded - no contracts needed

### Transactions Failing?
- Demo mode simulates transactions
- Real transactions require:
  - Deployed contracts
  - Mantle Sepolia testnet
  - Testnet MNT for gas
  - Testnet USDC for purchases

### Need Real Contracts?
```bash
cd contracts
cp .env.example .env
# Add your private key
npx hardhat run scripts/deploy.ts --network mantleSepolia
npx hardhat run scripts/seed-demo.ts --network mantleSepolia
```

Then update `frontend/lib/contracts/deployments.ts` with contract addresses.

---

## Pitch Points

### Problem
- $100B+ annual infrastructure gap in Africa
- Traditional aid has no accountability
- Zero financial returns for funders
- Projects fail with no consequences

### Solution
- **Tokenized bonds** with real yield from operations
- **Prediction markets** for outcome accountability
- **Oracle verification** for milestone tracking
- **Transparent** on-chain fund flow

### Why It Works
- Investors aligned with outcomes (yield tied to success)
- Speculators reveal information (market prices = risk assessment)
- Projects accountable (milestones verified on-chain)
- Composable DeFi (ERC-4626, ERC-3643)

### Traction
- 5 demo projects seeded
- Full platform functional
- Mantle testnet deployed
- Ready for real projects

---

## Q&A Preparation

**Q: How do you verify projects are real?**
A: Multi-source oracle - satellite imagery, IoT sensors, local agents. Each milestone requires verification before market resolution.

**Q: What if a project fails?**
A: Prediction market resolves NO - speculators who bet against are paid. Insurance pool provides partial refunds to bond holders.

**Q: Why Mantle?**
A: Low fees enable micro-transactions (small bond purchases, frequent trades). L2 security inherits from Ethereum.

**Q: How do you get real projects?**
A: Partnerships with African NGOs and social enterprises. They submit projects, we verify and tokenize.

**Q: Is this legal?**
A: ERC-3643 compliance hooks for KYC/AML. Jurisdiction-specific restrictions can be enforced at transfer level.
