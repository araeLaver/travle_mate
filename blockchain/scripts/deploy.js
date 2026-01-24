const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Fryndo NFT Contract Deployment");
  console.log("========================================");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer address:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "MATIC");

  if (balance === 0n) {
    console.error("\nError: Deployer has no MATIC balance!");
    process.exit(1);
  }

  // Contract parameters
  const name = "Fryndo Collectibles";
  const symbol = "TMCOL";
  const adminAddress = deployer.address;
  const minterAddress = process.env.MINTER_ADDRESS || deployer.address;

  console.log("\nContract Parameters:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Admin:", adminAddress);
  console.log("- Minter:", minterAddress);

  // Deploy contract
  console.log("\nDeploying contract...");
  const TravelMateNFT = await ethers.getContractFactory("TravelMateNFT");
  const nft = await TravelMateNFT.deploy(name, symbol, adminAddress, minterAddress);

  await nft.waitForDeployment();
  const contractAddress = await nft.getAddress();

  console.log("\n========================================");
  console.log("Deployment Successful!");
  console.log("========================================");
  console.log("Contract Address:", contractAddress);
  console.log("\nTransaction Hash:", nft.deploymentTransaction().hash);

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("\nNetwork:", network.name);
  console.log("Chain ID:", network.chainId.toString());

  // Explorer URL
  let explorerUrl = "";
  if (network.chainId === 137n) {
    explorerUrl = `https://polygonscan.com/address/${contractAddress}`;
  } else if (network.chainId === 80002n) {
    explorerUrl = `https://amoy.polygonscan.com/address/${contractAddress}`;
  }
  if (explorerUrl) {
    console.log("\nExplorer URL:", explorerUrl);
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    contractName: "TravelMateNFT",
    name: name,
    symbol: symbol,
    adminAddress: adminAddress,
    minterAddress: minterAddress,
    deployedAt: new Date().toISOString(),
    transactionHash: nft.deploymentTransaction().hash,
    explorerUrl: explorerUrl,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${network.chainId}-${contractAddress.slice(0, 8)}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\nDeployment info saved to:", filepath);

  // Also update latest deployment file
  const latestPath = path.join(deploymentsDir, `latest-${network.chainId}.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n========================================");
  console.log("Next Steps:");
  console.log("========================================");
  console.log("1. Verify contract on explorer:");
  console.log(`   npx hardhat verify --network ${network.name === "unknown" ? "amoy" : network.name} ${contractAddress} "${name}" "${symbol}" "${adminAddress}" "${minterAddress}"`);
  console.log("\n2. Update backend configuration:");
  console.log(`   NFT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n3. Grant minter role to backend wallet if different from deployer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
