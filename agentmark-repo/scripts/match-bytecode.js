const solc = require('solc');
const fs = require('fs');
const RPC = 'https://bsc-rpc.publicnode.com';
async function rpc(m, p) { const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }, body: JSON.stringify({ jsonrpc: '2.0', method: m, params: p, id: 1 }) }); const j = await r.json(); return j.result; }
(async () => {
  const onchain = (await rpc('eth_getCode', ['0x3ea174bc64F655EdcccE87d6D0C6fFcC939F0fb3', 'latest'])).toLowerCase();
  const src = fs.readFileSync('contracts/AgentMark.sol', 'utf8');
  const strip = h => h.slice(0, -106);
  for (const opt of [null, { enabled: false }, { enabled: true, runs: 200 }, { enabled: true, runs: 1000 }, { enabled: true, runs: 10000 }, { enabled: true, runs: 1 }]) {
    const input = { language: 'Solidity', sources: { 'AgentMark.sol': { content: src } }, settings: { outputSelection: { '*': { '*': ['evm.deployedBytecode'] } }, ...(opt ? { optimizer: opt } : {}) } };
    const out = JSON.parse(solc.compile(JSON.stringify(input)));
    if (out.errors && out.errors.some(e => e.severity === 'error')) { console.log('compile error', opt); continue; }
    const bc = '0x' + out.contracts['AgentMark.sol']['AgentMark'].evm.deployedBytecode.object;
    console.log(JSON.stringify(opt), 'bytes:', (bc.length - 2) / 2, 'match:', strip(bc) === strip(onchain));
  }
  console.log('solc version:', solc.version());
})().catch(e => { console.error(e.message); process.exitCode = 1; });
