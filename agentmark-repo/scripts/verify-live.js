const fs = require('fs');
const RPC = 'https://bsc-rpc.publicnode.com';
async function rpc(method, params) {
  const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }, body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }) });
  const j = await r.json();
  if (j.error) throw new Error(method + ': ' + JSON.stringify(j.error));
  return j.result;
}
const sel = s => require('ethers').id(s).slice(0, 10);
async function call(addr, sig, argsHex = '') {
  return rpc('eth_call', [{ to: addr, data: sel(sig) + argsHex }, 'latest']);
}
(async () => {
  const ADDR = '0x3ea174bc64F655EdcccE87d6D0C6fFcC939F0fb3';
  const code = await rpc('eth_getCode', [ADDR, 'latest']);
  console.log('code bytes:', (code.length - 2) / 2);
  const artifact = JSON.parse(fs.readFileSync('artifacts/contracts/AgentMark.sol/AgentMark.json', 'utf8'));
  const strip = h => h.toLowerCase().slice(0, -106);
  console.log('bytecode match (ignoring metadata):', strip(code) === strip(artifact.deployedBytecode));
  const { ethers } = require('ethers');
  const dec = (t, hex) => ethers.AbiCoder.defaultAbiCoder().decode([t], hex)[0];
  console.log('name:', dec('string', await call(ADDR, 'name()')));
  console.log('symbol:', dec('string', await call(ADDR, 'symbol()')));
  console.log('agentID:', dec('address', await call(ADDR, 'agentID()')));
  console.log('owner:', dec('address', await call(ADDR, 'owner()')));
  console.log('totalClaimed:', dec('uint256', await call(ADDR, 'totalClaimed()')).toString());
  const pad = a => '000000000000000000000000' + a.slice(2).toLowerCase();
  console.log('isAgentIDHolder(zwarte):', dec('bool', await call(ADDR, 'isAgentIDHolder(address)', pad('0xB6c3E8c972e11Cc06EAed3b967a2d663c31E59EC'))));
  console.log('claimBadge selector:', sel('claimBadge()'));
})().catch(e => { console.error(e.message); process.exitCode = 1; });
