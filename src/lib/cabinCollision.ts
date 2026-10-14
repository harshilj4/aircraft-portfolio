/** Floor footprints of the actual furniture. Player radius gives safe clearance
 * around chair arms and table edges while retaining a continuous centre aisle. */
interface Obstacle { x:number; z:number; hx:number; hz:number; height:number }
export const cabinObstacles: Obstacle[] = [
  ...[-18.7,-16.1].flatMap(x=>[-1.75,1.75].map(z=>({x,z,hx:.58,hz:.57,height:1.75}))),
  ...[-1.75,1.75].map(z=>({x:-17.4,z,hx:.56,hz:.43,height:.78})),
  {x:.7,z:-2.05,hx:1,hz:.4,height:1.6},
  {x:1.1,z:2.12,hx:.9,hz:.32,height:1.0},
  {x:6.3,z:-2.08,hx:1.15,hz:.43,height:1.2},
  {x:6.3,z:-1.42,hx:.4,hz:.4,height:.48},
  {x:5.4,z:1.85,hx:.58,hz:.58,height:1.28},
  {x:7.2,z:1.85,hx:.58,hz:.58,height:1.28},
  ...[9.7,11.5].flatMap(x=>[1.2,2.2].map(z=>({x,z,hx:.55,hz:.54,height:1.75}))),
  {x:10.6,z:1.55,hx:.8,hz:.8,height:.48},
  {x:19.9,z:0,hx:.45,hz:1.15,height:.4},
];
export function blocksCabinPosition(x:number,z:number,jumpHeight=0) {
  const radius=.19;
  for(const b of cabinObstacles) {
    if(jumpHeight>b.height+.02)continue;
    if(Math.abs(x-b.x)<b.hx+radius&&Math.abs(z-b.z)<b.hz+radius)return true;
  }
  return false;
}
