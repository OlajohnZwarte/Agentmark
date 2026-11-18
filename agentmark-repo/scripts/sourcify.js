const solc = require('solc');
const fs = require('fs');
(async () => {
  const src = fs.readFileSync('contracts/AgentMark.sol', 'utf8');
  const inst = await new Promise((res, rej) => solc.loadRemoteVersion('v0.8.20+commit.a1b79de6', (e, s) => e ? rej(e) : res(s)));
  const input = { language: 'Solidity', sources: { 'AgentMark.sol': { content: src } }, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['metadata'] } } } };
  const out = JSON.parse(inst.compile(JSON.stringify(input)));
  const metadata = out.contracts['AgentMark.sol']['AgentMark'].metadata;
  fs.writeFileSync('metadata.json', metadata);
  const body = { address: '0x3ea174bc64F655EdcccE87d6D0C6fFcC939F0fb3', chain: '56', files: { 'metadata.json': metadata, 'AgentMark.sol': src } };
  const r = await fetch('https://sourcify.dev/server/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  console.log('status:', r.status);
  console.log((await r.text()).slice(0, 600));
})().catch(e => { console.error(e.message); process.exitCode = 1; });
