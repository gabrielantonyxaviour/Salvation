import { ethers } from "hardhat";
import { parseUnits, keccak256, toUtf8Bytes } from "ethers";
import * as fs from "fs";
import * as path from "path";

/**
 * Seed Production Script
 * Seeds the deployed contracts with real IPFS metadata from upload-results.json
 */

// Load IPFS URIs from upload script
const uploadResultsPath = path.join(__dirname, "ipfs/upload-results.json");
if (!fs.existsSync(uploadResultsPath)) {
  console.error("ERROR: upload-results.json not found. Run `npm run ipfs:upload` first.");
  process.exit(1);
}

const uploadResults = JSON.parse(fs.readFileSync(uploadResultsPath, "utf8"));

// Load contract addresses from deployment file
const deploymentPath = path.join(__dirname, "../deployments/mantle-sepolia.json");
if (!fs.existsSync(deploymentPath)) {
  console.error("ERROR: mantle-sepolia.json not found. Run `npm run deploy:sepolia` first.");
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
const CONTRACTS = deployment.contracts;

// Project configurations matching IPFS metadata
interface ProjectConfig {
  ipfsName: string; // Must match projectName in upload-results.json
  displayName: string;
  fundingGoal: bigint;
  bondPrice: bigint;
  fundingPercent: number;
  question: string;
  resolutionDays: number;
  milestones: { description: string; daysFromNow: number }[];
  revenueAmount: bigint;
}

const PROJECTS: ProjectConfig[] = [
  {
    ipfsName: "project-1-water",
    displayName: "Kisumu Community Water Well",
    fundingGoal: parseUnits("15000", 6), // $15,000 USDC
    bondPrice: parseUnits("10", 6), // $10 per bond
    fundingPercent: 75, // 75% funded
    question: "Will Kisumu Water Well be operational by target date?",
    resolutionDays: 180,
    milestones: [
      { description: "Site preparation and permits", daysFromNow: 30 },
      { description: "Drilling and borehole installation", daysFromNow: 60 },
      { description: "Solar pump installation", daysFromNow: 90 },
      { description: "Water testing and community handover", daysFromNow: 120 },
    ],
    revenueAmount: parseUnits("500", 6), // $500 revenue
  },
  {
    ipfsName: "project-2-solar",
    displayName: "Lagos Solar Mini-Grid",
    fundingGoal: parseUnits("50000", 6), // $50,000 USDC
    bondPrice: parseUnits("25", 6), // $25 per bond
    fundingPercent: 65, // 65% funded
    question: "Will Lagos Solar Mini-Grid achieve full operation?",
    resolutionDays: 270,
    milestones: [
      { description: "Community engagement and site survey", daysFromNow: 14 },
      { description: "Equipment procurement", daysFromNow: 45 },
      { description: "Installation phase 1", daysFromNow: 75 },
      { description: "Grid connection and go-live", daysFromNow: 120 },
    ],
    revenueAmount: BigInt(0),
  },
  {
    ipfsName: "project-3-education",
    displayName: "Kigali Digital Skills Lab",
    fundingGoal: parseUnits("20000", 6), // $20,000 USDC
    bondPrice: parseUnits("20", 6), // $20 per bond
    fundingPercent: 100, // Fully funded
    question: "Will Kigali Digital Skills Lab graduate 100+ students?",
    resolutionDays: 365,
    milestones: [
      { description: "Facility setup and equipment", daysFromNow: 21 },
      { description: "Curriculum development", daysFromNow: 45 },
      { description: "First cohort enrollment", daysFromNow: 60 },
      { description: "Full operations", daysFromNow: 90 },
    ],
    revenueAmount: parseUnits("300", 6), // $300 revenue
  },
  {
    ipfsName: "project-4-healthcare",
    displayName: "Dar es Salaam Mobile Clinic",
    fundingGoal: parseUnits("35000", 6), // $35,000 USDC
    bondPrice: parseUnits("50", 6), // $50 per bond
    fundingPercent: 40, // 40% funded
    question: "Will Dar es Salaam Mobile Clinic serve 10,000 patients?",
    resolutionDays: 360,
    milestones: [
      { description: "Vehicle acquisition", daysFromNow: 30 },
      { description: "Medical equipment procurement", daysFromNow: 60 },
      { description: "Staff recruitment and licensing", daysFromNow: 90 },
      { description: "Service launch", daysFromNow: 120 },
    ],
    revenueAmount: BigInt(0),
  },
  {
    ipfsName: "project-5-agriculture",
    displayName: "Sidama Coffee Cooperative",
    fundingGoal: parseUnits("40000", 6), // $40,000 USDC
    bondPrice: parseUnits("40", 6), // $40 per bond
    fundingPercent: 85, // 85% funded
    question: "Will Sidama Coffee Cooperative achieve first export?",
    resolutionDays: 180,
    milestones: [
      { description: "Cooperative formation", daysFromNow: 21 },
      { description: "Processing equipment installation", daysFromNow: 60 },
      { description: "Quality certification", daysFromNow: 90 },
      { description: "First export shipment", daysFromNow: 150 },
    ],
    revenueAmount: parseUnits("1000", 6), // $1000 revenue
  },
];

async function main() {
  console.log("=".repeat(60));
  console.log("Salvation Production Seed Script");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log(`\nDeployer: ${deployer.address}`);

  // Get contract instances
  const usdc = await ethers.getContractAt("MockUSDC", CONTRACTS.usdc);
  const projectRegistry = await ethers.getContractAt("ProjectRegistry", CONTRACTS.projectRegistry);
  const bondFactory = await ethers.getContractAt("BondFactory", CONTRACTS.bondFactory);
  const marketFactory = await ethers.getContractAt("MarketFactory", CONTRACTS.marketFactory);
  const yieldVault = await ethers.getContractAt("YieldVault", CONTRACTS.yieldVault);
  const oracleAggregator = await ethers.getContractAt("OracleAggregator", CONTRACTS.oracleAggregator);

  console.log("\nContracts loaded successfully");

  // Temporarily set deployer as oracle for seeding (will restore after)
  const originalOracle = await projectRegistry.oracle();
  console.log(`\nOriginal oracle: ${originalOracle}`);
  console.log("Setting deployer as oracle for seeding...");
  await (await projectRegistry.setOracle(deployer.address)).wait();
  console.log("Deployer set as oracle");

  // Check USDC balance
  let usdcBalance = await usdc.balanceOf(deployer.address);
  console.log(`\nDeployer USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);

  // Mint USDC if needed (only if below minimum threshold)
  const minRequiredUSDC = parseUnits("50000", 6); // $50K minimum for demo
  if (usdcBalance < minRequiredUSDC) {
    console.log("\nMinting USDC for seeding...");
    const mintAmount = parseUnits("100000", 6);
    await (await usdc.mint(deployer.address, mintAmount)).wait();
    usdcBalance = await usdc.balanceOf(deployer.address);
    console.log(`New USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
  }

  // Helper to add delay between transactions
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  console.log("\n" + "-".repeat(60));
  console.log("Seeding Projects with REAL IPFS Metadata...");
  console.log("-".repeat(60));

  const projectIds: string[] = [];
  const results: { name: string; projectId: string; bondToken: string; market: string }[] = [];

  for (let i = 0; i < PROJECTS.length; i++) {
    const project = PROJECTS[i];
    console.log(`\n[${i + 1}/5] ${project.displayName}`);

    // Find matching IPFS result
    const ipfsResult = uploadResults.find((r: any) => r.projectName === project.ipfsName);
    if (!ipfsResult) {
      console.error(`  ERROR: No IPFS metadata found for ${project.ipfsName}`);
      continue;
    }

    console.log(`  IPFS Metadata: ${ipfsResult.metadataUri}`);

    // Add delay between projects to avoid nonce issues
    if (i > 0) {
      console.log("  Waiting 3 seconds...");
      await delay(3000);
    }

    try {
      // 1. Register project
      console.log("  - Registering project...");
      const tx1 = await projectRegistry.registerProject(
        project.displayName,
        ipfsResult.metadataUri, // REAL IPFS URI
        project.fundingGoal,
        project.bondPrice
      );
      const receipt1 = await tx1.wait();

      // Get project ID from event
      const projectRegisteredEvent = receipt1?.logs.find(
        (log: any) =>
          log.topics[0] === keccak256(toUtf8Bytes("ProjectRegistered(bytes32,address,string,uint256,uint256)"))
      );
      const projectId = projectRegisteredEvent?.topics[1] || `0x${i.toString().padStart(64, "0")}`;
      projectIds.push(projectId);
      console.log(`    Project ID: ${projectId.slice(0, 18)}...`);

      // 2. Update status to Funding (deployer should be oracle)
      console.log("  - Setting status to Funding...");
      await (await projectRegistry.updateStatus(projectId, 1)).wait(); // Funding = 1

      // 3. Create bond token
      console.log("  - Creating bond token...");
      await (await bondFactory.createBond(projectId)).wait();
      const bondTokenAddr = await bondFactory.getBondToken(projectId);
      console.log(`    Bond Token: ${bondTokenAddr.slice(0, 18)}...`);

      // 4. Setup milestones
      console.log("  - Setting up milestones...");
      const descriptions = project.milestones.map((m) => m.description);
      const targetDates = project.milestones.map((m) => {
        const date = new Date();
        date.setDate(date.getDate() + m.daysFromNow);
        return Math.floor(date.getTime() / 1000);
      });
      await (await oracleAggregator.setupMilestones(projectId, descriptions, targetDates)).wait();

      // 5. Create prediction market
      console.log("  - Creating prediction market...");
      const resolutionTime = Math.floor(Date.now() / 1000) + project.resolutionDays * 24 * 60 * 60;
      await (await marketFactory.createMarket(projectId, project.question, resolutionTime, 0)).wait();
      const marketAddress = await marketFactory.getMarket(projectId);
      console.log(`    Market: ${marketAddress.slice(0, 18)}...`);

      // 6. Purchase bonds (fund the project)
      const fundingAmount = (project.fundingGoal * BigInt(project.fundingPercent)) / BigInt(100);
      if (fundingAmount > 0) {
        console.log(`  - Funding ${project.fundingPercent}% ($${ethers.formatUnits(fundingAmount, 6)})...`);
        await (await usdc.approve(CONTRACTS.bondFactory, fundingAmount)).wait();
        await (await bondFactory.purchaseBonds(projectId, fundingAmount)).wait();
      }

      // 7. Trade on prediction market
      console.log("  - Trading on prediction market...");
      const market = await ethers.getContractAt("LMSRMarket", marketAddress);

      // Buy some YES shares (use small amounts due to WAD/USDC decimal mismatch)
      // The LMSR returns costs in WAD scale, so we use tiny share amounts
      const yesShares = parseUnits("0.001", 18); // 0.001 shares in WAD
      const yesCost = await market.getCostToBuy(true, yesShares);
      console.log(`    YES cost for 0.001 shares: ${yesCost.toString()}`);

      if (yesCost > 0 && yesCost < parseUnits("1000", 6)) {
        await (await usdc.approve(marketAddress, yesCost)).wait();
        await (await market.buyYes(yesShares)).wait();
        console.log(`    Bought 0.001 YES shares for ${ethers.formatUnits(yesCost, 6)} USDC`);

        // Buy some NO shares for balance
        const noShares = parseUnits("0.0003", 18);
        const noCost = await market.getCostToBuy(false, noShares);
        await (await usdc.approve(marketAddress, noCost)).wait();
        await (await market.buyNo(noShares)).wait();
        console.log(`    Bought 0.0003 NO shares for ${ethers.formatUnits(noCost, 6)} USDC`);
      } else {
        console.log(`    Skipping market trading (cost too high or zero: ${yesCost.toString()})`);
      }

      // 8. Deposit revenue if applicable
      if (project.revenueAmount > 0) {
        console.log(`  - Depositing $${ethers.formatUnits(project.revenueAmount, 6)} revenue...`);
        await (await usdc.approve(CONTRACTS.yieldVault, project.revenueAmount)).wait();
        await (await yieldVault.depositRevenue(projectId, project.revenueAmount)).wait();
      }

      // 9. If fully funded, mark as Active and complete some milestones
      if (project.fundingPercent >= 100) {
        console.log("  - Marking project as Active...");
        await (await projectRegistry.updateStatus(projectId, 2)).wait(); // Active = 2

        // Verify first milestone
        console.log("  - Completing first milestone...");
        await (
          await oracleAggregator.verifyMilestone(
            projectId,
            0,
            true,
            `ipfs://Qm${project.displayName.replace(/\s/g, "")}Evidence`,
            ["satellite-imagery", "field-report"],
            95
          )
        ).wait();
      }

      results.push({
        name: project.displayName,
        projectId,
        bondToken: bondTokenAddr,
        market: marketAddress,
      });

      console.log(`  [OK] ${project.displayName} seeded successfully`);
    } catch (error: any) {
      console.error(`  [ERROR] Failed to seed ${project.displayName}: ${error.message}`);
    }
  }

  // Restore original oracle
  console.log("\nRestoring original oracle...");
  await (await projectRegistry.setOracle(originalOracle)).wait();
  console.log(`Oracle restored to: ${originalOracle}`);

  console.log("\n" + "=".repeat(60));
  console.log("Seed Complete!");
  console.log("=".repeat(60));

  console.log("\nSeeded Projects:");
  for (const result of results) {
    console.log(`\n  ${result.name}:`);
    console.log(`    Project ID: ${result.projectId}`);
    console.log(`    Bond Token: ${result.bondToken}`);
    console.log(`    Market: ${result.market}`);
  }

  // Save results
  const outputPath = path.join(__dirname, "seed-results.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);

  console.log("\nNext steps:");
  console.log("  1. Deploy subgraph: cd subgraph && npm run deploy");
  console.log("  2. Start frontend: cd frontend && npm run dev");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
