import http from 'node:http';
import crypto from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {newProject,applyAction,PAGE_IDS} from './lib/workflow.mjs';

const PORT=Number(process.env.PORT||3000);
const TOKEN=process.env.GITHUB_TOKEN||'';
const PASSWORD=process.env.ADMIN_PASSWORD||'';
const SECRET=process.env.SESSION_SECRET||'';
const REPOS=(process.env.GITHUB_REPOS||process.env.GITHUB_REPO||'1464356758/xiaohongshuXP').split(',').map(x=>x.trim()).filter(x=>/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(x));
if(!TOKEN||!PASSWORD||!SECRET||SECRET.length<24) {
  console.error('启动需要设置 GITHUB_TOKEN、ADMIN_PASSWORD 和长度至少24字符的 SESSION_SECRET');
  process.exit(1);
}
if(!REPOS.length) {console.error('GITHUB_REPOS 格式错误');process.exit(1);}
const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
const error=(message,status=400)=>Object.assign(new Error(message),{status});
const json=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));};
function cookie(req,name){return(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';}
function signature(value){return crypto.createHmac('sha256',SECRET).update(value).digest('base64url');}
function sessionOk(req) {
  const str=cookie(req,'xp_session'), idx=str.lastIndexOf('.');
  if(idx<1)return false;
  const exp=str.slice(0,idx),sig=str.slice(idx+1);
  if(!/^\d+$/.test(exp)||Number(exp)<Date.now())return false;
  const actual=Buffer.from(sig), expected=Buffer.from(signature(exp));
  return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
}
function pwOk(raw) {
  const a=crypto.createHmac('sha256',SECRET).update(String(raw||'')).digest();
  const b=crypto.createHmac('sha256',SECRET).update(PASSWORD).digest();
  return crypto.timingSafeEqual(a,b);
}
async function body(req,limit=7_000_000) {
  const chunks=[];let length=0;
  for await(const c of req){length+=c.length;if(length>limit)throw error('请求体过大',413);chunks.push(c);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{throw error('JSON格式无效');}
}
const ghUrl=(repo,p)=>'https://api.github.com/repos/'+repo+'/contents/'+p.split('/').map(encodeURIComponent).join('/');
async function github(method,repo,asset,data) {
  const headers={authorization:'Bearer '+TOKEN,accept:'application/vnd.github+json',
    'x-github-api-version':'2022-11-28','user-agent':'XHS-XP-Studio/0.1'};
  if(data!==undefined) headers['content-type']='application/json';
  let response;
  try{response=await fetch(ghUrl(repo,asset),{method,headers,...(data!==undefined?{body:JSON.stringify(data)}:{})});}
  catch{throw error('GitHub网络连接失败，请检查服务部署网络',503);}
  if(!response.ok){
    if(response.status===404)return {missing:true};
    if(response.status===409||response.status===422)throw error('GitHub版本发生冲突，请刷新后重试',409);
    if(response.status===403||response.status===429)throw error('GitHub限流或写入权限不足',503);
    if(response.status===401)throw error('GitHub访问令牌无效',503);
    throw error('GitHub API请求失败 '+response.status,502);
  }
  return response.json();
}
const safeRepo=value=>{const v=String(value||REPOS[0]);if(!REPOS.includes(v))throw error('未授权的仓库',403);return v;};
const location=id=>'data/projects/'+id+'/project.json';
function validId(id){if(!/^[a-z0-9][a-z0-9-]{2,62}$/.test(id||''))throw error('项目标识不合法');return id;}
async function readProject(repo,id){const file=await github('GET',repo,location(validId(id)));if(file.missing)throw error('找不到该项目',404);
  try{return {project:JSON.parse(Buffer.from(file.content.replace(/\s/g,''),'base64').toString('utf8')),sha:file.sha};}
  catch{throw error('项目文件解析失败',500);}
}
async function writeProject(repo,id,project,sha){const obj={message:'xp: '+id+' revision '+project.revision,
  content:Buffer.from(JSON.stringify(project,null,2)+'\n','utf8').toString('base64'),branch:'main'};
  if(sha)obj.sha=sha;
  const out=await github('PUT',repo,location(id),obj);
  return out.content?.sha||'';
}
async function listProjects(repo) {
  const dir=await github('GET',repo,'data/projects');if(dir.missing)return [];
  if(!Array.isArray(dir))throw error('data/projects 必须是目录',409);
  const dirs=dir.filter(x=>x.type==='dir'&&/^[a-z0-9][a-z0-9-]{2,62}$/.test(x.name)).slice(0,80);
  const results=[];
  for(let i=0;i<dirs.length;i+=8) {
    const batch=await Promise.all(dirs.slice(i,i+8).map(async x=>{
      try{const {project}=await readProject(repo,x.name);
        return {id:project.id,name:project.name,account:project.account,stage:project.stage,updated_at:project.updated_at,revision:project.revision,pass:project.copy?.pages?.filter(x=>x.status==='PASS').length||0};}
      catch{return null;}
    }));results.push(...batch.filter(Boolean));
  }
  return results.sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
}
const paths={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/styles.css':'styles.css','/favicon.svg':'favicon.svg'};
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml'};
async function serve(res,url) {
  const filename=paths[url.pathname];if(!filename){res.writeHead(404);res.end('Not found');return;}
  const data=await readFile(path.join(ROOT,filename));
  res.writeHead(200,{'content-type':types[filename.split('.').pop()],'cache-control':'no-store',
    'content-security-policy':"default-src 'self'; img-src 'self' https: data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
    'x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'});
  res.end(data);
}
async function route(req,res) {
  const host=req.headers.host||'localhost';
  const url=new URL(req.url||'/', 'http://'+host);
  if(url.pathname==='/health')return json(res,200,{status:'ok',service:'xp-studio'});
  if(!url.pathname.startsWith('/api/'))return serve(res,url);
  if(req.method!=='GET'){
    const origin=req.headers.origin;
    if(origin && new URL(origin).host!==host)throw error('请求来源校验失败',403);
  }
  if(url.pathname==='/api/login'&&req.method==='POST'){
    const b=await body(req,2000);
    if(!pwOk(b.password))throw error('管理员密码错误',401);
    const exp=String(Date.now()+12*3600_000);const token=exp+'.'+signature(exp);
    res.setHeader('set-cookie','xp_session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200'+(process.env.NODE_ENV==='production'?'; Secure':''));
    return json(res,200,{ok:true});
  }
  if(!sessionOk(req))throw error('请先登录工作台',401);
  if(url.pathname==='/api/logout'&&req.method==='POST'){
    res.setHeader('set-cookie','xp_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return json(res,200,{ok:true});
  }
  if(url.pathname==='/api/config'&&req.method==='GET')return json(res,200,{repos:REPOS,version:'0.1.0',write_enabled:true});
  const repo=safeRepo(url.searchParams.get('repo'));
  if(url.pathname==='/api/projects'&&req.method==='GET')return json(res,200,{projects:await listProjects(repo)});
  if(url.pathname==='/api/projects'&&req.method==='POST'){
    const b=await body(req,10000);const safe=safeRepo(b.repo||repo);
    const slug='xp-'+Date.now().toString(36)+'-'+crypto.randomBytes(3).toString('hex');
    const p=newProject(b,slug);const sha=await writeProject(safe,slug,p,null);
    return json(res,201,{project:p,sha});
  }
  const match=url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)(?:\/(actions|upload))?$/);
  if(!match)throw error('API路径不存在',404);
  const id=validId(match[1]),op=match[2]||'';
  if(req.method==='GET'&&!op)return json(res,200,await readProject(repo,id));
  if(req.method==='POST'&&op==='actions'){
    const b=await body(req,15000);const prev=await readProject(repo,id);
    if(!b.expected_sha||prev.sha!==b.expected_sha)throw error('他人或其他设备已修改项目，请刷新确认',409);
    const next=applyAction(prev.project,b.action,b.payload||{});
    const sha=await writeProject(repo,id,next,prev.sha);
    return json(res,200,{project:next,sha});
  }
  if(req.method==='POST'&&op==='upload'){
    const b=await body(req);const prev=await readProject(repo,id);
    if(b.expected_sha!==prev.sha)throw error('项目版本已更新，请刷新',409);
    if(b.confirm_public!==true)throw error('请先确认公开仓库会公开上传的图片');
    if(!PAGE_IDS.includes(b.page_id))throw error('无效页码');
    const mime={png:'image/png',jpg:'image/jpeg',webp:'image/webp'};
    if(!mime[b.ext])throw error('仅支持PNG/JPG/WEBP');
    if(!/^[a-zA-Z0-9+/=\s]+$/.test(b.base64||''))throw error('图片编码错误');
    const bytes=Buffer.from(b.base64,'base64');
    if(bytes.length<50||bytes.length>3_000_000)throw error('图片大小必须在50B到3MB之间');
    if(b.ext==='png'&&bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw error('PNG文件格式不符');
    if(b.ext==='jpg'&&bytes.subarray(0,3).toString('hex')!=='ffd8ff')throw error('JPG文件格式不符');
    if(b.ext==='webp'&&bytes.subarray(0,4).toString()!=='RIFF')throw error('WEBP文件格式不符');
    const filename=b.page_id+'-'+crypto.randomBytes(7).toString('hex')+'.'+b.ext;
    const asset='data/projects/'+id+'/assets/'+filename;
    await github('PUT',repo,asset,{message:'xp: upload '+filename,branch:'main',content:bytes.toString('base64')});
    const urlImage='https://raw.githubusercontent.com/'+repo+'/main/'+asset.split('/').map(encodeURIComponent).join('/');
    const latest=await readProject(repo,id);
    const next=applyAction(latest.project,'SET_IMAGE',{page_id:b.page_id,url:urlImage});
    const sha=await writeProject(repo,id,next,latest.sha);
    return json(res,200,{project:next,sha,image_url:urlImage});
  }
  throw error('不支持的请求',405);
}
export const server=http.createServer((req,res)=>{
  route(req,res).catch(e=>{
    console.error('XP error',e.status||500,e.message?.slice(0,100));
    if(!res.headersSent)json(res,e.status||500,{error:e.message||'服务器发生异常'});else res.end();
  });
});
if(process.env.XP_NO_LISTEN!=='1')server.listen(PORT,'0.0.0.0',()=>console.log('XP Studio listening on port '+PORT));
