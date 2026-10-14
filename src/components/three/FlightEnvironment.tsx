"use client";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import { useAppStore } from "@/stores/useAppStore";
import type { PerfProfile } from "@/lib/device";

// One locally hosted 1K environment is loaded per lighting choice. Midnight
// uses a black background; the sky texture only provides faint reflections.
export default function FlightEnvironment({profile}:{profile:PerfProfile}) {
  const time=useAppStore(s=>s.timeOfDay);
  const {gl}=useThree();
  const night=time==="midnight", sunset=time==="evening";
  const stars=useMemo(()=>{
    const g=new THREE.BufferGeometry(),p:number[]=[];let seed=179;
    for(let i=0;i<440;i++) {seed=seed*16807%2147483647;const a=seed/2147483647*Math.PI*2;seed=seed*16807%2147483647;const y=-.94+seed/2147483647*1.88;const r=Math.sqrt(1-y*y);p.push(Math.cos(a)*r*900,y*900,Math.sin(a)*r*900);}
    g.setAttribute("position",new THREE.Float32BufferAttribute(p,3));return g;
  },[]);
  useEffect(()=>()=>stars.dispose(),[stars]);
  useEffect(()=>{
    const mapping=gl.toneMapping,exposure=gl.toneMappingExposure;
    gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=night?1.0:sunset?1.0:1.05;
    return()=>{gl.toneMapping=mapping;gl.toneMappingExposure=exposure;};
  },[gl,night,sunset]);
  return <>
    <color attach="background" args={[night?"#010207":sunset?"#b37467":"#86b0cd"]}/>
    <Suspense fallback={null}>
      <Environment files={sunset?"/environments/sunset-sky.hdr":"/environments/cruise-sky.hdr"}
        background={!night&&!sunset} backgroundRotation={sunset?[-.45,2.1,0]:[-.38,.6,0]} environmentRotation={[0,sunset?2.1:.6,0]}
        backgroundIntensity={sunset?.42:.75} environmentIntensity={night?.55:profile.tier==="low"?.7:.9}/>
    </Suspense>
    {sunset&&<Suspense fallback={null}><SunsetBackdrop/></Suspense>}
    {night&&<points geometry={stars}><pointsMaterial size={1.5} color="#99acc7" sizeAttenuation={false} transparent opacity={.9} depthWrite={false}/></points>}
    <directionalLight position={[-70,110,65]} intensity={night?2.2:sunset?2.0:2.4} color={night?"#b0c7e8":sunset?"#ffd2a0":"#fff4e5"}/>
    <hemisphereLight args={[night?"#8299bb":sunset?"#f4c9b5":"#d6eafa",night?"#050710":"#506574",night?.65:sunset?.45:.65]}/>
  </>;
}




/** One photographic cloud mask, one draw call, no volumetric ray marching. */
function SunsetBackdrop() {
  const clouds=useTexture("/textures/sky/cloud-mask.png");
  const uniforms=useMemo(()=>({cloudMap:{value:clouds}}),[clouds]);
  return <mesh>
    <sphereGeometry args={[1400,24,12]}/>
    <shaderMaterial uniforms={uniforms} side={THREE.BackSide} depthWrite={false} toneMapped={false}
      vertexShader={`varying vec3 vSky; void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
      fragmentShader={`uniform sampler2D cloudMap; varying vec3 vSky; void main(){
        vec3 d=normalize(vSky); float h=d.y+.24;
        vec3 lower=vec3(.055,.09,.17), horizon=vec3(.88,.33,.14), upper=vec3(.10,.08,.22);
        vec3 c=mix(lower,horizon,smoothstep(-.65,-.02,h));
        c=mix(c,upper,smoothstep(.02,.8,h));
        float sun=max(0.,dot(d,normalize(vec3(.5,-.32,-1.))));
        c+=vec3(.55,.23,.07)*pow(sun,22.);
        vec3 q=vec3(d.x,d.y*.928-d.z*.372,d.y*.372+d.z*.928);
        vec2 uv=vec2(atan(q.z,q.x)*.15915494+.6,asin(clamp(q.y,-1.,1.))*.31830989+.5);
        float cloud=texture2D(cloudMap,uv).a;
        float cloudBank=texture2D(cloudMap,vec2(fract(uv.x+.19),clamp(uv.y-.075,0.,1.))).a;
        cloud=max(cloud,cloudBank*.72);
        vec3 cloudColor=mix(vec3(.20,.16,.28),vec3(.95,.60,.36),pow(sun,4.));
        c=mix(c,cloudColor,cloud*.8);
        c=mix(c,vec3(1.,.79,.43),smoothstep(.9990,.9995,sun)*(1.-cloud*.75));
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`}/>
  </mesh>;
}



