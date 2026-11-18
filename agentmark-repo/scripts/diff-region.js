const solc = require('solc');
const fs = require('fs');
const RPC = 'https://bsc-rpc.publicnode.com';
async function rpc(m, p) { const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }, body: JSON.stringify({ jsonrpc: '2.0', method: m, params: p, id: 1 }) }); const j = await r.json(); return j.result; }
(async () => {
  const onchain = (await rpc('eth_getCode', ['0x3ea174bc64F655EdcccE87d6D0C6fFcC939F0fb3', 'latest'])).toLowerCase();
  const src = fs.readFileSync('contracts/AgentMark.sol', 'utf8');
  const inst = await new Promise((res, rej) => solc.loadRemoteVersion('v0.8.20+commit.a1b79de6', (e, s) => e ? rej(e) : res(s)));
  const input = { language: 'Solidity', sources: { 'AgentMark.sol': { content: src } }, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['evm.deployedBytecode'] } } } };
  const out = JSON.parse(inst.compile(JSON.stringify(input)));
  const bc = ('0x' + out.contracts['AgentMark.sol']['AgentMark'].evm.deployedBytecode.object).toLowerCase();
  const hex = h => h.slice(2);
  const a = hex(onchain), b = hex(bc);
  let ranges = [];
  let start = null;
  for (let i = 0; i < Math.min(a.length, b.length); i += 2) {
    const diff = a.slice(i, i + 2) !== b.slice(i, i + 2);
    if (diff && start === null) start = i / 2;
    if (!diff && start !== null) { ranges.push([start, i / 2]); start = null; }
  }
  if (start !== null) ranges.push([start, Math.min(a.length, b.length) / 2]);
  console.log('diff ranges (bytes):', JSON.stringify(ranges));
  for (const [s, e] of ranges.slice(0, 4)) {
    console.log(`range ${s}-${e}`);
    console.log(' onchain:', a.slice(s * 2, e * 2));
    console.log(' local  :', b.slice(s * 2, e * 2));
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
