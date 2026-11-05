import { mobileVideoFragmentShader, mobileVideoVertexShader } from "./mobileVideoShaders";

// WebGL 1, one RGBA8 video texture and two triangles. No Three.js, FBOs or floats.
export function createVideoOverlay(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) throw new Error("Video overlay WebGL unavailable");
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer(), texture = gl.createTexture();
  const dispose = () => {
    gl.deleteBuffer(buffer); gl.deleteTexture(texture); gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
  };
  try {
    if (!program || !buffer || !texture) throw new Error("Video overlay allocation failed");
    for (const [type, source] of [[gl.VERTEX_SHADER, mobileVideoVertexShader], [gl.FRAGMENT_SHADER, mobileVideoFragmentShader]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Video overlay shader allocation failed");
      shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Video shader compilation failed");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Video shader link failed");
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
    let width = 0, height = 0;
    return {
      dispose,
      draw(video: HTMLVideoElement, upload: boolean, pointer: readonly number[], flow: readonly number[], phase: number, strength: number) {
        if (gl.isContextLost()) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.25, 1280 / Math.max(rect.width, rect.height));
        const w = Math.max(1, Math.round(rect.width * ratio)), h = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.viewport(0, 0, w, h);
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
      },
    };
  } catch (error) { dispose(); throw error; }
}
