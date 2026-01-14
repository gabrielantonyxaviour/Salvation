import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ProjectRegistry, BondFactory, BondToken, MockUSDC } from "../typechain-types";

describe("BondFactory & BondToken", function () {
  async function deployFixture() {
    const [owner, oracle, sponsor, investor1, investor2] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy ProjectRegistry
    const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
    const registry = await ProjectRegistry.deploy(oracle.address);

    // Deploy BondFactory
    const BondFactory = await ethers.getContractFactory("BondFactory");
    const bondFactory = await BondFactory.deploy(await registry.getAddress(), await usdc.getAddress());

    // Set bond factory in registry
    await registry.setBondFactory(await bondFactory.getAddress());

    // Mint USDC to investors
    await usdc.mint(investor1.address, ethers.parseUnits("100000", 6));
    await usdc.mint(investor2.address, ethers.parseUnits("100000", 6));

    return { registry, bondFactory, usdc, owner, oracle, sponsor, investor1, investor2 };
  }

  async function deployWithProjectFixture() {
    const base = await deployFixture();
    const { registry, bondFactory, oracle, sponsor } = base;

    // Register a project
    await registry.connect(sponsor).registerProject(
      "Water Well Kenya",
      "ipfs://QmTest123",
      ethers.parseUnits("10000", 6), // 10,000 USDC
      ethers.parseUnits("1", 6) // 1 USDC per bond
    );

    const allProjects = await registry.getAllProjects();
    const projectId = allProjects[0].id;

    // Set to funding status
    await registry.connect(oracle).updateStatus(projectId, 1);

    // Create bond
    await bondFactory.createBond(projectId);
    const bondTokenAddress = await bondFactory.getBondToken(projectId);
    const bondToken = await ethers.getContractAt("BondToken", bondTokenAddress);

    return { ...base, projectId, bondToken };
  }

  describe("BondFactory Deployment", function () {
    it("Should set correct project registry", async function () {
      const { bondFactory, registry } = await loadFixture(deployFixture);
      expect(await bondFactory.projectRegistry()).to.equal(await registry.getAddress());
    });

    it("Should set correct USDC address", async function () {
      const { bondFactory, usdc } = await loadFixture(deployFixture);
      expect(await bondFactory.usdc()).to.equal(await usdc.getAddress());
    });
  });

  describe("Bond Creation", function () {
    it("Should create a bond for a project", async function () {
      const { registry, bondFactory, oracle, sponsor } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      await expect(bondFactory.createBond(projectId))
        .to.emit(bondFactory, "BondCreated")
        .withArgs(projectId, (addr: string) => ethers.isAddress(addr));
    });

    it("Should fail to create duplicate bond", async function () {
      const { registry, bondFactory, sponsor } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      await bondFactory.createBond(projectId);

      await expect(bondFactory.createBond(projectId)).to.be.revertedWith(
        "Bond already exists"
      );
    });

    it("Should fail for non-existent project", async function () {
      const { bondFactory } = await loadFixture(deployFixture);

      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(bondFactory.createBond(fakeId)).to.be.revertedWith(
        "Project not found"
      );
    });
  });

  describe("Bond Purchase", function () {
    it("Should allow purchasing bonds", async function () {
      const { bondFactory, usdc, investor1, projectId, bondToken } =
        await loadFixture(deployWithProjectFixture);

      // Approve USDC
      await usdc.connect(investor1).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("1000", 6)
      );

      // Purchase bonds
      await expect(
        bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("1000", 6))
      ).to.emit(bondFactory, "BondsPurchased");

      // Check bond balance (1000 USDC / 1 USDC per bond = 1000 bonds)
      const balance = await bondToken.balanceOf(investor1.address);
      expect(balance).to.equal(ethers.parseEther("1000")); // 1000 bonds in 18 decimals
    });

    it("Should update project funding raised", async function () {
      const { registry, bondFactory, usdc, investor1, projectId } =
        await loadFixture(deployWithProjectFixture);

      await usdc.connect(investor1).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("5000", 6)
      );

      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("5000", 6));

      const project = await registry.getProject(projectId);
      expect(project.fundingRaised).to.equal(ethers.parseUnits("5000", 6));
    });

    it("Should change status to Active when fully funded", async function () {
      const { registry, bondFactory, usdc, investor1, projectId } =
        await loadFixture(deployWithProjectFixture);

      // Funding goal is 10,000 USDC
      await usdc.connect(investor1).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("10000", 6)
      );

      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("10000", 6));

      const project = await registry.getProject(projectId);
      expect(project.status).to.equal(2); // Active
    });

    it("Should fail if project not in funding status", async function () {
      const { registry, bondFactory, usdc, oracle, investor1, projectId } =
        await loadFixture(deployWithProjectFixture);

      // Change to Active status
      await registry.connect(oracle).updateStatus(projectId, 2);

      await usdc.connect(investor1).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("1000", 6)
      );

      await expect(
        bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("1000", 6))
      ).to.be.revertedWith("Project not in funding status");
    });

    it("Should fail with zero amount", async function () {
      const { bondFactory, investor1, projectId } =
        await loadFixture(deployWithProjectFixture);

      await expect(
        bondFactory.connect(investor1).purchaseBonds(projectId, 0)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should fail if bond not created", async function () {
      const { registry, bondFactory, usdc, oracle, sponsor, investor1 } =
        await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "New Project",
        "ipfs://QmNew",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;
      await registry.connect(oracle).updateStatus(projectId, 1);

      await usdc.connect(investor1).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("1000", 6)
      );

      await expect(
        bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("1000", 6))
      ).to.be.revertedWith("Bond not created");
    });
  });

  describe("BondToken Properties", function () {
    it("Should be non-transferable (soulbound)", async function () {
      const { bondFactory, usdc, investor1, investor2, projectId, bondToken } =
        await loadFixture(deployWithProjectFixture);

      // Purchase bonds
      await usdc.connect(investor1).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("1000", 6)
      );
      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("1000", 6));

      // Try to transfer
      await expect(
        bondToken.connect(investor1).transfer(investor2.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Non-transferable");
    });

    it("Should not allow transferFrom", async function () {
      const { bondFactory, usdc, investor1, investor2, projectId, bondToken } =
        await loadFixture(deployWithProjectFixture);

      await usdc.connect(investor1).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("1000", 6)
      );
      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("1000", 6));

      await expect(
        bondToken.connect(investor2).transferFrom(
          investor1.address,
          investor2.address,
          ethers.parseEther("100")
        )
      ).to.be.revertedWith("Non-transferable");
    });

    it("Should not allow approve", async function () {
      const { bondFactory, usdc, investor1, investor2, projectId, bondToken } =
        await loadFixture(deployWithProjectFixture);

      await usdc.connect(investor1).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("1000", 6)
      );
      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("1000", 6));

      await expect(
        bondToken.connect(investor1).approve(investor2.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Non-transferable");
    });

    it("Should track bond balance correctly", async function () {
      const { bondFactory, usdc, investor1, projectId, bondToken } =
        await loadFixture(deployWithProjectFixture);

      await usdc.connect(investor1).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("500", 6)
      );
      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("500", 6));

      expect(await bondToken.bondBalance(investor1.address)).to.equal(ethers.parseEther("500"));
      expect(await bondToken.balanceOf(investor1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should return correct project ID", async function () {
      const { projectId, bondToken } = await loadFixture(deployWithProjectFixture);
      expect(await bondToken.projectId()).to.equal(projectId);
    });
  });

  describe("Multiple Investors", function () {
    it("Should handle multiple investors correctly", async function () {
      const { bondFactory, usdc, investor1, investor2, projectId, bondToken } =
        await loadFixture(deployWithProjectFixture);

      // Investor 1 buys 3000 bonds
      await usdc.connect(investor1).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("3000", 6)
      );
      await bondFactory.connect(investor1).purchaseBonds(projectId, ethers.parseUnits("3000", 6));

      // Investor 2 buys 5000 bonds
      await usdc.connect(investor2).approve(
        await bondFactory.getAddress(),
        ethers.parseUnits("5000", 6)
      );
      await bondFactory.connect(investor2).purchaseBonds(projectId, ethers.parseUnits("5000", 6));

      expect(await bondToken.balanceOf(investor1.address)).to.equal(ethers.parseEther("3000"));
      expect(await bondToken.balanceOf(investor2.address)).to.equal(ethers.parseEther("5000"));
      expect(await bondToken.totalSupply()).to.equal(ethers.parseEther("8000"));
    });
  });

  describe("YieldVault Integration", function () {
    it("Should set yield vault on new bonds when vault is configured", async function () {
      const { registry, bondFactory, oracle, sponsor, owner } = await loadFixture(deployFixture);

      // Set yield vault in factory first
      const vaultAddress = ethers.Wallet.createRandom().address;
      await bondFactory.setYieldVault(vaultAddress);

      // Create a new project and bond
      await registry.connect(sponsor).registerProject(
        "New Project",
        "ipfs://QmNew",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;
      await registry.connect(oracle).updateStatus(projectId, 1);
      await bondFactory.createBond(projectId);

      const bondTokenAddress = await bondFactory.getBondToken(projectId);
      const bondToken = await ethers.getContractAt("BondToken", bondTokenAddress);

      // Vault should be set automatically
      expect(await bondToken.yieldVault()).to.equal(vaultAddress);
    });

    it("Should only allow BondFactory owner to set yield vault on factory", async function () {
      const { bondFactory, investor1 } = await loadFixture(deployFixture);

      const newVault = ethers.Wallet.createRandom().address;
      await expect(
        bondFactory.connect(investor1).setYieldVault(newVault)
      ).to.be.revertedWithCustomError(bondFactory, "OwnableUnauthorizedAccount");
    });

    it("Should reject non-owner from setting yield vault on bond token", async function () {
      const { investor1, bondToken } = await loadFixture(deployWithProjectFixture);

      const newVault = ethers.Wallet.createRandom().address;
      await expect(
        bondToken.connect(investor1).setYieldVault(newVault)
      ).to.be.revertedWithCustomError(bondToken, "OwnableUnauthorizedAccount");
    });
  });
});
