import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("OracleAggregator", function () {
  async function deployFixture() {
    const [owner, oracleAgent, sponsor, investor1] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy ProjectRegistry
    const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
    const registry = await ProjectRegistry.deploy(owner.address); // temp oracle

    // Deploy BondFactory
    const BondFactory = await ethers.getContractFactory("BondFactory");
    const bondFactory = await BondFactory.deploy(await registry.getAddress(), await usdc.getAddress());
    await registry.setBondFactory(await bondFactory.getAddress());

    // Deploy YieldVault
    const YieldVault = await ethers.getContractFactory("YieldVault");
    const yieldVault = await YieldVault.deploy(await usdc.getAddress(), await bondFactory.getAddress());
    await bondFactory.setYieldVault(await yieldVault.getAddress());

    // Deploy MarketFactory
    const defaultLiquidity = ethers.parseEther("100");
    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    const marketFactory = await MarketFactory.deploy(owner.address, await usdc.getAddress(), defaultLiquidity);

    // Deploy OracleAggregator
    const OracleAggregator = await ethers.getContractFactory("OracleAggregator");
    const oracleAggregator = await OracleAggregator.deploy(
      await registry.getAddress(),
      await marketFactory.getAddress(),
      await yieldVault.getAddress(),
      owner.address
    );

    // Set up oracle permissions
    await registry.setOracle(await oracleAggregator.getAddress());
    await marketFactory.setOracle(await oracleAggregator.getAddress());

    // Grant ORACLE_ROLE to agent
    const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE"));
    await oracleAggregator.grantRole(ORACLE_ROLE, oracleAgent.address);

    // Mint USDC
    await usdc.mint(investor1.address, ethers.parseUnits("100000", 6));

    return {
      registry,
      bondFactory,
      yieldVault,
      marketFactory,
      oracleAggregator,
      usdc,
      owner,
      oracleAgent,
      sponsor,
      investor1,
      ORACLE_ROLE,
    };
  }

  async function deployWithProjectFixture() {
    const base = await deployFixture();
    const { registry, bondFactory, marketFactory, oracleAggregator, usdc, oracleAgent, sponsor, investor1 } = base;

    // Register project
    await registry.connect(sponsor).registerProject(
      "Solar Farm Tanzania",
      "ipfs://QmSolar",
      ethers.parseUnits("10000", 6),
      ethers.parseUnits("1", 6)
    );

    const allProjects = await registry.getAllProjects();
    const projectId = allProjects[0].id;

    // Set to funding status (via owner since oracle is now OracleAggregator)
    // We need to update status via the oracleAggregator or directly from owner
    // For this test, let's set owner as temp oracle first
    await registry.setOracle(base.owner.address);
    await registry.connect(base.owner).updateStatus(projectId, 1); // Funding
    await registry.setOracle(await oracleAggregator.getAddress());

    // Create bond and purchase
    await bondFactory.createBond(projectId);
    await usdc.connect(investor1).approve(await bondFactory.getAddress(), ethers.parseUnits("10000", 6));
    await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("10000", 6));

    // Create prediction market
    const resolutionTime = (await time.latest()) + 86400 * 30;
    await marketFactory.createMarket(projectId, "Will project succeed?", resolutionTime, 0);

    // Setup milestones
    const milestones = ["Site preparation", "Equipment installation", "Testing", "Go live"];
    const targetDates = [
      (await time.latest()) + 86400 * 7,
      (await time.latest()) + 86400 * 14,
      (await time.latest()) + 86400 * 21,
      (await time.latest()) + 86400 * 28,
    ];
    await oracleAggregator.connect(oracleAgent).setupMilestones(projectId, milestones, targetDates);

    return { ...base, projectId, resolutionTime };
  }

  describe("Deployment", function () {
    it("Should set correct project registry", async function () {
      const { oracleAggregator, registry } = await loadFixture(deployFixture);
      expect(await oracleAggregator.projectRegistry()).to.equal(await registry.getAddress());
    });

    it("Should set correct market factory", async function () {
      const { oracleAggregator, marketFactory } = await loadFixture(deployFixture);
      expect(await oracleAggregator.marketFactory()).to.equal(await marketFactory.getAddress());
    });

    it("Should set correct yield vault", async function () {
      const { oracleAggregator, yieldVault } = await loadFixture(deployFixture);
      expect(await oracleAggregator.yieldVault()).to.equal(await yieldVault.getAddress());
    });

    it("Should grant admin role to owner", async function () {
      const { oracleAggregator, owner } = await loadFixture(deployFixture);
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await oracleAggregator.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("Should grant oracle role to agent", async function () {
      const { oracleAggregator, oracleAgent, ORACLE_ROLE } = await loadFixture(deployFixture);
      expect(await oracleAggregator.hasRole(ORACLE_ROLE, oracleAgent.address)).to.equal(true);
    });
  });

  describe("Milestone Setup", function () {
    it("Should setup milestones for a project", async function () {
      const { oracleAggregator, registry, oracleAgent, sponsor } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      const descriptions = ["Phase 1", "Phase 2", "Phase 3"];
      const targetDates = [
        (await time.latest()) + 86400,
        (await time.latest()) + 86400 * 2,
        (await time.latest()) + 86400 * 3,
      ];

      await expect(oracleAggregator.connect(oracleAgent).setupMilestones(projectId, descriptions, targetDates))
        .to.emit(oracleAggregator, "MilestonesSetup")
        .withArgs(projectId, 3);
    });

    it("Should reject mismatched arrays", async function () {
      const { oracleAggregator, registry, oracleAgent, sponsor } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      const descriptions = ["Phase 1", "Phase 2"];
      const targetDates = [(await time.latest()) + 86400]; // Only 1 date

      await expect(
        oracleAggregator.connect(oracleAgent).setupMilestones(projectId, descriptions, targetDates)
      ).to.be.revertedWithCustomError(oracleAggregator, "InvalidArrayLengths");
    });

    it("Should reject empty arrays", async function () {
      const { oracleAggregator, registry, oracleAgent, sponsor } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      await expect(oracleAggregator.connect(oracleAgent).setupMilestones(projectId, [], []))
        .to.be.revertedWithCustomError(oracleAggregator, "InvalidArrayLengths");
    });

    it("Should reject duplicate milestone setup", async function () {
      const { oracleAggregator, registry, oracleAgent, sponsor } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      const descriptions = ["Phase 1"];
      const targetDates = [(await time.latest()) + 86400];

      await oracleAggregator.connect(oracleAgent).setupMilestones(projectId, descriptions, targetDates);

      await expect(oracleAggregator.connect(oracleAgent).setupMilestones(projectId, descriptions, targetDates))
        .to.be.revertedWithCustomError(oracleAggregator, "MilestonesAlreadySetup");
    });

    it("Should reject from non-oracle", async function () {
      const { oracleAggregator, registry, sponsor } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      await expect(
        oracleAggregator.connect(sponsor).setupMilestones(projectId, ["Phase 1"], [(await time.latest()) + 86400])
      ).to.be.reverted; // AccessControl revert
    });
  });

  describe("Milestone Verification", function () {
    it("Should verify a milestone", async function () {
      const { oracleAggregator, oracleAgent, projectId } = await loadFixture(deployWithProjectFixture);

      await expect(
        oracleAggregator.connect(oracleAgent).verifyMilestone(
          projectId,
          0, // First milestone
          true,
          "ipfs://QmEvidence123",
          ["satellite", "photos"],
          95
        )
      )
        .to.emit(oracleAggregator, "MilestoneVerified")
        .withArgs(projectId, 0, true, "ipfs://QmEvidence123", 95);
    });

    it("Should mark milestone as completed when verified", async function () {
      const { oracleAggregator, oracleAgent, projectId } = await loadFixture(deployWithProjectFixture);

      await oracleAggregator
        .connect(oracleAgent)
        .verifyMilestone(projectId, 0, true, "ipfs://QmEvidence", ["satellite"], 90);

      const milestones = await oracleAggregator.getMilestones(projectId);
      expect(milestones[0].completed).to.equal(true);
      expect(milestones[0].completedAt).to.be.greaterThan(0);
    });

    it("Should store verification record", async function () {
      const { oracleAggregator, oracleAgent, projectId } = await loadFixture(deployWithProjectFixture);

      await oracleAggregator
        .connect(oracleAgent)
        .verifyMilestone(projectId, 0, true, "ipfs://QmEvidence", ["satellite", "iot"], 85);

      const verifications = await oracleAggregator.getVerifications(projectId);
      expect(verifications.length).to.equal(1);
      expect(verifications[0].milestoneIndex).to.equal(0);
      expect(verifications[0].verified).to.equal(true);
      expect(verifications[0].confidence).to.equal(85);
    });

    it("Should reject invalid milestone index", async function () {
      const { oracleAggregator, oracleAgent, projectId } = await loadFixture(deployWithProjectFixture);

      await expect(
        oracleAggregator.connect(oracleAgent).verifyMilestone(projectId, 10, true, "ipfs://Qm", [], 90)
      ).to.be.revertedWithCustomError(oracleAggregator, "InvalidMilestoneIndex");
    });

    it("Should reject verification for already completed milestone", async function () {
      const { oracleAggregator, oracleAgent, projectId } = await loadFixture(deployWithProjectFixture);

      // Complete milestone 0
      await oracleAggregator
        .connect(oracleAgent)
        .verifyMilestone(projectId, 0, true, "ipfs://Qm1", [], 90);

      // Try to verify again
      await expect(
        oracleAggregator.connect(oracleAgent).verifyMilestone(projectId, 0, true, "ipfs://Qm2", [], 95)
      ).to.be.revertedWithCustomError(oracleAggregator, "MilestoneAlreadyCompleted");
    });

    it("Should reject confidence > 100", async function () {
      const { oracleAggregator, oracleAgent, projectId } = await loadFixture(deployWithProjectFixture);

      await expect(
        oracleAggregator.connect(oracleAgent).verifyMilestone(projectId, 0, true, "ipfs://Qm", [], 101)
      ).to.be.revertedWithCustomError(oracleAggregator, "InvalidConfidence");
    });

    it("Should reject if milestones not setup", async function () {
      const { oracleAggregator, oracleAgent } = await loadFixture(deployFixture);

      const fakeProjectId = ethers.keccak256(ethers.toUtf8Bytes("fake"));

      await expect(
        oracleAggregator.connect(oracleAgent).verifyMilestone(fakeProjectId, 0, true, "ipfs://Qm", [], 90)
      ).to.be.revertedWithCustomError(oracleAggregator, "MilestonesNotSetup");
    });
  });

  describe("Project Completion", function () {
    it("Should mark project as completed when final milestone verified", async function () {
      const { oracleAggregator, registry, oracleAgent, projectId, resolutionTime } = await loadFixture(deployWithProjectFixture);

      // Advance time to after resolution time (since final milestone triggers market resolution)
      await time.increaseTo(resolutionTime + 1);

      // Verify all 4 milestones
      for (let i = 0; i < 4; i++) {
        await oracleAggregator
          .connect(oracleAgent)
          .verifyMilestone(projectId, i, true, `ipfs://QmEvidence${i}`, ["data"], 90);
      }

      const project = await registry.getProject(projectId);
      expect(project.status).to.equal(3); // Completed
    });

    it("Should resolve prediction market when project completes", async function () {
      const { oracleAggregator, marketFactory, oracleAgent, projectId, resolutionTime } =
        await loadFixture(deployWithProjectFixture);

      // Move time forward
      await time.increaseTo(resolutionTime + 1);

      // Verify all milestones
      for (let i = 0; i < 4; i++) {
        await oracleAggregator
          .connect(oracleAgent)
          .verifyMilestone(projectId, i, true, `ipfs://QmEvidence${i}`, ["data"], 90);
      }

      const marketAddress = await marketFactory.getMarket(projectId);
      const market = await ethers.getContractAt("LMSRMarket", marketAddress);

      expect(await market.resolved()).to.equal(true);
      expect(await market.outcome()).to.equal(true); // YES wins
    });
  });

  describe("Project Failure", function () {
    it("Should mark project as failed", async function () {
      const { oracleAggregator, registry, oracleAgent, projectId, resolutionTime } = await loadFixture(deployWithProjectFixture);

      // Advance time to after resolution time (since markProjectFailed triggers market resolution)
      await time.increaseTo(resolutionTime + 1);

      await expect(
        oracleAggregator.connect(oracleAgent).markProjectFailed(projectId, "Funding misappropriation detected")
      )
        .to.emit(oracleAggregator, "ProjectMarkedFailed")
        .withArgs(projectId, "Funding misappropriation detected");

      const project = await registry.getProject(projectId);
      expect(project.status).to.equal(4); // Failed
    });

    it("Should resolve market as NO when project fails", async function () {
      const { oracleAggregator, marketFactory, oracleAgent, projectId, resolutionTime } =
        await loadFixture(deployWithProjectFixture);

      await time.increaseTo(resolutionTime + 1);

      await oracleAggregator.connect(oracleAgent).markProjectFailed(projectId, "Project abandoned");

      const marketAddress = await marketFactory.getMarket(projectId);
      const market = await ethers.getContractAt("LMSRMarket", marketAddress);

      expect(await market.resolved()).to.equal(true);
      expect(await market.outcome()).to.equal(false); // NO wins
    });
  });

  describe("Progress Tracking", function () {
    it("Should track project progress correctly", async function () {
      const { oracleAggregator, oracleAgent, projectId } = await loadFixture(deployWithProjectFixture);

      let [completed, total] = await oracleAggregator.getProjectProgress(projectId);
      expect(completed).to.equal(0);
      expect(total).to.equal(4);

      // Complete 2 milestones
      await oracleAggregator.connect(oracleAgent).verifyMilestone(projectId, 0, true, "ipfs://Qm0", [], 90);
      await oracleAggregator.connect(oracleAgent).verifyMilestone(projectId, 1, true, "ipfs://Qm1", [], 90);

      [completed, total] = await oracleAggregator.getProjectProgress(projectId);
      expect(completed).to.equal(2);
      expect(total).to.equal(4);
    });

    it("Should get individual milestone", async function () {
      const { oracleAggregator, projectId } = await loadFixture(deployWithProjectFixture);

      const milestone = await oracleAggregator.getMilestone(projectId, 0);
      expect(milestone.description).to.equal("Site preparation");
      expect(milestone.completed).to.equal(false);
    });

    it("Should get milestone count", async function () {
      const { oracleAggregator, projectId } = await loadFixture(deployWithProjectFixture);

      expect(await oracleAggregator.getMilestoneCount(projectId)).to.equal(4);
    });

    it("Should get verification count", async function () {
      const { oracleAggregator, oracleAgent, projectId } = await loadFixture(deployWithProjectFixture);

      await oracleAggregator.connect(oracleAgent).verifyMilestone(projectId, 0, true, "ipfs://Qm", [], 90);

      expect(await oracleAggregator.getVerificationCount(projectId)).to.equal(1);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update project registry", async function () {
      const { oracleAggregator, owner } = await loadFixture(deployFixture);

      const newAddress = ethers.Wallet.createRandom().address;
      await oracleAggregator.connect(owner).setProjectRegistry(newAddress);
      expect(await oracleAggregator.projectRegistry()).to.equal(newAddress);
    });

    it("Should allow admin to update market factory", async function () {
      const { oracleAggregator, owner } = await loadFixture(deployFixture);

      const newAddress = ethers.Wallet.createRandom().address;
      await oracleAggregator.connect(owner).setMarketFactory(newAddress);
      expect(await oracleAggregator.marketFactory()).to.equal(newAddress);
    });

    it("Should allow admin to update yield vault", async function () {
      const { oracleAggregator, owner } = await loadFixture(deployFixture);

      const newAddress = ethers.Wallet.createRandom().address;
      await oracleAggregator.connect(owner).setYieldVault(newAddress);
      expect(await oracleAggregator.yieldVault()).to.equal(newAddress);
    });

    it("Should reject zero address updates", async function () {
      const { oracleAggregator, owner } = await loadFixture(deployFixture);

      await expect(oracleAggregator.connect(owner).setProjectRegistry(ethers.ZeroAddress)).to.be.revertedWith(
        "Invalid address"
      );
    });

    it("Should reject updates from non-admin", async function () {
      const { oracleAggregator, sponsor } = await loadFixture(deployFixture);

      const newAddress = ethers.Wallet.createRandom().address;
      await expect(oracleAggregator.connect(sponsor).setProjectRegistry(newAddress)).to.be.reverted;
    });
  });
});
