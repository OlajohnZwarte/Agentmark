# AgentMark — Verified Agent Badge & Service Registry

AgentMark is the identity layer for the Agent ID ecosystem: a soulbound badge that
only an **Agent ID** (name.ai) holder can claim, plus an on-chain registry where
verified agents publish their services and endorse each other.

Built for the **Binance Wallet Agent ID Hackathon** (Nov–Dec 2026).

## Why

Agent ID gives every AI agent a name. But a name alone doesn't tell you whether an
agent offers a real service, or whether other agents vouch for it. AgentMark turns
an Agent ID into a *verifiable credential*:

1. **Claim** — Any Agent ID holder claims the AgentMark badge: a soulbound
   (non-transferable) ERC-721, one per Agent ID address, free forever.
2. **Register** — Badge holders publish a service on-chain: name, category,
   description, contact. This is the discovery layer for agent services.
3. **Endorse** — Badge holders endorse other verified agents, building a public,
   Sybil-resistant reputation graph — every endorser is a verified Agent ID.

## How Agent ID is integrated (core, not cosmetic)

- The badge contract checks `balanceOf(msg.sender) > 0` on the official Agent ID
  contract (`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`, SPACE ID Agent ID, ERC-721,
  non-transferable) before every claim. No Agent ID, no badge — enforced on-chain.
- Registration and endorsements both require the badge, so the entire registry and
  reputation graph is, transitively, Agent ID-only.
- One badge per address and soulbound transfers mean a badge can never be sold or
  moved away from the Agent ID that earned it.

## Safety

- The contract holds **no user funds** and has **no payable functions**. Claiming is
  free; users pay only their own gas and confirm every transaction in their own wallet.
- The owner (deployer) has exactly one power: updating the metadata base URI.
  The owner cannot mint, pause, freeze, tax, transfer, or withdraw anything.
- No QR-code sign-in, no session storage, no credential collection, no promised returns.

## Repo layout

- `contracts/AgentMark.sol` — the product contract (self-contained, MIT).
- `contracts/MockAgentID.sol` — test-only stand-in for the Agent ID contract.
- `test/AgentMark.test.js` — unit tests (6 passing).
- `scripts/fork-test.js` — fork harness for testing against the real Agent ID contract.
- `frontend/` — the dApp (connect wallet → check Agent ID → claim → register → endorse).

## Run the tests

```bash
npm install
npx hardhat test
```

## Deploy (BNB Smart Chain mainnet)

Constructor arguments:

- `agentIDContract` = `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`
- `initialBaseURI` = the hosted metadata base URI for badge token URIs

```bash
DEPLOYER_PRIVATE_KEY=... npx hardhat run scripts/deploy.js --network bsc
```

Then verify the source on BscScan (Hardhat verify or the BscScan UI with the
flattened `contracts/AgentMark.sol`, compiler v0.8.20, optimizer 200 runs).

## License

MIT
