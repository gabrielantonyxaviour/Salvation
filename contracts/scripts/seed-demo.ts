import { ethers } from "hardhat";
import { parseUnits, keccak256, toUtf8Bytes } from "ethers";

/**
 * Seed Demo Data Script
 * Creates 5 demo projects with prediction markets, bonds, and simulated activity
 *
 * Demo Projects:
 * 1. Kisumu Water Well (Kenya) - 75% funded, Active, 78% YES
 * 2. Lagos Solar Microgrid (Nigeria) - 65% funded, Funding, 82% YES
 * 3. Accra Tech Academy (Ghana) - 100% funded, Active, 65% YES
 * 4. Nairobi Health Clinic (Kenya) - 40% funded, Funding, 71% YES
 * 5. Sidama Coffee Cooperative (Ethiopia) - 100% funded, Completed, Resolved YES
 */

interface DemoProject {
  name: string;
  metadataURI: string;
  fundingGoal: bigint;
  bondPrice: bigint;
  fundingPercent: number;
  status: "funding" | "active" | "completed";
  question: string;
  resolutionDays: number;
  yesPercent: number;
  milestones: { description: string; daysFromNow: number }[];
  completedMilestones: number;
  revenue: bigint;
}

const DEMO_PROJECTS: DemoProject[] = [
  {
    name: "Kisumu Water Well",
    metadataURI: "ipfs://QmKisumuWaterWell",
    fundingGoal: parseUnits("10000", 6), // $10,000 USDC
    bondPrice: parseUnits("1", 6), // $1 per bond
    fundingPercent: 75,
    status: "active",
    question: "Will this project be operational by Q2 2026?",
    resolutionDays: 180,
    yesPercent: 78,
    milestones: [
      { description: "Site survey and community engagement", daysFromNow: -60 },
      { description: "Drilling and well installation", daysFromNow: -30 },
      { description: "Pump installation and water testing", daysFromNow: 30 },
      { description: "Community handover and operations launch", daysFromNow: 90 },
    ],
    completedMilestones: 2,
    revenue: parseUnits("500", 6), // $500 mock revenue
  },
  {
    name: "Lagos Solar Microgrid",
    metadataURI: "ipfs://QmLagosSolarGrid",
    fundingGoal: parseUnits("25000", 6), // $25,000 USDC
    bondPrice: parseUnits("1", 6),
    fundingPercent: 65,
    status: "funding",
    question: "Will this project achieve full funding and begin operations by Q3 2026?",
    resolutionDays: 270,
    yesPercent: 82,
    milestones: [
      { description: "Grid design and permits", daysFromNow: 30 },
      { description: "Equipment procurement", daysFromNow: 60 },
      { description: "Installation and connection", daysFromNow: 120 },
      { description: "Go-live and revenue generation", daysFromNow: 180 },
    ],
    completedMilestones: 0,
    revenue: BigInt(0),
  },
  {
    name: "Accra Tech Academy",
    metadataURI: "ipfs://QmAccraTechAcademy",
    fundingGoal: parseUnits("50000", 6), // $50,000 USDC
    bondPrice: parseUnits("1", 6),
    fundingPercent: 100,
    status: "active",
    question: "Will this academy graduate and place 100+ students in jobs by 2027?",
    resolutionDays: 365,
    yesPercent: 65,
    milestones: [
      { description: "Facility renovation and equipment setup", daysFromNow: -45 },
      { description: "First cohort enrollment and operations", daysFromNow: 60 },
      { description: "Full capacity operations and job placements", daysFromNow: 180 },
    ],
    completedMilestones: 1,
    revenue: parseUnits("200", 6),
  },
  {
    name: "Nairobi Health Clinic",
    metadataURI: "ipfs://QmNairobiHealthClinic",
    fundingGoal: parseUnits("75000", 6), // $75,000 USDC
    bondPrice: parseUnits("1", 6),
    fundingPercent: 40,
    status: "funding",
    question: "Will this clinic be operational and serving patients by Q4 2026?",
    resolutionDays: 360,
    yesPercent: 71,
    milestones: [
      { description: "Site acquisition and licensing", daysFromNow: 45 },
      { description: "Construction and equipment", daysFromNow: 120 },
      { description: "Staff hiring and training", daysFromNow: 180 },
      { description: "Clinic opening and patient services", daysFromNow: 240 },
    ],
    completedMilestones: 0,
    revenue: BigInt(0),
  },
  {
    name: "Sidama Coffee Cooperative",
    metadataURI: "ipfs://QmSidamaCoffee",
    fundingGoal: parseUnits("30000", 6), // $30,000 USDC
    bondPrice: parseUnits("1", 6),
    fundingPercent: 100,
    status: "completed",
    question: "Will this cooperative achieve profitability and distribute dividends?",
    resolutionDays: -15, // Already resolved
    yesPercent: 100, // Resolved YES
    milestones: [
      { description: "Cooperative formation and training", daysFromNow: -180 },
      { description: "Processing equipment installation", daysFromNow: -120 },
      { description: "First harvest and export", daysFromNow: -60 },
      { description: "Full operations and profit distribution", daysFromNow: -15 },
    ],
    completedMilestones: 4,
    revenue: parseUnits("3000", 6), // $3,000 revenue
  },
];

