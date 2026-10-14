import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const workspaceProject = path.resolve(root, '../../outputs/aircraft-portfolio-copy');
const project = fs.existsSync(path.join(workspaceProject, 'node_modules')) ? workspaceProject : path.resolve(root, '../../..');
const T = await import(pathToFileURL(path.join(project, 'node_modules/three/build/three.module.js')).href);
function parse(file, translation = [0, 0, 0]) {
  const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
  const mats = [], objects = []; let n = 0;
  while (n < lines.length) {
    const line = lines[n++].trim();
    if (line.startsWith('MATERIAL')) mats.push({ name: line.match(/"([^"]+)"/)[1], rgb: line.match(/rgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/).slice(1).map(Number) });
    if (line !== 'OBJECT poly') continue;
    const o = { name: '', texture: null, vertices: [], faces: [], mats };
    while (n < lines.length) {
      const l = lines[n++].trim();
      if (l.startsWith('name ')) o.name = JSON.parse(l.slice(5));
      else if (l.startsWith('texture ')) o.texture = JSON.parse(l.slice(8));
      else if (l.startsWith('numvert ')) for (let j = 0; j < Number(l.split(/\s+/)[1]); j++) o.vertices.push(lines[n++].trim().split(/\s+/).map((v, k) => Number(v) + translation[k]));
      else if (l.startsWith('numsurf ')) {
        const count = Number(l.split(/\s+/)[1]);
        for (let j = 0; j < count; j++) {
          const flag = parseInt(lines[n++].trim().split(/\s+/)[1]);
          const mat = Number(lines[n++].trim().split(/\s+/)[1]);
          const count = Number(lines[n++].trim().split(/\s+/)[1]), v = [];
          for (let k = 0; k < count; k++) v.push(lines[n++].trim().split(/\s+/).map(Number));
          o.faces.push({ flag, mat, v });
        }
      } else if (l.startsWith('kids')) break;
    }
    objects.push(o);
  }
  return objects;
}
// AC3D uses Y up; FlightGear's offsets use Z up.
const objects = [...parse('CRJ700.ac'), ...parse('CRJ700-engine.ac', [6.796, -.31, -2.27]), ...parse('CRJ700-engine.ac', [6.796, -.31, 2.27])];
const drop = /Wire|CargoRoom|Int$|Well|RAT|Stair|Landing|Gear[LR]Door/i;
const groups = new Map();
for (const o of objects.filter(o => !drop.test(o.name))) {
  const normals = o.vertices.map(() => new T.Vector3());
  for (const f of o.faces) {
    if (f.v.length < 3) continue;
    const a = new T.Vector3(...o.vertices[f.v[0][0]]), b = new T.Vector3(...o.vertices[f.v[1][0]]), c = new T.Vector3(...o.vertices[f.v[2][0]]);
    f.normal = b.sub(a).cross(c.sub(a)); for (const r of f.v) normals[r[0]].add(f.normal);
  }
  normals.forEach(v => v.normalize());
  for (const f of o.faces) {
    if (f.v.length < 3 || (f.flag & 15) !== 0) continue;
    const source = o.mats[f.mat];
    const type = /Windows|Glass/i.test(o.name + source.name) ? 'glass' : /Chrome|Metal|Slats|Flap|Spoiler/i.test(o.name + source.name) ? 'chrome' : o.texture ? (o.texture === 'engine.png' ? 'engine' : 'paint') : 'solid';
    const key = type === 'solid' ? type + source.rgb.join(',') : type;
    if (!groups.has(key)) groups.set(key, { type, rgb: source.rgb, p: [], n: [], uv: [], ix: [] });
    const out = groups.get(key), base = out.p.length / 3;
    for (const [id, u, v] of f.v) {
      out.p.push(...o.vertices[id]); const normal = f.flag & 16 ? normals[id] : f.normal.clone().normalize();
      out.n.push(normal.x, normal.y, normal.z); out.uv.push(u, 1 - v);
    }
    for (let k = 1; k < f.v.length - 1; k++) out.ix.push(base, base + k, base + k + 1);
  }
}
const chunks = [], views = [], accessors = []; let offset = 0;
function buffer(data, target) {
  while (offset % 4) { chunks.push(Buffer.from([0])); offset++; }
  const i = views.length; views.push({ buffer: 0, byteOffset: offset, byteLength: data.byteLength, ...(target ? { target } : {}) });
  chunks.push(Buffer.from(data.buffer, data.byteOffset, data.byteLength)); offset += data.byteLength; return i;
}
function accessor(data, size, componentType, target) {
  const a = { bufferView: buffer(data, target), componentType, count: data.length / size, type: { 1: 'SCALAR', 2: 'VEC2', 3: 'VEC3' }[size] };
  if (size === 3 && target === 34962) {
    a.min = [Infinity, Infinity, Infinity]; a.max = [-Infinity, -Infinity, -Infinity];
    for (let j = 0; j < data.length; j++) { a.min[j % 3] = Math.min(a.min[j % 3], data[j]); a.max[j % 3] = Math.max(a.max[j % 3], data[j]); }
  }
  accessors.push(a); return accessors.length - 1;
}
const images = ['CRJ700-Blank.png', 'engine.png'].map(name => ({ bufferView: buffer(new Uint8Array(fs.readFileSync(path.join(root, name)))), mimeType: 'image/png' }));
const materials = [], primitives = [];
for (const [name, g] of groups) {
  const pbr = g.type === 'paint' || g.type === 'engine' ? { baseColorTexture: { index: g.type === 'paint' ? 0 : 1 }, metallicFactor: .18, roughnessFactor: .3 } :
    g.type === 'glass' ? { baseColorFactor: [.025, .05, .085, 1], metallicFactor: .45, roughnessFactor: .16 } :
    g.type === 'chrome' ? { baseColorFactor: [.62, .68, .74, 1], metallicFactor: .9, roughnessFactor: .2 } :
    { baseColorFactor: [...g.rgb, 1], metallicFactor: .15, roughnessFactor: .4 };
  const m = materials.length; materials.push({ name, doubleSided: true, pbrMetallicRoughness: pbr });
  const indices = g.p.length / 3 < 65536 ? new Uint16Array(g.ix) : new Uint32Array(g.ix);
  primitives.push({ attributes: { POSITION: accessor(new Float32Array(g.p), 3, 5126, 34962), NORMAL: accessor(new Float32Array(g.n), 3, 5126, 34962), TEXCOORD_0: accessor(new Float32Array(g.uv), 2, 5126, 34962) }, indices: accessor(indices, 1, indices instanceof Uint16Array ? 5123 : 5125, 34963), material: m });
}
while (offset % 4) { chunks.push(Buffer.from([0])); offset++; }
const doc = { asset: { version: '2.0', generator: 'Ryan Skyop Miller / FlightGear CRJ700-family; CC-BY-4.0; exterior-only conversion' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], meshes: [{ primitives }], materials, images, textures: [{ source: 0, sampler: 0 }, { source: 1, sampler: 0 }], samplers: [{ magFilter: 9729, minFilter: 9987 }], buffers: [{ byteLength: offset }], bufferViews: views, accessors };
let json = Buffer.from(JSON.stringify(doc)); while (json.length % 4) json = Buffer.concat([json, Buffer.from(' ')]);
const bin = Buffer.concat(chunks), header = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + bin.length, 8);
jh.writeUInt32LE(json.length); jh.writeUInt32LE(0x4e4f534a, 4); bh.writeUInt32LE(bin.length); bh.writeUInt32LE(0x004e4942, 4);
const output = path.join(project, 'public/models/crj700'); fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'crj700-cruise.glb'), Buffer.concat([header, jh, json, bh, bin]));
if (path.resolve(root) !== path.resolve(output)) for (const name of ['CRJ700.ac', 'CRJ700-engine.ac', 'CRJ700-Blank.png', 'engine.png', 'README.md', 'LICENSE', 'convert.mjs']) fs.copyFileSync(path.join(root, name), path.join(output, name));
const bbox = new T.Box3(); for (const g of groups.values()) for (let i = 0; i < g.p.length; i += 3) bbox.expandByPoint(new T.Vector3(g.p[i], g.p[i + 1], g.p[i + 2]));
console.log({ triangles: primitives.reduce((a, p) => a + accessors[p.indices].count / 3, 0), materials: materials.length, bytes: 28 + json.length + bin.length, bounds: bbox });
