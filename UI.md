# Salvation UI Specification

Complete UI/UX specification for the Salvation frontend. Reference this document for all UI implementation details.

---

## Table of Contents

1. [Demo Flow](#demo-flow)
2. [Tech Stack](#tech-stack)
3. [Pages](#pages)
4. [Components](#components)
5. [Contract Integration](#contract-integration)
6. [Privy Authentication](#privy-authentication)
7. [Types & Interfaces](#types--interfaces)
8. [File Structure](#file-structure)

---

## Demo Flow

### Primary Demo Script (5-7 minutes)

```
1. LANDING (30s)
   → Show hero: "Yield-Generating African Infrastructure Bonds"
   → Stats: 5 projects, $200K TVL, 12% avg APY
   → Click "Browse Projects"

2. BROWSE PROJECTS (45s)
   → Show 5 project cards
   → Filter by "Water" category
   → Point out: funding %, APY, market confidence
   → Click "Kisumu Water Well"

3. PROJECT DETAIL (60s)
   → Hero image + location
   → Stats bar: 75% funded, 12.5% APY, 78% YES
   → Scroll to milestones (2/4 complete)
   → Show verification evidence (news, location)
   → Click "Buy Bonds"

4. LOGIN WITH PRIVY (30s)
   → Modal opens
   → Enter email → OTP sent
   → Enter code → Logged in
   → Embedded wallet created (show address)

5. PURCHASE BONDS (60s)
   → Enter amount: 100 USDC
   → Show cost breakdown
   → Click "Approve USDC" → TX confirms
   → Click "Purchase Bonds" → TX confirms
   → Show success: "You own 100 WELL-KIS bonds"

6. PREDICTION MARKET (60s)
   → Navigate to market tab or /markets
   → Show question: "Operational by Q2 2026?"
   → Price: 78% YES / 22% NO
   → Buy 50 YES tokens (~$39)
   → Show price movement

7. PORTFOLIO (45s)
   → Navigate to /portfolio
   → Show bond holdings table
   → Show prediction positions
   → Show claimable yield: $4.50
   → Click "Claim" → TX confirms

8. SPONSOR FLOW (60s) - Optional
   → Navigate to /sponsor
   → Show multi-step form
   → Quick fill demo data
   → Submit → Project appears
```

### User Journeys

**Investor Journey:**
```
Landing → Projects → Project Detail → Login → Buy Bonds → Portfolio → Claim Yield
```

**Speculator Journey:**
```
Landing → Markets → Market Detail → Login → Trade YES/NO → Portfolio → Claim Winnings
```

**Sponsor Journey:**
```
Landing → Sponsor → Fill Form → Submit → Track Project
```

---

## Tech Stack

### Core
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4

### Authentication & Wallet
- **Auth:** Privy (email only)
- **Wallet:** Privy Embedded Wallets
- **Chain:** Mantle Sepolia (chainId: 5003)

### State Management
- **Server State:** TanStack Query
- **Client State:** Zustand
- **Contract Reads:** Privy + viem

### UI Components
- **Base:** Radix UI primitives
- **Styled:** shadcn/ui (already installed)
- **Icons:** Lucide React
- **Toasts:** Sonner
- **Charts:** Recharts

### Existing Dependencies (Keep)
```json
{
  "@privy-io/react-auth": "^1.x",  // ADD THIS
  "viem": "^2.17.0",
  "wagmi": "^2.12.0",              // Keep for contract hooks
  "@tanstack/react-query": "^5.51.0",
  "zustand": "^5.0.8",
  "recharts": "^3.3.0",
  "sonner": "^2.0.7",
  "lucide-react": "^0.548.0"
}
```

---

## Pages

### 1. Landing Page (`/`)

**Purpose:** Hero, value proposition, featured projects

**Sections:**
| Section | Content |
|---------|---------|
| Hero | Title, subtitle, CTA buttons |
| Stats | Projects funded, TVL, Avg APY, Investors |
| How It Works | 3-step visual (Browse → Invest → Earn) |
| Featured Projects | 3 ProjectCards |
| CTA | "Browse All Projects" button |

**Components Used:**
- `Button`
- `Card`
- `ProjectCard` (×3)

---

### 2. Projects Page (`/projects`)

**Purpose:** Browse and filter all infrastructure projects

**Layout:**
```
┌─────────────────────────────────────────┐
│  Stats Bar (total, funded, avg APY)     │
├─────────────────────────────────────────┤
│  Filters (category, status, search)     │
├─────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Project │ │ Project │ │ Project │   │
│  │  Card   │ │  Card   │ │  Card   │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐               │
│  │ Project │ │ Project │               │
│  │  Card   │ │  Card   │               │
│  └─────────┘ └─────────┘               │
└─────────────────────────────────────────┘
```

**Components Used:**
- `ProjectFilters`
- `ProjectGrid`
- `ProjectCard` (×N)

**Data Source:**
- `ProjectRegistry.getAllProjects()`

---

### 3. Project Detail Page (`/projects/[id]`)

**Purpose:** Full project info, buy bonds, see market

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Hero Image                                              │
│  Project Name                          Location Badge    │
├─────────────────────────────────────────────────────────┤
│  Stats: Funded% | APY | Investors | Market Odds         │
├───────────────────────────────────┬─────────────────────┤
│                                   │                     │
│  Description                      │  BondPurchase       │
│  Revenue Model                    │  ├─ Price           │
│                                   │  ├─ Amount Input    │
│  ───────────────────              │  ├─ Cost Calc       │
│                                   │  ├─ Approve Btn     │
│  Milestones Timeline              │  ├─ Purchase Btn    │
│  ├─ Milestone 1 ✓                 │  └─ Holdings        │
│  ├─ Milestone 2 ✓                 │                     │
│  ├─ Milestone 3 (current)         ├─────────────────────┤
│  └─ Milestone 4                   │  Market Preview     │
│                                   │  ├─ Question        │
│  ───────────────────              │  ├─ YES/NO Price    │
│                                   │  └─ Trade Link      │
│  Verification Evidence            │                     │
│  ├─ News mentions                 │                     │
│  ├─ Location verified             │                     │
│  └─ Evidence photos               │                     │
│                                   │                     │
└───────────────────────────────────┴─────────────────────┘
```

**Components Used:**
- `ProjectDetail`
- `BondPurchase`
- `MilestoneTimeline`
- `MarketPreview`
- `VerificationPanel`

**Data Source:**
- `ProjectRegistry.getProject(id)`
- `BondToken.balanceOf(user)`
- `YieldVault.claimableYield(user, project)`
- `OracleAggregator.getMilestones(id)`
- `MarketFactory.getMarket(id)`
- `LMSRMarket.getYesPrice()`

---

### 4. Markets Page (`/markets`)

**Purpose:** Browse all prediction markets

**Layout:**
```
┌─────────────────────────────────────────┐
│  Stats Bar (total markets, volume)      │
├─────────────────────────────────────────┤
│  Filters (status: active/resolved)      │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ Market Card                      │   │
│  │ "Will Kisumu Water Well..."      │   │
│  │ |████████░░| 78% YES             │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Market Card                      │   │
│  │ "Will Lagos Solar Grid..."       │   │
│  │ |████████░| 82% YES              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Components Used:**
- `MarketFilters`
- `MarketList`
- `MarketCard` (×N)

**Data Source:**
- `MarketFactory.getAllMarkets()` (or iterate projects)
- `LMSRMarket.getYesPrice()` for each

---

### 5. Market Detail Page (`/markets/[id]`)

**Purpose:** Trade YES/NO tokens on a specific market

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Project: Kisumu Water Well                    [Link]   │
├─────────────────────────────────────────────────────────┤
│  "Will this project be operational by Q2 2026?"         │
├─────────────────────────────────────────────────────────┤
│  Resolution: June 30, 2026 (180 days)                   │
├───────────────────────────────────┬─────────────────────┤
│                                   │                     │
│  Price Display                    │  TradingPanel       │
│  ┌─────────────────────────────┐ │  ├─ [YES] [NO]      │
│  │ YES: $0.78                  │ │  ├─ [BUY] [SELL]    │
│  │ |████████████████░░░░|      │ │  ├─ Amount Input    │
│  │ NO:  $0.22                  │ │  ├─ Cost/Return     │
│  └─────────────────────────────┘ │  ├─ Execute Btn     │
│                                   │  └─ Positions       │
│  Your Positions                   │                     │
│  ├─ 50 YES ($39 value)           │                     │
│  └─ 0 NO                         │                     │
│                                   │                     │
│  Market Info                      │                     │
│  ├─ Total Volume: $5,000         │                     │
│  ├─ Liquidity (b): 1000          │                     │
│  └─ Created: Jan 1, 2026         │                     │
│                                   │                     │
└───────────────────────────────────┴─────────────────────┘
```

**Components Used:**
- `MarketInfo`
- `PriceDisplay`
- `TradingPanel`
- `PositionDisplay`

**Data Source:**
- `LMSRMarket.getYesPrice()`
- `LMSRMarket.getNoPrice()`
- `YesToken.balanceOf(user)`
- `NoToken.balanceOf(user)`
- `LMSRMarket.resolved`
- `LMSRMarket.outcome`

---

### 6. Portfolio Page (`/portfolio`)

**Purpose:** User's bond holdings, positions, yield

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  My Portfolio                                           │
├─────────────────────────────────────────────────────────┤
│  Stats Cards                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Total    │ │ Claimable│ │ Average  │ │ Positions│  │
│  │ Value    │ │ Yield    │ │ APY      │ │ Value    │  │
│  │ $500     │ │ $12.50   │ │ 11.2%    │ │ $89      │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│  [Bond Holdings] [Prediction Positions]  ← Tabs        │
├─────────────────────────────────────────────────────────┤
│  Bond Holdings Table                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Project      │ Bonds │ APY   │ Yield  │ Action  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ Water Well   │ 100   │ 12.5% │ $4.50  │ [Claim] │   │
│  │ Solar Grid   │ 200   │ 15.2% │ $8.00  │ [Claim] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  OR (if Positions tab selected)                        │
│                                                         │
│  Prediction Positions Table                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Market       │ Side │ Shares│ Value  │ Status  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ Water Well   │ YES  │ 50    │ $39    │ Active  │   │
│  │ Coffee Coop  │ YES  │ 100   │ $100   │ Won ✓   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Claim All Yield: $12.50]  ← Button                   │
└─────────────────────────────────────────────────────────┘
```

**Components Used:**
- `PortfolioStats`
- `BondList`
- `PositionList`
- `YieldPanel`
- `Tabs` (from shadcn)

**Data Source:**
- Iterate all projects, check `BondToken.balanceOf(user)`
- Iterate all markets, check `YesToken/NoToken.balanceOf(user)`
- `YieldVault.claimableYield(user, projectId)` for each

---

### 7. Sponsor Page (`/sponsor`)

**Purpose:** Submit new infrastructure project

**Layout:** Multi-step form wizard

```
Step 1: Business Info (Mock KYB)
┌─────────────────────────────────────────┐
│  Organization Name      [___________]   │
│  Registration Number    [___________]   │
│  Country               [▼ Select    ]   │
│  Contact Email         [___________]   │
│                                         │
│                        [Next →]         │
└─────────────────────────────────────────┘

Step 2: Project Details
┌─────────────────────────────────────────┐
│  Project Name          [___________]   │
│  Category              [▼ Select    ]   │
│  Location                              │
│    Country             [▼ Select    ]   │
│    Region              [___________]   │
│    Coordinates         [___] [___]     │
│  Description           [            ]   │
│                        [            ]   │
│  Image URL             [___________]   │
│                                         │
│              [← Back]  [Next →]         │
└─────────────────────────────────────────┘

Step 3: Funding
┌─────────────────────────────────────────┐
│  Funding Goal (USDC)   [___________]   │
│  Bond Price            [$1.00      ]   │
│  Revenue Model         [            ]   │
│                        [            ]   │
│  Projected APY (%)     [___________]   │
│                                         │
│              [← Back]  [Next →]         │
└─────────────────────────────────────────┘

Step 4: Milestones
┌─────────────────────────────────────────┐
│  Milestones (min 2)                     │
│                                         │
│  1. [Site Survey_______] [2026-02-01]  │
│  2. [Equipment Purchase_] [2026-03-15]  │
│  3. [Installation______] [2026-05-01]  │
│                                         │
│  [+ Add Milestone]                      │
│                                         │
│              [← Back]  [Next →]         │
└─────────────────────────────────────────┘

Step 5: Review & Submit
┌─────────────────────────────────────────┐
│  Review Your Submission                 │
│                                         │
│  Organization: Kisumu Water Trust       │
│  Project: Community Water Well          │
│  Category: Water                        │
│  Location: Kisumu, Kenya                │
│  Funding Goal: $10,000                  │
│  Milestones: 4                          │
│                                         │
│              [← Back]  [Submit Project] │
└─────────────────────────────────────────┘
```

**Components Used:**
- `ProjectForm` (multi-step)
- `Input`, `Select`, `Textarea` (from shadcn)
- `Button`
- `Card`

**Data Source (Writes):**
- `ProjectRegistry.registerProject(...)`
- `OracleAggregator.setupMilestones(...)`

---

## Components

### Auth Components

#### LoginButton
```tsx
// components/auth/LoginButton.tsx
// Privy email login button

Props: none

Features:
- Shows "Login" when not authenticated
- Shows truncated address when authenticated
- Opens Privy modal on click
- Dropdown with "Logout" option when authenticated

Uses:
- usePrivy() → { login, logout, authenticated, user }
```

#### WalletInfo
```tsx
// components/auth/WalletInfo.tsx
// Display wallet address and USDC balance

Props: none

Features:
- Shows truncated address (0x1234...5678)
- Shows USDC balance
- Copy address button
- Link to explorer

Uses:
- usePrivy() → { user }
- useWallets() → { wallets }
- USDC.balanceOf(address)
```

---

### Project Components

#### ProjectCard
```tsx
// components/projects/ProjectCard.tsx

Props:
- project: Project

Features:
- Image (or placeholder by category)
- Name + location badge
- Category badge (color-coded)
- Funding progress bar (raised/goal)
- APY badge (e.g., "12.5% APY")
- Market odds badge (e.g., "78% confidence")
- Status badge (Funding/Active/Completed)
- Click → navigate to /projects/[id]

Size: ~300px wide card
```

#### ProjectGrid
```tsx
// components/projects/ProjectGrid.tsx

Props:
- projects: Project[]
- loading?: boolean

Features:
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- Loading skeletons
- Empty state message
```

#### ProjectFilters
```tsx
// components/projects/ProjectFilters.tsx

Props:
- onFilterChange: (filters: ProjectFilters) => void

Features:
- Category dropdown (All, Water, Solar, Education, Healthcare, Agriculture)
- Status dropdown (All, Funding, Active, Completed)
- Search input (by name)
- Clear filters button
```

#### ProjectDetail
```tsx
// components/projects/ProjectDetail.tsx

Props:
- project: Project
- milestones: Milestone[]
- verifications: Verification[]

Features:
- Hero section (image, name, location)
- Stats bar
- Description section
- Revenue model section
- Includes MilestoneTimeline
- Includes VerificationPanel
```

#### BondPurchase
```tsx
// components/projects/BondPurchase.tsx

Props:
- project: Project

Features:
- Bond price display
- Available bonds (goal - raised)
- Amount input with max button
- Cost calculation display
- USDC balance display
- Approve button (if needed)
- Purchase button
- Current holdings display
- Claimable yield display
- Claim button

States:
- Not logged in → "Login to Purchase" button
- Insufficient balance → Disabled with message
- Needs approval → Show approve button
- Ready → Show purchase button
- Processing → Loading state

Transactions:
- USDC.approve(bondFactory, amount)
- BondFactory.purchaseBonds(projectId, amount)
```

#### MilestoneTimeline
```tsx
// components/projects/MilestoneTimeline.tsx

Props:
- milestones: Milestone[]
- currentIndex: number

Features:
- Vertical timeline
- Each milestone shows:
  - Status icon (✓ complete, ● current, ○ pending)
  - Description
  - Target date
  - Completion date (if complete)
- Highlight current milestone
```

#### VerificationPanel
```tsx
// components/projects/VerificationPanel.tsx

Props:
- verifications: Verification[]

Features:
- List of verification sources
- Each shows: source type, result, confidence, timestamp
- Collapsible evidence details
```

#### MarketPreview
```tsx
// components/projects/MarketPreview.tsx

Props:
- market: Market

Features:
- Compact view for project detail page
- Question text
- YES/NO price bar
- "Trade" button → /markets/[id]
```

---

### Market Components

#### MarketCard
```tsx
// components/markets/MarketCard.tsx

Props:
- market: Market

Features:
- Project name + link
- Question text
- PriceBar component
- Volume display
- Resolution date countdown
- Status badge (Active/Resolved)
- Click → navigate to /markets/[id]
```

#### MarketList
```tsx
// components/markets/MarketList.tsx

Props:
- markets: Market[]
- loading?: boolean

Features:
- List layout (full width cards)
- Loading skeletons
- Empty state
```

#### PriceBar
```tsx
// components/markets/PriceBar.tsx

Props:
- yesPrice: number (0-1)
- noPrice: number (0-1)
- size?: 'sm' | 'md' | 'lg'

Features:
- Visual bar: |████████░░| 78%
- YES side colored (green)
- NO side colored (red)
- Percentage labels
```

#### TradingPanel
```tsx
// components/markets/TradingPanel.tsx

Props:
- market: Market

Features:
- Side toggle: [YES] [NO]
- Action toggle: [BUY] [SELL]
- Amount input (shares)
- Cost/return calculation (LMSR)
- Price impact warning (if >5%)
- USDC balance display
- Approve button (if needed)
- Execute button
- Current positions display

States:
- Not logged in → "Login to Trade"
- Insufficient balance → Disabled
- Needs approval → Show approve
- Market resolved → Show "Claim Winnings" instead

Transactions:
- USDC.approve(market, amount)
- LMSRMarket.buyYes(shares)
- LMSRMarket.buyNo(shares)
- LMSRMarket.sellYes(shares)
- LMSRMarket.sellNo(shares)
- LMSRMarket.claimWinnings()
```

#### PositionDisplay
```tsx
// components/markets/PositionDisplay.tsx

Props:
- yesBalance: number
- noBalance: number
- yesPrice: number
- noPrice: number
- resolved: boolean
- outcome?: boolean

Features:
- Shows YES position (shares, value)
- Shows NO position (shares, value)
- If resolved: shows if won/lost
- Claim button if won
```

---

### Portfolio Components

#### PortfolioStats
```tsx
// components/portfolio/PortfolioStats.tsx

Props:
- totalBondValue: number
- totalClaimableYield: number
- averageAPY: number
- totalPositionValue: number

Features:
- 4 stat cards in a row
- Responsive (2x2 on mobile)
```

#### BondList
```tsx
// components/portfolio/BondList.tsx

Props:
- holdings: BondHolding[]

Features:
- Table with columns: Project, Bonds, APY, Claimable, Action
- Claim button per row
- Click project name → /projects/[id]
- Empty state if no holdings
```

#### PositionList
```tsx
// components/portfolio/PositionList.tsx

Props:
- positions: MarketPosition[]

Features:
- Table with columns: Market, Side, Shares, Value, Status, Action
- Claim button for won positions
- Click market → /markets/[id]
- Status badges (Active, Won, Lost)
```

#### YieldPanel
```tsx
// components/portfolio/YieldPanel.tsx

Props:
- totalClaimable: number
- holdings: BondHolding[]

Features:
- Total claimable display
- "Claim All" button
- List of per-project yield

Transactions:
- YieldVault.claimYield(projectId) for each
```

---

### Sponsor Components

#### ProjectForm
```tsx
// components/sponsor/ProjectForm.tsx

Props: none (self-contained)

Features:
- Multi-step wizard (5 steps)
- Step indicator
- Form validation
- Back/Next navigation
- Final submit

Steps:
1. BusinessInfoStep (mock KYB)
2. ProjectDetailsStep
3. FundingStep
4. MilestonesStep
5. ReviewStep

Transactions:
- ProjectRegistry.registerProject(...)
- OracleAggregator.setupMilestones(...)
```

---

## Contract Integration

### Contract Addresses (Mantle Sepolia)
```typescript
// lib/contracts/deployments.ts
export const MANTLE_SEPOLIA_CHAIN_ID = 5003;

export const contracts = {
  usdc: '0x...', // Mock USDC or testnet USDC
  projectRegistry: '0x...',
  bondFactory: '0x...',
  yieldVault: '0x...',
  marketFactory: '0x...',
  oracleAggregator: '0x...',
};
```

### Read Operations

| Hook | Contract | Function | Returns |
|------|----------|----------|---------|
| `useProjects()` | ProjectRegistry | `getAllProjects()` | Project[] |
| `useProject(id)` | ProjectRegistry | `getProject(id)` | Project |
| `useBondBalance(user, project)` | BondToken | `balanceOf(user)` | number |
| `useClaimableYield(user, project)` | YieldVault | `claimableYield(user, project)` | number |
| `useMarket(projectId)` | MarketFactory | `getMarket(projectId)` | address |
| `useMarketPrices(market)` | LMSRMarket | `getYesPrice()`, `getNoPrice()` | {yes, no} |
| `useMarketPositions(user, market)` | YesToken, NoToken | `balanceOf(user)` | {yes, no} |
| `useMilestones(project)` | OracleAggregator | `getMilestones(project)` | Milestone[] |
| `useUSDCBalance(user)` | USDC | `balanceOf(user)` | number |
| `useAllowance(user, spender)` | USDC | `allowance(user, spender)` | number |

### Write Operations

| Hook | Contract | Function | Params |
|------|----------|----------|--------|
| `useApproveUSDC()` | USDC | `approve(spender, amount)` | spender, amount |
| `usePurchaseBonds()` | BondFactory | `purchaseBonds(projectId, amount)` | projectId, amount |
| `useClaimYield()` | YieldVault | `claimYield(projectId)` | projectId |
| `useBuyYes()` | LMSRMarket | `buyYes(shares)` | market, shares |
| `useBuyNo()` | LMSRMarket | `buyNo(shares)` | market, shares |
| `useSellYes()` | LMSRMarket | `sellYes(shares)` | market, shares |
| `useSellNo()` | LMSRMarket | `sellNo(shares)` | market, shares |
| `useClaimWinnings()` | LMSRMarket | `claimWinnings()` | market |
| `useRegisterProject()` | ProjectRegistry | `registerProject(...)` | name, uri, goal, price |
| `useSetupMilestones()` | OracleAggregator | `setupMilestones(...)` | projectId, descriptions, dates |

---

## Privy Authentication

### Setup

```tsx
// lib/privy/config.ts
import { mantleSepoliaTestnet } from 'viem/chains';

export const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia',
  network: 'mantle-sepolia',
  nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://sepolia.mantlescan.xyz' },
  },
};

export const privyConfig = {
  loginMethods: ['email'],
  appearance: {
    theme: 'dark',
    accentColor: '#F97316',
    logo: '/images/logo.png',
  },
  embeddedWallets: {
    createOnLogin: 'all-users',
    noPromptOnSignature: true,
  },
  defaultChain: mantleSepolia,
  supportedChains: [mantleSepolia],
};
```

### Provider

```tsx
// lib/privy/provider.tsx
'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { privyConfig, mantleSepolia } from './config';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={privyConfig}
    >
      {children}
    </PrivyProvider>
  );
}
```

### Usage in Components

```tsx
import { usePrivy, useSendTransaction, useWallets } from '@privy-io/react-auth';

// Authentication
const { login, logout, authenticated, user } = usePrivy();

// Get embedded wallet
const { wallets } = useWallets();
const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

// Send transaction (no MetaMask popup)
const { sendTransaction } = useSendTransaction();
await sendTransaction({
  to: contractAddress,
  data: encodedFunctionData,
});
```

---

## Types & Interfaces

```typescript
// types/project.ts
export interface Project {
  id: string;
  name: string;
  description: string;
  metadataURI: string;
  sponsor: string;
  location: {
    country: string;
    region: string;
    coordinates: [number, number];
  };
  category: 'water' | 'solar' | 'education' | 'healthcare' | 'agriculture';
  fundingGoal: number;
  fundingRaised: number;
  bondPrice: number;
  projectedAPY: number;
  status: 'pending' | 'funding' | 'active' | 'completed' | 'failed';
  bondTokenAddress: string;
  marketAddress: string;
  imageUrl: string;
  createdAt: number;
}

export interface Milestone {
  index: number;
  description: string;
  targetDate: number;
  completed: boolean;
  completedAt?: number;
  evidenceURI?: string;
}

export interface Verification {
  projectId: string;
  milestoneIndex: number;
  verified: boolean;
  evidenceURI: string;
  dataSources: string[];
  confidence: number;
  timestamp: number;
}

// types/market.ts
export interface Market {
  id: string;
  address: string;
  projectId: string;
  projectName: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  yesShares: number;
  noShares: number;
  liquidity: number; // b parameter
  resolutionTime: number;
  resolved: boolean;
  outcome?: boolean;
  totalVolume: number;
}

export interface MarketPosition {
  marketId: string;
  marketAddress: string;
  question: string;
  yesBalance: number;
  noBalance: number;
  yesValue: number;
  noValue: number;
  resolved: boolean;
  outcome?: boolean;
  won?: boolean;
}

// types/portfolio.ts
export interface BondHolding {
  projectId: string;
  projectName: string;
  bondTokenAddress: string;
  balance: number;
  value: number;
  apy: number;
  claimableYield: number;
}

export interface PortfolioSummary {
  totalBondValue: number;
  totalClaimableYield: number;
  averageAPY: number;
  totalPositionValue: number;
  holdings: BondHolding[];
  positions: MarketPosition[];
}
```

---

## File Structure

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout with AuthProvider
│   ├── page.tsx                   # Landing page
│   ├── projects/
│   │   ├── page.tsx               # Projects list
│   │   └── [id]/
│   │       └── page.tsx           # Project detail
│   ├── markets/
│   │   ├── page.tsx               # Markets list
│   │   └── [id]/
│   │       └── page.tsx           # Market trading
│   ├── portfolio/
│   │   └── page.tsx               # User portfolio
│   └── sponsor/
│       └── page.tsx               # Project submission
├── components/
│   ├── auth/
│   │   ├── LoginButton.tsx
│   │   └── WalletInfo.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectGrid.tsx
│   │   ├── ProjectFilters.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── BondPurchase.tsx
│   │   ├── MilestoneTimeline.tsx
│   │   ├── VerificationPanel.tsx
│   │   └── MarketPreview.tsx
│   ├── markets/
│   │   ├── MarketCard.tsx
│   │   ├── MarketList.tsx
│   │   ├── PriceBar.tsx
│   │   ├── TradingPanel.tsx
│   │   └── PositionDisplay.tsx
│   ├── portfolio/
│   │   ├── PortfolioStats.tsx
│   │   ├── BondList.tsx
│   │   ├── PositionList.tsx
│   │   └── YieldPanel.tsx
│   ├── sponsor/
│   │   └── ProjectForm.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── ui/                        # shadcn components (existing)
├── lib/
│   ├── privy/
│   │   ├── config.ts
│   │   └── provider.tsx
│   ├── contracts/
│   │   ├── deployments.ts
│   │   ├── abis/
│   │   │   ├── ProjectRegistry.json
│   │   │   ├── BondFactory.json
│   │   │   ├── BondToken.json
│   │   │   ├── YieldVault.json
│   │   │   ├── MarketFactory.json
│   │   │   ├── LMSRMarket.json
│   │   │   ├── OutcomeToken.json
│   │   │   ├── OracleAggregator.json
│   │   │   └── ERC20.json
│   │   └── hooks/
│   │       ├── useProjects.ts
│   │       ├── useBondFactory.ts
│   │       ├── useYieldVault.ts
│   │       ├── useMarket.ts
│   │       ├── useLMSRMarket.ts
│   │       └── useUSDC.ts
│   ├── utils/
│   │   ├── lmsr.ts               # LMSR price calculations
│   │   └── format.ts             # Number/date formatting
│   └── ipfs/
│       └── upload.ts             # Existing
└── types/
    ├── project.ts
    ├── market.ts
    └── portfolio.ts
```

---

## Design Tokens

### Colors
```css
--primary: #F97316;        /* Orange - main accent */
--primary-light: #FB923C;
--success: #22C55E;        /* Green - YES, complete */
--danger: #EF4444;         /* Red - NO, failed */
--warning: #EAB308;        /* Yellow - pending */

--bg-primary: #0F172A;     /* Dark blue - main bg */
--bg-secondary: #1E293B;   /* Lighter - cards */
--bg-tertiary: #334155;    /* Even lighter - inputs */

--text-primary: #F8FAFC;
--text-secondary: #94A3B8;
--text-muted: #64748B;
```

### Category Colors
```css
--category-water: #3B82F6;      /* Blue */
--category-solar: #EAB308;      /* Yellow */
--category-education: #8B5CF6;  /* Purple */
--category-healthcare: #EC4899; /* Pink */
--category-agriculture: #22C55E;/* Green */
```
