const solc = require('solc');
const fs = require('fs');
const RPC = 'https://bsc-rpc.publicnode.com';
async function rpc(m, p) { const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }, body: JSON.stringify({ jsonrpc: '2.0', method: m, params: p, id: 1 }) }); const j = await r.json(); return j.result; }
const strip = h => h.slice(0, -106);
function compileWith(solcInst, src, runs) {
  const input = { language: 'Solidity', sources: { 'AgentMark.sol': { content: src } }, settings: { optimizer: { enabled: true, runs }, outputSelection: { '*': { '*': ['evm.deployedBytecode'] } } } };
  const out = JSON.parse(solcInst.compile(JSON.stringify(input)));
  if (out.errors && out.errors.some(e => e.severity === 'error')) return null;
  return '0x' + out.contracts['AgentMark.sol']['AgentMark'].evm.deployedBytecode.object;
}
(async () => {
  const onchain = (await rpc('eth_getCode', ['0x3ea174bc64F655EdcccE87d6D0C6fFcC939F0fb3', 'latest'])).toLowerCase();
  const src = fs.readFileSync('contracts/AgentMark.sol', 'utf8');
  const versions = ['v0.8.20+commit.a1b79de6', 'v0.8.22+commit.4fc1097e', 'v0.8.24+commit.e11b9ed9', 'v0.8.25+commit.b61c2a91', 'v0.8.26+commit.8a97fa7a', 'v0.8.27+commit.40a35a09', 'v0.8.28+commit.7893614a', 'v0.8.30+commit.73712a01'];
  for (const v of versions) {
    const inst = await new Promise((res, rej) => solc.loadRemoteVersion(v, (e, s) => e ? rej(e) : res(s)));
    for (const runs of [200, 1000]) {
      const bc = compileWith(inst, src, runs);
      if (bc) console.log(v, 'runs', runs, 'bytes', (bc.length - 2) / 2, 'MATCH:', strip(bc) === strip(onchain));
    }
  }
  console.log('done');
})().catch(e => { console.error(e.message); process.exitCode = 1; });
