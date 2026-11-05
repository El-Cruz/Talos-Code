import { mobileVideoFragmentShader, mobileVideoVertexShader, mobileParticleVertexShader, mobileParticleFragmentShader } from "./mobileVideoShaders";
import { createParticleSeeds, nextResolutionScale, TIER3_PARTICLE_COUNT } from "./tier3Particles";

interface TimerExtension {
  TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number;
  QUERY_RESULT_AVAILABLE_EXT: number; QUERY_RESULT_EXT: number;
  createQueryEXT(): WebGLQuery | null;
  deleteQueryEXT(query: WebGLQuery): void;
  beginQueryEXT(target: number, query: WebGLQuery): void;
  endQueryEXT(target: number): void;
  getQueryObjectEXT(query: WebGLQuery, parameter: number): number | boolean;
}

// Two draws: a video quad and 12K independent points. No FBOs or CPU simulation.
export function createVideoOverlay(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) throw new Error("Video overlay WebGL unavailable");
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const particleProgram = gl.createProgram(), particleBuffer = gl.createBuffer();
  const timer = gl.getExtension("EXT_disjoint_timer_query") as TimerExtension | null;
  let query: WebGLQuery | null = null, resolutionScale = 1, frames = 0;
  const buffer = gl.createBuffer(), texture = gl.createTexture();
  const dispose = () => {
    gl.deleteBuffer(buffer); gl.deleteTexture(texture); gl.deleteProgram(program);
    gl.deleteBuffer(particleBuffer); gl.deleteProgram(particleProgram);
    if (query) timer?.deleteQueryEXT(query);
    shaders.forEach(shader => gl.deleteShader(shader));
  };
  try {
    if (!program || !buffer || !texture || !particleProgram || !particleBuffer) throw new Error("Video overlay allocation failed");
    for (const [target, vertex, fragment] of [[program, mobileVideoVertexShader, mobileVideoFragmentShader], [particleProgram, mobileParticleVertexShader, mobileParticleFragmentShader]] as const) {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Video overlay shader allocation failed");
      shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Video shader compilation failed");
      gl.attachShader(target, shader);
    }
    gl.linkProgram(target);
    if (!gl.getProgramParameter(target, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(target) || "Video shader link failed");
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const uniforms = Object.fromEntries(["uVideo", "uPointer", "uFlow", "uCover", "uAspect", "uPhase", "uStrength"].map(name => [name, gl.getUniformLocation(program, name)]));
    gl.uniform1i(uniforms.uVideo, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, createParticleSeeds(), gl.STATIC_DRAW);
    const seed = gl.getAttribLocation(particleProgram, "aSeed");
    const particleUniforms = Object.fromEntries(["uPointer", "uAspect", "uPhase", "uStrength", "uPixelScale"].map(name => [name, gl.getUniformLocation(particleProgram, name)]));
    canvas.dataset.particleCount = String(TIER3_PARTICLE_COUNT);
    canvas.dataset.gpuTiming = timer ? "pending" : "unavailable";
    let width = 0, height = 0;
    return {
      dispose,
      draw(video: HTMLVideoElement, upload: boolean, pointer: readonly number[], flow: readonly number[], phase: number, strength: number) {
        if (gl.isContextLost()) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        if (timer && query && gl.getParameter(timer.GPU_DISJOINT_EXT)) {
          timer.deleteQueryEXT(query); query = null;
        }
        if (timer && query && timer.getQueryObjectEXT(query, timer.QUERY_RESULT_AVAILABLE_EXT)) {
          const ms = Number(timer.getQueryObjectEXT(query, timer.QUERY_RESULT_EXT)) / 1e6;
          canvas.dataset.gpuMs = ms.toFixed(2); canvas.dataset.gpuTiming = "measured";
          resolutionScale = nextResolutionScale(resolutionScale, ms);
          timer.deleteQueryEXT(query); query = null;
          if (!resolutionScale) throw new Error("Overlay exceeds 4ms GPU budget at minimum resolution");
        }
        const ratio = Math.min(window.devicePixelRatio || 1, 1, 960 / Math.max(rect.width, rect.height)) * resolutionScale;
        const w = Math.max(1, Math.round(rect.width * ratio)), h = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.viewport(0, 0, w, h);
        const measuring = !!timer && !query && frames++ % 30 === 0;
        if (measuring && timer) { query = timer.createQueryEXT(); if (query) timer.beginQueryEXT(timer.TIME_ELAPSED_EXT, query); }
        try {
        gl.useProgram(program); gl.disable(gl.BLEND);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        if (video.videoWidth !== width || video.videoHeight !== height) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          width = video.videoWidth; height = video.videoHeight;
        } else if (upload) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
        const aspect = rect.width / rect.height, videoAspect = width / height;
        gl.uniform2f(uniforms.uCover, Math.min(1, aspect / videoAspect), Math.min(1, videoAspect / aspect));
        gl.uniform2f(uniforms.uPointer, pointer[0], pointer[1]);
        gl.uniform2f(uniforms.uFlow, flow[0], flow[1]);
        gl.uniform1f(uniforms.uAspect, aspect); gl.uniform1f(uniforms.uPhase, phase); gl.uniform1f(uniforms.uStrength, strength);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(position);
        gl.useProgram(particleProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
        gl.enableVertexAttribArray(seed); gl.vertexAttribPointer(seed, 3, gl.FLOAT, false, 0, 0);
        gl.uniform2f(particleUniforms.uPointer, pointer[0], pointer[1]);
        gl.uniform1f(particleUniforms.uAspect, aspect); gl.uniform1f(particleUniforms.uPhase, phase);
        gl.uniform1f(particleUniforms.uStrength, strength); gl.uniform1f(particleUniforms.uPixelScale, ratio);
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.POINTS, 0, TIER3_PARTICLE_COUNT);
        gl.disableVertexAttribArray(seed);
        } finally { if (measuring && query && timer) timer.endQueryEXT(timer.TIME_ELAPSED_EXT); }
      },
    };
  } catch (error) { dispose(); throw error; }
}
