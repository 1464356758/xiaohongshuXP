import test from 'node:test';
import assert from 'node:assert/strict';
process.env.XP_NO_LISTEN='1';
process.env.GITHUB_TOKEN='test-token-not-real';
process.env.ADMIN_PASSWORD='strong-admin-password';
process.env.SESSION_SECRET='this-is-a-long-static-key-for-unit-tests-0123';
const {server}=await import('../server.mjs');
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
test.after(async()=>{await new Promise(resolve=>server.close(resolve));});
test('health and shell accessible while data API requires login',async()=>{
 let r=await fetch(base+'/health');assert.equal(r.status,200);assert.equal((await r.json()).status,'ok');
 r=await fetch(base+'/');assert.equal(r.status,200);assert.match(await r.text(),/XP Studio/);
 r=await fetch(base+'/visual-direction.js');assert.equal(r.status,200);assert.match(await r.text(),/SHOT_PROFILES/);
 r=await fetch(base+'/api/config');assert.equal(r.status,401);
});
test('login, cookie-based session and origin protection',async()=>{
 let r=await fetch(base+'/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:'wrong'})});
 assert.equal(r.status,401);
 r=await fetch(base+'/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:'strong-admin-password'})});
 assert.equal(r.status,200);
 const cookie=r.headers.get('set-cookie').split(';')[0];assert.ok(cookie.includes('xp_session='));
 r=await fetch(base+'/api/config',{headers:{cookie}});assert.equal(r.status,200);
 assert.deepEqual((await r.json()).repos,['1464356758/xiaohongshuXP']);
 r=await fetch(base+'/api/logout',{method:'POST',headers:{cookie,origin:'https://evil.example'}});
 assert.equal(r.status,403);
});
