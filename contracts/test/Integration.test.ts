import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Integration Tests - End-to-End Flows", function () {
  async function deployFullSystemFixture() {
    const [deployer, oracleAgent, sponsor, investor1, investor2, revenueProvider, trader1, trader2] =
      await ethers.getSigners();

    // Deploy MockUSDC (6 decimals for bonds/yield)
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy MockERC20 (18 decimals for prediction markets - LMSR requires WAD scale)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const marketCollateral = await MockERC20.deploy("Market Collateral", "MCOL");

    // Deploy ProjectRegistry
    const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
    const registry = await ProjectRegistry.deploy(deployer.address);

    // Deploy BondFactory
    const BondFactory = await ethers.getContractFactory("BondFactory");
    const bondFactory = await BondFactory.deploy(await registry.getAddress(), await usdc.getAddress());
    await registry.setBondFactory(await bondFactory.getAddress());

    // Deploy YieldVault
    const YieldVault = await ethers.getContractFactory("YieldVault");
    const yieldVault = await YieldVault.deploy(await usdc.getAddress(), await bondFactory.getAddress());
    await bondFactory.setYieldVault(await yieldVault.getAddress());

    // Deploy MarketFactory with 18-decimal collateral
    const defaultLiquidity = ethers.parseEther("1000");
    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    const marketFactory = await MarketFactory.deploy(deployer.address, await marketCollateral.getAddress(), defaultLiquidity);

    // Deploy OracleAggregator
    const OracleAggregator = await ethers.getContractFactory("OracleAggregator");
    const oracleAggregator = await OracleAggregator.deploy(
      await registry.getAddress(),
      await marketFactory.getAddress(),
      await yieldVault.getAddress(),
      deployer.address
    );

    // Configure oracle permissions
    await registry.setOracle(await oracleAggregator.getAddress());
    await marketFactory.setOracle(await oracleAggregator.getAddress());

    // Grant ORACLE_ROLE
    const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE"));
    await oracleAggregator.grantRole(ORACLE_ROLE, oracleAgent.address);

    // Mint USDC to all users (6 decimals)
    for (const user of [investor1, investor2, revenueProvider, trader1, trader2]) {
      await usdc.mint(user.address, ethers.parseUnits("1000000", 6));
    }

    // Mint market collateral to traders (18 decimals)
    for (const user of [trader1, trader2]) {
      await marketCollateral.mint(user.address, ethers.parseEther("1000000"));
    }

    return {
      usdc,
      marketCollateral,
      registry,
      bondFactory,
      yieldVault,
      marketFactory,
      oracleAggregator,
      deployer,
      oracleAgent,
      sponsor,
      investor1,
      investor2,
      revenueProvider,
      trader1,
      trader2,
    };
  }

  describe("Complete Project Lifecycle - Success Path", function () {
    it("Should complete full project lifecycle from creation to completion", async function () {
      const {
        usdc,
        registry,
        bondFactory,
        yieldVault,
        marketFactory,
        oracleAggregator,
        deployer,
        oracleAgent,
        sponsor,
        investor1,
        investor2,
        revenueProvider,
      } = await loadFixture(deployFullSystemFixture);

      // ========== PHASE 1: Project Creation ==========
      console.log("Phase 1: Creating project...");

      await registry.connect(sponsor).registerProject(
        "Community Solar Farm - Ghana",
        "ipfs://QmProjectMetadata",
        ethers.parseUnits("50000", 6), // $50,000 funding goal
        ethers.parseUnits("10", 6) // $10 per bond
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;
      expect(allProjects.length).to.equal(1);

      // ========== PHASE 2: Set to Funding ==========
      console.log("Phase 2: Setting project to funding status...");

      // Need to temporarily set oracle to deployer for status update
      await registry.setOracle(deployer.address);
      await registry.connect(deployer).updateStatus(projectId, 1); // Funding
      await registry.setOracle(await oracleAggregator.getAddress());

      // ========== PHASE 3: Create Bond and Market ==========
      console.log("Phase 3: Creating bond and prediction market...");

      await bondFactory.createBond(projectId);
      const bondTokenAddress = await bondFactory.getBondToken(projectId);
      const bondToken = await ethers.getContractAt("BondToken", bondTokenAddress);
      // YieldVault is automatically set by BondFactory during createBond

      const resolutionTime = (await time.latest()) + 86400 * 60; // 60 days
      await marketFactory.createMarket(projectId, "Will project be operational by deadline?", resolutionTime, 0);
      const marketAddress = await marketFactory.getMarket(projectId);
      const market = await ethers.getContractAt("LMSRMarket", marketAddress);

      // ========== PHASE 4: Investors Purchase Bonds ==========
      console.log("Phase 4: Investors purchasing bonds...");

      // Investor 1 buys $20,000 worth
      await usdc.connect(investor1).approve(await bondFactory.getAddress(), ethers.parseUnits("20000", 6));
      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("20000", 6));
      expect(await bondToken.balanceOf(investor1.address)).to.equal(ethers.parseEther("2000")); // 2000 bonds

      // Investor 2 buys $30,000 worth (completes funding)
      await usdc.connect(investor2).approve(await bondFactory.getAddress(), ethers.parseUnits("30000", 6));
      await bondFactory.connect(investor2).purchaseBonds(projectId, ethers.parseUnits("30000", 6));
      expect(await bondToken.balanceOf(investor2.address)).to.equal(ethers.parseEther("3000")); // 3000 bonds

      // Project should now be Active
      const projectAfterFunding = await registry.getProject(projectId);
      expect(projectAfterFunding.status).to.equal(2); // Active

      // ========== PHASE 5: Setup Milestones ==========
      console.log("Phase 5: Setting up milestones...");

      const milestones = ["Site survey", "Equipment procurement", "Installation", "Grid connection"];
      const targetDates = [
        (await time.latest()) + 86400 * 7,
        (await time.latest()) + 86400 * 21,
        (await time.latest()) + 86400 * 42,
        (await time.latest()) + 86400 * 56,
      ];
      await oracleAggregator.connect(oracleAgent).setupMilestones(projectId, milestones, targetDates);

      const storedMilestones = await oracleAggregator.getMilestones(projectId);
      expect(storedMilestones.length).to.equal(4);

      // ========== PHASE 6: Project Generates Revenue ==========
      console.log("Phase 6: Depositing project revenue...");

      // Project generates $5,000 in revenue
      await usdc.connect(revenueProvider).approve(await yieldVault.getAddress(), ethers.parseUnits("5000", 6));
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("5000", 6));

      // Check claimable yield
      const yield1 = await yieldVault.claimableYield(projectId, investor1.address);
      const yield2 = await yieldVault.claimableYield(projectId, investor2.address);
      expect(yield1).to.equal(ethers.parseUnits("2000", 6)); // 40% of 5000
      expect(yield2).to.equal(ethers.parseUnits("3000", 6)); // 60% of 5000

      // ========== PHASE 7: Investors Claim Yield ==========
      console.log("Phase 7: Investors claiming yield...");

      const balance1Before = await usdc.balanceOf(investor1.address);
      await yieldVault.connect(investor1).claimYield(projectId);
      const balance1After = await usdc.balanceOf(investor1.address);
      expect(balance1After - balance1Before).to.equal(ethers.parseUnits("2000", 6));

      // ========== PHASE 8: Verify Milestones ==========
      console.log("Phase 8: Verifying milestones...");

      // Verify milestones 0-2
      for (let i = 0; i < 3; i++) {
        await oracleAggregator
          .connect(oracleAgent)
          .verifyMilestone(projectId, i, true, `ipfs://QmEvidence${i}`, ["satellite", "photos"], 95);
      }

      const [completed, total] = await oracleAggregator.getProjectProgress(projectId);
      expect(completed).to.equal(3);
      expect(total).to.equal(4);

      // ========== PHASE 9: Complete Final Milestone ==========
      console.log("Phase 9: Completing final milestone...");

      await time.increaseTo(resolutionTime + 1);

      await oracleAggregator
        .connect(oracleAgent)
        .verifyMilestone(projectId, 3, true, "ipfs://QmFinalEvidence", ["iot", "inspection"], 98);

      // Project should be completed
      const finalProject = await registry.getProject(projectId);
      expect(finalProject.status).to.equal(3); // Completed

      // Market should be resolved (YES wins)
      expect(await market.resolved()).to.equal(true);
      expect(await market.outcome()).to.equal(true);

      console.log("SUCCESS: Project lifecycle completed!");
    });
  });

  describe("Complete Project Lifecycle - Failure Path", function () {
    it("Should handle project failure correctly", async function () {
      const {
        usdc,
        marketCollateral,
        registry,
        bondFactory,
        marketFactory,
        oracleAggregator,
        deployer,
        oracleAgent,
        sponsor,
        investor1,
        trader1,
        trader2,
      } = await loadFixture(deployFullSystemFixture);

      // Create and fund project
      await registry.connect(sponsor).registerProject(
        "Failed Project",
        "ipfs://QmFailed",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      await registry.setOracle(deployer.address);
      await registry.connect(deployer).updateStatus(projectId, 1);
      await registry.setOracle(await oracleAggregator.getAddress());

      await bondFactory.createBond(projectId);

      const resolutionTime = (await time.latest()) + 86400 * 30;
      await marketFactory.createMarket(projectId, "Will project succeed?", resolutionTime, 0);
      const marketAddress = await marketFactory.getMarket(projectId);
      const market = await ethers.getContractAt("LMSRMarket", marketAddress);

      // Fund the project
      await usdc.connect(investor1).approve(await bondFactory.getAddress(), ethers.parseUnits("10000", 6));
      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("10000", 6));

      // Setup milestones
      await oracleAggregator
        .connect(oracleAgent)
        .setupMilestones(projectId, ["Phase 1", "Phase 2"], [(await time.latest()) + 86400, (await time.latest()) + 86400 * 2]);

      // Trader bets NO (using 18-decimal market collateral)
      const noShares = ethers.parseEther("10");
      const noCost = await market.getCostToBuy(false, noShares);
      await marketCollateral.connect(trader1).approve(await market.getAddress(), noCost);
      await market.connect(trader1).buyNo(noShares);

      // Fund the market with additional collateral for payouts
      const additionalFunding = noShares - noCost + ethers.parseEther("1");
      await marketCollateral.connect(trader2).transfer(await market.getAddress(), additionalFunding);

      // Complete first milestone
      await oracleAggregator.connect(oracleAgent).verifyMilestone(projectId, 0, true, "ipfs://Qm", [], 90);

      // Project fails
      await time.increaseTo(resolutionTime + 1);
      await oracleAggregator.connect(oracleAgent).markProjectFailed(projectId, "Sponsor absconded with funds");

      // Verify failure state
      const project = await registry.getProject(projectId);
      expect(project.status).to.equal(4); // Failed

      // Market resolved as NO
      expect(await market.resolved()).to.equal(true);
      expect(await market.outcome()).to.equal(false);

      // Trader can claim NO winnings
      const balanceBefore = await marketCollateral.balanceOf(trader1.address);
      await market.connect(trader1).claimWinnings();
      const balanceAfter = await marketCollateral.balanceOf(trader1.address);
      expect(balanceAfter - balanceBefore).to.equal(noShares);

      console.log("Project failure handled correctly!");
    });
  });

  describe("Prediction Market Trading Scenarios", function () {
    it("Should handle complex trading scenario with price movements", async function () {
      const { marketCollateral, registry, marketFactory, deployer, oracleAgent, sponsor, trader1, trader2 } =
        await loadFixture(deployFullSystemFixture);

      // Create project
      await registry.connect(sponsor).registerProject(
        "Trading Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      // Create market
      const resolutionTime = (await time.latest()) + 86400 * 30;
      await marketFactory.createMarket(projectId, "Test?", resolutionTime, 0);
      const marketAddress = await marketFactory.getMarket(projectId);
      const market = await ethers.getContractAt("LMSRMarket", marketAddress);
      const yesToken = await ethers.getContractAt("OutcomeToken", await market.yesToken());

      // Initial price should be ~50%
      const initialPrice = await market.getYesPrice();
      expect(initialPrice).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.05"));

      // Trader1 buys YES (bullish) - using smaller shares for stability
      const yesShares = ethers.parseEther("20");
      const yesCost = await market.getCostToBuy(true, yesShares);
      await marketCollateral.connect(trader1).approve(await market.getAddress(), yesCost);
      await market.connect(trader1).buyYes(yesShares);

      // Price should increase
      const priceAfterYes = await market.getYesPrice();
      expect(priceAfterYes).to.be.greaterThan(initialPrice);

      // Trader2 buys NO (bearish)
      const noShares = ethers.parseEther("30");
      const noCost = await market.getCostToBuy(false, noShares);
      await marketCollateral.connect(trader2).approve(await market.getAddress(), noCost);
      await market.connect(trader2).buyNo(noShares);

      // Price should decrease
      const priceAfterNo = await market.getYesPrice();
      expect(priceAfterNo).to.be.lessThan(priceAfterYes);

      // Trader1 sells some YES
      const sellShares = ethers.parseEther("10");
      await market.connect(trader1).sellYes(sellShares);
      expect(await yesToken.balanceOf(trader1.address)).to.equal(yesShares - sellShares);

      // Trader1 transfers remaining YES tokens to Trader2
      await yesToken.connect(trader1).transfer(trader2.address, yesShares - sellShares);
      expect(await yesToken.balanceOf(trader2.address)).to.equal(yesShares - sellShares);

      console.log("Complex trading scenario completed!");
    });
  });

  describe("Multiple Projects Simultaneously", function () {
    it("Should handle multiple projects independently", async function () {
      const { usdc, registry, bondFactory, yieldVault, oracleAggregator, deployer, oracleAgent, sponsor, investor1 } =
        await loadFixture(deployFullSystemFixture);

      // Create 3 projects
      const projects = [];
      for (let i = 0; i < 3; i++) {
        await registry.connect(sponsor).registerProject(
          `Project ${i + 1}`,
          `ipfs://QmProject${i}`,
          ethers.parseUnits("5000", 6),
          ethers.parseUnits("1", 6)
        );
      }

      const allProjects = await registry.getAllProjects();
      expect(allProjects.length).to.equal(3);

      // Set all to funding
      await registry.setOracle(deployer.address);
      for (const project of allProjects) {
        await registry.connect(deployer).updateStatus(project.id, 1);
        await bondFactory.createBond(project.id);
        // YieldVault is automatically set by BondFactory during createBond
      }
      await registry.setOracle(await oracleAggregator.getAddress());

      // Invest in all projects
      for (const project of allProjects) {
        await usdc.connect(investor1).approve(await bondFactory.getAddress(), ethers.parseUnits("5000", 6));
        await bondFactory.connect(investor1).purchaseBonds(project.id, ethers.parseUnits("5000", 6));
      }

      // Setup milestones for each
      for (const project of allProjects) {
        await oracleAggregator
          .connect(oracleAgent)
          .setupMilestones(project.id, ["Done"], [(await time.latest()) + 86400]);
      }

      // Verify project 1 succeeds
      await oracleAggregator.connect(oracleAgent).verifyMilestone(allProjects[0].id, 0, true, "ipfs://Qm", [], 90);
      expect((await registry.getProject(allProjects[0].id)).status).to.equal(3); // Completed

      // Project 2 fails
      await oracleAggregator.connect(oracleAgent).markProjectFailed(allProjects[1].id, "Failed");
      expect((await registry.getProject(allProjects[1].id)).status).to.equal(4); // Failed

      // Project 3 still in progress
      expect((await registry.getProject(allProjects[2].id)).status).to.equal(2); // Active

      console.log("Multiple projects handled independently!");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle minimum investment amounts", async function () {
      const { usdc, registry, bondFactory, deployer, sponsor, investor1 } =
        await loadFixture(deployFullSystemFixture);

      await registry.connect(sponsor).registerProject(
        "Small Project",
        "ipfs://Qm",
        ethers.parseUnits("100", 6), // $100 goal
        ethers.parseUnits("1", 6) // $1 per bond
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      await registry.setOracle(deployer.address);
      await registry.connect(deployer).updateStatus(projectId, 1);
      await bondFactory.createBond(projectId);

      // Invest just $1
      await usdc.connect(investor1).approve(await bondFactory.getAddress(), ethers.parseUnits("1", 6));
      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("1", 6));

      const bondTokenAddress = await bondFactory.getBondToken(projectId);
      const bondToken = await ethers.getContractAt("BondToken", bondTokenAddress);
      expect(await bondToken.balanceOf(investor1.address)).to.equal(ethers.parseEther("1"));
    });

    it("Should handle revenue distribution with many investors", async function () {
      const { usdc, registry, bondFactory, yieldVault, deployer, sponsor, investor1, investor2, revenueProvider } =
        await loadFixture(deployFullSystemFixture);

      await registry.connect(sponsor).registerProject(
        "Multi Investor",
        "ipfs://Qm",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("10", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      await registry.setOracle(deployer.address);
      await registry.connect(deployer).updateStatus(projectId, 1);
      await bondFactory.createBond(projectId);
      // YieldVault is automatically set by BondFactory during createBond

      // Multiple investments
      await usdc.connect(investor1).approve(await bondFactory.getAddress(), ethers.parseUnits("2500", 6));
      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("2500", 6));

      await usdc.connect(investor2).approve(await bondFactory.getAddress(), ethers.parseUnits("7500", 6));
      await bondFactory.connect(investor2).purchaseBonds(projectId, ethers.parseUnits("7500", 6));

      // Deposit revenue
      await usdc.connect(revenueProvider).approve(await yieldVault.getAddress(), ethers.parseUnits("1000", 6));
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      // Check proportional distribution
      expect(await yieldVault.claimableYield(projectId, investor1.address)).to.equal(
        ethers.parseUnits("250", 6)
      ); // 25%
      expect(await yieldVault.claimableYield(projectId, investor2.address)).to.equal(
        ethers.parseUnits("750", 6)
      ); // 75%
    });
  });
});
