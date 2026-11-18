const { ethers } = require("hardhat");
async function main() {
  const Mock = await ethers.getContractFactory("MockAgentID");
  const mock = await Mock.deploy();
  const Mark = await ethers.getContractFactory("AgentMark");
  const mark = await Mark.deploy(await mock.getAddress(), "https://agentmark.example/metadata/");
  const receipt = await mark.deploymentTransaction().wait();
  const artifact = await hre.artifacts.readArtifact("AgentMark");
  console.log("deployed bytecode bytes:", (artifact.deployedBytecode.length - 2) / 2);
  console.log("deployment gas used:", receipt.gasUsed.toString());
}
main().catch(e => { console.error(e); process.exitCode = 1; });
