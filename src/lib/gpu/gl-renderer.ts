import type { SceneSpec } from "@/lib/forge/types";
import { vram } from "./vram";

const MAX_ORBS = 8192;
const VOL = 32;
const BOX_FLOATS = 72 * 4;

const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_pos;
layout(location=1) in float a_kind;
layout(location=2) in vec4 a_inst;
uniform mat4 u_vp;
uniform vec2 u_res;
uniform int u_pass;
out vec2 v_uv;
out float v_kind;
out float v_shade;
void main() {
  if (u_pass == 1) {
    vec2 corners[6] = vec2[6](
      vec2(-1.0,-1.0), vec2(1.0,-1.0), vec2(-1.0,1.0),
      vec2(-1.0,1.0), vec2(1.0,-1.0), vec2(1.0,1.0)
    );
    vec2 uv = corners[gl_VertexID % 6];
    vec4 center = u_vp * vec4(a_inst.xyz, 1.0);
    float px = max(a_inst.w, 0.03);
    float aspect = max(u_res.x / max(u_res.y, 1.0), 0.2);
    gl_Position = center + vec4(uv.x * px * center.w, uv.y * px * aspect * center.w, 0.0, 0.0);
    v_uv = uv;
    v_kind = 1.0;
    v_shade = 0.6 + 0.4 * clamp(a_inst.y * 1.4 + 0.5, 0.0, 1.0);
  } else {
    gl_Position = u_vp * vec4(a_pos, 1.0);
    v_uv = vec2(0.0);
    v_kind = a_kind;
    v_shade = 1.0;
  }
}
`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
in float v_kind;
in float v_shade;
out vec4 o;
void main() {
  if (v_kind < 0.5) {
    o = vec4(0.82, 0.86, 0.90, 0.42);
    return;
  }
  if (v_kind > 1.5) {
    o = vec4(0.70, 0.78, 0.84, 0.95);
    return;
  }
  float d = length(v_uv);
  if (d > 1.0) discard;
  float rim = smoothstep(0.62, 1.0, d);
  vec3 rgb = mix(vec3(0.88, 0.90, 0.92) * v_shade, vec3(1.0), rim);
  o = vec4(rgb, 1.0);
}
`;

