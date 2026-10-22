import {buildVisualBrief,SHOT_PROFILES,QA_LABELS} from '/visual-direction.js';
import {renderEditorialImage} from '/editorial-renderer.js';
const $ = (s,root=document)=>root.querySelector(s);
const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeHtml;
const PAGE_IDS=['P01','P02','P03','P04','P05'];
const STAGES={TOPIC_DISCOVERY:'选题研究',PRODUCT_VERIFICATION:'商品核验',COPY_BUILD:'内容策划',IMAGE_BUILD:'视觉制作',REVIEW:'逐页审核',READY_TO_EXPORT:'已审核可交付',BLOCKED:'返修阻塞'};
const tabs=[['topics','选题'],['product','商品'],['copy','文案'],['images','图片'],['review','审核'],['files','交付 / 日志']];
const state={config:null,repo:null,projects:[],project:null,sha:null,tab:'topics',busy:false};
const app=$('#app');
function notice(message,isError=false){$('.toast')?.remove();const node=document.createElement('div');node.className='toast'+(isError?' error':'');node.textContent=message;document.body.append(node);setTimeout(()=>node.remove(),4500);}
async function api(url,method='GET',data){
  const options={method,credentials:'same-origin',headers:{}};
  if(data!==undefined){options.headers['content-type']='application/json';options.body=JSON.stringify(data);}
  let res;try{res=await fetch(url,options);}catch{throw new Error('无法连接到XP服务端');}
  let result;try{result=await res.json();}catch{throw new Error('服务端响应格式错误');}
  if(!res.ok){if(res.status===401&&url!=='/api/login'){state.config=null;renderLogin();}
    throw new Error(result.error||'操作失败');}
  return result;
}
function url(path){return path+'?repo='+encodeURIComponent(state.repo);}
function stageBadge(stage){const cls=stage==='READY_TO_EXPORT'?' pass':stage==='BLOCKED'?' block':'';return '<span class="pill'+cls+'">'+e(STAGES[stage]||stage)+'</span>';}
function section(title,description){return '<div class="section-head"><h2>'+e(title)+'</h2><p>'+e(description)+'</p></div>';}
function input(name,label,value='',placeholder='',required=false){return '<div class="field"><label for="'+e(name)+'">'+e(label)+'</label><input id="'+e(name)+'" name="'+e(name)+'" value="'+e(value)+'" placeholder="'+e(placeholder)+'"'+(required?' required':'')+'></div>';}
function area(name,label,value='',rows=4){return '<div class="field"><label for="'+e(name)+'">'+e(label)+'</label><textarea id="'+e(name)+'" name="'+e(name)+'" rows="'+rows+'">'+e(value)+'</textarea></div>';}
function formButton(text='保存到GitHub'){return '<div class="actions"><button class="btn" type="submit">'+e(text)+'</button></div>';}
function renderLogin(){
  app.innerHTML='<div class="login-wrap"><div class="login-card"><div class="mark">XP</div><h1>欢迎回到 XP Studio</h1>'+
   '<p>小红书专业创作工作台。你的选题、稿件和审核记录都写入自己的 GitHub 仓库。</p>'+
   '<form id="loginForm" class="form"><div class="field"><label>管理员密码</label><input name="password" type="password" autocomplete="current-password" required placeholder="输入在服务器中设置的 ADMIN_PASSWORD"></div>'+
   '<button type="submit" class="btn">安全登录 →</button></form><p class="small">本页面不需要也不会要求填写 GitHub Token。请在服务端环境变量中配置。</p></div></div>';
}
function dashboard(){
  const done=state.projects.filter(x=>x.stage==='READY_TO_EXPORT').length;
  const cards=state.projects.length?state.projects.map(p=>
    '<article class="card project-card"><div class="statusline">'+stageBadge(p.stage)+'<span class="small muted">rev '+e(p.revision)+'</span></div>'+
    '<div><h3>'+e(p.name)+'</h3><div class="small muted">'+e(p.account||'未设置账号')+' · '+e(p.id)+'</div></div>'+
    '<div class="project-bottom"><span class="small muted">'+e(p.pass)+' / 5 页通过</span><button class="btn sm" data-action="open" data-id="'+e(p.id)+'">继续创作 →</button></div></article>'
  ).join(''):'<div class="card empty">暂时没有创作项目。建立第一个项目，系统将自动创建独立的 GitHub 状态文件。</div>';
  return '<section class="hero"><div><span class="eyebrow">EDITORIAL INTELLIGENCE · V0.1</span><h1>让好内容，<br>有迹可循。</h1>'+
    '<p>从选题、商品核验到每一张图片的审核，保留证据、版本和返修记录。质量先行，发布由你最终决定。</p>'+
    '<div class="stats"><div class="stat"><strong>'+state.projects.length+'</strong><small>创作项目</small></div><div class="stat"><strong>'+done+'</strong><small>审核完成</small></div><div class="stat"><strong>5</strong><small>每套图文页数</small></div></div></div>'+
    '<div class="art"><div class="art-inner"><div class="eyebrow" style="color:#ffe5e7">THE CONTENT STUDIO</div><b>Make it<br>remarkable.</b><p>研究 · 创作 · 审核 · 交付</p></div></div></section>'+
    '<div class="split"><section><div class="intro"><div><h2>你的项目</h2><p class="muted small">GitHub实时状态，不使用浏览器本地假数据</p></div><button class="btn ghost sm" data-action="refresh">↻ 刷新</button></div>'+
    '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(235px,1fr))">'+cards+'</div></section>'+
    '<section><div class="intro"><div><h2>开始新的创作</h2><p class="muted small">一部内容计划，一个独立项目</p></div></div>'+
    '<div class="card"><form id="newProjectForm" class="form">'+input('name','项目名称','','例如：晚梨｜新品唇妆测评',true)+input('account','运营账号','','晚梨')+
    input('persona','人物锚点','','PERSONA-001')+'<div class="info">会在 '+e(state.repo)+' 仓库写入新的项目JSON；不会自动生成或发布内容。</div>'+formButton('创建项目 →')+'</form></div></section></div>';
}
function topicPanel(p){
  let rows=p.candidates.length?p.candidates.map(t=>
    '<div class="topic-item"><div><h3>'+e(t.title)+'</h3><p class="small muted">'+e(t.angle||'未填写原创角度')+'</p>'+
    (t.source_url?'<a target="_blank" rel="noopener noreferrer" href="'+e(t.source_url)+'">查看参考来源 ↗</a>':'<span class="pill block">缺少参考来源</span>')+
    '<div class="small muted">'+e(t.evidence_state)+'</div></div><div>'+((p.selected_topic_id===t.id)?'<span class="pill pass">已选定</span>':
    '<button class="btn sm ghost" data-action="select" data-id="'+e(t.id)+'">选择选题</button>')+'</div></div>'
  ).join(''):'<div class="empty">还没有选题。请添加真实来源或自己确认的主题，不会虚构实时热度。</div>';
  return section('选题研究','推荐先搜集5～10个真实候选，再选择有原创角度的主题。')+
    '<div class="card"><h3>候选选题 · '+p.candidates.length+' / 30</h3>'+rows+'</div>'+
    '<div class="card"><h3>添加候选选题</h3><form class="form" id="topicForm">'+input('title','选题标题','','例如：为什么这支唇釉这么受欢迎？',true)+
    area('angle','差异化切入角度')+input('source_url','参考来源网址（需人工判断真实性）','','https://...')+
    area('notes','事实与风险备注',2)+formButton('保存候选选题')+'</form></div>';
}
function productPanel(p){
  const x=p.product;
  return section('商品身份核验','先锁定官方产品身份，再开始文案和图片。避免色号、容量或产品包装张冠李戴。')+
    '<div class="card"><div class="statusline">'+(x.verified?'<span class="pill pass">已由用户确认</span>':'<span class="pill block">尚未核验</span>')+'</div>'+
    '<form class="form" id="productForm"><div class="form-row">'+input('brand','品牌',x.brand,'品牌',true)+input('name','商品完整名称',x.name,'官方全称',true)+'</div>'+
    '<div class="form-row">'+input('shade','色号 / 系列',x.shade)+input('spec','规格 / 容量',x.spec,'例如：15ml',true)+'</div>'+
    input('source_url','官方来源网址',x.source_url,'https://...',true)+area('claims','已核验的卖点 / 禁止夸大的宣称',x.claims,6)+
    formButton('保存商品资料（重置核验状态）')+'</form><div class="hr"></div>'+
    '<label class="checkbox"><input id="verifyConsent" type="checkbox">我已实际检查商品名称、色号/规格、来源真实性；不把未经核实的效果写成事实。</label>'+
    '<div class="actions"><button class="btn" data-action="verify-product">我已核验，进入文案 →</button></div></div>';
}
function copyPanel(p){
  const cards=p.copy.pages.map(x=>
    '<div class="page-card"><div class="page-header"><strong>'+e(x.id)+' · '+e(SHOT_PROFILES[x.id].name)+'</strong>'+stageBadge(x.status)+'</div>'+
    input('headline_'+x.id,'页内主标题',x.headline)+area('body_'+x.id,'页内文案',x.body,4)+
    area('visual_prompt_'+x.id,'视觉指令 / 镜头设计',x.visual_prompt,5)+
    '<div class="actions"><button type="button" class="btn ghost sm" data-action="compose-prompt" data-page="'+e(x.id)+'">生成专业视觉指令</button>'+
    '<button type="button" class="btn line sm" data-action="copy-prompt" data-page="'+e(x.id)+'">复制本页指令</button></div></div>'
  ).join('');
  return section('内容策划与五页分镜','五页使用五种不同镜头语言；先摄影底片、真实素材合成，最后后期精确排版。不让模型一次生成带中文字的完整海报。')+
    '<div class="card"><form class="form" id="copyForm">'+input('title','发布标题',p.copy.title,'输入最终发布标题',true)+
    area('caption','正文',p.copy.caption,6)+input('tags','话题标签',p.copy.tags,'#美妆 #口红')+
    '<div class="page-grid">'+cards+'</div>'+formButton('保存整套五页文案')+'</form></div>';
}
function thumb(x){return '<div class="thumb">'+(x.image_url?'<img src="'+e(x.image_url)+'" alt="'+e(x.id)+'已上传图片" loading="lazy">':'<span>暂无图片 · '+e(x.id)+'</span>')+'</div>';}
function imagePanel(p){
  return section('视觉制作','每页保留独立图片。上传前请确认图片不含不应公开的人像、隐私或未授权素材。')+
   '<div class="info important">重要：当前 GitHub 仓库是公开仓库。上传文件会公开给所有人。真实人物锚点照片、商业未公开素材或敏感照片不要上传到此仓库。</div>'+
   '<label class="checkbox"><input type="checkbox" id="publicConsent">我明确知晓并同意：本次上传的图片会公开保存在 GitHub。</label>'+
   '<div class="page-grid">'+p.copy.pages.map(x=>
     '<div class="page-card"><div class="page-header"><strong>'+e(x.id)+' · '+e(SHOT_PROFILES[x.id].name)+'</strong>'+stageBadge(x.status)+'</div>'+thumb(x)+
     '<div class="small muted" style="margin-top:9px">'+e(x.issues||'未审核')+'</div>'+
     '<form class="form" data-page="'+e(x.id)+'" id="imageForm_'+e(x.id)+'"><div class="field"><label>图片URL（https/http）</label><input name="image_url" value="'+e(x.image_url)+'" placeholder="粘贴已托管的图片地址"></div>'+
     '<button class="btn ghost sm" type="submit">保存图片链接</button></form>'+
     '<div class="info">专业后期排版：选择已合法获得的高质量摄影底片，手机端本地加中文标题，导出1086×1448 PNG。底片中的商品必须真实，不会凭空补出商品。</div>'+
     '<input class="hide photo-base-input" type="file" data-page="'+e(x.id)+'" accept="image/png,image/jpeg,image/webp">'+
     '<div class="actions"><button class="btn ghost sm" data-action="render-layout" data-format="jpg" data-page="'+e(x.id)+'">排版为高清JPG</button><button class="btn line sm" data-action="render-layout" data-format="png" data-page="'+e(x.id)+'">排版为无损PNG</button></div>'+
     '<input class="hide upload-input" type="file" data-page="'+e(x.id)+'" accept="image/png,image/jpeg,image/webp">'+
     '<div class="actions"><button class="btn sm" data-action="upload" data-page="'+e(x.id)+'">选择本地图片上传</button>'+
     (x.image_url?'<a class="btn line sm" href="'+e(x.image_url)+'" target="_blank" rel="noopener noreferrer">打开原图 ↗</a>':'')+'</div></div>'
   ).join('')+'</div>';
}
function reviewPanel(p){
  const approved=p.copy.pages.filter(x=>x.status==='PASS').length;
  return section('逐页审核','图片一致性、商品信息、文字边界与事实声明由人工确认；三轮失败则进入人工裁决。')+
    '<div class="kpi-row"><div class="kpi"><strong>'+approved+'/5</strong><span>已通过页面</span></div>'+
    '<div class="kpi"><strong>'+p.copy.pages.filter(x=>x.status==='BLOCKED').length+'</strong><span>人工阻塞</span></div>'+
    '<div class="kpi"><strong>'+e(p.revision)+'</strong><span>当前状态版本</span></div></div>'+
    '<div class="page-grid" style="margin-top:16px">'+p.copy.pages.map(x=>
    '<div class="page-card"><div class="page-header"><strong>'+e(x.id)+' · '+e(SHOT_PROFILES[x.id].name)+'</strong>'+stageBadge(x.status)+'</div>'+thumb(x)+
    '<div class="small muted" style="margin:10px 0">返修记录：'+e(x.repair_rounds)+'/3轮</div>'+
    '<div class="small">'+e(x.headline||'未写标题')+'</div>'+
    (x.status==='BLOCKED'?
      '<form class="form" id="manualForm_'+e(x.id)+'" data-page="'+e(x.id)+'">'+area('reason','人工裁决理由',x.issues,3)+formButton('解除阻塞并重新审核')+'</form>':
      '<form class="form" id="reviewForm_'+e(x.id)+'" data-page="'+e(x.id)+'"><div class="field"><label>审核结论</label><select name="verdict"><option value="PASS">PASS｜通过</option><option value="REWORK">REWORK｜局部返修</option></select></div>'+
      '<div class="info">PASS须手动确认下列8项。没有商品或人物参考时，不能当作已核实。</div>'+      '<div class="form">'+Object.entries(QA_LABELS).map(([key,label])=>'<label class="checkbox"><input type="checkbox" name="qa_'+e(key)+'"'+(x.last_review?.verdict==='PASS'?' checked':'')+'>'+e(label)+'</label>').join('')+'</div>'+      area('issues','具体问题 / 通过依据',x.issues,3)+formButton('保存 '+x.id+' 审核')+'</form>')+'</div>'
   ).join('')+'</div><div class="card" style="margin-top:16px"><h3>整套最终验收</h3><p class="muted">需已核验商品、有效发布标题，以及 5 / 5 页面状态PASS。</p>'+
   '<div class="actions"><button class="btn" data-action="finalize">确认最终通过并锁定交付 →</button><button class="btn ghost" data-action="tab" data-tab="files">查看导出</button></div></div>';
}
function filesPanel(p){
  const can=p.stage==='READY_TO_EXPORT';
  return section('交付与版本记录','每次修改对应 GitHub 真实提交与文件SHA，便于手机接续创作。')+
    '<div class="card"><h3>发布材料</h3><div class="statusline">'+stageBadge(p.stage)+'<span class="small muted">'+p.copy.pages.filter(x=>x.status==='PASS').length+'/5张图片审核通过</span></div>'+
    '<div class="info">本版本支持复制文案、导出TXT与JSON备份、逐张打开原图；ZIP批量打包和真正的AI一键生图尚未接入。</div>'+
    '<div class="actions"><button class="btn" data-action="copy-caption">复制发布文案</button>'+
    '<button class="btn ghost" data-action="export-txt"'+(can?'':' disabled')+'>导出TXT</button>'+
    '<button class="btn ghost" data-action="export-json">导出项目JSON</button></div>'+
    '<div class="hr"></div><div class="small muted">GitHub仓库</div><div class="mono">'+e(state.repo)+'</div>'+
    '<div class="small muted" style="margin-top:10px">项目文件SHA</div><div class="mono">'+e(state.sha)+'</div>'+
    '<a target="_blank" rel="noopener noreferrer" href="https://github.com/'+e(state.repo)+'/blob/main/data/projects/'+e(p.id)+'/project.json">查看GitHub真实状态 ↗</a></div>'+
    '<div class="card"><h3>操作与审核日志 · '+p.history.length+'</h3><div class="timeline">'+p.history.slice().reverse().map(h=>
    '<div class="log"><div class="statusline"><strong class="small">'+e(h.action)+'</strong><time>'+e(h.time)+'</time></div><div class="small muted">'+e(h.note)+'</div></div>').join('')+'</div></div>';
}
function projectContent(p){
  if(state.tab==='topics')return topicPanel(p);
  if(state.tab==='product')return productPanel(p);
  if(state.tab==='copy')return copyPanel(p);
  if(state.tab==='images')return imagePanel(p);
  if(state.tab==='review')return reviewPanel(p);
  return filesPanel(p);
}
function projectView(){
  const p=state.project;
  return '<div class="project-top"><div><div class="breadcrumbs">项目列表 / '+e(p.id)+'</div><h1>'+e(p.name)+'</h1>'+
   '<div class="statusline">'+stageBadge(p.stage)+'<span class="small muted">'+e(p.account||'个人创作')+' · '+e(p.persona.name)+' · rev '+e(p.revision)+'</span></div></div>'+
   '<div class="actions"><button class="btn ghost sm" data-action="back">← 返回列表</button><button class="btn line sm" data-action="refresh">↻ 同步GitHub</button></div></div>'+
   '<div class="workspace"><aside class="sidebar"><div class="card" style="padding:9px"><nav class="nav">'+tabs.map(t=>
   '<button data-action="tab" data-tab="'+e(t[0])+'" class="'+(state.tab===t[0]?'active':'')+'">'+e(t[1])+'<span>›</span></button>').join('')+
   '</nav></div></aside><main class="main-panel">'+projectContent(p)+'</main></div>';
}
function render(){
  if(!state.config)return renderLogin();
  app.innerHTML='<div class="shell"><header class="topbar"><div class="brand" data-action="back"><div class="mark">XP</div><div><strong>XP Studio</strong><small>CONTENT INTELLIGENCE</small></div></div>'+
  '<div class="top-actions"><select id="repoSelector" class="repo-select" aria-label="仓库" style="max-width:190px;font-size:12px">'+state.config.repos.map(r=>
  '<option value="'+e(r)+'"'+(state.repo===r?' selected':'')+'>'+e(r)+'</option>').join('')+'</select>'+
  '<button class="btn ghost sm" data-action="logout">退出</button></div></header>'+
  (state.project?projectView():dashboard())+
  '<footer class="footer">XP Studio v0.1 · 质量优先 · 数据存储于你的GitHub仓库 · 非官方小红书客户端</footer></div>';
}
async function loadProjects(){const r=await api(url('/api/projects'));state.projects=r.projects;render();}
async function openProject(id){const r=await api(url('/api/projects/'+id));state.project=r.project;state.sha=r.sha;
  state.tab=r.project.stage==='TOPIC_DISCOVERY'?'topics':r.project.stage==='PRODUCT_VERIFICATION'?'product':
    r.project.stage==='COPY_BUILD'?'copy':r.project.stage==='IMAGE_BUILD'?'images':
    r.project.stage==='READY_TO_EXPORT'?'files':'review';
  render();scrollTo({top:0,behavior:'smooth'});}
