const solc = require('solc');
const fs = require('fs');
const RPC = 'https://bsc-rpc.publicnode.com';
async function rpc(m, p) { const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }, body: JSON.stringify({ jsonrpc: '2.0', method: m, params: p, id: 1 }) }); const j = await r.json(); return j.result; }
(async () => {
  const onchain = (await rpc('eth_getCode', ['0x3ea174bc64F655EdcccE87d6D0C6fFcC939F0fb3', 'latest'])).toLowerCase();
  const src = fs.readFileSync('contracts/AgentMark.sol', 'utf8');
  const inst = await new Promise((res, rej) => solc.loadRemoteVersion('v0.8.20+commit.a1b79de6', (e, s) => e ? rej(e) : res(s)));
  for (const evm of [undefined, 'shanghai', 'paris', 'cancun', 'london']) {
    const settings = { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['evm.deployedBytecode'] } } };
    if (evm) settings.evmVersion = evm;
    const input = { language: 'Solidity', sources: { 'AgentMark.sol': { content: src } }, settings };
    const out = JSON.parse(inst.compile(JSON.stringify(input)));
    if (out.errors && out.errors.some(e => e.severity === 'error')) { console.log(evm, 'compile error'); continue; }
    const bc = ('0x' + out.contracts['AgentMark.sol']['AgentMark'].evm.deployedBytecode.object).toLowerCase();
    let firstDiff = -1;
    const n = Math.min(bc.length, onchain.length);
    for (let i = 0; i < n; i += 2) { if (bc.slice(i, i + 2) !== onchain.slice(i, i + 2)) { firstDiff = i / 2; break; } }
    let diffCount = 0;
    for (let i = 0; i < n; i += 2) { if (bc.slice(i, i + 2) !== onchain.slice(i, i + 2)) diffCount++; }
    console.log('evmVersion', evm || 'default', 'bytes', (bc.length - 2) / 2, 'firstDiffByte', firstDiff, 'diffBytes', diffCount);
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