export class GlViewport {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private boxBuf: WebGLBuffer;
  private orbBuf: WebGLBuffer;
  private quadBuf: WebGLBuffer;
  private vaoBox: WebGLVertexArrayObject;
  private vaoOrb: WebGLVertexArrayObject;
  private uVp: WebGLUniformLocation;
  private uRes: WebGLUniformLocation;
  private uPass: WebGLUniformLocation;
  private orbCpu = new Float32Array(MAX_ORBS * 4);
  private boxCpu = new Float32Array(BOX_FLOATS);
  private w = 0;
  private h = 0;
  private t0 = performance.now();

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      depth: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.floor(box.width * dpr));
    canvas.height = Math.max(2, Math.floor(box.height * dpr));
    this.w = canvas.width;
    this.h = canvas.height;
    gl.viewport(0, 0, this.w, this.h);

    this.prog = compile(gl, VERT, FRAG);
    this.uVp = gl.getUniformLocation(this.prog, "u_vp")!;
    this.uRes = gl.getUniformLocation(this.prog, "u_res")!;
    this.uPass = gl.getUniformLocation(this.prog, "u_pass")!;

    this.boxBuf = gl.createBuffer()!;
    this.orbBuf = gl.createBuffer()!;
    this.quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.boxBuf);
    gl.bufferData(gl.ARRAY_BUFFER, BOX_FLOATS * 4, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.orbBuf);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_ORBS * 16, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(6 * 4), gl.STATIC_DRAW);

    this.vaoBox = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoBox);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.boxBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);

    this.vaoOrb = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoOrb);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.orbBuf);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 16, 0);
    gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null);

    const scratch = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, scratch);
    gl.bufferData(gl.ARRAY_BUFFER, vram.scratchBytes || 4 * 1024 * 1024, gl.DYNAMIC_DRAW);
    try {
      const vol = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_3D, vol);
      gl.texStorage3D(gl.TEXTURE_3D, 1, gl.R32F, VOL, VOL, VOL);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      this.bakeVolume();
    } catch {
      /* reserved in the heap even if the format is missing */
    }

    vram.adoptGl(gl, [
      { name: "gl.scratch", bytes: vram.scratchBytes || 4 * 1024 * 1024, kind: "buffer" },
      { name: "gl.orbs", bytes: MAX_ORBS * 16, kind: "buffer" },
      { name: "gl.box", bytes: BOX_FLOATS * 4, kind: "buffer" },
      { name: "gl.volume", bytes: VOL * VOL * VOL * 4, kind: "texture" },
    ]);
    vram.volumeDim = VOL;
  }

  resize(canvas: HTMLCanvasElement) {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.floor(r.width * dpr));
    const h = Math.max(2, Math.floor(r.height * dpr));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    canvas.width = w;
    canvas.height = h;
    this.gl.viewport(0, 0, w, h);
  }

  frame(canvas: HTMLCanvasElement, scene: SceneSpec) {
    const gl = this.gl;
    this.resize(canvas);
    const nx = Math.max(0, Math.min(24, Math.round(scene.orbs.nx)));
    const ny = Math.max(0, Math.min(24, Math.round(scene.orbs.ny)));
    const nz = Math.max(0, Math.min(12, Math.round(scene.orbs.nz)));
    const count = Math.min(MAX_ORBS, nx * ny * nz);
    vram.orbs = count;
    const maxDim = Math.max(scene.clip.widthMm, scene.clip.heightMm, scene.clip.depthMm, 1);
    const sx = scene.clip.widthMm / maxDim;
    const sy = scene.clip.heightMm / maxDim;
    const sz = scene.clip.depthMm / maxDim;
    const time = (performance.now() - this.t0) / 1000;
    this.writeOrbs(scene, count, nx, ny, nz, sx, sy, sz, time);
    this.writeBox(sx, sy, sz, scene.clip.hollow);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.08, 0.10, 0.12, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.uVp, false, viewProj(time, this.w, this.h));
    gl.uniform2f(this.uRes, this.w, this.h);

    gl.uniform1i(this.uPass, 0);
    gl.bindVertexArray(this.vaoBox);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.boxBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.boxCpu);
    gl.drawArrays(gl.TRIANGLES, 0, 72);

    if (count > 0) {
      gl.uniform1i(this.uPass, 1);
      gl.bindVertexArray(this.vaoOrb);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.orbBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.orbCpu, 0, count * 4);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    }
    gl.bindVertexArray(null);
    vram.markFrame();
    vram.noteWrites(2);
  }

  private writeOrbs(
    scene: SceneSpec,
    count: number,
    nx: number,
    ny: number,
    nz: number,
    sx: number,
    sy: number,
    sz: number,
    time: number,
  ) {
    const r = Math.max(0.03, (scene.orbs.radius / Math.max(scene.clip.widthMm, 1)) * 2.2);
    const morph = scene.clip.morph;
    const jitter = scene.orbs.jitter;
    const o = this.orbCpu;
    for (let i = 0; i < count; i++) {
      const ix = nx ? i % nx : 0;
      const iy = nx ? Math.floor(i / nx) % Math.max(ny, 1) : 0;
      const iz = nx * ny ? Math.floor(i / (nx * ny)) : 0;
      const fx = nx > 1 ? ix / (nx - 1) : 0.5;
      const fy = ny > 1 ? iy / (ny - 1) : 0.5;
      const fz = nz > 1 ? iz / (nz - 1) : 0.5;
      let x = (fx - 0.5) * sx * 0.72;
      let y = (fy - 0.5) * sy * 0.62;
      let z = (fz - 0.5) * sz * 0.55;
      const seed = i * 12.9898;
      x += Math.sin(seed) * jitter * 0.04 * sx + morph * 0.06 * sx * Math.sin(time * 1.4 + iy);
      y += Math.cos(seed * 1.3) * jitter * 0.04 * sy;
      z += Math.sin(seed * 0.7) * jitter * 0.04 * sz + morph * 0.04 * sz * Math.cos(time * 1.1 + ix);
      const b = i * 4;
      o[b] = x;
      o[b + 1] = y;
      o[b + 2] = z;
      o[b + 3] = r;
    }
  }

  private writeBox(sx: number, sy: number, sz: number, hollow: number) {
    const out = this.boxCpu;
    let i = 0;
    const faces = [
      [0, 1, 2, 0, 2, 3],
      [5, 4, 7, 5, 7, 6],
      [4, 0, 3, 4, 3, 7],
      [1, 5, 6, 1, 6, 2],
      [3, 2, 6, 3, 6, 7],
      [4, 5, 1, 4, 1, 0],
    ];
    const emit = (ex: number, ey: number, ez: number, kind: number) => {
      const hx = ex * 0.5;
      const hy = ey * 0.5;
      const hz = ez * 0.5;
      const c: [number, number, number][] = [
        [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz],
        [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz],
      ];
      for (const face of faces) {
        for (const idx of face) {
          const p = c[idx]!;
          out[i++] = p[0]!;
          out[i++] = p[1]!;
          out[i++] = p[2]!;
          out[i++] = kind;
        }
      }
    };
    emit(sx, sy, sz, 0);
    const inset = 1 - (0.18 + hollow * 0.22);
    emit(sx * inset, sy * inset, sz * inset, 2);
  }

  private bakeVolume() {
    try {
      const data = new Float32Array(VOL * VOL * VOL);
      for (let z = 0; z < VOL; z++) {
        for (let y = 0; y < VOL; y++) {
          for (let x = 0; x < VOL; x++) {
            const fx = (x + 0.5) / VOL - 0.5;
            const fy = (y + 0.5) / VOL - 0.5;
            const fz = (z + 0.5) / VOL - 0.5;
            const box = Math.max(Math.abs(fx), Math.abs(fy), Math.abs(fz));
            data[x + y * VOL + z * VOL * VOL] = box < 0.48 && box > 0.28 ? 1 : 0;
          }
        }
      }
      const gl = this.gl;
      gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, VOL, VOL, VOL, gl.RED, gl.FLOAT, data);
    } catch {
      /* volume is reserved even if the fill is skipped */
    }
  }

  dispose() {
    /* context is owned by the canvas */
  }
}

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const v = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(v, vs);
  gl.compileShader(v);
  if (!gl.getShaderParameter(v, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(v) || "vertex");
  }
  const f = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(f, fs);
  gl.compileShader(f);
  if (!gl.getShaderParameter(f, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(f) || "fragment");
  }
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || "link");
  }
  return p;
}

