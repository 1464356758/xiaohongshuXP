/**
 * XP Visual Direction v0.2: five distinct beauty-editorial shot briefs.
 * It writes no images, and never claims a verified product photograph exists.
 * Works identically as a browser module and in Node.js tests.
 */
export const VISUAL_STANDARD_VERSION='XP-VISUAL-0.2';
export const FINAL_CANVAS={width:1086,height:1448,ratio:'3:4'};
export const CRITICAL_QA_KEYS=['product_identity','visual_fidelity','persona_consistency','content_truth','composition','typography','technical_format','rights_and_privacy'];
export const QA_LABELS={
 product_identity:'商品名称、色号、容量、包装结构与已核验资料一致',
 visual_fidelity:'真实商品素材未被模型改造，色彩和材质可信',
 persona_consistency:'如有人物：锚点一致、小痣方向正确且未镜像；无人像则选不适用',
 content_truth:'图中内容与事实一致，没有捏造试用、功效或价格',
 composition:'构图、光线、景深与该页视觉分工匹配，不廉价不杂乱',
 typography:'中文文字精准、可读、无越界遮挡，信息层级清楚',
 technical_format:'成品1086×1448、3:4竖版，无重采样明显瑕疵',
 rights_and_privacy:'有权使用素材，未泄露隐私/未将私密素材上传公开仓库'
};
const safe=(value,max=500)=>String(value??'').trim().slice(0,max);
export function beautyCategory(name){
 const s=safe(name,400);
 if(/唇|口红|唇釉|唇蜜|唇膏|润唇|lip|gloss|rouge/i.test(s))return 'LIP';
 if(/眼影|眉|睫毛|眼线|eyeshadow|mascara/i.test(s))return 'EYE';
 if(/香水|香氛|perfume|fragrance/i.test(s))return 'FRAGRANCE';
 if(/面霜|精华|乳液|洁面|防晒|肌底|护肤|凝露|serum|cream|spf/i.test(s))return 'SKIN';
 if(/腮红|修容|高光|散粉|粉饼|粉底|气垫|blush|highlighter|powder/i.test(s))return 'COMPLEXION';
 return 'BEAUTY';
}
const sceneByCategory={
 LIP:{
  material:'唇妆质感的近距离镜头：自然唇纹、真实反射、高光克制，唇色仅在有经过核验的实拍参考时还原，不创造不存在的上嘴试色。',
  evidence:'口红/唇釉实际膏体、刷头、管身比例、色号与唇妆色泽必须来源于获准使用的实物图；没有证据时只生成无商品、无真实试色的背景板。',
  comparison:'通过经过核验的实物纹理局部、材质对比或公开的官方准确参数呈现信息；不凭想象制作手臂试色和持久度实验。',
  portrait:'只有具备授权人物参考时才生成真人面部与唇部画面；不可虚构本人已试色或个人评价。'
 },
 EYE:{
  material:'眼部妆效仅使用确认的真实色彩参考，保留真实皮肤和睫毛细节，避开夸张假睫毛和闪粉渲染。',
  evidence:'眼影盘形制、色块排布、压纹和真实色号都必须从原商品图复用，不允许AI改盘或改变色块。',
  comparison:'以准确色块平面图、真实纹理局部或经核验的功能说明作为信息页，不生成伪造眼妆实测。',
  portrait:'仅在持有已授权人物参考时使用眼部特写，并锁定同一人物的骨相、眉眼和小痣方向。'
 },
 SKIN:{
  material:'表现真实肤质、瓶身材质、水润质感，避免人造塑料皮、皮肤前后对比、实验室虚假证明。',
  evidence:'包装印字、滴管、泵头、瓶形与规格必须与准确的官方资产一致。',
  comparison:'只使用有公开且准确来源的成分、规格、使用方法信息，不捏造功效对比、临床数据或医学背书。',
  portrait:'人物肤质保留真实毛孔与微瑕；不生成或暗示未经验证的使用前后效果。'
 },
 COMPLEXION:{
  material:'真实底妆粉体、盘面压纹、光泽颗粒及刷具肌理；不允许镜面CG高光或错误的盘面。',
  evidence:'盘体、粉格数量、表面纹理与真实商品参考必须逐一吻合。',
  comparison:'用明确来源的色号信息、真实盘面裁切或独立排版的选择建议；不伪造真人前后效果。',
  portrait:'人像肤色和妆面自然、保留细节，避免过度磨皮和同一镜头机械重复。'
 },
 FRAGRANCE:{
  material:'玻璃瓶体折射、液体色彩、瓶盖连接、材质反射真实可信，不出现悬浮的虚假产品结构。',
  evidence:'瓶身字样、瓶盖、容量、品牌标志与准确资产同一，AI不得重画任何标签。',
  comparison:'使用可信的香调信息源或真实视觉灵感，不把个人感受写成实际试香体验。',
  portrait:'人物可为氛围出镜，但不得编造现场使用和真实消费者反馈。'
 },
 BEAUTY:{
  material:'真实材质微纹理与柔和层次，用摄影真实感优先于夸张造型。',
  evidence:'产品包装的任何细节均应从获准使用的实物参考中保真复用。',
  comparison:'信息页仅陈列可核验的规格与可靠事实，不创造试用对比。',
  portrait:'人物如出镜，必须使用实际授权参考，保留辨识特征，不能任意替换面容。'
 }
};
export const SHOT_PROFILES={
 P01:{name:'封面｜编辑式主视觉',mode:'EDITORIAL_HERO',
  shot:'人物环境肖像与商品主体的高级杂志封面布局，或在没有人物参考时采用有明确层次的高端静物封面。',
  light:'大面积单侧柔光做主光，背后极轻分离光，暖冷关系克制；真实摄影棚或可信窗边，不用虚假光束。',
  framing:'主体落于上中区域偏侧，留出顶部标题可读留白；一个视觉焦点，背景层次简洁。',
  lens:'全画幅 50mm 或 85mm 的现实摄影透视，自然景深、可辨的肌理。',
  typography:'主标题短句不超过两行，标题和编号由后期编辑层排版；画面本体完全不生字。'},
 P02:{name:'产品｜真实结构特写',mode:'TRUE_PRODUCT_PACKSHOT',
  shot:'核心商品一镜到底的单品商业静物，商品占主视觉，外观必须忠于提供的实物图/官方图。',
  light:'大面柔光加细节反光板，建立符合物理规律的边缘高光和真实接触阴影。',
  framing:'70%视觉重心给商品，三分构图；提供清晰边缘、不过度虚化的真实包装信息区。',
  lens:'真实微距摄影的 70–100mm 视角、适度景深；不得虚构广角形变。',
  typography:'页面标注只通过后期排版添加，先保证产品本身的可信度。'},
 P03:{name:'质感｜使用场景或材质',mode:'MATERIAL_IN_USE',
  shot:'突出商品真实材质、触感或经授权的真人局部使用场景，与封面镜头建立距离差。',
  light:'贴近真实自然窗光的斜侧光，以微弱阴影表现细腻质地，禁止重度美容磨皮。',
  framing:'中近景或局部近景，主视觉横纵比例协调，留出侧边信息区域，不能像另一张重复封面。',
  lens:'全画幅 85mm 肖像镜头或 100mm 微距，根据真实拍摄对象选择。',
  typography:'少量经核验的关键词后期排版，避免让AI绘制文字或虚假的体验标注。'},
 P04:{name:'信息｜可证实的细节与判断',mode:'EVIDENCE_EDITORIAL',
  shot:'整齐但不死板的证据型排版画面：真实素材裁切、准确的信息标签和一块简洁的材料特写。',
  light:'均衡漫射光，真实颜色优先，避免因为氛围光误导色号与质地。',
  framing:'整洁的双栏或三分栏信息架构；背景留出清楚的文字区，不生成浮夸贴纸、假测量图表。',
  lens:'客观的微距或正视台面视角；优先清晰展示而非戏剧化。',
  typography:'采用实际可编辑的文本和经核验的数据，所有表格、符号与中文由排版引擎完成。'},
 P05:{name:'结尾｜回收主题与品牌记忆',mode:'CLOSING_STILL_LIFE',
  shot:'与封面呼应但取景不同的高级静物或人物手部细节，形成视觉收束与内容判断。',
  light:'同系列主光方向和色温，光比柔和，安静、可信、收敛。',
  framing:'大量有效留白，画面收尾而非又一张产品宣传KV，保留重要的总结位置。',
  lens:'50–85mm 中近景，真实透视与边缘清晰度。',
  typography:'后期添加不夸大承诺的判断性结论，不生成煽动性购买文案。'}
};
export function buildVisualBrief(project,pageId){
 const shot=SHOT_PROFILES[pageId];
 if(!shot)throw new Error('未知页面：'+pageId);
 const product=project?.product||{};
 const pg=project?.copy?.pages?.find(x=>x.id===pageId)||{};
 const category=beautyCategory([product.brand,product.name,product.shade].join(' '));
 const detail=sceneByCategory[category];
 const personaName=safe(project?.persona?.name||'PERSONA-001',80);
 const productName=[product.brand,product.name,product.shade,product.spec].map(x=>safe(x,160)).filter(Boolean).join('｜');
 const isVerified=product.verified===true;
 const title=safe(pg.headline,200)||'（待确认本页标题）';
 const body=safe(pg.body,1200)||'（暂无经核验的页面内容）';
 const blocking=isVerified?[]:['商品尚未完成人工身份核验：只允许做不含真实商品的构图预演。'];
 const referenceRule='官方商品页面链接只证明资料来源，不等于已获得可用于生图的高质量产品参考图，也不等于素材使用授权。';
 const notes=[
  '先执行「真实商品资产核验 → 低成本构图预演 → 背景/人物单独生成 → 真实商品抠图合成 → 可编辑中文文字排版 → 成品审核」，切忌一步到位让模型同时伪造商品、人物和文字。',
  '如缺少产品的合法精确参考图：只制作可复用环境底片，不生成商品包装、Logo、色号和不存在的真实试用效果。',
  '如缺少已授权人物参考：不生成固定人设正脸，使用不出镜方案。',
  referenceRule
 ];
 const prompt=[
  'XP Studio | BEAUTY EDITORIAL ART DIRECTION | '+VISUAL_STANDARD_VERSION,
  'SHOT '+pageId+' | '+shot.name+' | '+shot.mode,
  'PROJECT: '+safe(project?.name,130),
  'PRODUCT (reference identity only, never fabricate): '+(productName||'商品未锁定'),
  'FACT SOURCE (manual verification required): '+(safe(product.source_url,500)||'未提供'),
  'EDITORIAL STORY: '+title+'。'+body,
  'FINAL DELIVERY: portrait 3:4, 1086×1448 px after compositing; no text in the generative image.',
  'CAMERA & SCENE: '+shot.shot,
  'REALISTIC LIGHTING: '+shot.light,
  'COMPOSITION: '+shot.framing,
  'OPTICS & TEXTURE: '+shot.lens,
  'CATEGORY-SPECIFIC MATERIAL: '+detail.material,
  'PRODUCT ASSET FIDELITY: '+detail.evidence,
  'PERSONA RULE: '+detail.portrait+' Identity anchor '+personaName+'。不允许镜像，已授权肖像参考中的右颧骨小痣保持于人物原始解剖右侧。没有已授权原始参考，不得自行编造人脸身份。',
  'TYPOGRAPHY & LAYOUT: '+shot.typography+' 文字、Logo与参数使用合法真实资产与后期可编辑图层，不让图像模型生成中文汉字。',
  'VISUAL SERIES DNA: natural believable premium beauty editorial photography, restrained chroma, coherent directional light, organic micro-textures, rich yet natural tonal range; five distinct camera compositions, not five duplicate images.',
  'NON-NEGOTIABLE NEGATIVES: fabricated packaging, altered logo, imaginary shade or SKU, invented testimonial, false before/after, fake swatch, over-smoothed skin, CGI plastic texture, excessive HDR, exaggerated rim light, random text, watermark, cluttered collage, disconnected objects, anatomically wrong hands.',
  'OUTPUT BEHAVIOR: If exact product photo is not independently supplied, render a photography-grade BACKGROUND PLATE with clear reserved space for licensed product asset compositing. Never invent or redraw real packaging. If identity reference is missing, omit identifiable face. Do not claim any test or real-world shoot happened.',
  ...notes.map((line,i)=>'PRODUCTION GATE '+(i+1)+': '+line),
  ...(blocking.map(x=>'BLOCKED: '+x))
 ].join('\n\n');
 return {page_id:pageId,version:VISUAL_STANDARD_VERSION,category,role:shot.name,mode:shot.mode,
  final_canvas:FINAL_CANVAS,product_verified:isVerified,production_ready:false,blocking,notes,
  needs:['已授权且精确对应SKU的真实商品素材','如有人像则需已授权的原始人物参考','待校对的中文排版文本','发布平台的实际上传预览'],
  human_qa:QA_LABELS,prompt};
}
