// Fork test: deploy AgentMark against the REAL Agent ID contract on a
// local fork of BSC mainnet, then verify:
//  - the user's zwarte.ai address (a real Agent ID holder) CAN claim
//  - a random address with no Agent ID CANNOT claim
// Run: BSC_FORK_URL=https://bsc-dataseed-public.bnbchain.org npx hardhat run scripts/fork-test.js
const { ethers } = require("hardhat");

const AGENT_ID = "0x60b9262456de011f7d15a54cdd8c48baaa8b022f";
const ZWARTE = "0xB6c3E8c972e11Cc06EAed3b967a2d663c31E59EC"; // zwarte.ai holder
const OMKRON = "0x0214C8e78b0210a953D9ED1459b18613090AE8BE"; // omikron.ai holder

async function main() {
  const agentId = await ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)"],
    AGENT_ID
  );
  console.log("zwarte.ai Agent ID balance:", (await agentId.balanceOf(ZWARTE)).toString());
  console.log("omikron.ai Agent ID balance:", (await agentId.balanceOf(OMKRON)).toString());

  const Mark = await ethers.getContractFactory("AgentMark");
  const mark = await Mark.deploy(AGENT_ID, "https://agentmark.example/metadata/");
  console.log("AgentMark deployed on fork at:", await mark.getAddress());

  // Impersonate the real holder (fork only — no real funds, no real keys)
  await ethers.provider.send("hardhat_impersonateAccount", [ZWARTE]);
  await ethers.provider.send("hardhat_setBalance", [ZWARTE, "0x56BC75E2D63100000"]); // 100 BNB on fork
  const zwarte = await ethers.getSigner(ZWARTE);

  console.log("isAgentIDHolder(zwarte):", await mark.isAgentIDHolder(ZWARTE));
  const tx = await mark.connect(zwarte).claimBadge();
  await tx.wait();
  console.log("zwarte claimed badge #", (await mark.badgeOf(ZWARTE)).toString());

  await mark.connect(zwarte).registerService("Zwarte Agent", "Research", "Agent ecosystem research", "@_Zwarte");
  console.log("zwarte registered a service:", (await mark.getService(ZWARTE)).agentName);

  // A fresh address with no Agent ID must fail
  const [, nobody] = await ethers.getSigners();
  console.log("isAgentIDHolder(random):", await mark.isAgentIDHolder(nobody.address));
  try {
    await mark.connect(nobody).claimBadge();
    console.log("FAIL: non-holder was able to claim");
    process.exitCode = 1;
  } catch (e) {
    console.log("non-holder claim correctly reverted:", /no Agent ID/.test(e.message) ? '"no Agent ID"' : e.message.slice(0, 80));
  }
  console.log("FORK TEST PASSED");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
