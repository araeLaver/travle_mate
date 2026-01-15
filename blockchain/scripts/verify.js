const { run, ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("TravelMate NFT Contract Verification");
  console.log("========================================");

  // Get network
  const network = await ethers.provider.getNetwork();
  console.log("\nNetwork:", network.name);
  console.log("Chain ID:", network.chainId.toString());

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestPath = path.join(deploymentsDir, `latest-${network.chainId}.json`);

  if (!fs.existsSync(latestPath)) {
    console.error("\nError: No deployment found for this network!");
    console.error("Please deploy the contract first using: npm run deploy:amoy");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(latestPath, "utf8"));
  console.log("\nLoaded deployment info:");
  console.log("- Contract Address:", deployment.contractAddress);
  console.log("- Deployed At:", deployment.deployedAt);

  // Verify contract
  console.log("\nVerifying contract on explorer...");

  try {
    await run("verify:verify", {
      address: deployment.contractAddress,
      constructorArguments: [
        deployment.name,
        deployment.symbol,
        deployment.adminAddress,
        deployment.minterAddress,
      ],
    });

    console.log("\n========================================");
    console.log("Verification Successful!");
    console.log("========================================");
    console.log("\nExplorer URL:", deployment.explorerUrl);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\nContract is already verified!");
      console.log("Explorer URL:", deployment.explorerUrl);
    } else {
      console.error("\nVerification failed:", error.message);
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
