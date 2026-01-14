import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT");

  const oracleAgentAddress = process.env.ORACLE_AGENT_ADDRESS || deployer.address;
  console.log("Oracle agent address:", oracleAgentAddress);

  // Track deployed contracts
  const deployedContracts: Record<string, string> = {};

  // ============ 1. Deploy Mock USDC ============
  console.log("\n1. Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  deployedContracts.usdc = usdcAddress;
  console.log("   MockUSDC deployed to:", usdcAddress);

  // ============ 2. Deploy ProjectRegistry ============
  console.log("\n2. Deploying ProjectRegistry...");
  const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
  // Initially set oracle to deployer, will update after OracleAggregator is deployed
  const projectRegistry = await ProjectRegistry.deploy(deployer.address);
  await projectRegistry.waitForDeployment();
  const registryAddress = await projectRegistry.getAddress();
  deployedContracts.projectRegistry = registryAddress;
  console.log("   ProjectRegistry deployed to:", registryAddress);

  // ============ 3. Deploy BondFactory ============
  console.log("\n3. Deploying BondFactory...");
  const BondFactory = await ethers.getContractFactory("BondFactory");
  const bondFactory = await BondFactory.deploy(registryAddress, usdcAddress);
  await bondFactory.waitForDeployment();
  const bondFactoryAddress = await bondFactory.getAddress();
  deployedContracts.bondFactory = bondFactoryAddress;
  console.log("   BondFactory deployed to:", bondFactoryAddress);

  // Set BondFactory in ProjectRegistry
  console.log("   Setting BondFactory in ProjectRegistry...");
  await projectRegistry.setBondFactory(bondFactoryAddress);

  // ============ 4. Deploy YieldVault ============
  console.log("\n4. Deploying YieldVault...");
  const YieldVault = await ethers.getContractFactory("YieldVault");
  const yieldVault = await YieldVault.deploy(usdcAddress, bondFactoryAddress);
  await yieldVault.waitForDeployment();
  const yieldVaultAddress = await yieldVault.getAddress();
  deployedContracts.yieldVault = yieldVaultAddress;
  console.log("   YieldVault deployed to:", yieldVaultAddress);

  // Set YieldVault in BondFactory
  console.log("   Setting YieldVault in BondFactory...");
  await bondFactory.setYieldVault(yieldVaultAddress);

  // ============ 5. Deploy MarketFactory ============
  console.log("\n5. Deploying MarketFactory...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  // Default liquidity parameter: 100 USDC worth (100 * 10^6 for 6 decimals, but in WAD it's 100e18)
  // Using 100e18 as the b parameter for LMSR
  const defaultLiquidity = ethers.parseEther("100"); // 100 in WAD
  // Initially set oracle to deployer, will update after OracleAggregator
  const marketFactory = await MarketFactory.deploy(deployer.address, usdcAddress, defaultLiquidity);
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();
  deployedContracts.marketFactory = marketFactoryAddress;
  console.log("   MarketFactory deployed to:", marketFactoryAddress);

  // ============ 6. Deploy OracleAggregator ============
  console.log("\n6. Deploying OracleAggregator...");
  const OracleAggregator = await ethers.getContractFactory("OracleAggregator");
  const oracleAggregator = await OracleAggregator.deploy(
    registryAddress,
    marketFactoryAddress,
    yieldVaultAddress,
    deployer.address // Admin for role management
  );
  await oracleAggregator.waitForDeployment();
  const oracleAddress = await oracleAggregator.getAddress();
  deployedContracts.oracleAggregator = oracleAddress;
  console.log("   OracleAggregator deployed to:", oracleAddress);

  // ============ 7. Setup Roles ============
  console.log("\n7. Setting up roles...");

  // Update oracle in ProjectRegistry to OracleAggregator
  console.log("   Setting OracleAggregator as oracle in ProjectRegistry...");
  await projectRegistry.setOracle(oracleAddress);

  // Update oracle in MarketFactory to OracleAggregator
  console.log("   Setting OracleAggregator as oracle in MarketFactory...");
  await marketFactory.setOracle(oracleAddress);

  // Grant ORACLE_ROLE to agent wallet (if different from deployer)
  if (oracleAgentAddress.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("   Granting ORACLE_ROLE to agent wallet:", oracleAgentAddress);
    const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE"));
    await oracleAggregator.grantRole(ORACLE_ROLE, oracleAgentAddress);
  }

  // ============ 8. Save Deployment ============
  console.log("\n8. Saving deployment...");

  const network = await ethers.provider.getNetwork();
  const deployment = {
    chainId: Number(network.chainId),
    networkName: network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    oracleAgent: oracleAgentAddress,
    contracts: {
      usdc: deployedContracts.usdc,
      projectRegistry: deployedContracts.projectRegistry,
      bondFactory: deployedContracts.bondFactory,
      yieldVault: deployedContracts.yieldVault,
      marketFactory: deployedContracts.marketFactory,
      oracleAggregator: deployedContracts.oracleAggregator,
    },
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save to network-specific file
  const filename = network.chainId === 5003n ? "mantle-sepolia.json" : `chain-${network.chainId}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
  console.log("   Deployment saved to:", filepath);

  // ============ Summary ============
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("\nDeployed Contracts:");
  console.log("  MockUSDC:          ", deployedContracts.usdc);
  console.log("  ProjectRegistry:   ", deployedContracts.projectRegistry);
  console.log("  BondFactory:       ", deployedContracts.bondFactory);
  console.log("  YieldVault:        ", deployedContracts.yieldVault);
  console.log("  MarketFactory:     ", deployedContracts.marketFactory);
  console.log("  OracleAggregator:  ", deployedContracts.oracleAggregator);
  console.log("\nOracle Agent:", oracleAgentAddress);
  console.log("=".repeat(60));

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
