"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import { useAppStore } from "@/stores/useAppStore";
import type { PerfProfile } from "@/lib/device";

export default function FlightEnvironment({profile}:{profile:PerfProfile}) {
  const time=useAppStore(s=>s.timeOfDay);
  const {gl}=useThree();
  const night=time==="midnight", sunset=time==="evening";
  const stars=useMemo(()=>{
    const g=new THREE.BufferGeometry(),p:number[]=[],colors:number[]=[];let seed=179;
    const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
    for(let i=0;i<780;i++) {
      const a=random()*Math.PI*2,y=-.94+random()*1.88,r=Math.sqrt(1-y*y);
      p.push(Math.cos(a)*r*900,y*900,Math.sin(a)*r*900);
      const brightness=.3+Math.pow(random(),3)*.7,warm=random()>.83;
      colors.push(brightness*(warm?1:.7),brightness*.83,brightness*(warm?.72:1));
    }
    g.setAttribute("position",new THREE.Float32BufferAttribute(p,3));
    g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));return g;
  },[]);
  useEffect(()=>()=>stars.dispose(),[stars]);
  useEffect(()=>{
    const mapping=gl.toneMapping,exposure=gl.toneMappingExposure;
    gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=night?1:sunset?1:1.05;
    return()=>{gl.toneMapping=mapping;gl.toneMappingExposure=exposure;};
  },[gl,night,sunset]);
  return <>
    <color attach="background" args={[night?"#010207":sunset?"#b37467":"#86b0cd"]}/>
    <Suspense fallback={null}>
      <Environment files={sunset?"/environments/sunset-sky.hdr":"/environments/cruise-sky.hdr"}
        background={!night&&!sunset} backgroundRotation={[-.38,.6,0]} environmentRotation={[0,sunset?2.1:.6,0]}
        backgroundIntensity={.75} environmentIntensity={night?.55:profile.tier==="low"?.7:.9}/>
    </Suspense>
    {(sunset||night)&&<Suspense fallback={null}><AtmosphereBackdrop night={night}/></Suspense>}
    {night&&<points geometry={stars}><pointsMaterial size={1.7} vertexColors sizeAttenuation={false} transparent opacity={.92} depthWrite={false} toneMapped={false}/></points>}
    <directionalLight position={[-70,110,65]} intensity={night?2.2:sunset?2:2.4} color={night?"#b0c7e8":sunset?"#ffd2a0":"#fff4e5"}/>
    <hemisphereLight args={[night?"#8299bb":sunset?"#f4c9b5":"#d6eafa",night?"#050710":"#506574",night?.65:sunset?.45:.65]}/>
  </>;
}

// Two samples of the existing cloud mask; moon and atmosphere share this draw.
function AtmosphereBackdrop({night}:{night:boolean}) {
  const clouds=useTexture("/textures/sky/cloud-mask.png");
  const reduced=useAppStore(s=>s.reducedMotion);
  const material=useRef<THREE.ShaderMaterial>(null!);
  const uniforms=useMemo(()=>({cloudMap:{value:clouds},nightMode:{value:night?1:0},drift:{value:0}}),[clouds,night]);
  useFrame((_,dt)=>{
    if(!material.current)return;
    material.current.uniforms.nightMode.value=night?1:0;
    if(!reduced)material.current.uniforms.drift.value=(material.current.uniforms.drift.value+Math.min(dt,.05)*.0003)%1;
  });
  return <mesh renderOrder={-10}>
    <sphereGeometry args={[1400,24,12]}/>
    <shaderMaterial ref={material} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} toneMapped={false}
      vertexShader={`varying vec3 vSky; void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
      fragmentShader={`uniform sampler2D cloudMap; uniform float nightMode; uniform float drift; varying vec3 vSky;
      void main(){
        vec3 d=normalize(vSky); float h=d.y+.24;
        vec3 q=vec3(d.x,d.y*.928-d.z*.372,d.y*.372+d.z*.928);
        vec2 uv=vec2(fract(atan(q.z,q.x)*.15915494+.6+drift),asin(clamp(q.y,-1.,1.))*.31830989+.5);
        float nearCloud=texture2D(cloudMap,uv).a;
        float farCloud=texture2D(cloudMap,vec2(fract(uv.x+.19),clamp(uv.y-.075,0.,1.))).a;
        float cloud=max(nearCloud,farCloud*.72);
        vec3 c;
        if(nightMode>.5){
          float haze=exp(-pow((d.y+.32)*5.,2.));
          c=mix(vec3(.0005,.001,.003),vec3(.006,.011,.023),haze);
          vec3 moonDir=normalize(vec3(.5,-.065,-1.));
          float alignment=max(0.,dot(d,moonDir));
          c+=vec3(.008,.014,.025)*pow(alignment,65.);
          vec3 right=normalize(cross(moonDir,vec3(0.,1.,0.)));
          vec3 up=cross(right,moonDir);
          vec2 m=vec2(dot(d,right),dot(d,up));
          float disc=1.-smoothstep(.018,.0195,length(m));
          float shade=1.-smoothstep(.017,.019,length(m-vec2(.009,.004)));
          float moon=disc*(1.-shade)*step(.99,alignment);
          c=mix(c,vec3(.51,.60,.72),moon);
          vec3 cloudShade=mix(vec3(.004,.007,.013),vec3(.018,.027,.043),pow(alignment,7.));
          c=mix(c,cloudShade,cloud*.55);
        }else{
          vec3 lower=vec3(.025,.045,.085),horizon=vec3(.72,.225,.065),upper=vec3(.025,.035,.12);
          c=mix(lower,horizon,smoothstep(-.55,-.04,h));
          c=mix(c,upper,smoothstep(.015,.5,h));
          float sun=max(0.,dot(d,normalize(vec3(.5,-.32,-1.))));
          c+=vec3(.3,.12,.035)*pow(sun,32.);
          vec3 cloudColor=mix(vec3(.065,.065,.12),vec3(.8,.39,.17),pow(sun,7.));
          float edge=clamp((farCloud-nearCloud)*3.,0.,1.)*pow(sun,10.);
          cloudColor+=vec3(.22,.11,.035)*edge;
          c=mix(c,cloudColor,cloud*.88);
          c=mix(c,vec3(1.,.79,.43),smoothstep(.9990,.9995,sun)*(1.-cloud*.82));
        }
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`}/>
  </mesh>;
}
