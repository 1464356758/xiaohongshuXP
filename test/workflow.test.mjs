import test from 'node:test';
import assert from 'node:assert/strict';
import {newProject,applyAction,PAGE_IDS,isUrl} from '../lib/workflow.mjs';
const now='2026-10-22T12:00:00.000Z';
function act(p,action,payload){return applyAction(p,action,payload,now);}
function topicAndProduct(){
 let p=newProject({name:'晚梨测试',account:'晚梨'},'xp-test',now);
 p=act(p,'ADD_TOPIC',{title:'真实唇釉体验',source_url:'https://example.com/source'});
 p=act(p,'SELECT_TOPIC',{id:p.candidates[0].id});
 p=act(p,'SAVE_PRODUCT',{brand:'品牌A',name:'唇釉',shade:'01',spec:'5ml',source_url:'https://example.com/product'});
 p=act(p,'VERIFY_PRODUCT',{confirmed:true});
 return p;
}
function withContent(p){
 const pages=PAGE_IDS.map(id=>({id,headline:id+'重点',body:'真实描述',visual_prompt:'写实竖版摄影'}));
 return act(p,'SAVE_COPY',{title:'唇妆实测',caption:'完整正文',tags:'#彩妆',pages});
}
test('initial state contains five unique pages and controlled stage',()=>{
 const p=newProject({name:'新的项目'},'xp-a',now);
 assert.equal(p.stage,'TOPIC_DISCOVERY');assert.deepEqual(p.copy.pages.map(x=>x.id),PAGE_IDS);
 assert.throws(()=>newProject({name:'  '},'xp-a',now),/项目名称/);
});
test('cannot skip topic or product verification',()=>{
 let p=newProject({name:'测试'},'xp-a',now);
 assert.throws(()=>act(p,'VERIFY_PRODUCT',{confirmed:true}),/先选择选题/);
 assert.throws(()=>act(p,'SAVE_COPY',{title:'foo',pages:[]}),/先核验商品/);
 p=act(p,'ADD_TOPIC',{title:'原创选题'});
 assert.equal(p.candidates[0].evidence_state,'NO_SOURCE');
 p=act(p,'SELECT_TOPIC',{id:p.candidates[0].id});
 assert.throws(()=>act(p,'VERIFY_PRODUCT',{confirmed:true}),/不完整/);
});
test('five pages must match exact order',()=>{
 const p=topicAndProduct();
 assert.throws(()=>act(p,'SAVE_COPY',{pages:PAGE_IDS.slice(0,4).map(id=>({id}))}),/5页/);
});
test('five independent reviews unlock export and edits reset changed page',()=>{
 let p=withContent(topicAndProduct());
 for(const id of PAGE_IDS){
  p=act(p,'SET_IMAGE',{page_id:id,url:'https://example.com/'+id+'.png'});
  p=act(p,'REVIEW_PAGE',{page_id:id,verdict:'PASS'});
 }
 assert.equal(p.copy.pages.filter(x=>x.status==='PASS').length,5);
 p=act(p,'FINALIZE',{});assert.equal(p.stage,'READY_TO_EXPORT');
 const pages=p.copy.pages.map(x=>({id:x.id,headline:x.headline,body:x.body,visual_prompt:x.visual_prompt}));
 pages[2].headline='已经修改的标题';
 p=act(p,'SAVE_COPY',{title:p.copy.title,caption:p.copy.caption,tags:p.copy.tags,pages});
 assert.equal(p.copy.pages[2].status,'PENDING');assert.equal(p.copy.pages[0].status,'PASS');
 assert.throws(()=>act(p,'FINALIZE',{}),/5\/5/);
});
test('three failed rounds block and require an explicit human resolution',()=>{
 let p=withContent(topicAndProduct());
 p=act(p,'SET_IMAGE',{page_id:'P01',url:'https://example.com/test.png'});
 for(let n=0;n<3;n++)p=act(p,'REVIEW_PAGE',{page_id:'P01',verdict:'REWORK',issues:'商品色号与画面不一致'});
 assert.equal(p.stage,'BLOCKED');assert.equal(p.copy.pages[0].status,'BLOCKED');
 assert.throws(()=>act(p,'REVIEW_PAGE',{page_id:'P01',verdict:'PASS'}),/人工解除/);
 p=act(p,'MANUAL_RESOLVE',{page_id:'P01',reason:'已重新确认权利和资料'});
 assert.equal(p.copy.pages[0].repair_rounds,0);assert.equal(p.stage,'REVIEW');
});
test('invalid URLs are blocked',()=>{
 assert.equal(isUrl('javascript:alert(1)'),false);
 assert.equal(isUrl('https://example.org/path'),true);
 let p=withContent(topicAndProduct());
 assert.throws(()=>act(p,'SET_IMAGE',{page_id:'P01',url:'javascript:alert(1)'}),/网址/);
});
