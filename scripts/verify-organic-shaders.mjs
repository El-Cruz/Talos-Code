// Run against a local Chromium started with --remote-debugging-port=9333.
// GPU readback is test-only; production never reads particle positions back.
import assert from 'node:assert/strict';
import { organicParticleVertexShader as vertex, organicParticleFragmentShader as fragment }
  from '../src/components/webgl/organicParticleShaders.ts';

const endpoint = process.argv[2] ?? 'http://127.0.0.1:9333';
const pages = await (await fetch(`${endpoint}/json`)).json();
const ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => { ws.onopen = resolve; });
try {
  const result = await new Promise((resolve, reject) => {
    ws.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (message.id === 1) {
        if (message.error) reject(message.error);
        else resolve(message.result);
      }
    };
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
      expression: `(${verify.toString()})(${JSON.stringify(vertex)},${JSON.stringify(fragment)})`,
      returnByValue: true,
    } }));
  });
  assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
  assert.equal(result.result.value, 'PASS: GLSL link, endpoints, organic path, additive hover at 0/.5/1, release, finite center, retarget continuity, stateless replay');
  console.log(result.result.value);
} finally { ws.close(); }

function verify(vertex, fragment) {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) throw Error('WebGL2 unavailable');
  const check = (condition, label) => { if (!condition) throw Error(label); };
  const compile = (type, source) => {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    check(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader)); return shader;
  };
  const program = (v, f, feedback = false) => {
    const p = gl.createProgram();
    const shaders = [compile(gl.VERTEX_SHADER, v), compile(gl.FRAGMENT_SHADER, f)];
    shaders.forEach(s => gl.attachShader(p, s));
    if (feedback) gl.transformFeedbackVaryings(p, ['gl_Position', 'v_interaction'], gl.INTERLEAVED_ATTRIBS);
    gl.linkProgram(p); check(gl.getProgramParameter(p, gl.LINK_STATUS), gl.getProgramInfoLog(p));
    shaders.forEach(s => gl.deleteShader(s)); return p;
  };
  // Compile the exact shipped ES 1.00 pair first. ES 3.00 enables test readback.
  gl.deleteProgram(program(vertex, fragment));
  const p = program('#version 300 es\n'+vertex.replaceAll('attribute ', 'in ').replaceAll('varying ', 'out '),
    '#version 300 es\n'+fragment.replaceAll('varying ', 'in ').replace('void main()', 'out vec4 color;\nvoid main()').replaceAll('gl_FragColor','color'), true);
  gl.useProgram(p);
  const attribute = (name, data) => {
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p,name); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0); return b;
  };
  const source = [.2,.1,-3], target = [.5,.4,-3];
  const sourceBuffer = attribute('position',source), targetBuffer = attribute('targetPosition',target);
  const scalar = (name, value) => gl.uniform1f(gl.getUniformLocation(p,name),value);
  const vector = (name, value) => gl.uniform3fv(gl.getUniformLocation(p,name),value);
  const identity = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  for (const name of ['modelViewMatrix','projectionMatrix']) gl.uniformMatrix4fv(gl.getUniformLocation(p,name),false,identity);
  for (const [name,value] of Object.entries({u_time:2,u_morphCarry:0,u_pointerRadius:.85,u_pointerStrength:.45,u_pointSize:2,u_pixelRatio:1,u_opacity:1})) scalar(name,value);
  vector('u_mouseDirection',[0,0,-1]);
  const feedback = gl.createBuffer(); gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER,feedback);
  gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER,20,gl.STREAM_READ); gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,feedback);
  const draw = (progress, active = 0, mouse = [0,0,-3]) => {
    scalar('u_morphProgress',progress); scalar('u_mouseActive',active); vector('u_mouse',mouse);
    gl.enable(gl.RASTERIZER_DISCARD); gl.beginTransformFeedback(gl.POINTS); gl.drawArrays(gl.POINTS,0,1); gl.endTransformFeedback(); gl.disable(gl.RASTERIZER_DISCARD);
    const data = new Float32Array(5); gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER,0,data);
    check(gl.getError()===gl.NO_ERROR,'WebGL error'); check(data.every(Number.isFinite),'non-finite output'); return [...data];
  };
  const close = (a,b) => a.every((value,i)=>Math.abs(value-b[i])<.00001);
  check(close(draw(0).slice(0,3),source),'source endpoint'); check(close(draw(1).slice(0,3),target),'target endpoint');
  check(!close(draw(.5).slice(0,3),source.map((v,i)=>(v+target[i])*.5)),'path must curve');
  for (const progress of [0,.5,1]) {
    const base = draw(progress), mouse = [base[0]-.15,base[1],base[2]];
    const hover = draw(progress,1,mouse);
    check(hover[0]>base[0]+.25 && hover[4]>.8,'additive repulsion missing at '+progress);
    check(close(draw(progress),base),'release restores exact base');
    check(close(draw(progress,1,[100,100,100]),base),'pointer radius leaked');
    draw(progress,1,base.slice(0,3)); // exact pointer center must remain finite
  }
  const first = draw(.7); draw(.2); check(close(first,draw(.7)),'frame history affected result');
  const previous = draw(.4), eased = .4*.4*(3-2*.4);
  gl.bindBuffer(gl.ARRAY_BUFFER,sourceBuffer); gl.bufferSubData(gl.ARRAY_BUFFER,0,new Float32Array(source.map((v,i)=>v+(target[i]-v)*eased)));
  scalar('u_morphCarry',.22*16*.4*.4*.6*.6);
  check(close(draw(0),previous),'interrupted morph snaps');
  gl.deleteBuffer(sourceBuffer); gl.deleteBuffer(targetBuffer); gl.deleteBuffer(feedback); gl.deleteProgram(p);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return 'PASS: GLSL link, endpoints, organic path, additive hover at 0/.5/1, release, finite center, retarget continuity, stateless replay';
}