function viewProj(time: number, w: number, h: number): Float32Array {
  const a = time * 0.22;
  const eye: [number, number, number] = [Math.cos(a) * 1.85, 1.05, Math.sin(a) * 1.85];
  const z = norm(eye);
  const x = norm(cross([0, 1, 0], z));
  const y = cross(z, x);
  const view = new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
  const aspect = Math.max(w / Math.max(h, 1), 0.2);
  const p = 1.15;
  const n = 0.08;
  const f = 14;
  const proj = new Float32Array([
    p / aspect, 0, 0, 0,
    0, p, 0, 0,
    0, 0, f / (n - f), -1,
    0, 0, (n * f) / (n - f), 0,
  ]);
  return mul4(proj, view);
}

function norm(v: number[]): [number, number, number] {
  const l = Math.hypot(v[0]!, v[1]!, v[2]!) || 1;
  return [v[0]! / l, v[1]! / l, v[2]! / l];
}
function cross(a: number[], b: number[]): [number, number, number] {
  return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
}
function dot(a: number[], b: number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}
function mul4(a: Float32Array, b: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] =
        a[0 * 4 + r]! * b[c * 4 + 0]! +
        a[1 * 4 + r]! * b[c * 4 + 1]! +
        a[2 * 4 + r]! * b[c * 4 + 2]! +
        a[3 * 4 + r]! * b[c * 4 + 3]!;
    }
  }
  return o;
}