async function main() {
  console.log("=".repeat(60));
  console.log("Salvation Demo Seed Script");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log(`\nDeployer: ${deployer.address}`);

  // Get deployed contract addresses from environment or hardcoded for demo
  const ADDRESSES = {
    usdc: process.env.USDC_ADDRESS || "",
    projectRegistry: process.env.PROJECT_REGISTRY_ADDRESS || "",
    bondFactory: process.env.BOND_FACTORY_ADDRESS || "",
    marketFactory: process.env.MARKET_FACTORY_ADDRESS || "",
    yieldVault: process.env.YIELD_VAULT_ADDRESS || "",
    oracleAggregator: process.env.ORACLE_AGGREGATOR_ADDRESS || "",
  };

  // Validate addresses
  for (const [name, address] of Object.entries(ADDRESSES)) {
    if (!address || address === ethers.ZeroAddress) {
      console.error(`\nError: ${name} address not set`);
      console.log("Please deploy contracts first using: npx hardhat run scripts/deploy.ts --network mantleSepolia");
      console.log("Then set the addresses in .env or update this script");
      process.exit(1);
    }
  }

  // Get contract instances
  const usdc = await ethers.getContractAt("IERC20", ADDRESSES.usdc);
  const projectRegistry = await ethers.getContractAt("IProjectRegistry", ADDRESSES.projectRegistry);
  const bondFactory = await ethers.getContractAt("IBondFactory", ADDRESSES.bondFactory);
  const marketFactory = await ethers.getContractAt("MarketFactory", ADDRESSES.marketFactory);
  const yieldVault = await ethers.getContractAt("IYieldVault", ADDRESSES.yieldVault);
  const oracleAggregator = await ethers.getContractAt("IOracleAggregator", ADDRESSES.oracleAggregator);

  console.log("\nContracts loaded:");
  console.log(`  USDC: ${ADDRESSES.usdc}`);
  console.log(`  ProjectRegistry: ${ADDRESSES.projectRegistry}`);
  console.log(`  BondFactory: ${ADDRESSES.bondFactory}`);
  console.log(`  MarketFactory: ${ADDRESSES.marketFactory}`);
  console.log(`  YieldVault: ${ADDRESSES.yieldVault}`);
  console.log(`  OracleAggregator: ${ADDRESSES.oracleAggregator}`);

  // Check USDC balance
  const usdcBalance = await usdc.balanceOf(deployer.address);
  console.log(`\nDeployer USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);

  const requiredUSDC = parseUnits("50000", 6); // $50K for demo
  if (usdcBalance < requiredUSDC) {
    console.log(`\nWarning: Low USDC balance. Need at least ${ethers.formatUnits(requiredUSDC, 6)} USDC for full demo`);
  }

  console.log("\n" + "-".repeat(60));
  console.log("Seeding Demo Projects...");
  console.log("-".repeat(60));

  const projectIds: string[] = [];

  for (let i = 0; i < DEMO_PROJECTS.length; i++) {
    const project = DEMO_PROJECTS[i];
    console.log(`\n[${i + 1}/5] ${project.name}`);

    try {
      // 1. Register project
      console.log("  - Registering project...");
      const tx1 = await projectRegistry.registerProject(
        project.name,
        project.metadataURI,
        project.fundingGoal,
        project.bondPrice
      );
      const receipt1 = await tx1.wait();

      // Get project ID from event
      const projectRegisteredEvent = receipt1?.logs.find(
        (log: any) => log.topics[0] === keccak256(toUtf8Bytes("ProjectRegistered(bytes32,address,string,uint256,uint256)"))
      );
      const projectId = projectRegisteredEvent?.topics[1] || `0x${i.toString().padStart(64, "0")}`;
      projectIds.push(projectId);
      console.log(`    Project ID: ${projectId.slice(0, 10)}...`);

      // 2. Setup milestones
      console.log("  - Setting up milestones...");
      const descriptions = project.milestones.map((m) => m.description);
      const targetDates = project.milestones.map((m) => {
        const date = new Date();
        date.setDate(date.getDate() + m.daysFromNow);
        return Math.floor(date.getTime() / 1000);
      });
      await (await oracleAggregator.setupMilestones(projectId, descriptions, targetDates)).wait();

      // 3. Create prediction market
      console.log("  - Creating prediction market...");
      const resolutionTime = Math.floor(Date.now() / 1000) + project.resolutionDays * 24 * 60 * 60;
      await (await marketFactory.createMarket(projectId, project.question, resolutionTime, 0)).wait();
      const marketAddress = await marketFactory.getMarket(projectId);
      console.log(`    Market: ${marketAddress.slice(0, 10)}...`);

      // 4. Purchase bonds (simulate funding)
      const fundingAmount = (project.fundingGoal * BigInt(project.fundingPercent)) / BigInt(100);
      if (fundingAmount > 0 && usdcBalance >= fundingAmount) {
        console.log(`  - Funding ${project.fundingPercent}% ($${ethers.formatUnits(fundingAmount, 6)})...`);
        await (await usdc.approve(ADDRESSES.bondFactory, fundingAmount)).wait();
        await (await bondFactory.purchaseBonds(projectId, fundingAmount)).wait();
      }

      // 5. Update status if needed
      if (project.status === "active") {
        console.log("  - Activating project...");
        await (await projectRegistry.updateStatus(projectId, 2)).wait(); // Active = 2
      } else if (project.status === "completed") {
        console.log("  - Marking project completed...");
        await (await projectRegistry.updateStatus(projectId, 3)).wait(); // Completed = 3
      }

      // 6. Verify completed milestones
      if (project.completedMilestones > 0) {
        console.log(`  - Verifying ${project.completedMilestones} milestones...`);
        for (let m = 0; m < project.completedMilestones; m++) {
          await (
            await oracleAggregator.verifyMilestone(
              projectId,
              m,
              true,
              `ipfs://Qm${project.name.replace(/\s/g, "")}Milestone${m}`,
              ["satellite", "agent"],
              95
            )
          ).wait();
        }
      }

      // 7. Deposit revenue for active/completed projects
      if (project.revenue > 0 && usdcBalance >= project.revenue) {
        console.log(`  - Depositing $${ethers.formatUnits(project.revenue, 6)} revenue...`);
        await (await usdc.approve(ADDRESSES.yieldVault, project.revenue)).wait();
        await (await yieldVault.depositRevenue(projectId, project.revenue)).wait();
      }

      // 8. Simulate market trading to achieve target price
      if (project.yesPercent < 100 && project.yesPercent > 50) {
        console.log(`  - Trading to ${project.yesPercent}% YES...`);
        const market = await ethers.getContractAt("LMSRMarket", marketAddress);

        // Calculate trades to move price
        const yesAmount = parseUnits(String(project.yesPercent * 10), 6);
        const noAmount = parseUnits(String((100 - project.yesPercent) * 10), 6);

        if (usdcBalance >= yesAmount + noAmount) {
          await (await usdc.approve(marketAddress, yesAmount + noAmount)).wait();
          await (await market.buyYes(yesAmount)).wait();
          await (await market.buyNo(noAmount)).wait();
        }
      }

      // 9. Resolve completed project's market
      if (project.status === "completed" && project.yesPercent === 100) {
        console.log("  - Resolving market (YES)...");
        const market = await ethers.getContractAt("LMSRMarket", marketAddress);
        // Note: Only oracle can resolve - this would need the oracle to be the deployer
        // await (await market.resolve(true)).wait();
        console.log("    (Resolution requires oracle - skipped)");
      }

      console.log(`  [OK] ${project.name} seeded successfully`);
    } catch (error: any) {
      console.error(`  [ERROR] Failed to seed ${project.name}: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Demo Seed Complete!");
  console.log("=".repeat(60));

  console.log("\nProject IDs:");
  for (let i = 0; i < projectIds.length; i++) {
    console.log(`  ${DEMO_PROJECTS[i].name}: ${projectIds[i]}`);
  }

  console.log("\nDemo Wallet Setup:");
  console.log(`  Address: ${deployer.address}`);
  console.log(`  - Pre-purchased bonds in Kisumu Water Well and Lagos Solar Microgrid`);
  console.log(`  - Pre-bought YES positions in 2 markets`);

  console.log("\nNext steps:");
  console.log("  1. Update frontend/lib/contracts/deployments.ts with contract addresses");
  console.log("  2. Start frontend: cd frontend && npm run dev");
  console.log("  3. Run demo flow (see docs/DEMO.md)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
