import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Starting deployment of BlotChainSnapshot...");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contract with account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} MATIC`);

  // Config parameters:
  // - initialOwner: deployer address
  // - royaltyReceiver: deployer address
  // - royaltyFeeNumerator: 500 (representing 5% as 500 / 10000 basis points)
  const royaltyFeeNumerator = 500n;

  const BlotChainSnapshotFactory = await ethers.getContractFactory("BlotChainSnapshot");
  const blotChainSnapshot = await BlotChainSnapshotFactory.deploy(
    deployer.address,
    deployer.address,
    royaltyFeeNumerator
  );

  console.log("Waiting for deployment transaction to be mined...");
  await blotChainSnapshot.waitForDeployment();

  const deployedAddress = await blotChainSnapshot.getAddress();
  console.log(`BlotChainSnapshot successfully deployed to: ${deployedAddress}`);

  // Fetch the ABI from the compiled artifact
  const artifactPath = path.join(__dirname, "../artifacts/contracts/BlotChainSnapshot.sol/BlotChainSnapshot.json");
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found at ${artifactPath}. Please run pnpm compile first.`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  // Prepare config data
  const configData = {
    address: deployedAddress,
    abi: abi
  };

  // Ensure shared directory exists
  const sharedDir = path.join(__dirname, "../../shared");
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }

  const configPath = path.join(sharedDir, "contract-config.json");
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), "utf8");
  console.log(`Successfully saved deployed address and ABI to ${configPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
