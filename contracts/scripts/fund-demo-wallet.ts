import { ethers } from "hardhat";
import { parseUnits } from "ethers";

/**
 * Fund Demo Wallet Script
 * Use this script to prepare a wallet for demo video recording.
 *
 * Prerequisites:
 * - Contracts must be deployed
 * - Set DEMO_WALLET_PRIVATE_KEY in .env or use deployer
 *
 * This script will:
 * 1. Mint 10,000 mock USDC to the demo wallet
 * 2. Pre-purchase bonds in 2 projects (requires projects to be seeded first)
 * 3. Pre-buy YES positions in 2 markets
 */

async function main() {
  console.log("=".repeat(60));
  console.log("Salvation Demo Wallet Funding Script");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();

  // Demo wallet - use a specific wallet or the deployer
  const demoWalletAddress = process.env.DEMO_WALLET_ADDRESS || deployer.address;

  console.log(`\nDeployer: ${deployer.address}`);
  console.log(`Demo Wallet: ${demoWalletAddress}`);

  // Get deployed contract addresses from environment
  const ADDRESSES = {
    usdc: process.env.USDC_ADDRESS || "",
    projectRegistry: process.env.PROJECT_REGISTRY_ADDRESS || "",
    bondFactory: process.env.BOND_FACTORY_ADDRESS || "",
    marketFactory: process.env.MARKET_FACTORY_ADDRESS || "",
  };

  // Validate USDC address at minimum
  if (!ADDRESSES.usdc || ADDRESSES.usdc === ethers.ZeroAddress) {
    console.error("\nError: USDC_ADDRESS not set");
    console.log("Please deploy contracts first using: npx hardhat run scripts/deploy.ts --network mantleSepolia");
    process.exit(1);
  }

  // Get MockUSDC contract
  const mockUSDC = await ethers.getContractAt("MockUSDC", ADDRESSES.usdc);

  console.log("\n" + "-".repeat(60));
  console.log("Step 1: Mint USDC to Demo Wallet");
  console.log("-".repeat(60));

  // Check current balance
  const currentBalance = await mockUSDC.balanceOf(demoWalletAddress);
  console.log(`Current Balance: ${ethers.formatUnits(currentBalance, 6)} USDC`);

  // Mint 10,000 USDC
  const mintAmount = parseUnits("10000", 6);
  console.log(`\nMinting ${ethers.formatUnits(mintAmount, 6)} USDC...`);

  try {
    // If demo wallet is different from deployer, use mint function (owner only)
    // If using the wallet itself, use faucet
    if (demoWalletAddress === deployer.address) {
      // Use faucet function
      const tx = await mockUSDC.faucet();
      await tx.wait();
      console.log("Faucet successful!");
    } else {
      // Use mint function (requires owner)
      const tx = await mockUSDC.mint(demoWalletAddress, mintAmount);
      await tx.wait();
      console.log("Mint successful!");
    }

    const newBalance = await mockUSDC.balanceOf(demoWalletAddress);
    console.log(`New Balance: ${ethers.formatUnits(newBalance, 6)} USDC`);
  } catch (error: any) {
    console.error(`Failed to mint: ${error.message}`);
  }

  // Optional: Pre-purchase bonds and market positions if contracts are deployed
  if (ADDRESSES.bondFactory && ADDRESSES.bondFactory !== ethers.ZeroAddress) {
    console.log("\n" + "-".repeat(60));
    console.log("Step 2: Pre-purchase Bonds (Optional)");
    console.log("-".repeat(60));

    // Get project IDs from environment or skip
    const projectId1 = process.env.DEMO_PROJECT_1_ID;
    const projectId2 = process.env.DEMO_PROJECT_2_ID;

    if (projectId1 && projectId2) {
      try {
        const bondFactory = await ethers.getContractAt("IBondFactory", ADDRESSES.bondFactory);

        // Approve and purchase bonds
        const bondAmount = parseUnits("500", 6); // $500 in bonds

        // Project 1
        console.log(`\nPurchasing $500 bonds in Project 1...`);
        await (await mockUSDC.approve(ADDRESSES.bondFactory, bondAmount)).wait();
        await (await bondFactory.purchaseBonds(projectId1, bondAmount)).wait();
        console.log("Done!");

        // Project 2
        console.log(`Purchasing $500 bonds in Project 2...`);
        await (await mockUSDC.approve(ADDRESSES.bondFactory, bondAmount)).wait();
        await (await bondFactory.purchaseBonds(projectId2, bondAmount)).wait();
        console.log("Done!");
      } catch (error: any) {
        console.log(`Skipping bond purchases: ${error.message}`);
      }
    } else {
      console.log("Skipping - Set DEMO_PROJECT_1_ID and DEMO_PROJECT_2_ID to pre-purchase bonds");
    }
  }

  if (ADDRESSES.marketFactory && ADDRESSES.marketFactory !== ethers.ZeroAddress) {
    console.log("\n" + "-".repeat(60));
    console.log("Step 3: Pre-buy Market Positions (Optional)");
    console.log("-".repeat(60));

    const projectId1 = process.env.DEMO_PROJECT_1_ID;
    const projectId2 = process.env.DEMO_PROJECT_2_ID;

    if (projectId1 && projectId2) {
      try {
        const marketFactory = await ethers.getContractAt("MarketFactory", ADDRESSES.marketFactory);

        // Get market addresses
        const market1Address = await marketFactory.getMarket(projectId1);
        const market2Address = await marketFactory.getMarket(projectId2);

        if (market1Address !== ethers.ZeroAddress && market2Address !== ethers.ZeroAddress) {
          const market1 = await ethers.getContractAt("LMSRMarket", market1Address);
          const market2 = await ethers.getContractAt("LMSRMarket", market2Address);

          const tradeAmount = parseUnits("100", 6); // $100 in YES tokens

          // Buy YES in Market 1
          console.log(`\nBuying $100 YES in Market 1...`);
          await (await mockUSDC.approve(market1Address, tradeAmount)).wait();
          await (await market1.buyYes(tradeAmount)).wait();
          console.log("Done!");

          // Buy YES in Market 2
          console.log(`Buying $100 YES in Market 2...`);
          await (await mockUSDC.approve(market2Address, tradeAmount)).wait();
          await (await market2.buyYes(tradeAmount)).wait();
          console.log("Done!");
        }
      } catch (error: any) {
        console.log(`Skipping market trades: ${error.message}`);
      }
    } else {
      console.log("Skipping - Set DEMO_PROJECT_1_ID and DEMO_PROJECT_2_ID to pre-buy positions");
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Demo Wallet Funding Complete!");
  console.log("=".repeat(60));

  // Final balance
  const finalBalance = await mockUSDC.balanceOf(demoWalletAddress);
  console.log(`\nFinal USDC Balance: ${ethers.formatUnits(finalBalance, 6)} USDC`);

  console.log("\nNext steps:");
  console.log("  1. Import demo wallet into MetaMask or Privy");
  console.log("  2. Fund with testnet MNT from faucet.sepolia.mantle.xyz");
  console.log("  3. Start frontend and record demo");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
