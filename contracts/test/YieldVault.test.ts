import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("YieldVault", function () {
  async function deployFixture() {
    const [owner, oracle, sponsor, investor1, investor2, revenueProvider] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy ProjectRegistry
    const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
    const registry = await ProjectRegistry.deploy(oracle.address);

    // Deploy BondFactory
    const BondFactory = await ethers.getContractFactory("BondFactory");
    const bondFactory = await BondFactory.deploy(await registry.getAddress(), await usdc.getAddress());

    // Deploy YieldVault
    const YieldVault = await ethers.getContractFactory("YieldVault");
    const yieldVault = await YieldVault.deploy(await usdc.getAddress(), await bondFactory.getAddress());

    // Set up connections
    await registry.setBondFactory(await bondFactory.getAddress());
    await bondFactory.setYieldVault(await yieldVault.getAddress());

    // Mint USDC
    await usdc.mint(investor1.address, ethers.parseUnits("100000", 6));
    await usdc.mint(investor2.address, ethers.parseUnits("100000", 6));
    await usdc.mint(revenueProvider.address, ethers.parseUnits("100000", 6));

    return { registry, bondFactory, yieldVault, usdc, owner, oracle, sponsor, investor1, investor2, revenueProvider };
  }

  async function deployWithInvestmentFixture() {
    const base = await deployFixture();
    const { registry, bondFactory, yieldVault, usdc, oracle, sponsor, investor1, investor2 } = base;

    // Register project
    await registry.connect(sponsor).registerProject(
      "Solar Farm Ghana",
      "ipfs://QmSolar",
      ethers.parseUnits("10000", 6),
      ethers.parseUnits("1", 6)
    );

    const allProjects = await registry.getAllProjects();
    const projectId = allProjects[0].id;

    // Set to funding
    await registry.connect(oracle).updateStatus(projectId, 1);

    // Create bond (BondFactory automatically sets yieldVault since it was set before)
    await bondFactory.createBond(projectId);
    const bondTokenAddress = await bondFactory.getBondToken(projectId);
    const bondToken = await ethers.getContractAt("BondToken", bondTokenAddress);

    // Investors buy bonds
    await usdc.connect(investor1).approve(await bondFactory.getAddress(), ethers.parseUnits("3000", 6));
    await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("3000", 6));

    await usdc.connect(investor2).approve(await bondFactory.getAddress(), ethers.parseUnits("7000", 6));
    await bondFactory.connect(investor2).purchaseBonds(projectId, ethers.parseUnits("7000", 6));

    return { ...base, projectId, bondToken };
  }

  describe("Deployment", function () {
    it("Should set correct USDC address", async function () {
      const { yieldVault, usdc } = await loadFixture(deployFixture);
      expect(await yieldVault.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set correct bond factory", async function () {
      const { yieldVault, bondFactory } = await loadFixture(deployFixture);
      expect(await yieldVault.bondFactory()).to.equal(await bondFactory.getAddress());
    });
  });

  describe("Revenue Deposit", function () {
    it("Should allow depositing revenue", async function () {
      const { yieldVault, usdc, revenueProvider, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("1000", 6)
      );

      await expect(
        yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6))
      ).to.emit(yieldVault, "RevenueDeposited")
        .withArgs(projectId, ethers.parseUnits("1000", 6), ethers.parseUnits("1000", 6));
    });

    it("Should track project revenue correctly", async function () {
      const { yieldVault, usdc, revenueProvider, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("2500", 6)
      );

      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1500", 6));

      expect(await yieldVault.projectRevenue(projectId)).to.equal(ethers.parseUnits("2500", 6));
    });

    it("Should fail with zero amount", async function () {
      const { yieldVault, revenueProvider, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await expect(
        yieldVault.connect(revenueProvider).depositRevenue(projectId, 0)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should fail for non-existent bond", async function () {
      const { yieldVault, usdc, revenueProvider } = await loadFixture(deployFixture);

      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("1000", 6)
      );

      await expect(
        yieldVault.connect(revenueProvider).depositRevenue(fakeId, ethers.parseUnits("1000", 6))
      ).to.be.revertedWith("Bond not found");
    });
  });

  describe("Yield Calculation", function () {
    it("Should calculate claimable yield proportionally", async function () {
      const { yieldVault, usdc, revenueProvider, investor1, investor2, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      // Deposit 1000 USDC revenue
      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("1000", 6)
      );
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      // Investor1 has 3000 bonds (30%), Investor2 has 7000 bonds (70%)
      const yield1 = await yieldVault.claimableYield(projectId, investor1.address);
      const yield2 = await yieldVault.claimableYield(projectId, investor2.address);

      // 30% of 1000 = 300
      expect(yield1).to.equal(ethers.parseUnits("300", 6));
      // 70% of 1000 = 700
      expect(yield2).to.equal(ethers.parseUnits("700", 6));
    });

    it("Should return zero for non-holder", async function () {
      const { yieldVault, usdc, revenueProvider, sponsor, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("1000", 6)
      );
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      expect(await yieldVault.claimableYield(projectId, sponsor.address)).to.equal(0);
    });

    it("Should return zero with no revenue", async function () {
      const { yieldVault, investor1, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      expect(await yieldVault.claimableYield(projectId, investor1.address)).to.equal(0);
    });
  });

  describe("Yield Claiming", function () {
    it("Should allow claiming yield", async function () {
      const { yieldVault, usdc, revenueProvider, investor1, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("1000", 6)
      );
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      const balanceBefore = await usdc.balanceOf(investor1.address);

      await expect(yieldVault.connect(investor1).claimYield(projectId))
        .to.emit(yieldVault, "YieldClaimed")
        .withArgs(projectId, investor1.address, ethers.parseUnits("300", 6));

      const balanceAfter = await usdc.balanceOf(investor1.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("300", 6));
    });

    it("Should update distributed revenue", async function () {
      const { yieldVault, usdc, revenueProvider, investor1, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("1000", 6)
      );
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      await yieldVault.connect(investor1).claimYield(projectId);

      expect(await yieldVault.distributedRevenue(projectId)).to.equal(ethers.parseUnits("300", 6));
    });

    it("Should fail with no yield to claim", async function () {
      const { yieldVault, investor1, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await expect(
        yieldVault.connect(investor1).claimYield(projectId)
      ).to.be.revertedWith("No yield to claim");
    });

    it("Should eventually exhaust yield when all claim", async function () {
      const { yieldVault, usdc, revenueProvider, investor1, investor2, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("1000", 6)
      );
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      // Both investors claim until exhausted
      // The yield vault distributes proportionally from undistributed pool
      let totalClaimed = 0n;
      let iterations = 0;
      while (iterations < 10) {
        const claimable1 = await yieldVault.claimableYield(projectId, investor1.address);
        const claimable2 = await yieldVault.claimableYield(projectId, investor2.address);

        if (claimable1 === 0n && claimable2 === 0n) break;

        if (claimable1 > 0n) {
          await yieldVault.connect(investor1).claimYield(projectId);
          totalClaimed += claimable1;
        }
        if (claimable2 > 0n) {
          await yieldVault.connect(investor2).claimYield(projectId);
          totalClaimed += claimable2;
        }
        iterations++;
      }

      // Eventually all revenue should be distributed
      expect(await yieldVault.distributedRevenue(projectId)).to.be.closeTo(
        ethers.parseUnits("1000", 6),
        ethers.parseUnits("1", 6) // Allow small rounding error
      );
    });

    it("Should allow claiming after new deposit", async function () {
      const { yieldVault, usdc, revenueProvider, investor1, investor2, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      // First deposit
      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("2000", 6)
      );
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      // Both claim
      await yieldVault.connect(investor1).claimYield(projectId);
      await yieldVault.connect(investor2).claimYield(projectId);

      // Second deposit
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      // Should be able to claim again
      const claimable1 = await yieldVault.claimableYield(projectId, investor1.address);
      const claimable2 = await yieldVault.claimableYield(projectId, investor2.address);

      // After first round, some undistributed remains, so new deposit adds to it
      expect(claimable1).to.be.greaterThan(0);
      expect(claimable2).to.be.greaterThan(0);
    });
  });

  describe("Project Yield Info", function () {
    it("Should return correct yield info", async function () {
      const { yieldVault, usdc, revenueProvider, investor1, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("1000", 6)
      );
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      await yieldVault.connect(investor1).claimYield(projectId);

      const [totalRevenue, distributed, apy] = await yieldVault.getProjectYieldInfo(projectId);

      expect(totalRevenue).to.equal(ethers.parseUnits("1000", 6));
      expect(distributed).to.equal(ethers.parseUnits("300", 6));
      // APY will depend on time elapsed
    });

    it("Should track last claim time", async function () {
      const { yieldVault, usdc, revenueProvider, investor1, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("1000", 6)
      );
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      const beforeClaim = await yieldVault.lastClaimTime(investor1.address, projectId);
      expect(beforeClaim).to.equal(0);

      await yieldVault.connect(investor1).claimYield(projectId);

      const afterClaim = await yieldVault.lastClaimTime(investor1.address, projectId);
      expect(afterClaim).to.be.greaterThan(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small revenue amounts", async function () {
      const { yieldVault, usdc, revenueProvider, investor1, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("10", 6) // 10 USDC
      );
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("10", 6));

      const yield1 = await yieldVault.claimableYield(projectId, investor1.address);
      expect(yield1).to.equal(ethers.parseUnits("3", 6)); // 30% of 10
    });

    it("Should handle multiple deposits and claims correctly", async function () {
      const { yieldVault, usdc, revenueProvider, investor1, investor2, projectId } =
        await loadFixture(deployWithInvestmentFixture);

      await usdc.connect(revenueProvider).approve(
        await yieldVault.getAddress(),
        ethers.parseUnits("5000", 6)
      );

      // Deposit 1: 1000 USDC
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("1000", 6));

      // Both investors claim their share of first deposit
      const claim1_1 = await yieldVault.claimableYield(projectId, investor1.address);
      const claim1_2 = await yieldVault.claimableYield(projectId, investor2.address);
      await yieldVault.connect(investor1).claimYield(projectId);
      await yieldVault.connect(investor2).claimYield(projectId);

      // Deposit 2: 2000 USDC more
      await yieldVault.connect(revenueProvider).depositRevenue(projectId, ethers.parseUnits("2000", 6));

      // Both can claim again
      const claim2_1 = await yieldVault.claimableYield(projectId, investor1.address);
      const claim2_2 = await yieldVault.claimableYield(projectId, investor2.address);
      expect(claim2_1).to.be.greaterThan(0);
      expect(claim2_2).to.be.greaterThan(0);

      // Total revenue is tracked correctly
      expect(await yieldVault.projectRevenue(projectId)).to.equal(ethers.parseUnits("3000", 6));
    });
  });
});
