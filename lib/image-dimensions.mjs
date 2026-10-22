// Header-level image dimension validation for studio upload preflight.
// Real image decodability still depends on browser image preview / manual review.
export function inspectImageDimensions(input,ext){
 const b=Buffer.isBuffer(input)?input:Buffer.from(input);
 if(ext==='png'){
  if(b.length<24||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.subarray(12,16).toString()!=='IHDR')throw new Error('PNG文件结构无效');
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
 }
 if(ext==='jpg'){
  if(b.length<12||b.readUInt16BE(0)!==0xffd8)throw new Error('JPG文件结构无效');
  let p=2;
  while(p+4<=b.length){
   if(b[p++]!==0xff)throw new Error('JPG标记损坏');
   while(p<b.length&&b[p]===0xff)p++;
   if(p>=b.length)break;
   const marker=b[p++];
   if(marker===0xd9||marker===0xda)break;
   if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
   if(p+2>b.length)break;
   const size=b.readUInt16BE(p);
   if(size<2||p+size>b.length)break;
   if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
    if(size<7)break;
    return {height:b.readUInt16BE(p+3),width:b.readUInt16BE(p+5)};
   }
   p+=size;
  }
  throw new Error('无法读取JPG画幅尺寸');
 }
 if(ext==='webp'){
  if(b.length<30||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')throw new Error('WEBP结构无效');
  const type=b.toString('ascii',12,16);
  if(type==='VP8X'){
   const width=1+b[24]+(b[25]<<8)+(b[26]<<16);
   const height=1+b[27]+(b[28]<<8)+(b[29]<<16);
   return {width,height};
  }
  if(type==='VP8L'){
   if(b[20]!==0x2f)throw new Error('WEBP lossless结构无效');
   const width=1+b[21]+((b[22]&0x3f)<<8);
   const height=1+(b[22]>>6)+(b[23]<<2)+((b[24]&0xf)<<10);
   return {width,height};
  }
  if(type==='VP8 '){
   if(b[23]!==0x9d||b[24]!==0x01||b[25]!==0x2a)throw new Error('WEBP lossy结构无效');
   return {width:b.readUInt16LE(26)&0x3fff,height:b.readUInt16LE(28)&0x3fff};
  }
  throw new Error('WEBP编码格式不支持');
 }
 throw new Error('未知的图片文件类型');
}
