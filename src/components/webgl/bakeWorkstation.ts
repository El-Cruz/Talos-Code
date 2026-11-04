// Analytic surface sampling runs once on the CPU; no SDF evaluations are needed.
export function bakeWorkstation(count: number) {
  const targets = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  let seed = 42;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const box = (i: number, bx: number, by: number, bz: number, radius: number, cx: number, cy: number, cz: number, angle = 0) => {
    const x = bx + radius, y = by + radius, z = bz + radius;
    const area = random() * (y*z + x*z + x*y);
    let px = (random()*2-1)*x, py = (random()*2-1)*y, pz = (random()*2-1)*z;
    const sign = random() < .5 ? -1 : 1;
    if (area < y*z) px = sign*x; else if (area < y*z+x*z) py = sign*y; else pz = sign*z;
    const qx = Math.max(-bx, Math.min(bx, px)), qy = Math.max(-by, Math.min(by, py)), qz = Math.max(-bz, Math.min(bz, pz));
    let nx = px-qx, ny = py-qy, nz = pz-qz;
    const length = Math.hypot(nx,ny,nz); nx/=length; ny/=length; nz/=length;
    px=qx+nx*radius; py=qy+ny*radius; pz=qz+nz*radius;
    const c=Math.cos(angle), s=Math.sin(angle), j=i*3;
    targets[j]=px+cx; targets[j+1]=py*c-pz*s+cy; targets[j+2]=py*s+pz*c+cz;
    normals[j]=nx; normals[j+1]=ny*c-nz*s; normals[j+2]=ny*s+nz*c;
  };
  for(let i=0;i<count;i++) {
    const r=random(); randoms[i]=r;
    const j=i*3;
    if(r>=.8) {
      targets[j]=random()*20-10; targets[j+1]=random()*20-10; targets[j+2]=random()*20-15;
      continue;
    }
    const part=random();
    if(part<.52) {
      // Remove the front aperture from the casing; sample its glass separately.
      do { box(i,1.35,1,.7,.16,0,0,0); }
      while(targets[j+2]>.69 && Math.abs(targets[j])<1.25 && Math.abs(targets[j+1]-.06)<.88);
    } else if(part<.69) {
      targets[j]=(random()*2-1)*1.18; targets[j+1]=(random()*2-1)*.8+.06;
      targets[j+2]=.54; normals[j+2]=1;
    } else if(part<.74) box(i,.25,.22,.25,.07,0,-1.32,-.12);
    else if(part<.80) box(i,.76,.06,.48,.08,0,-1.58,0);
    else if(part<.96) box(i,1.12,.09,.43,.08,-.12,-1.87,1.35,-.16);
    else box(i,.18,.1,.29,.12,1.55,-1.82,1.4);
  }
  return { targets, normals, randoms };
}
