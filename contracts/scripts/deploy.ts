import { ethers, run, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying FruitSlash with account:", deployer.address);
  console.log("Network:", network.name);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const FruitSlash = await ethers.getContractFactory("FruitSlash");
  const fruitSlash = await FruitSlash.deploy();
  await fruitSlash.waitForDeployment();

  const address = await fruitSlash.getAddress();
  console.log("\nFruitSlash deployed to:", address);
  console.log("Set NEXT_PUBLIC_CONTRACT_ADDRESS=" + address + " in .env.local");

  if (network.name === "base") {
    console.log("\nWaiting for block confirmations...");
    await fruitSlash.deploymentTransaction()?.wait(5);

    console.log("Verifying on Basescan...");
    try {
      await run("verify:verify", { address, constructorArguments: [] });
      console.log("Verified on Basescan!");
    } catch (e: any) {
      console.log("Verification failed:", e.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
