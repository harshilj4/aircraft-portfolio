"use client";
import {useEffect,useRef} from "react";
import * as THREE from "three";
import {useFrame,useThree} from "@react-three/fiber";
import Aircraft from "./Aircraft";
import FlightEnvironment from "./FlightEnvironment";
import {useAppStore} from "@/stores/useAppStore";
import type {PerfProfile} from "@/lib/device";

const BOARD_X:Record<string,number>={cockpit:-18,projects:-10,research:-3,briefing:3,systems:9,comms:16};
function ExteriorRig() {
  const {camera,size,pointer}=useThree();
  const mode=useAppStore(s=>s.mode),section=useAppStore(s=>s.currentSection),reduced=useAppStore(s=>s.reducedMotion);
  const boardStart=useRef(0),startPos=useRef(new THREE.Vector3()),startUp=useRef(new THREE.Vector3());
  const dir=useRef(new THREE.Vector3()),aim=useRef(new THREE.Vector3()),right=useRef(new THREE.Vector3());
  const up=useRef(new THREE.Vector3()),target=useRef(new THREE.Vector3());
  const initialized=useRef(false);
  const introStart=useRef<number|null>(null);
  useEffect(()=>{
    if(mode==="boarding"){boardStart.current=performance.now();startPos.current.copy(camera.position);startUp.current.copy(camera.up);}
  },[mode,camera]);
  useFrame(({clock},dt)=>{
    const cam=camera as THREE.PerspectiveCamera;
    if(cam.near!==1||cam.far!==1800){cam.near=1;cam.far=1800;cam.updateProjectionMatrix();}
    const aspect=size.width/Math.max(size.height,1),portrait=aspect<.8;
    const fov=portrait?48:40;
    if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix();}
    if(mode==="boarding"){
      const t=THREE.MathUtils.clamp((performance.now()-boardStart.current)/(reduced?100:1450),0,1),e=t*t*(3-2*t),x=BOARD_X[section]??-10;
      target.current.set(x,.6,3.3);camera.position.lerpVectors(startPos.current,target.current,e);
      up.current.set(0,1,0);camera.up.lerpVectors(startUp.current,up.current,e).normalize();camera.lookAt(x,.4,0);return;
    }
    if(introStart.current===null)introStart.current=clock.elapsedTime;
    const t=clock.elapsedTime-introStart.current;
    // The camera is locked for the approach, then travels to a side tracking shot.
    const reveal=reduced?1:THREE.MathUtils.smoothstep(t,.65,3.25);
    const cruise=Math.max(0,t-3.25),angle=THREE.MathUtils.lerp(1.34,.32,reveal)+(reduced?0:Math.sin(cruise*.12)*.13*reveal);
    const halfFov=Math.tan(THREE.MathUtils.degToRad(fov/2));
    // Analytic framing avoids the old oscillating projection feedback loop.
    const distance=Math.max(88,31/(halfFov*aspect))*1.03;
    const roll=portrait?THREE.MathUtils.degToRad(23)*reveal:0;
    up.current.set(Math.sin(roll),Math.cos(roll),0);
    dir.current.set(-Math.sin(angle),.10+reveal*.09,Math.cos(angle)).normalize().multiplyScalar(distance);
    if(reveal>.99&&!reduced){dir.current.x+=pointer.x*1.8;dir.current.y+=pointer.y*1.1;}
    const blend=initialized.current?1-Math.exp(-dt*5):1;initialized.current=true;
    camera.position.lerp(dir.current,blend);camera.up.lerp(up.current,blend).normalize();
    const halfH=distance*halfFov;
    aim.current.set(0,0,0);
    right.current.copy(camera.position).negate().normalize().cross(camera.up).normalize();
    aim.current.addScaledVector(camera.up,-halfH*(portrait?.34:.29));
    if(!portrait)aim.current.addScaledVector(right.current,-halfH*aspect*.10);
    camera.lookAt(aim.current);camera.updateMatrixWorld();
  });
  return null;
}
export default function ExteriorScene({profile}:{profile:PerfProfile}) {
  const ready=useAppStore(s=>s.setReady);
  useEffect(()=>{const id=requestAnimationFrame(()=>ready());return()=>cancelAnimationFrame(id);},[ready]);
  return <>
    <FlightEnvironment profile={profile}/><Aircraft profile={profile}/><ExteriorRig/>
  </>;
}

