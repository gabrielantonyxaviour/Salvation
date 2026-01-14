import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MarketFactory & LMSRMarket", function () {
  // Helper to parse USDC amounts (6 decimals)
  const parseUSDC = (amount: string | number) => ethers.parseUnits(amount.toString(), 6);

  async function deployFixture() {
    const [owner, oracle, trader1, trader2, trader3] = await ethers.getSigners();

    // Deploy MockUSDC with 6 decimals (realistic for production)
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const collateral = await MockUSDC.deploy();

    // Default liquidity parameter in WAD (1e18)
    // This represents the LMSR 'b' parameter - higher = less price impact
    const defaultLiquidity = ethers.parseEther("1000"); // 1000 in WAD scale

    // Deploy MarketFactory
    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    const marketFactory = await MarketFactory.deploy(
      oracle.address,
      await collateral.getAddress(),
      defaultLiquidity
    );

    // Mint collateral to traders (6 decimals USDC)
    await collateral.mint(trader1.address, parseUSDC("1000000")); // 1M USDC
    await collateral.mint(trader2.address, parseUSDC("1000000"));
    await collateral.mint(trader3.address, parseUSDC("1000000"));

    return { marketFactory, usdc: collateral, owner, oracle, trader1, trader2, trader3, defaultLiquidity };
  }

  async function deployWithMarketFixture() {
    const base = await deployFixture();
    const { marketFactory, oracle } = base;

    const projectId = ethers.keccak256(ethers.toUtf8Bytes("project-123"));
    const question = "Will the water well be operational by Q2 2026?";
    const resolutionTime = (await time.latest()) + 86400 * 30; // 30 days from now

    await marketFactory.createMarket(projectId, question, resolutionTime, 0);
    const marketAddress = await marketFactory.getMarket(projectId);
    const market = await ethers.getContractAt("LMSRMarket", marketAddress);

    const yesTokenAddress = await market.yesToken();
    const noTokenAddress = await market.noToken();
    const yesToken = await ethers.getContractAt("OutcomeToken", yesTokenAddress);
    const noToken = await ethers.getContractAt("OutcomeToken", noTokenAddress);

    return { ...base, projectId, market, yesToken, noToken, resolutionTime };
  }

  describe("MarketFactory", function () {
    describe("Deployment", function () {
      it("Should set correct oracle", async function () {
        const { marketFactory, oracle } = await loadFixture(deployFixture);
        expect(await marketFactory.oracle()).to.equal(oracle.address);
      });

      it("Should set correct collateral", async function () {
        const { marketFactory, usdc } = await loadFixture(deployFixture);
        expect(await marketFactory.collateral()).to.equal(await usdc.getAddress());
      });

      it("Should set correct default liquidity", async function () {
        const { marketFactory, defaultLiquidity } = await loadFixture(deployFixture);
        expect(await marketFactory.defaultLiquidity()).to.equal(defaultLiquidity);
      });
    });

    describe("Market Creation", function () {
      it("Should create a new market", async function () {
        const { marketFactory } = await loadFixture(deployFixture);

        const projectId = ethers.keccak256(ethers.toUtf8Bytes("test-project"));
        const question = "Will it succeed?";
        const resolutionTime = (await time.latest()) + 86400;

        await expect(marketFactory.createMarket(projectId, question, resolutionTime, 0))
          .to.emit(marketFactory, "MarketCreated");
      });

      it("Should fail for duplicate market", async function () {
        const { marketFactory } = await loadFixture(deployFixture);

        const projectId = ethers.keccak256(ethers.toUtf8Bytes("test-project"));
        const question = "Will it succeed?";
        const resolutionTime = (await time.latest()) + 86400;

        await marketFactory.createMarket(projectId, question, resolutionTime, 0);

        await expect(marketFactory.createMarket(projectId, question, resolutionTime, 0))
          .to.be.revertedWithCustomError(marketFactory, "MarketAlreadyExists");
      });

      it("Should fail with past resolution time", async function () {
        const { marketFactory } = await loadFixture(deployFixture);

        const projectId = ethers.keccak256(ethers.toUtf8Bytes("test-project"));
        const question = "Will it succeed?";
        const resolutionTime = (await time.latest()) - 1; // Past

        await expect(marketFactory.createMarket(projectId, question, resolutionTime, 0))
          .to.be.revertedWithCustomError(marketFactory, "ResolutionTimeInPast");
      });

      it("Should use custom liquidity when provided", async function () {
        const { marketFactory } = await loadFixture(deployFixture);

        const projectId = ethers.keccak256(ethers.toUtf8Bytes("test-project"));
        const customLiquidity = ethers.parseEther("200");
        const resolutionTime = (await time.latest()) + 86400;

        await marketFactory.createMarket(projectId, "Question?", resolutionTime, customLiquidity);

        const marketAddress = await marketFactory.getMarket(projectId);
        const market = await ethers.getContractAt("LMSRMarket", marketAddress);
        expect(await market.b()).to.equal(customLiquidity);
      });
    });

    describe("Market Retrieval", function () {
      it("Should return market address by project ID", async function () {
        const { marketFactory } = await loadFixture(deployFixture);

        const projectId = ethers.keccak256(ethers.toUtf8Bytes("test-project"));
        const resolutionTime = (await time.latest()) + 86400;

        await marketFactory.createMarket(projectId, "Question?", resolutionTime, 0);

        const marketAddress = await marketFactory.getMarket(projectId);
        expect(marketAddress).to.not.equal(ethers.ZeroAddress);
      });

      it("Should return zero address for non-existent market", async function () {
        const { marketFactory } = await loadFixture(deployFixture);

        const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
        expect(await marketFactory.getMarket(fakeId)).to.equal(ethers.ZeroAddress);
      });

      it("Should track all markets", async function () {
        const { marketFactory } = await loadFixture(deployFixture);

        const resolutionTime = (await time.latest()) + 86400;

        for (let i = 0; i < 3; i++) {
          const projectId = ethers.keccak256(ethers.toUtf8Bytes(`project-${i}`));
          await marketFactory.createMarket(projectId, `Question ${i}?`, resolutionTime, 0);
        }

        expect(await marketFactory.getMarketCount()).to.equal(3);
        const allMarkets = await marketFactory.getAllMarkets();
        expect(allMarkets.length).to.equal(3);
      });
    });

    describe("Admin Functions", function () {
      it("Should allow owner to update oracle", async function () {
        const { marketFactory, owner, trader1 } = await loadFixture(deployFixture);

        await marketFactory.connect(owner).setOracle(trader1.address);
        expect(await marketFactory.oracle()).to.equal(trader1.address);
      });

      it("Should reject zero address oracle", async function () {
        const { marketFactory, owner } = await loadFixture(deployFixture);

        await expect(marketFactory.connect(owner).setOracle(ethers.ZeroAddress))
          .to.be.revertedWithCustomError(marketFactory, "InvalidOracle");
      });

      it("Should allow owner to update default liquidity", async function () {
        const { marketFactory, owner } = await loadFixture(deployFixture);

        const newLiquidity = ethers.parseEther("500");
        await marketFactory.connect(owner).setDefaultLiquidity(newLiquidity);
        expect(await marketFactory.defaultLiquidity()).to.equal(newLiquidity);
      });
    });
  });

  describe("LMSRMarket", function () {
    describe("Initial State", function () {
      it("Should have correct project ID", async function () {
        const { market, projectId } = await loadFixture(deployWithMarketFixture);
        expect(await market.projectId()).to.equal(projectId);
      });

      it("Should have initial prices at 50%", async function () {
        const { market } = await loadFixture(deployWithMarketFixture);

        const yesPrice = await market.getYesPrice();
        const noPrice = await market.getNoPrice();

        // Should be around 0.5e18 (50%)
        expect(yesPrice).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.01"));
        expect(noPrice).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.01"));
      });

      it("Should have zero shares initially", async function () {
        const { market } = await loadFixture(deployWithMarketFixture);
        expect(await market.yesShares()).to.equal(0);
        expect(await market.noShares()).to.equal(0);
      });

      it("Should not be resolved initially", async function () {
        const { market } = await loadFixture(deployWithMarketFixture);
        expect(await market.resolved()).to.equal(false);
      });
    });

    describe("Buying Shares", function () {
      it("Should allow buying YES shares", async function () {
        const { market, usdc, trader1, yesToken } = await loadFixture(deployWithMarketFixture);

        // Use small shares relative to liquidity to avoid overflow
        const shares = ethers.parseEther("0.1");
        const cost = await market.getCostToBuy(true, shares);

        await usdc.connect(trader1).approve(await market.getAddress(), cost);
        await market.connect(trader1).buyYes(shares);

        expect(await yesToken.balanceOf(trader1.address)).to.equal(shares);
        expect(await market.yesShares()).to.equal(shares);
      });

      it("Should allow buying NO shares", async function () {
        const { market, usdc, trader1, noToken } = await loadFixture(deployWithMarketFixture);

        const shares = ethers.parseEther("10");
        const cost = await market.getCostToBuy(false, shares);

        await usdc.connect(trader1).approve(await market.getAddress(), cost);
        await market.connect(trader1).buyNo(shares);

        expect(await noToken.balanceOf(trader1.address)).to.equal(shares);
        expect(await market.noShares()).to.equal(shares);
      });

      it("Should increase YES price when buying YES", async function () {
        const { market, usdc, trader1 } = await loadFixture(deployWithMarketFixture);

        const yesPriceBefore = await market.getYesPrice();

        const shares = ethers.parseEther("50");
        const cost = await market.getCostToBuy(true, shares);
        await usdc.connect(trader1).approve(await market.getAddress(), cost);
        await market.connect(trader1).buyYes(shares);

        const yesPriceAfter = await market.getYesPrice();
        expect(yesPriceAfter).to.be.greaterThan(yesPriceBefore);
      });

      it("Should fail with zero shares", async function () {
        const { market, trader1 } = await loadFixture(deployWithMarketFixture);

        await expect(market.connect(trader1).buyYes(0))
          .to.be.revertedWithCustomError(market, "ZeroShares");
      });

      it("Should emit event on purchase", async function () {
        const { market, usdc, trader1 } = await loadFixture(deployWithMarketFixture);

        const shares = ethers.parseEther("10");
        const cost = await market.getCostToBuy(true, shares);
        await usdc.connect(trader1).approve(await market.getAddress(), cost);

        await expect(market.connect(trader1).buyYes(shares))
          .to.emit(market, "SharesPurchased")
          .withArgs(trader1.address, true, shares, cost);
      });
    });

    describe("Selling Shares", function () {
      it("Should allow selling YES shares", async function () {
        const { market, usdc, trader1, yesToken } = await loadFixture(deployWithMarketFixture);

        // Buy first
        const buyShares = ethers.parseEther("20");
        const buyCost = await market.getCostToBuy(true, buyShares);
        await usdc.connect(trader1).approve(await market.getAddress(), buyCost);
        await market.connect(trader1).buyYes(buyShares);

        // Then sell half
        const sellShares = ethers.parseEther("10");
        const balanceBefore = await usdc.balanceOf(trader1.address);

        await market.connect(trader1).sellYes(sellShares);

        const balanceAfter = await usdc.balanceOf(trader1.address);
        expect(balanceAfter).to.be.greaterThan(balanceBefore);
        expect(await yesToken.balanceOf(trader1.address)).to.equal(buyShares - sellShares);
      });

      it("Should fail if insufficient shares", async function () {
        const { market, trader1 } = await loadFixture(deployWithMarketFixture);

        await expect(market.connect(trader1).sellYes(ethers.parseEther("10")))
          .to.be.revertedWithCustomError(market, "InsufficientShares");
      });

      it("Should fail with zero shares", async function () {
        const { market, trader1 } = await loadFixture(deployWithMarketFixture);

        await expect(market.connect(trader1).sellYes(0))
          .to.be.revertedWithCustomError(market, "ZeroShares");
      });
    });

    describe("Market Resolution", function () {
      it("Should allow oracle to resolve YES", async function () {
        const { market, oracle, resolutionTime } = await loadFixture(deployWithMarketFixture);

        // Move time forward
        await time.increaseTo(resolutionTime + 1);

        await market.connect(oracle).resolve(true);

        expect(await market.resolved()).to.equal(true);
        expect(await market.outcome()).to.equal(true);
      });

      it("Should allow oracle to resolve NO", async function () {
        const { market, oracle, resolutionTime } = await loadFixture(deployWithMarketFixture);

        await time.increaseTo(resolutionTime + 1);
        await market.connect(oracle).resolve(false);

        expect(await market.resolved()).to.equal(true);
        expect(await market.outcome()).to.equal(false);
      });

      it("Should reject resolution from non-oracle", async function () {
        const { market, trader1, resolutionTime } = await loadFixture(deployWithMarketFixture);

        await time.increaseTo(resolutionTime + 1);

        await expect(market.connect(trader1).resolve(true))
          .to.be.revertedWithCustomError(market, "OnlyOracle");
      });

      it("Should reject resolution before time", async function () {
        const { market, oracle } = await loadFixture(deployWithMarketFixture);

        await expect(market.connect(oracle).resolve(true))
          .to.be.revertedWithCustomError(market, "ResolutionTimeNotReached");
      });

      it("Should reject double resolution", async function () {
        const { market, oracle, resolutionTime } = await loadFixture(deployWithMarketFixture);

        await time.increaseTo(resolutionTime + 1);
        await market.connect(oracle).resolve(true);

        await expect(market.connect(oracle).resolve(false))
          .to.be.revertedWithCustomError(market, "MarketAlreadyResolved");
      });

      it("Should emit event on resolution", async function () {
        const { market, oracle, resolutionTime } = await loadFixture(deployWithMarketFixture);

        await time.increaseTo(resolutionTime + 1);

        await expect(market.connect(oracle).resolve(true))
          .to.emit(market, "MarketResolved")
          .withArgs(true, (timestamp: bigint) => timestamp > 0n);
      });
    });

    describe("Claiming Winnings", function () {
      it("Should pay YES holders when YES wins", async function () {
        const { market, usdc, oracle, trader1, trader2, resolutionTime } =
          await loadFixture(deployWithMarketFixture);

        // Buy YES shares (shares in WAD, cost in USDC 6 decimals)
        const shares = ethers.parseEther("10"); // 10 shares in WAD
        const cost = await market.getCostToBuy(true, shares);
        await usdc.connect(trader1).approve(await market.getAddress(), cost);
        await market.connect(trader1).buyYes(shares);

        // Fund the market with additional collateral (to cover payouts)
        // Each share pays out $1, so need 10 USDC (10 * 1e6)
        // Cost was already paid in, so need: payout - cost (in USDC terms)
        const expectedPayout = ethers.parseUnits("10", 6); // 10 USDC for 10 shares
        const additionalFunding = expectedPayout - cost + ethers.parseUnits("1", 6); // Extra buffer
        await usdc.connect(trader2).transfer(await market.getAddress(), additionalFunding);

        // Resolve YES
        await time.increaseTo(resolutionTime + 1);
        await market.connect(oracle).resolve(true);

        // Claim winnings
        const balanceBefore = await usdc.balanceOf(trader1.address);
        await market.connect(trader1).claimWinnings();
        const balanceAfter = await usdc.balanceOf(trader1.address);

        // Should receive 1 USDC per share (10 shares = 10 USDC = 10 * 1e6)
        expect(balanceAfter - balanceBefore).to.equal(expectedPayout);
      });

      it("Should pay NO holders when NO wins", async function () {
        const { market, usdc, oracle, trader1, trader2, resolutionTime } =
          await loadFixture(deployWithMarketFixture);

        // Buy NO shares
        const shares = ethers.parseEther("10");
        const cost = await market.getCostToBuy(false, shares);
        await usdc.connect(trader1).approve(await market.getAddress(), cost);
        await market.connect(trader1).buyNo(shares);

        // Fund the market with additional collateral (to cover payouts)
        const expectedPayout = ethers.parseUnits("10", 6);
        const additionalFunding = expectedPayout - cost + ethers.parseUnits("1", 6);
        await usdc.connect(trader2).transfer(await market.getAddress(), additionalFunding);

        // Resolve NO
        await time.increaseTo(resolutionTime + 1);
        await market.connect(oracle).resolve(false);

        // Claim winnings
        const balanceBefore = await usdc.balanceOf(trader1.address);
        await market.connect(trader1).claimWinnings();
        const balanceAfter = await usdc.balanceOf(trader1.address);

        expect(balanceAfter - balanceBefore).to.equal(expectedPayout);
      });

      it("Should return zero for losing side", async function () {
        const { market, usdc, oracle, trader1, resolutionTime } =
          await loadFixture(deployWithMarketFixture);

        // Buy NO shares
        const shares = ethers.parseEther("10");
        const cost = await market.getCostToBuy(false, shares);
        await usdc.connect(trader1).approve(await market.getAddress(), cost);
        await market.connect(trader1).buyNo(shares);

        // Resolve YES (NO loses)
        await time.increaseTo(resolutionTime + 1);
        await market.connect(oracle).resolve(true);

        // Check claimable (should be 0)
        expect(await market.claimableWinnings(trader1.address)).to.equal(0);
      });

      it("Should fail to claim before resolution", async function () {
        const { market, usdc, trader1 } = await loadFixture(deployWithMarketFixture);

        const shares = ethers.parseEther("10");
        const cost = await market.getCostToBuy(true, shares);
        await usdc.connect(trader1).approve(await market.getAddress(), cost);
        await market.connect(trader1).buyYes(shares);

        await expect(market.connect(trader1).claimWinnings())
          .to.be.revertedWithCustomError(market, "MarketNotResolved");
      });
    });

    describe("Trading Restrictions After Resolution", function () {
      it("Should prevent buying after resolution", async function () {
        const { market, usdc, oracle, trader1, resolutionTime } =
          await loadFixture(deployWithMarketFixture);

        await time.increaseTo(resolutionTime + 1);
        await market.connect(oracle).resolve(true);

        const shares = ethers.parseEther("10");
        await usdc.connect(trader1).approve(await market.getAddress(), ethers.parseEther("100"));

        await expect(market.connect(trader1).buyYes(shares))
          .to.be.revertedWithCustomError(market, "MarketAlreadyResolved");
      });

      it("Should prevent selling after resolution", async function () {
        const { market, usdc, oracle, trader1, resolutionTime } =
          await loadFixture(deployWithMarketFixture);

        // Buy first
        const shares = ethers.parseEther("10");
        const cost = await market.getCostToBuy(true, shares);
        await usdc.connect(trader1).approve(await market.getAddress(), cost);
        await market.connect(trader1).buyYes(shares);

        // Resolve
        await time.increaseTo(resolutionTime + 1);
        await market.connect(oracle).resolve(true);

        // Try to sell
        await expect(market.connect(trader1).sellYes(shares))
          .to.be.revertedWithCustomError(market, "MarketAlreadyResolved");
      });
    });
  });

  describe("OutcomeToken", function () {
    it("Should only allow market to mint", async function () {
      const { yesToken, trader1 } = await loadFixture(deployWithMarketFixture);

      await expect(yesToken.connect(trader1).mint(trader1.address, ethers.parseEther("100")))
        .to.be.revertedWithCustomError(yesToken, "OnlyMarket");
    });

    it("Should only allow market to burn", async function () {
      const { yesToken, trader1 } = await loadFixture(deployWithMarketFixture);

      await expect(yesToken.connect(trader1).burn(trader1.address, ethers.parseEther("100")))
        .to.be.revertedWithCustomError(yesToken, "OnlyMarket");
    });

    it("Should allow free transfer between users", async function () {
      const { market, usdc, trader1, trader2, yesToken } = await loadFixture(deployWithMarketFixture);

      // Buy shares
      const shares = ethers.parseEther("10");
      const cost = await market.getCostToBuy(true, shares);
      await usdc.connect(trader1).approve(await market.getAddress(), cost);
      await market.connect(trader1).buyYes(shares);

      // Transfer to trader2
      await yesToken.connect(trader1).transfer(trader2.address, shares);

      expect(await yesToken.balanceOf(trader1.address)).to.equal(0);
      expect(await yesToken.balanceOf(trader2.address)).to.equal(shares);
    });

    it("Should have 18 decimals", async function () {
      const { yesToken } = await loadFixture(deployWithMarketFixture);
      expect(await yesToken.decimals()).to.equal(18);
    });
  });
});
