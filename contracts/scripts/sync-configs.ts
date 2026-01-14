import * as fs from "fs";
import * as path from "path";

/**
 * Sync Configs Script
 * Updates all configuration files (frontend, subgraph) with new deployment addresses
 * Run this after deploying contracts: npx ts-node scripts/sync-configs.ts
 */

const ROOT_DIR = path.join(__dirname, "../..");
const DEPLOYMENT_FILE = path.join(__dirname, "../deployments/mantle-sepolia.json");

// Check if deployment file exists
if (!fs.existsSync(DEPLOYMENT_FILE)) {
  console.error("ERROR: mantle-sepolia.json not found. Run `npm run deploy:sepolia` first.");
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"));
const contracts = deployment.contracts;

console.log("=".repeat(60));
console.log("Syncing Configuration Files");
console.log("=".repeat(60));
console.log("\nDeployment loaded from:", DEPLOYMENT_FILE);
console.log("Timestamp:", deployment.timestamp);
console.log("\nContract Addresses:");
Object.entries(contracts).forEach(([name, addr]) => {
  console.log(`  ${name}: ${addr}`);
});

// ============ 1. Update Frontend Deployments ============
console.log("\n" + "-".repeat(60));
console.log("1. Updating frontend/lib/contracts/deployments.ts");

const frontendDeploymentsPath = path.join(ROOT_DIR, "frontend/lib/contracts/deployments.ts");
const frontendDeploymentsContent = `// Contract addresses per chain
// These will be populated after deploying contracts

export const MANTLE_SEPOLIA_CHAIN_ID = 5003;

export interface ContractAddresses {
  usdc: \`0x\${string}\`;
  projectRegistry: \`0x\${string}\`;
  bondFactory: \`0x\${string}\`;
  yieldVault: \`0x\${string}\`;
  marketFactory: \`0x\${string}\`;
  oracleAggregator: \`0x\${string}\`;
  identityRegistry: \`0x\${string}\`;
  complianceModule: \`0x\${string}\`;
}

// Mantle Sepolia deployments (deployed ${deployment.timestamp})
export const mantleSepoliaContracts: ContractAddresses = {
  usdc: '${contracts.usdc}',
  projectRegistry: '${contracts.projectRegistry}',
  bondFactory: '${contracts.bondFactory}',
  yieldVault: '${contracts.yieldVault}',
  marketFactory: '${contracts.marketFactory}',
  oracleAggregator: '${contracts.oracleAggregator}',
  // Not deployed for MVP - set to zero
  identityRegistry: '0x0000000000000000000000000000000000000000',
  complianceModule: '0x0000000000000000000000000000000000000000',
};

// Get contracts by chain ID
export function getContracts(chainId: number): ContractAddresses | null {
  switch (chainId) {
    case MANTLE_SEPOLIA_CHAIN_ID:
      return mantleSepoliaContracts;
    default:
      return null;
  }
}

// Check if core contracts are deployed (non-zero addresses)
export function areContractsDeployed(chainId: number): boolean {
  const contracts = getContracts(chainId);
  if (!contracts) return false;

  const zeroAddress = '0x0000000000000000000000000000000000000000';
  // Only check essential contracts (not identityRegistry/complianceModule)
  const essentialContracts = [
    contracts.usdc,
    contracts.projectRegistry,
    contracts.bondFactory,
    contracts.yieldVault,
    contracts.marketFactory,
    contracts.oracleAggregator,
  ];
  return essentialContracts.every(addr => addr !== zeroAddress);
}
`;

fs.writeFileSync(frontendDeploymentsPath, frontendDeploymentsContent);
console.log("   Updated:", frontendDeploymentsPath);

// ============ 2. Update Subgraph YAML ============
console.log("\n" + "-".repeat(60));
console.log("2. Updating subgraph/subgraph.yaml");

// Get the current block number for startBlock (approximate - use a recent block)
// In production, you'd get this from the deployment transaction
const startBlock = process.env.START_BLOCK || "35000000"; // Update this after deployment

const subgraphYamlPath = path.join(ROOT_DIR, "subgraph/subgraph.yaml");
const subgraphYamlContent = `specVersion: 0.0.5
features:
  - ipfsOnEthereumContracts
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum/contract
    name: ProjectRegistry
    network: mantle-sepolia
    source:
      address: "${contracts.projectRegistry}"
      abi: ProjectRegistry
      startBlock: ${startBlock}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Project
        - Milestone
        - Location
      abis:
        - name: ProjectRegistry
          file: ./abis/ProjectRegistry.json
      eventHandlers:
        - event: ProjectRegistered(indexed bytes32,indexed address,string,uint256,uint256)
          handler: handleProjectRegistered
        - event: ProjectStatusUpdated(indexed bytes32,uint8)
          handler: handleProjectStatusUpdated
        - event: ProjectFunded(indexed bytes32,uint256,uint256)
          handler: handleProjectFunded
      file: ./src/project-registry.ts

  - kind: ethereum/contract
    name: BondFactory
    network: mantle-sepolia
    source:
      address: "${contracts.bondFactory}"
      abi: BondFactory
      startBlock: ${startBlock}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - BondToken
        - Project
      abis:
        - name: BondFactory
          file: ./abis/BondFactory.json
        - name: BondToken
          file: ./abis/BondToken.json
      eventHandlers:
        - event: BondCreated(indexed bytes32,address)
          handler: handleBondCreated
        - event: BondsPurchased(indexed bytes32,indexed address,uint256,uint256)
          handler: handleBondsPurchased
      file: ./src/bond-factory.ts

  - kind: ethereum/contract
    name: MarketFactory
    network: mantle-sepolia
    source:
      address: "${contracts.marketFactory}"
      abi: MarketFactory
      startBlock: ${startBlock}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Market
        - Project
      abis:
        - name: MarketFactory
          file: ./abis/MarketFactory.json
        - name: LMSRMarket
          file: ./abis/LMSRMarket.json
      eventHandlers:
        - event: MarketCreated(indexed bytes32,indexed address,string,uint256,uint256)
          handler: handleMarketCreated
      file: ./src/market-factory.ts

  - kind: ethereum/contract
    name: YieldVault
    network: mantle-sepolia
    source:
      address: "${contracts.yieldVault}"
      abi: YieldVault
      startBlock: ${startBlock}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - YieldVault
        - YieldClaim
      abis:
        - name: YieldVault
          file: ./abis/YieldVault.json
      eventHandlers:
        - event: RevenueDeposited(indexed bytes32,uint256,uint256)
          handler: handleRevenueDeposited
        - event: YieldClaimed(indexed bytes32,indexed address,uint256)
          handler: handleYieldClaimed
      file: ./src/yield-vault.ts

  - kind: ethereum/contract
    name: OracleAggregator
    network: mantle-sepolia
    source:
      address: "${contracts.oracleAggregator}"
      abi: OracleAggregator
      startBlock: ${startBlock}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Milestone
        - Project
      abis:
        - name: OracleAggregator
          file: ./abis/OracleAggregator.json
      eventHandlers:
        - event: MilestonesSetup(indexed bytes32,uint256)
          handler: handleMilestonesSetup
        - event: MilestoneVerified(indexed bytes32,indexed uint256,bool,string,uint256)
          handler: handleMilestoneVerified
        - event: ProjectMarkedFailed(indexed bytes32,string)
          handler: handleProjectMarkedFailed
      file: ./src/oracle-aggregator.ts

templates:
  - kind: ethereum/contract
    name: BondToken
    network: mantle-sepolia
    source:
      abi: BondToken
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - BondToken
        - BondHolder
      abis:
        - name: BondToken
          file: ./abis/BondToken.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
        - event: BondsMinted(indexed address,uint256)
          handler: handleBondsMinted
      file: ./src/bond-token.ts

  - kind: ethereum/contract
    name: LMSRMarket
    network: mantle-sepolia
    source:
      abi: LMSRMarket
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Market
        - Trade
      abis:
        - name: LMSRMarket
          file: ./abis/LMSRMarket.json
      eventHandlers:
        - event: SharesPurchased(indexed address,indexed bool,uint256,uint256)
          handler: handleSharesPurchased
        - event: SharesSold(indexed address,indexed bool,uint256,uint256)
          handler: handleSharesSold
        - event: MarketResolved(bool,uint256)
          handler: handleMarketResolved
      file: ./src/lmsr-market.ts
`;

fs.writeFileSync(subgraphYamlPath, subgraphYamlContent);
console.log("   Updated:", subgraphYamlPath);
console.log("   Start Block:", startBlock);

// ============ Summary ============
console.log("\n" + "=".repeat(60));
console.log("SYNC COMPLETE!");
console.log("=".repeat(60));
console.log("\nNext steps:");
console.log("  1. Deploy subgraph:");
console.log("     cd ../subgraph");
console.log("     npm run codegen && npm run build");
console.log("     npm run deploy:goldsky  (bump version if needed)");
console.log("");
console.log("  2. Seed projects (run ONLY ONCE!):");
console.log("     cd ../contracts");
console.log("     npm run seed");
console.log("");
console.log("  3. Update frontend subgraph URL if changed:");
console.log("     Edit: frontend/lib/subgraph/config.ts");
console.log("=".repeat(60));
