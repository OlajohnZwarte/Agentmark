const fs = require('fs');
(async () => {
  const src = fs.readFileSync('contracts/AgentMark.sol', 'utf8');
  const stdJsonInput = { language: 'Solidity', sources: { 'AgentMark.sol': { content: src } }, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['*'] } } } };
  const body = { stdJsonInput, compilerVersion: '0.8.20+commit.a1b79de6', contractIdentifier: 'AgentMark.sol:AgentMark' };
  const r = await fetch('https://sourcify.dev/server/v2/verify/56/0x3ea174bc64F655EdcccE87d6D0C6fFcC939F0fb3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  console.log('status:', r.status);
  const t = await r.text();
  console.log(t.slice(0, 800));
  try { const j = JSON.parse(t); if (j.verificationId) fs.writeFileSync('scripts/sourcify-verification-id.txt', j.verificationId); } catch {}
})().catch(e => { console.error(e.message); process.exitCode = 1; });
