// Deploy AgentMark to the selected network.
// Usage: DEPLOYER_PRIVATE_KEY=... npx hardhat run scripts/deploy.js --network bsc
const { ethers } = require("hardhat");

const AGENT_ID_MAINNET = "0x60b9262456de011f7d15a54cdd8c48baaa8b022f";
const BASE_URI = process.env.BASE_URI || ""; // set after hosting is live; owner can update via setBaseURI

async function main() {
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  console.log("network chainId:", net.chainId.toString());
  console.log("deployer:", deployer.address);
  console.log("balance (BNB):", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const Mark = await ethers.getContractFactory("AgentMark");
  const mark = await Mark.deploy(AGENT_ID_MAINNET, BASE_URI);
  await mark.waitForDeployment();
  const address = await mark.getAddress();
  const receipt = await mark.deploymentTransaction().wait();
  console.log("AgentMark deployed:", address);
  console.log("deployment gas used:", receipt.gasUsed.toString());
  console.log("constructor args:", AGENT_ID_MAINNET, BASE_URI);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
