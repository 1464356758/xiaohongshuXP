// XP Editorial Canvas Renderer v0.2
// Local, deterministic typography export. This renders a user-supplied photo;
// it never creates a product image, a human identity, or an unsupported claim.
const W=1086,H=1448;
const COLORS={paper:'#f8f3ef',ink:'#2c2228',quiet:'#82737b',accent:'#874968',line:'#e6dade',light:'#fffdfa'};
const FNT='"Noto Sans SC","PingFang SC","Microsoft Yahei",sans-serif';
function fittedImage(ctx,image,x,y,w,h,focusX=.5,focusY=.5){
 const iw=image.width,ih=image.height,ratio=Math.max(w/iw,h/ih);
 const rw=iw*ratio,rh=ih*ratio;
 const ox=Math.min(0,Math.max(w-rw,(w-rw)*focusX));
 const oy=Math.min(0,Math.max(h-rh,(h-rh)*focusY));
 ctx.drawImage(image,x+ox,y+oy,rw,rh);
}
function breakIntoLines(ctx,text,maxWidth,maxLines){
 const chars=Array.from(String(text??'').replace(/\s+/g,' ').trim());
 const lines=[];let line='';
 for(const char of chars){
  const tryLine=line+char;
  if(ctx.measureText(tryLine).width>maxWidth&&line){
   lines.push(line);line=char;if(lines.length===maxLines)break;
  }else{line=tryLine;}
 }
 if(lines.length<maxLines&&line)lines.push(line);
 if(lines.join('')!==chars.join('')&&lines.length){
  let last=lines.length-1;
  while(lines[last]&&ctx.measureText(lines[last]+'…').width>maxWidth)lines[last]=lines[last].slice(0,-1);
  lines[last]+='…';
 }
 return lines;
}
function textBlock(ctx,text,{x,y,width,size=70,min=42,lines=2,color=COLORS.ink,weight=700,lineHeight=1.32}){
 const value=String(text??'').trim();
 if(!value)return y;
 let scale=size,drawLines=[];
 for(;scale>=min;scale-=2){
  ctx.font=weight+' '+scale+'px '+FNT;
  drawLines=breakIntoLines(ctx,value,width,lines);
  const originalLength=Array.from(value.replace(/\s+/g,' ')).length;
  if(drawLines.join('').replace(/…$/,'').length>=originalLength||scale<=min)break;
 }
 ctx.fillStyle=color;ctx.textBaseline='top';
 const lh=scale*lineHeight;
 drawLines.forEach((line,i)=>ctx.fillText(line,x,y+i*lh));
 return y+lh*drawLines.length;
}
function letterSpacing(ctx,text,x,y,size=24,tracking=5,color=COLORS.quiet){
 ctx.font='600 '+size+'px '+FNT;ctx.fillStyle=color;ctx.textBaseline='top';let cursor=x;
 for(const ch of Array.from(String(text))) {ctx.fillText(ch,cursor,y);cursor+=ctx.measureText(ch).width+tracking;}
}
function horizontal(ctx,x,y,w){ctx.fillStyle=COLORS.line;ctx.fillRect(x,y,w,2);}
function label(ctx,prefix,y){letterSpacing(ctx,prefix,80,y,20,4,COLORS.accent);}
function pageNumber(ctx,number,light=false){
 ctx.font='500 21px '+FNT;ctx.textBaseline='top';ctx.fillStyle=light?'#fffaf1':COLORS.quiet;
 ctx.fillText(String(number).padStart(2,'0')+' / 05',932,1387);
}
function bottomBar(ctx,caption,account){
 horizontal(ctx,80,1322,926);
 ctx.font='400 24px '+FNT;ctx.fillStyle=COLORS.quiet;ctx.textBaseline='top';
 ctx.fillText(String(account||'BEAUTY EDITORIAL').slice(0,22),80,1354);
 const c=String(caption||'').slice(0,50);
 if(c)ctx.fillText(c,80,1250);
}
function gradient(ctx,y,h,opacity=.9){
 const gr=ctx.createLinearGradient(0,y,0,y+h);
 gr.addColorStop(0,'rgba(14,11,15,0)');gr.addColorStop(.5,'rgba(21,15,22,'+(opacity*.55)+')');
 gr.addColorStop(1,'rgba(21,15,22,'+opacity+')');
 ctx.fillStyle=gr;ctx.fillRect(0,y,W,h);
}
function draw(ctx,image,page,account,focus){
 const id=page.id||'P01',title=String(page.headline||'').trim(),description=String(page.body||'').trim();
 if(!title)throw new Error('请先填写本页标题再排版');
 ctx.fillStyle=COLORS.paper;ctx.fillRect(0,0,W,H);
 if(id==='P01'){
  fittedImage(ctx,image,0,0,W,H,focus.x,focus.y);
  gradient(ctx,770,678,.86);
  letterSpacing(ctx,'THE BEAUTY EDIT',82,93,20,5,'#fffaf3');
  horizontal(ctx,82,1010,85);
  textBlock(ctx,title,{x:82,y:1050,width:900,size:87,min:54,lines:2,color:'#fffefa'});
  ctx.fillStyle='#f3dfe8';ctx.font='400 29px '+FNT;ctx.textBaseline='top';
  ctx.fillText(String(account||'BEAUTY EDITORIAL').slice(0,23),82,1365);
  pageNumber(ctx,1,true);
 }else if(id==='P02'){
  fittedImage(ctx,image,0,0,W,991,focus.x,focus.y);
  ctx.fillStyle=COLORS.light;ctx.fillRect(0,991,W,457);
  label(ctx,'PRODUCT / 02',1022);
  horizontal(ctx,80,1058,926);
  textBlock(ctx,title,{x:80,y:1090,width:915,size:72,min:42,lines:2});
  if(description)textBlock(ctx,description,{x:81,y:1316,width:790,size:27,min:24,lines:1,color:COLORS.quiet,weight:400});
  pageNumber(ctx,2);
 }else if(id==='P03'){
  fittedImage(ctx,image,0,0,W,1005,focus.x,focus.y);
  ctx.fillStyle=COLORS.paper;ctx.fillRect(0,1005,W,443);
  letterSpacing(ctx,'TEXTURE & DETAIL',80,1055,19,5,COLORS.accent);
  textBlock(ctx,title,{x:80,y:1110,width:900,size:70,min:42,lines:2});
  bottomBar(ctx,'',account);pageNumber(ctx,3);
 }else if(id==='P04'){
  fittedImage(ctx,image,0,0,W,834,focus.x,focus.y);
  ctx.fillStyle=COLORS.light;ctx.fillRect(0,834,W,614);
  label(ctx,'THE DETAILS / 04',872);
  textBlock(ctx,title,{x:80,y:915,width:910,size:70,min:42,lines:2});
  horizontal(ctx,80,1120,926);
  if(description)textBlock(ctx,description,{x:80,y:1155,width:900,size:29,min:26,lines:3,color:COLORS.quiet,weight:400});
  pageNumber(ctx,4);
 }else{
  fittedImage(ctx,image,0,0,W,H,focus.x,focus.y);
  gradient(ctx,730,718,.91);
  letterSpacing(ctx,'FINAL THOUGHTS',82,965,19,4,'#fbe7eb');
  textBlock(ctx,title,{x:82,y:1030,width:900,size:77,min:48,lines:2,color:'#fffafa'});
  if(description)textBlock(ctx,description,{x:82,y:1250,width:865,size:29,min:24,lines:2,color:'#f0e2e7',weight:400});
  pageNumber(ctx,5,true);
 }
}
export async function renderEditorialImage(file,page,account='',focus={x:.5,y:.5},format='png'){
 if(!(file instanceof Blob))throw new Error('请先选择可读取的底片');
 if(file.size>15_000_000)throw new Error('底片文件超过15MB');
 const allowed=['image/png','image/jpeg','image/webp'];
 if(!allowed.includes(file.type))throw new Error('请使用PNG/JPG/WebP摄影底片');
 if(!['P01','P02','P03','P04','P05'].includes(page?.id))throw new Error('无效页码');
 const img=await createImageBitmap(file);
 try{
  if(img.width<650||img.height<850)throw new Error('底片像素过低，建议至少1086×1448以避免明显放大模糊');
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('浏览器不支持Canvas');
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  draw(ctx,img,page,account,focus);
  if(!['png','jpg'].includes(format))throw new Error('只支持PNG或高质量JPG导出');
  const mime=format==='jpg'?'image/jpeg':'image/png';
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,mime,.94));
  if(!blob)throw new Error('PNG导出失败');
  return blob;
 }finally{img.close();}
}

export const renderEditorialPNG=(file,page,account='',focus={x:.5,y:.5})=>renderEditorialImage(file,page,account,focus,'png');
export const renderEditorialJPG=(file,page,account='',focus={x:.5,y:.5})=>renderEditorialImage(file,page,account,focus,'jpg');
