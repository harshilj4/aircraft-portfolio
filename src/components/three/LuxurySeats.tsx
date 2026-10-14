"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useAppStore } from "@/stores/useAppStore";

type SeatPosition = { x: number; z: number; rotation?: number };
const PARTS = [
  { size: [.83,.25,.95], at: [0,-.71,0], color: "#70442d" },
  { size: [.77,.19,.79], at: [-.04,-.49,0], color: "#cdbb9e" },
  { size: [.23,1.04,.83], at: [.34,.03,0], color: "#cdbb9e" },
  { size: [.27,.27,.72], at: [.37,.63,0], color: "#b8a080" },
  { size: [.74,.16,.14], at: [-.03,-.22,-.48], color: "#976b49" },
  { size: [.74,.16,.14], at: [-.03,-.22,.48], color: "#976b49" },
  { size: [.46,.25,.55], at: [0,-.87,0], color: "#252c32" },
  { size: [.025,.28,.53], at: [.475,-.12,0], color: "#866749" },
  { size: [.028,.018,.66], at: [.205,.5,0], color: "#eadbc4" },
];

export function ClubSeats({ seats }: { seats: SeatPosition[] }) {
  const meshes = useRef<THREE.InstancedMesh[]>([]);
  const { camera } = useThree();
  const geometries = useMemo(() => PARTS.map(p => new RoundedBoxGeometry(p.size[0],p.size[1],p.size[2],2,Math.min(...p.size)*.3)), []);
  useEffect(() => () => geometries.forEach(g => g.dispose()), [geometries]);
  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    PARTS.forEach((part, n) => {
      seats.forEach((seat, i) => {
        const a = seat.rotation ?? 0, [x,y,z] = part.at;
        object.position.set(seat.x+Math.cos(a)*x+Math.sin(a)*z,y,seat.z-Math.sin(a)*x+Math.cos(a)*z);
        object.rotation.set(0,a,n===2||n===3?-.09:0);
        object.updateMatrix(); meshes.current[n].setMatrixAt(i,object.matrix);
      });
      meshes.current[n].instanceMatrix.needsUpdate = true;
      meshes.current[n].computeBoundingSphere();
    });
  }, [seats]);
  const sit = (e: ThreeEvent<MouseEvent>) => {
    if(e.delta>6||e.instanceId===undefined)return;
    const seat=seats[e.instanceId];
    if(Math.hypot(camera.position.x-seat.x,camera.position.z-seat.z)>3.5)return;
    e.stopPropagation();useAppStore.getState().setSeatAt({x:seat.x,z:seat.z});
  };
  return <group>
    {PARTS.map((p,i)=><instancedMesh key={i} ref={m=>{if(m)meshes.current[i]=m;}} args={[geometries[i],undefined,seats.length]} onClick={sit}>
      <meshLambertMaterial color={p.color}/>
    </instancedMesh>)}
  </group>;
}

/** CC0 Poly Haven chair, normalized once and rendered with two diffuse maps.
 * Geometry and textures are shared by every chair; no costly normal/ARM maps. */
export function ImportedLoungeChair({x,z,ry}:{x:number;z:number;ry:number}) {
  const {scene}=useGLTF("/models/lounge-chair/lounge-chair.glb");
  const {camera}=useThree();
  const parts=useMemo(()=>{
    scene.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(scene),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    const scale=1.28/size.y,out:{geometry:THREE.BufferGeometry;map:THREE.Texture|null;color:string}[]=[];
    scene.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      const m=o.material as THREE.MeshStandardMaterial;
      const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
      geometry.translate(-center.x,-box.min.y,-center.z);geometry.scale(scale,scale,scale);
      out.push({geometry,map:m.map,color:m.name.includes("pillow")?"#e7d9bf":"#c5a27c"});
    });return out;
  },[scene]);
  useEffect(()=>()=>parts.forEach(p=>p.geometry.dispose()),[parts]);
  return <group position={[x,-.99,z]} rotation={[0,ry,0]} onClick={(e:ThreeEvent<MouseEvent>)=>{
    if(e.delta>6||Math.hypot(camera.position.x-x,camera.position.z-z)>3.5)return;
    e.stopPropagation();useAppStore.getState().setSeatAt({x,z});
  }}>
    {parts.map((p,i)=><mesh key={i} geometry={p.geometry}><meshLambertMaterial map={p.map} color={p.color}/></mesh>)}
  </group>;
}

