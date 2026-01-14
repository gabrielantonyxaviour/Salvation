import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ProjectRegistry, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ProjectRegistry", function () {
  async function deployFixture() {
    const [owner, oracle, sponsor, user1, user2] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
    const registry = await ProjectRegistry.deploy(oracle.address);

    return { registry, usdc, owner, oracle, sponsor, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("Should set the correct oracle", async function () {
      const { registry, oracle } = await loadFixture(deployFixture);
      expect(await registry.oracle()).to.equal(oracle.address);
    });
  });

  describe("Project Registration", function () {
    it("Should register a new project", async function () {
      const { registry, sponsor } = await loadFixture(deployFixture);

      const tx = await registry.connect(sponsor).registerProject(
        "Water Well Kenya",
        "ipfs://QmTest123",
        ethers.parseUnits("10000", 6), // 10,000 USDC funding goal
        ethers.parseUnits("1", 6) // 1 USDC per bond
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "ProjectRegistered"
      );
      expect(event).to.not.be.undefined;
    });

    it("Should fail with empty name", async function () {
      const { registry, sponsor } = await loadFixture(deployFixture);

      await expect(
        registry.connect(sponsor).registerProject(
          "",
          "ipfs://QmTest123",
          ethers.parseUnits("10000", 6),
          ethers.parseUnits("1", 6)
        )
      ).to.be.revertedWith("Name required");
    });

    it("Should fail with empty metadataURI", async function () {
      const { registry, sponsor } = await loadFixture(deployFixture);

      await expect(
        registry.connect(sponsor).registerProject(
          "Test Project",
          "",
          ethers.parseUnits("10000", 6),
          ethers.parseUnits("1", 6)
        )
      ).to.be.revertedWith("MetadataURI required");
    });

    it("Should fail with zero funding goal", async function () {
      const { registry, sponsor } = await loadFixture(deployFixture);

      await expect(
        registry.connect(sponsor).registerProject(
          "Test Project",
          "ipfs://QmTest123",
          0,
          ethers.parseUnits("1", 6)
        )
      ).to.be.revertedWith("Funding goal must be > 0");
    });

    it("Should fail with zero bond price", async function () {
      const { registry, sponsor } = await loadFixture(deployFixture);

      await expect(
        registry.connect(sponsor).registerProject(
          "Test Project",
          "ipfs://QmTest123",
          ethers.parseUnits("10000", 6),
          0
        )
      ).to.be.revertedWith("Bond price must be > 0");
    });

    it("Should generate unique project IDs", async function () {
      const { registry, sponsor, user1 } = await loadFixture(deployFixture);

      const tx1 = await registry.connect(sponsor).registerProject(
        "Project A",
        "ipfs://QmTestA",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const tx2 = await registry.connect(user1).registerProject(
        "Project B",
        "ipfs://QmTestB",
        ethers.parseUnits("20000", 6),
        ethers.parseUnits("2", 6)
      );

      const allProjects = await registry.getAllProjects();
      expect(allProjects.length).to.equal(2);
      expect(allProjects[0].id).to.not.equal(allProjects[1].id);
    });
  });

  describe("Project Retrieval", function () {
    it("Should get project by ID", async function () {
      const { registry, sponsor } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Water Well Kenya",
        "ipfs://QmTest123",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const project = await registry.getProject(allProjects[0].id);

      expect(project.metadataURI).to.equal("ipfs://QmTest123");
      expect(project.sponsor).to.equal(sponsor.address);
      expect(project.fundingGoal).to.equal(ethers.parseUnits("10000", 6));
      expect(project.status).to.equal(0); // Pending
    });

    it("Should fail for non-existent project", async function () {
      const { registry } = await loadFixture(deployFixture);

      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(registry.getProject(fakeId)).to.be.revertedWith(
        "Project not found"
      );
    });

    it("Should return all projects", async function () {
      const { registry, sponsor, user1 } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Project 1",
        "ipfs://Qm1",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      await registry.connect(user1).registerProject(
        "Project 2",
        "ipfs://Qm2",
        ethers.parseUnits("20000", 6),
        ethers.parseUnits("2", 6)
      );

      const allProjects = await registry.getAllProjects();
      expect(allProjects.length).to.equal(2);
    });

    it("Should return correct project count", async function () {
      const { registry, sponsor } = await loadFixture(deployFixture);

      expect(await registry.getProjectCount()).to.equal(0);

      await registry.connect(sponsor).registerProject(
        "Project 1",
        "ipfs://Qm1",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      expect(await registry.getProjectCount()).to.equal(1);
    });
  });

  describe("Status Updates", function () {
    it("Should allow oracle to update status", async function () {
      const { registry, sponsor, oracle } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      // Update to Funding (1)
      await registry.connect(oracle).updateStatus(projectId, 1);

      const project = await registry.getProject(projectId);
      expect(project.status).to.equal(1); // Funding
    });

    it("Should reject status update from non-oracle", async function () {
      const { registry, sponsor, user1 } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      await expect(
        registry.connect(user1).updateStatus(projectId, 1)
      ).to.be.revertedWith("Only oracle");
    });

    it("Should emit event on status update", async function () {
      const { registry, sponsor, oracle } = await loadFixture(deployFixture);

      await registry.connect(sponsor).registerProject(
        "Test Project",
        "ipfs://QmTest",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();
      const projectId = allProjects[0].id;

      await expect(registry.connect(oracle).updateStatus(projectId, 2))
        .to.emit(registry, "ProjectStatusUpdated")
        .withArgs(projectId, 2);
    });
  });

  describe("Active Projects", function () {
    it("Should return only funding and active projects", async function () {
      const { registry, sponsor, oracle } = await loadFixture(deployFixture);

      // Create 3 projects
      await registry.connect(sponsor).registerProject(
        "Project 1",
        "ipfs://Qm1",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );
      await registry.connect(sponsor).registerProject(
        "Project 2",
        "ipfs://Qm2",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );
      await registry.connect(sponsor).registerProject(
        "Project 3",
        "ipfs://Qm3",
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("1", 6)
      );

      const allProjects = await registry.getAllProjects();

      // Set project 1 to Funding
      await registry.connect(oracle).updateStatus(allProjects[0].id, 1);
      // Set project 2 to Active
      await registry.connect(oracle).updateStatus(allProjects[1].id, 2);
      // Project 3 stays Pending

      const activeProjects = await registry.getActiveProjects();
      expect(activeProjects.length).to.equal(2);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set bond factory", async function () {
      const { registry, owner, user1 } = await loadFixture(deployFixture);

      await registry.connect(owner).setBondFactory(user1.address);
      expect(await registry.bondFactory()).to.equal(user1.address);
    });

    it("Should reject setBondFactory from non-owner", async function () {
      const { registry, user1 } = await loadFixture(deployFixture);

      await expect(
        registry.connect(user1).setBondFactory(user1.address)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to change oracle", async function () {
      const { registry, owner, user1 } = await loadFixture(deployFixture);

      await registry.connect(owner).setOracle(user1.address);
      expect(await registry.oracle()).to.equal(user1.address);
    });
  });
});
