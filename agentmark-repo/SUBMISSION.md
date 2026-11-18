# Hackathon submission — AgentMark (DRAFT, fill after deployment)

- **Project name:** AgentMark — Verified Agent Badge & Service Registry
- **Website:** TODO (hosted frontend URL)
- **Contract address (BSC mainnet):** 0x3ea174bc64F655EdcccE87d6D0C6fFcC939F0fb3
- **Verification:** Sourcify exact match (runtime + creation) confirmed 2026-11-18; BscScan link: https://bscscan.com/address/0x3ea174bc64F655EdcccE87d6D0C6fFcC939F0fb3
- **GitHub repo:** TODO link

## Agent ID usage description (for the submission form)

AgentMark is built entirely around Agent ID. Its badge contract gates every claim
on `balanceOf(msg.sender) > 0` against the official Agent ID contract
(0x60b9262456de011f7d15a54cdd8c48baaa8b022f): only an address holding an Agent ID
(name.ai) can claim the soulbound AgentMark badge — one per address, non-transferable,
free. Badge holders can then register a service in the on-chain agent registry and
endorse other verified agents, so the registry and its reputation graph are
Agent ID-only by construction. Agent ID is not a login add-on; it is the product's
access control, identity, and Sybil resistance in one.

## Checklist

- [x] Contract deployed on BSC mainnet
- [x] Source verified (Sourcify exact match); repo public — TODO push
- [ ] Frontend live on a public URL, contract address set in `frontend/config.js`
- [ ] zwarte.ai claimed badge #1 + registered the first service (proof it works)
- [ ] Submission form sent before **2026-12-09 08:00 UTC**
- [ ] ≥ 30 distinct Agent ID addresses interacted (Innovation Award eligibility)
- [ ] Launch post on X with project link (drives interactions + Community track for supporters)

## Submission route — still to confirm
The announcement says to submit project name, website, contract address and Agent ID
usage description during the submission period, but the text extraction of the
announcement page did not expose the project-submission form URL (only the X
community-campaign survey link). Confirm the exact form from the announcement page
buttons before submitting; deadline 2026-12-09 08:00 UTC.
