import test from 'node:test';
import assert from 'node:assert/strict';
import {buildVisualBrief,beautyCategory,SHOT_PROFILES,FINAL_CANVAS,CRITICAL_QA_KEYS} from '../lib/visual-direction.mjs';

const project={
 name:'晚梨｜新品图文',
 product:{brand:'YSL',name:'唇釉',shade:'色号01',spec:'5ml',source_url:'https://example.org/official',verified:true},
 persona:{name:'PERSONA-001',rules:'同一人物，右颧骨小痣'},
 copy:{pages:['P01','P02','P03','P04','P05'].map(id=>({id,headline:'专业实拍风格',body:'本文仅描述已核验内容'}))}
};
test('five distinct camera directions and typography policies',()=>{
 const briefs=Object.keys(SHOT_PROFILES).map(id=>buildVisualBrief(project,id));
 assert.equal(briefs.length,5);
 assert.equal(new Set(briefs.map(x=>x.role)).size,5);
 assert.equal(new Set(briefs.map(x=>x.mode)).size,5);
 assert.equal(briefs.every(x=>x.final_canvas.width===1086&&x.final_canvas.height===1448),true);
 assert.equal(briefs.every(x=>x.prompt.includes('不让图像模型生成中文')||x.prompt.includes('不依赖模型')),true);
 assert.equal(briefs.every(x=>x.prompt.includes('real packaging')||x.prompt.includes('包装')),true);
 assert.equal(briefs.every(x=>x.prompt.includes('右颧骨小痣')),true);
});
test('unverified product is a blocking draft and never claimed a finished commercial image',()=>{
 const draft=structuredClone(project);draft.product.verified=false;
 const result=buildVisualBrief(draft,'P02');
 assert.equal(result.product_verified,false);
 assert.equal(result.blocking.length,1);
 assert.equal(result.production_ready,false);
 assert.match(result.prompt,/BACKGROUND PLATE/);
});
test('beauty category adapts to lipstick, eyeshadow, skincare and fragrance',()=>{
 for(const [name,category] of [['哑光口红','LIP'],['四色眼影盘','EYE'],['修护精华','SKIN'],['香水','FRAGRANCE'],['修容粉饼','COMPLEXION']])
  assert.equal(beautyCategory(name),category,name);
});
test('quality checklist covers eight critical sign-off dimensions',()=>{
 assert.equal(CRITICAL_QA_KEYS.length,8);
 assert.equal(new Set(CRITICAL_QA_KEYS).size,8);
 assert.ok(CRITICAL_QA_KEYS.includes('rights_and_privacy'));
 assert.ok(CRITICAL_QA_KEYS.includes('technical_format'));
});
test('missing page returns an explicit error',()=>{
 assert.throws(()=>buildVisualBrief(project,'P06'),/未知页面/);
});
