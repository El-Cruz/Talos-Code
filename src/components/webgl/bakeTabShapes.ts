/** Surface point clouds: stacked capped cylinders and a nucleus with three torus orbits. */
export function bakeTabShapes(count: number) {
  const database = new Float32Array(count * 4), atom = new Float32Array(count * 4);
  let seed = 9201;
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < count; i++) {
    const j=i*4, angle=random()*Math.PI*2, band=Math.floor(random()*3);
    const cap=random()<.28, radius=cap ? Math.sqrt(random())*1.2 : 1.2;
    database[j]=Math.cos(angle)*radius;
    database[j+1]=(band-1)*.85+(cap ? .32 : (random()-.5)*.64);
    database[j+2]=Math.sin(angle)*radius; database[j+3]=random();
    const u=random()*Math.PI*2, v=random()*Math.PI*2;
    if (random()<.22) {
      const z=random()*2-1, r=Math.sqrt(1-z*z)*.4;
      atom[j]=r*Math.cos(u);atom[j+1]=z*.4;atom[j+2]=r*Math.sin(u);
    } else {
      const tilt=Math.floor(random()*3)*Math.PI/3;
      const x=(1.65+Math.cos(v)*.035)*Math.cos(u), y=(1.65+Math.cos(v)*.035)*Math.sin(u), z=Math.sin(v)*.035;
      atom[j]=x;atom[j+1]=y*Math.cos(tilt)-z*Math.sin(tilt);atom[j+2]=y*Math.sin(tilt)+z*Math.cos(tilt);
    }
    atom[j+3]=random();
  }
  return { database, atom };
}
