import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying FruitSlash with account:", deployer.address);
  console.log("Balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const FruitSlash = await ethers.getContractFactory("FruitSlash");
  const fruitSlash = await FruitSlash.deploy();
  await fruitSlash.waitForDeployment();

  const address = await fruitSlash.getAddress();
  console.log("FruitSlash deployed to:", address);
  console.log("Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local with:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
