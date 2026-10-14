import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const workspaceProject=path.resolve(root,'../../outputs/aircraft-portfolio-copy');
const projectRoot=fs.existsSync(path.join(workspaceProject,'node_modules'))?workspaceProject:path.resolve(root,'../../..');
const T=await import(pathToFileURL(path.join(projectRoot,'node_modules/three/build/three.module.js')).href);
const lines=fs.readFileSync(path.join(root,'CitationX.ac'),'utf8').split(/\r?\n/);
const mats=[],objects=[];let n=0;
while(n<lines.length){
 const line=lines[n++].trim();
 if(line.startsWith('MATERIAL')){const rgb=line.match(/rgb ([\d.]+) ([\d.]+) ([\d.]+)/);mats.push({name:line.match(/"([^"]+)"/)[1],rgb:rgb.slice(1).map(Number)});}
 if(line!=='OBJECT poly')continue;
 const o={name:'',texture:null,vertices:[],faces:[]};
 while(n<lines.length){
  const l=lines[n++].trim();
  if(l.startsWith('name '))o.name=JSON.parse(l.slice(5));
  else if(l.startsWith('texture '))o.texture=JSON.parse(l.slice(8));
  else if(l.startsWith('numvert ')){for(let j=0;j<Number(l.split(' ')[1]);j++)o.vertices.push(lines[n++].trim().split(/\s+/).map(Number));}
  else if(l.startsWith('numsurf ')){
   const count=Number(l.split(' ')[1]);for(let j=0;j<count;j++){
    const flag=parseInt(lines[n++].split(' ')[1]);const mat=Number(lines[n++].split(' ')[1]);const refs=Number(lines[n++].split(' ')[1]);const v=[];
    for(let k=0;k<refs;k++)v.push(lines[n++].trim().split(/\s+/).map(Number));o.faces.push({flag,mat,v});
   }
  }else if(l.startsWith('kids'))break;
 }
 objects.push(o);
}
const drop=/wheel|strut|shock|damper|arm[LU]|well|^step$|^Bcn|^Land|^Taxi|^Strb|Lamps|navlights|redlamp|^[LR]Geardoor/i;
const kept=objects.filter(o=>!drop.test(o.name));
console.log('Retained',kept.map(o=>o.name).join(', '));
const grouped=new Map();
for(const o of kept){
 const normals=o.vertices.map(()=>new T.Vector3());
 for(const f of o.faces){if(f.v.length<3)continue;const a=new T.Vector3(...o.vertices[f.v[0][0]]),b=new T.Vector3(...o.vertices[f.v[1][0]]),c=new T.Vector3(...o.vertices[f.v[2][0]]);f.normal=b.sub(a).cross(c.sub(a));for(const r of f.v)normals[r[0]].add(f.normal);}
 normals.forEach(v=>v.normalize());
 for(const f of o.faces){
  if(f.v.length<3||(f.flag&0xf)!==0)continue;
  let type=o.name==='Glass'?'glass':/chrome|heater|slat/i.test(o.name)?'chrome':o.texture?'paint':mats[f.mat].name==='transp'?'glass':'solid';
  const key=type+(type==='solid'?'-'+f.mat:'');
  if(!grouped.has(key))grouped.set(key,{type,mat:f.mat,p:[],normal:[],uv:[],ix:[]});const out=grouped.get(key),base=out.p.length/3;
  for(const [id,u,v] of f.v){out.p.push(...o.vertices[id]);const norm=(f.flag&0x10)?normals[id]:f.normal.clone().normalize();out.normal.push(norm.x,norm.y,norm.z);out.uv.push(u,1-v);}
  for(let k=1;k<f.v.length-1;k++)out.ix.push(base,base+k,base+k+1);
 }
}
const chunks=[],views=[],accessors=[];let offset=0;
function buffer(data,target){while(offset%4){chunks.push(Buffer.from([0]));offset++;}const v=views.length;views.push({buffer:0,byteOffset:offset,byteLength:data.byteLength,...(target?{target}:{})});chunks.push(Buffer.from(data.buffer,data.byteOffset,data.byteLength));offset+=data.byteLength;return v;}
function accessor(data,size,type,target){const view=buffer(data,target);const i=accessors.length;const a={bufferView:view,componentType:type,count:data.length/size,type:{1:'SCALAR',2:'VEC2',3:'VEC3'}[size]};if(size===3&&target===34962){a.min=[Infinity,Infinity,Infinity];a.max=[-Infinity,-Infinity,-Infinity];for(let j=0;j<data.length;j++){a.min[j%3]=Math.min(a.min[j%3],data[j]);a.max[j%3]=Math.max(a.max[j%3],data[j]);}}accessors.push(a);return i;}
const image=buffer(new Uint8Array(fs.readFileSync(path.join(root,'livery1.png'))));
const glMaterials=[],primitives=[];
for(const [key,g] of grouped){
 const mat=g.type==='paint'?{name:key,pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:.16,roughnessFactor:.3}}:
 g.type==='glass'?{name:key,pbrMetallicRoughness:{baseColorFactor:[.022,.045,.068,1],metallicFactor:.5,roughnessFactor:.16}}:
 g.type==='chrome'?{name:key,pbrMetallicRoughness:{baseColorFactor:[.63,.71,.77,1],metallicFactor:.92,roughnessFactor:.2}}:
 {name:key,pbrMetallicRoughness:{baseColorFactor:[...mats[g.mat].rgb,1],metallicFactor:.15,roughnessFactor:.38}};
 mat.doubleSided=true;const m=glMaterials.length;glMaterials.push(mat);
 primitives.push({attributes:{POSITION:accessor(new Float32Array(g.p),3,5126,34962),NORMAL:accessor(new Float32Array(g.normal),3,5126,34962),TEXCOORD_0:accessor(new Float32Array(g.uv),2,5126,34962)},indices:accessor(new Uint32Array(g.ix),1,5125,34963),material:m});
}
while(offset%4){chunks.push(Buffer.from([0]));offset++;}
const doc={asset:{version:'2.0',generator:'AC3D exterior conversion; Syd Adams / FlightGear / SurferTim, GPL-2.0-or-later'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{name:'Citation X exterior',primitives}],materials:glMaterials,textures:[{source:0,sampler:0}],samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}],images:[{bufferView:image,mimeType:'image/png'}],buffers:[{byteLength:offset}],bufferViews:views,accessors};
let json=Buffer.from(JSON.stringify(doc));while(json.length%4)json=Buffer.concat([json,Buffer.from(' ')]);const bin=Buffer.concat(chunks);
const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+json.length+8+bin.length,8);
const jh=Buffer.alloc(8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
const output=path.join(projectRoot,'public/models/citation-x');fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'citation-x.glb'),Buffer.concat([header,jh,json,bh,bin]));
if(path.resolve(root)!==path.resolve(output))for(const name of ['CitationX.ac','livery1.png','COPYING','README.md','model.xml','convert.mjs'])fs.copyFileSync(path.join(root,name),path.join(output,name));
const bbox=new T.Box3();for(const o of kept)for(const p of o.vertices)bbox.expandByPoint(new T.Vector3(...p));
console.log({triangles:primitives.reduce((a,p)=>a+accessors[p.indices].count/3,0),draws:primitives.length,bytes:12+8+json.length+8+bin.length,bounds:bbox});
