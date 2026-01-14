# Salvation Subgraph

This subgraph indexes events from the Salvation smart contracts on Mantle Sepolia.

## Prerequisites

- Node.js v18+
- npm or yarn
- Docker (for local deployment)
- Graph CLI: `npm install -g @graphprotocol/graph-cli`
- Goldsky CLI (optional): `curl https://goldsky.com | sh`

## Setup

```bash
cd subgraph
npm install
npm run codegen
npm run build
```

## Deployment Options

### Option 1: Local Graph Node (Docker)

1. Start the local Graph Node:
```bash
npm run start:local
```

2. Wait for services to be healthy, then create and deploy:
```bash
npm run create-local
npm run deploy:local
```

3. Query endpoint: `http://localhost:8000/subgraphs/name/salvation`

4. To stop:
```bash
npm run stop:local
```

### Option 2: Goldsky (Recommended for Mantle)

1. Login to Goldsky:
```bash
goldsky login
```

2. Deploy:
```bash
npm run deploy:goldsky
```

3. Your subgraph will be available at:
`https://api.goldsky.com/api/public/project_<id>/subgraphs/salvation/1.0.0/gn`

### Option 3: The Graph Studio

Note: Mantle Sepolia may not be supported. Check https://thegraph.com/docs/en/supported-networks/

1. Create a subgraph at https://thegraph.com/studio/
2. Authenticate:
```bash
graph auth --studio <DEPLOY_KEY>
```

3. Deploy:
```bash
npm run deploy:studio
```

## Frontend Integration

Add the subgraph URL to your frontend `.env.local`:

```env
# For local development
NEXT_PUBLIC_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/salvation

# For Goldsky
NEXT_PUBLIC_SUBGRAPH_URL=https://api.goldsky.com/api/public/project_<id>/subgraphs/salvation/1.0.0/gn

# For The Graph Studio
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/<id>/salvation/<version>
```

## Contract Addresses (Mantle Sepolia)

| Contract | Address |
|----------|---------|
| ProjectRegistry | 0x7b26647372E10B7e363A8A857FF88C0C0b63913b |
| BondFactory | 0x9ED03b9a9Fb743ac36EFb35B72a2db31DE525821 |
| MarketFactory | 0xCEF696B36e24945f45166548B1632c7585e3F0DB |
| YieldVault | 0xe05dC9467de459adFc5c31Ce4746579d29B65ba2 |
| OracleAggregator | 0x11191A01670643f2BE3BD8965a16F59556258c2d |

## Sample Queries

### Get all projects
```graphql
{
  projects(first: 10) {
    id
    name
    description
    status
    fundingGoal
    fundingRaised
    sponsor
    bondToken {
      symbol
      totalSupply
    }
    market {
      yesPrice
      noPrice
      totalVolume
    }
  }
}
```

### Get project by ID
```graphql
{
  project(id: "0x...") {
    name
    status
    milestones {
      description
      completed
      completedAt
    }
    bondToken {
      holders {
        holder
        balance
      }
    }
  }
}
```

### Get recent trades
```graphql
{
  trades(first: 20, orderBy: timestamp, orderDirection: desc) {
    market {
      project {
        name
      }
    }
    trader
    isYes
    amount
    cost
    timestamp
  }
}
```

## Entities

- **Project**: Main entity for infrastructure projects
- **BondToken**: Bond tokens issued for projects
- **BondHolder**: Tracks bond token holders and balances
- **Market**: Prediction markets for project milestones
- **Trade**: Individual trades on prediction markets
- **Milestone**: Project milestones with completion status
- **YieldVault**: Yield vault for project revenue distribution
- **YieldClaim**: Claims of yield by bond holders
- **Location**: Geographic location of projects
