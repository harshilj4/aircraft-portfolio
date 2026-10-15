"use client";
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import type {ThreeEvent} from "@react-three/fiber";
import {useCursor,useGLTF} from "@react-three/drei";
import {useAppStore} from "@/stores/useAppStore";
import { useCanvasTexture } from "@/lib/canvasTexture";
import type {PerfProfile} from "@/lib/device";

/** FlightGear CRJ700 exterior by Ryan Miller and contributors; CC-BY-4.0.
 * Source, converter and attribution accompany the local GLB in public/models.
 * No simulator interior, gear, lights, shadows or network requests at runtime.
 */
export default function Aircraft({profile}:{profile:PerfProfile}) {
  const gltf=useGLTF("/models/crj700/crj700-cruise.glb");
  const root=useRef<THREE.Group>(null!),start=useRef<number|null>(null);
  const reduced=useAppStore(s=>s.reducedMotion),mode=useAppStore(s=>s.mode),board=useAppStore(s=>s.board);
  const time=useAppStore(s=>s.timeOfDay);
  const nav=useRef<THREE.MeshBasicMaterial>(null!);
  const [hovered,setHovered]=useState(false);useCursor(hovered&&mode==="landing");
  const jet=useMemo(()=>{
    const scene=gltf.scene.clone(true);
    scene.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      o.castShadow=o.receiveShadow=false;
      const source=o.material as THREE.MeshStandardMaterial,m=source.clone();
      m.envMapIntensity=.55;
      if(m.name==="chrome"){m.roughness=.46;m.metalness=.55;m.color.set("#bda371");
        // Source slats/flaps/metal skins overlap the base wing at cruise.
        m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-2;}
      if(m.map)m.map.anisotropy=4;
      if(m.name==="paint") {
        m.metalness=.12;m.roughness=.43;
        // A restrained black finish and thin gold cheatline retain the source panel detail.
        m.onBeforeCompile=shader=>{
          shader.vertexShader="varying vec3 vJetLocal;\n"+shader.vertexShader;
          shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\n vJetLocal=position;");
          shader.fragmentShader="varying vec3 vJetLocal;\n"+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
            float paintLuma=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b));
            float cabinGlass=step(paintLuma,0.014);
            if(paintLuma>.12) {
              vec3 livery=vec3(.009,.013,.018);
              if(abs(vJetLocal.z)<1.48 && vJetLocal.y<-.12 && vJetLocal.y>-.23)
                livery=vec3(.72,.48,.19);
              diffuseColor.rgb*=livery;
            }
          `);
          shader.fragmentShader=shader.fragmentShader.replace("#include <roughnessmap_fragment>","#include <roughnessmap_fragment>\n roughnessFactor=mix(roughnessFactor,0.12,cabinGlass);");
        };
      }
      if(m.name==="engine") {
        m.metalness=.25;m.roughness=.4;
        m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
          if(min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b))>.16)diffuseColor.rgb*=vec3(.012,.016,.022);
        `);};
      }
      o.material=m;
    });
    return scene;
  },[gltf.scene]);
  useEffect(()=>()=>{
    jet.traverse(o=>{
      if(o instanceof THREE.Mesh)(o.material as THREE.Material).dispose();
    });
  },[jet]);
  useFrame(({clock})=>{
    if(start.current===null)start.current=clock.elapsedTime;
    const t=reduced?0:clock.elapsedTime-start.current,intro=reduced?1:THREE.MathUtils.smoothstep(t,.1,1.6);
    root.current.position.set(THREE.MathUtils.lerp(72,0,intro),Math.sin(t*.35)*.3,0);
    root.current.rotation.set(Math.sin(t*.28)*.055,Math.sin(t*.18)*.025,Math.sin(t*.22)*.025);
    if(nav.current)nav.current.color.setScalar(reduced || Math.sin(t*5.5)>.93 ? 3 : .12);
  });
  return <group ref={root} onClick={(e:ThreeEvent<MouseEvent>)=>{if(mode!=="landing")return;e.stopPropagation();board("projects");}}
    onPointerOver={e=>{e.stopPropagation();setHovered(true);}} onPointerOut={()=>setHovered(false)}>
    <TailSignature/>
    <group scale={1.65} position={[0,1.1,0]}><primitive object={jet}/></group>
    {[-1,1].map(s=><mesh key={s} position={[10,-.6,s*19.15]}>
      <sphereGeometry args={[time==="midnight"?.15:.08,8,6]}/><meshBasicMaterial color={s===1?"#65ffc1":"#ff4740"} toneMapped={false}/>
    </mesh>)}
    <mesh position={[25,5.7,0]}><sphereGeometry args={[.12,8,6]}/><meshBasicMaterial ref={nav} toneMapped={false}/></mesh>
    {profile.contrails&&time!=="midnight"&&[-1,1].map(s=><mesh key={s} position={[44,.6,s*3.75]} rotation={[0,0,Math.PI/2]}>
      <cylinderGeometry args={[.08,.65,46,6,1,true]}/><shaderMaterial transparent depthWrite={false} side={THREE.DoubleSide}
        vertexShader={`varying vec2 vTrail; void main(){vTrail=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 vTrail; void main(){float fade=smoothstep(0.,.18,vTrail.y)*(1.-smoothstep(.4,1.,vTrail.y));gl_FragColor=vec4(.78,.84,.9,fade*.07);}`}/>
    </mesh>)}
  </group>;
}


/** Two flat tail markings share one tiny texture and one instanced draw. */
function TailSignature(){
  const ref=useRef<THREE.InstancedMesh>(null!);
  const texture=useCanvasTexture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);ctx.fillStyle="#d9b871";ctx.textAlign="center";
    ctx.font="italic 700 132px Georgia";ctx.fillText("HJ",w/2,145);
    ctx.font="600 23px Segoe UI";ctx.fillText("J A D A W A L A",w/2,190);
  },512,256,[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  useLayoutEffect(()=>{
    const o=new THREE.Object3D();
    [-1,1].forEach((side,i)=>{o.position.set(22.3,4.7,side*.28);o.rotation.y=side===1?0:Math.PI;o.updateMatrix();ref.current.setMatrixAt(i,o.matrix);});
    ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();
  },[]);
  return <instancedMesh ref={ref} args={[undefined,undefined,2]}>
    <planeGeometry args={[2.7,1.35]}/><meshBasicMaterial map={texture} transparent alphaTest={.08} depthWrite={false} toneMapped={false}/>
  </instancedMesh>;
}
