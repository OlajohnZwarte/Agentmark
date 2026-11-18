const assert = require("assert");
const { ethers } = require("hardhat");

async function reverts(promise, needle) {
  try {
    await promise;
  } catch (e) {
    assert.ok(
      (e.message || "").includes(needle),
      `expected revert containing "${needle}", got: ${e.message}`
    );
    return;
  }
  assert.fail(`expected revert containing "${needle}", but the call succeeded`);
}

describe("AgentMark", function () {
  let mock, mark, owner, alice, bob, carol;

  beforeEach(async function () {
    [owner, alice, bob, carol] = await ethers.getSigners();
    const Mock = await ethers.getContractFactory("MockAgentID");
    mock = await Mock.deploy();
    const Mark = await ethers.getContractFactory("AgentMark");
    mark = await Mark.deploy(await mock.getAddress(), "https://agentmark.example/metadata/");
    await mock.setBalance(alice.address, 1);
    await mock.setBalance(bob.address, 1);
  });

  it("reverts claim without an Agent ID", async function () {
    await reverts(mark.connect(carol).claimBadge(), "AgentMark: no Agent ID");
  });

  it("claims a badge for an Agent ID holder, once only", async function () {
    const tx = await mark.connect(alice).claimBadge();
    const receipt = await tx.wait();
    assert.ok(receipt.logs.length >= 1, "BadgeClaimed event expected");
    assert.equal(await mark.badgeOf(alice.address), 1n);
    assert.equal(await mark.balanceOf(alice.address), 1n);
    assert.equal(await mark.ownerOf(1n), alice.address);
    assert.equal(await mark.isVerifiedAgent(alice.address), true);
    await reverts(mark.connect(alice).claimBadge(), "AgentMark: badge already claimed");
  });

  it("badge is soulbound: transfers and approvals revert", async function () {
    await mark.connect(alice).claimBadge();
    await reverts(mark.connect(alice).transferFrom(alice.address, bob.address, 1), "soulbound");
    await reverts(mark.connect(alice).approve(bob.address, 1), "soulbound");
  });

  it("registry requires a badge, then stores the service", async function () {
    await reverts(mark.connect(alice).registerService("A", "Data", "d", "@a"), "claim your badge first");
    await mark.connect(alice).claimBadge();
    await mark.connect(alice).registerService("Alice Agent", "Research", "Deep research agent", "@alice");
    const s = await mark.getService(alice.address);
    assert.equal(s.agentName, "Alice Agent");
    assert.equal(s.registered, true);
    assert.equal(await mark.registeredAgentCount(), 1n);
  });

  it("endorsements: badge-only, no self, once per pair", async function () {
    await mark.connect(alice).claimBadge();
    await mark.connect(bob).claimBadge();
    await reverts(mark.connect(alice).endorse(alice.address), "cannot endorse yourself");
    await mark.connect(alice).endorse(bob.address);
    assert.equal(await mark.endorsementCount(bob.address), 1n);
    await reverts(mark.connect(alice).endorse(bob.address), "already endorsed");
    await reverts(mark.connect(carol).endorse(bob.address), "claim your badge first");
  });

  it("owner can only change baseURI; tokenURI composes", async function () {
    await mark.connect(alice).claimBadge();
    assert.equal(await mark.tokenURI(1n), "https://agentmark.example/metadata/1");
    await reverts(mark.connect(alice).setBaseURI("https://x/"), "not owner");
    await mark.setBaseURI("https://x/");
    assert.equal(await mark.tokenURI(1n), "https://x/1");
  });
});
