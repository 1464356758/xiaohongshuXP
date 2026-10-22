// XP Studio domain rules. Pure functions, deliberately no model calls.
export const STAGES = ['TOPIC_DISCOVERY','PRODUCT_VERIFICATION','COPY_BUILD','IMAGE_BUILD','REVIEW','READY_TO_EXPORT','BLOCKED'];
export const PAGE_IDS = ['P01','P02','P03','P04','P05'];
const clean = (value, max=1200) => String(value ?? '').trim().slice(0,max);
const invalid = message => { const e=new Error(message); e.status=400; throw e; };
const requireText=(v,label,max=200)=> {const s=clean(v,max); if(!s) invalid('请填写'+label);return s;};
export function isUrl(v) {try{const u=new URL(String(v||''));return ['https:','http:'].includes(u.protocol)&&!!u.hostname;}catch{return false;}}
export function newProject(data={}, id, now=new Date().toISOString()) {
  const name=requireText(data.name,'项目名称',100);
  const account=clean(data.account,90);
  return {schema_version:1,id,name,account,platform:clean(data.platform||'小红书',30),
    persona:{name:clean(data.persona||'PERSONA-001',50),rules:'人物参考须获授权；同一人物五官、发色、痣的位置保持一致；不可镜像'},
    stage:'TOPIC_DISCOVERY',created_at:now,updated_at:now,revision:1,
    candidates:[],selected_topic_id:null,
    product:{brand:'',name:'',shade:'',spec:'',source_url:'',claims:'',verified:false,verified_at:null},
    copy:{title:'',caption:'',tags:'',pages:PAGE_IDS.map(id=>({id,headline:'',body:'',visual_prompt:'',image_url:'',status:'PENDING',issues:'',repair_rounds:0}))},
    history:[{time:now,action:'CREATE',note:'项目初始化'}]};
}
export function applyAction(original, action, payload={}, now=new Date().toISOString()) {
  const p=structuredClone(original);
  const page = id => {const x=p.copy.pages.find(x=>x.id===id);if(!x)invalid('不存在的图片页');return x;};
  const record = (note) => { p.revision=(Number(p.revision)||0)+1;p.updated_at=now;p.history.push({time:now,action,note:clean(note,300)});p.history=p.history.slice(-300);};
  switch(action){
    case 'ADD_TOPIC': {
      if(p.candidates.length>=30) invalid('最多保留30个候选选题');
      const title=requireText(payload.title,'选题',150);
      const item={id:'T'+String(Date.now())+Math.random().toString(36).slice(2,6),title,
        angle:clean(payload.angle,500),source_url:clean(payload.source_url,700),notes:clean(payload.notes,700),added_at:now,
        evidence_state:isUrl(payload.source_url)?'LINK_NOT_INDEPENDENTLY_VERIFIED':'NO_SOURCE'};
      p.candidates.push(item);record('添加选题：'+title);break;
    }
    case 'SELECT_TOPIC': {
      const x=p.candidates.find(x=>x.id===payload.id);if(!x)invalid('请先添加候选选题');
      p.selected_topic_id=x.id;p.stage='PRODUCT_VERIFICATION';
      p.product={brand:'',name:'',shade:'',spec:'',source_url:'',claims:'',verified:false,verified_at:null};
      p.copy={title:'',caption:'',tags:'',pages:PAGE_IDS.map(id=>({id,headline:'',body:'',visual_prompt:'',image_url:'',status:'PENDING',issues:'',repair_rounds:0}))};
      record('选定：'+x.title+'（旧商品与草稿信息已清空以防混用）');break;
    }
    case 'SAVE_PRODUCT': {
      p.product={brand:clean(payload.brand,100),name:clean(payload.name,180),shade:clean(payload.shade,100),
        spec:clean(payload.spec,100),source_url:clean(payload.source_url,900),
        claims:clean(payload.claims,3000),verified:false,verified_at:null};
      p.stage='PRODUCT_VERIFICATION';
      p.copy.pages.forEach(pg=>{pg.status='PENDING';pg.issues='商品资料变更后须重新审核';});
      record('更新商品资料，撤销旧审核状态并等待重新核验');break;
    }
    case 'VERIFY_PRODUCT': {
      if(!p.selected_topic_id) invalid('先选择选题');
      for(const k of ['brand','name','spec','source_url']) if(!p.product[k]) invalid('商品资料尚不完整：'+k);
      if(!isUrl(p.product.source_url))invalid('请输入有效商品来源网址');
      if(payload.confirmed!==true)invalid('必须明确勾选已人工核验商品身份与来源');
      p.product.verified=true;p.product.verified_at=now;p.stage='COPY_BUILD';
      record('人工确认商品资料');break;
    }
    case 'SAVE_COPY': {
      if(!p.product.verified)invalid('请先核验商品');
      p.copy.title=clean(payload.title,200);p.copy.caption=clean(payload.caption,3000);p.copy.tags=clean(payload.tags,500);
      const next=payload.pages;
      if(!Array.isArray(next)||next.length!==5||!PAGE_IDS.every((id,i)=>next[i]?.id===id))invalid('必须包含顺序正确的5页');
      let changed=false;
      p.copy.pages=next.map((v,i)=>{
        const old=p.copy.pages[i];const headline=clean(v.headline,200),body=clean(v.body,1800),visual_prompt=clean(v.visual_prompt,3200);
        const edit=(old.headline!==headline||old.body!==body||old.visual_prompt!==visual_prompt);
        changed ||=edit;
        return {...old,headline,body,visual_prompt,status:edit?'PENDING':old.status,issues:edit?'':old.issues};
      });
      p.stage=p.copy.pages.every(x=>x.status==='PASS')?'REVIEW':'IMAGE_BUILD';
      record('保存5页文案与分镜'+(changed?'，变更页已撤销审核通过':''));
      break;
    }
    case 'SET_IMAGE': {
      if(!p.product.verified) invalid('请先核验商品');
      const pg=page(payload.page_id);
      if(!isUrl(payload.url)) invalid('图片必须是有效网址');
      pg.image_url=clean(payload.url,1800);pg.status='PENDING';pg.issues='';p.stage='IMAGE_BUILD';
      record('更新'+pg.id+'图片，等待重新审核');break;
    }
    case 'REVIEW_PAGE': {
      const pg=page(payload.page_id), verdict=payload.verdict;
      if(!['PASS','REWORK'].includes(verdict)) invalid('审核结果只能是PASS或REWORK');
      if(!pg.image_url||!isUrl(pg.image_url))invalid('页面没有可用图片');
      if(!pg.headline&&!pg.body)invalid('页面文案不能为空');
      const issues=clean(payload.issues,1200);
      if(verdict==='REWORK'){
        if(!issues)invalid('返修必须填写具体问题');
        pg.repair_rounds+=1;pg.status=pg.repair_rounds>=3?'BLOCKED':'REWORK';pg.issues=issues;
      }else{ if(pg.status==='BLOCKED')invalid('已达到三轮返修上限，需人工解除阻塞');pg.status='PASS';pg.issues=issues;}
      p.stage=p.copy.pages.some(x=>x.status==='BLOCKED')?'BLOCKED':'REVIEW';
      record(pg.id+' 审核：'+pg.status);break;
    }
    case 'MANUAL_RESOLVE': {
      const pg=page(payload.page_id);
      if(pg.status!=='BLOCKED')invalid('只有阻塞的页面才能人工裁决');
      if(!requireText(payload.reason,'裁决理由',600))invalid('需要裁决理由');
      pg.status='PENDING';pg.issues='人工裁决：'+clean(payload.reason,600);pg.repair_rounds=0;
      p.stage='REVIEW';record(pg.id+'已人工解除阻塞，需重新审核');break;
    }
    case 'FINALIZE': {
      if(!p.product.verified||!p.copy.title.trim())invalid('尚未完成商品核验或正式标题');
      if(!p.copy.pages.every(x=>x.status==='PASS'))invalid('必须5/5图片审核PASS');
      p.stage='READY_TO_EXPORT';record('5/5 PASS，人工批准进入导出');break;
    }
    default: invalid('未知任务操作');
  }
  return p;
}