async function action(name,payload){if(!state.project)return;const id=state.project.id;
  const result=await api(url('/api/projects/'+id+'/actions'),'POST',{expected_sha:state.sha,action:name,payload});
  state.project=result.project;state.sha=result.sha;render();notice('已写入GitHub，并更新状态版本 rev '+result.project.revision);}
async function start(){
  try{const cfg=await api('/api/config');state.config=cfg;state.repo=cfg.repos[0];await loadProjects();}
  catch(ex){if(!state.config)renderLogin();else notice(ex.message,true);}
}
function getForm(form){return Object.fromEntries(new FormData(form));}
function withError(promise){Promise.resolve(promise).catch(ex=>{notice(ex.message,true);});}
document.addEventListener('submit',event=>{
  const f=event.target;if(!f.id)return;event.preventDefault();
  withError((async()=>{
    if(f.id==='loginForm'){await api('/api/login','POST',{password:f.elements.password.value});await start();notice('欢迎回来');return;}
    if(f.id==='newProjectForm'){const d=getForm(f);const result=await api(url('/api/projects'),'POST',{...d,repo:state.repo});
      await loadProjects();await openProject(result.project.id);notice('项目已创建并写入GitHub');return;}
    if(f.id==='topicForm'){await action('ADD_TOPIC',getForm(f));return;}
    if(f.id==='productForm'){await action('SAVE_PRODUCT',getForm(f));return;}
    if(f.id==='copyForm'){const d=getForm(f);const pages=PAGE_IDS.map(id=>({id,headline:d['headline_'+id],body:d['body_'+id],visual_prompt:d['visual_prompt_'+id]}));
      await action('SAVE_COPY',{title:d.title,caption:d.caption,tags:d.tags,pages});return;}
    if(f.id.startsWith('imageForm_')){await action('SET_IMAGE',{page_id:f.dataset.page,url:f.elements.image_url.value});return;}
    if(f.id.startsWith('reviewForm_')){const data=getForm(f);const checklist=Object.fromEntries(Object.keys(QA_LABELS).map(k=>[k,!!f.elements['qa_'+k]?.checked]));await action('REVIEW_PAGE',{page_id:f.dataset.page,...data,checklist});return;}
    if(f.id.startsWith('manualForm_')){await action('MANUAL_RESOLVE',{page_id:f.dataset.page,...getForm(f)});return;}
  })());
});
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const type=button.dataset.action;
  withError((async()=>{
    if(type==='open'){await openProject(button.dataset.id);return;}
    if(type==='back'){state.project=null;state.sha=null;await loadProjects();return;}
    if(type==='refresh'){if(state.project)await openProject(state.project.id);else await loadProjects();notice('已从GitHub刷新');return;}
    if(type==='tab'){state.tab=button.dataset.tab;render();return;}
    if(type==='select'){await action('SELECT_TOPIC',{id:button.dataset.id});state.tab='product';render();return;}
    if(type==='verify-product'){if(!$('#verifyConsent')?.checked)throw new Error('请先人工核验并勾选确认');await action('VERIFY_PRODUCT',{confirmed:true});state.tab='copy';render();return;}
    if(type==='finalize'){await action('FINALIZE',{});state.tab='files';render();return;}
    if(type==='render-layout'){const input=$('.photo-base-input[data-page="'+button.dataset.page+'"]');if(input){input.dataset.format=button.dataset.format||'jpg';input.click();}return;}
    if(type==='upload'){if(!$('#publicConsent')?.checked)throw new Error('图片将公开在GitHub，请先勾选知情同意');$('.upload-input[data-page="'+button.dataset.page+'"]')?.click();return;}
    if(type==='compose-prompt'){
      const id=button.dataset.page,form=$('#copyForm');
      const draft={...state.project,copy:{...state.project.copy,pages:state.project.copy.pages.map(pg=>
        pg.id===id?{...pg,headline:form?.elements['headline_'+id]?.value||pg.headline,body:form?.elements['body_'+id]?.value||pg.body}:pg)}};
      const brief=buildVisualBrief(draft,id);
      const target=form?.elements['visual_prompt_'+id];
      if(!target)throw new Error('请打开文案编辑页');
      target.value=brief.prompt;target.focus();
      notice(button.dataset.page+' 已生成独立镜头摄影方案；商品原图和人物参考仍需人工核验');
      return;
    }
    if(type==='copy-prompt'){
      const target=$('#copyForm')?.elements['visual_prompt_'+button.dataset.page];
      if(!target?.value.trim())throw new Error('本页没有提示词，先生成或输入');
      await navigator.clipboard.writeText(target.value);notice('本页视觉指令已复制');return;
    }
    if(type==='copy-caption'){const p=state.project;
      await navigator.clipboard.writeText([p.copy.title,p.copy.caption,p.copy.tags].filter(Boolean).join('\n\n'));notice('文案已复制');return;}
    if(type==='export-json'){saveFile(state.project.id+'.json',JSON.stringify(state.project,null,2),'application/json');return;}
    if(type==='export-txt'){
      if(state.project.stage!=='READY_TO_EXPORT')throw new Error('请先完成5/5审核');
      const p=state.project;
      const txt=[p.copy.title,p.copy.caption,p.copy.tags,'','页面清单：',...p.copy.pages.map(x=>x.id+' '+x.headline+'\n'+x.body+'\n图片：'+x.image_url)].join('\n\n');
      saveFile(p.id+'.txt',txt,'text/plain;charset=utf-8');return;}
    if(type==='logout'){await api('/api/logout','POST');state.config=null;state.project=null;renderLogin();return;}
  })());
});
document.addEventListener('change',event=>{
  const f=event.target;
  if(f.id==='repoSelector'){withError((async()=>{state.repo=f.value;state.project=null;state.sha=null;await loadProjects();})());return;}
  if(f.classList.contains('photo-base-input')&&f.files?.[0]){
    withError((async()=>{
      const project=state.project,page=project.copy.pages.find(pg=>pg.id===f.dataset.page);
      if(!page)throw new Error('项目图片页不存在');
      const format=f.dataset.format==='png'?'png':'jpg';
      const image=await renderEditorialImage(f.files[0],page,project.account,undefined,format);
      saveBlob(project.id+'-'+page.id+'-1086x1448.'+format,image);
      notice('已本地排版导出'+format.toUpperCase()+'。请目视核实商品、文字和裁切，再决定是否上传。');
      f.value='';
    })());
    return;
  }
  if(!f.classList.contains('upload-input')||!f.files?.[0])return;
  withError((async()=>{
    const file=f.files[0],ext=file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':file.type==='image/webp'?'webp':null;
    if(!ext)throw new Error('仅支持 JPG、PNG 或 WebP');
    if(file.size>3_000_000)throw new Error('图片不能超过3 MB');
    const bitmap=await createImageBitmap(file);
    const width=bitmap.width,height=bitmap.height;
    bitmap.close();
    if(width!==1086||height!==1448)throw new Error('成品必须1086×1448像素（3:4）；当前'+width+'×'+height+'。请先导出正确画幅。');
    const base64=await new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('图片读取失败'));reader.readAsDataURL(file);
    });
    const result=await api(url('/api/projects/'+state.project.id+'/upload'),'POST',{
      page_id:f.dataset.page,ext,base64,confirm_public:true,expected_sha:state.sha});
    state.project=result.project;state.sha=result.sha;render();notice('已上传图片至公开GitHub仓库');
  })());
});
function saveFile(name,content,type){saveBlob(name,new Blob([content],{type}));}
function saveBlob(name,blob){const address=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=address;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(address),1000);}
start();
