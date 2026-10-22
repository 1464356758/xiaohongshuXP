import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectImageDimensions} from '../lib/image-dimensions.mjs';

test('PNG IHDR gets full raster size',()=>{
 const header=Buffer.alloc(40);
 Buffer.from('89504e470d0a1a0a','hex').copy(header,0);
 header.write('IHDR',12);header.writeUInt32BE(1086,16);header.writeUInt32BE(1448,20);
 assert.deepEqual(inspectImageDimensions(header,'png'),{width:1086,height:1448});
});
test('JPEG SOF0 dimensions are extracted',()=>{
 const sample=Buffer.from([0xff,0xd8,0xff,0xc0,0,0x11,8,0x05,0xa8,0x04,0x3e,3,1,0x11,0,2,0x11,0,3,0x11,0,0xff,0xd9]);
 assert.deepEqual(inspectImageDimensions(sample,'jpg'),{width:1086,height:1448});
});
test('WEBP VP8X canvas size is extracted',()=>{
 const header=Buffer.alloc(30);
 header.write('RIFF',0);header.write('WEBP',8);header.write('VP8X',12);
 const w=1086-1,h=1448-1;
 header[24]=w&0xff;header[25]=(w>>8)&0xff;header[26]=(w>>16)&0xff;
 header[27]=h&0xff;header[28]=(h>>8)&0xff;header[29]=(h>>16)&0xff;
 assert.deepEqual(inspectImageDimensions(header,'webp'),{width:1086,height:1448});
});
test('broken uploads rejected at header level',()=>{
 assert.throws(()=>inspectImageDimensions(Buffer.alloc(25),'png'),/结构/);
 assert.throws(()=>inspectImageDimensions(Buffer.from([0xff,0xd8]),'jpg'),/结构/);
 assert.throws(()=>inspectImageDimensions(Buffer.alloc(50),'webp'),/结构/);
});
