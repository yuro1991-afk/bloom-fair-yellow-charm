/// <reference types="@webgpu/types" />

import type { SceneSpec } from "@/lib/forge/types";
import { DRAW_WGSL } from "./shaders";
import { vram } from "./vram";

const UNIFORM_FLOATS = 16;
const MAX_ORBS = 8192;
const VOL = 64;

export class GpuViewport {
  private canvas: HTMLCanvasElement;
  private ctx: GPUCanvasContext;
  private orbPipe!: GPURenderPipeline;
  private boxPipe!: GPURenderPipeline;
  private bind!: GPUBindGroup;
  private w = 0;
  private h = 0;
  private t0 = performance.now();
  private uniformBytes = new ArrayBuffer(UNIFORM_FLOATS * 4);
  private uniformF = new Float32Array(this.uniformBytes);
  private uniformU = new Uint32Array(this.uniformBytes);
  private orbCpu = new Float32Array(MAX_ORBS * 4);
  private boxCpu = new Float32Array(72 * 4);
  private lastHollow = -1;

  constructor(canvas: HTMLCanvasElement) {
    const device = vram.device;
    if (!device) throw new Error("VRAM not mounted");
    const ctx = canvas.getContext("webgpu");
    if (!ctx) throw new Error("canvas.getContext('webgpu') failed");
    this.canvas = canvas;
    this.ctx = ctx;
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.floor(box.width * dpr));
    canvas.height = Math.max(2, Math.floor(box.height * dpr));
    this.w = canvas.width;
    this.h = canvas.height;
    ctx.configure({ device, format: vram.format, alphaMode: "opaque" });

    vram.buffer("uniforms", UNIFORM_FLOATS * 4, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    vram.buffer("orbs", MAX_ORBS * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
    vram.buffer("box", 72 * 16, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
    vram.buffer("volume", VOL * VOL * VOL * 4, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    vram.volumeDim = VOL;
    this.bakeVolume(0);

    const drawMod = device.createShaderModule({ label: "draw", code: DRAW_WGSL });
    const bgl = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      ],
    });
    const layout = device.createPipelineLayout({ bindGroupLayouts: [bgl] });
    const color = {
      format: vram.format,
      blend: {
        color: { srcFactor: "src-alpha" as const, dstFactor: "one-minus-src-alpha" as const, operation: "add" as const },
        alpha: { srcFactor: "one" as const, dstFactor: "one-minus-src-alpha" as const, operation: "add" as const },
      },
    };
    this.orbPipe = device.createRenderPipeline({
      layout,
      vertex: {
        module: drawMod,
        entryPoint: "vs_orb",
        buffers: [
          {
            arrayStride: 16,
            stepMode: "instance",
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x4" }],
          },
        ],
      },
      fragment: { module: drawMod, entryPoint: "fs", targets: [color] },
      primitive: { topology: "triangle-list", cullMode: "none" },
    });
    this.boxPipe = device.createRenderPipeline({
      layout,
      vertex: {
        module: drawMod,
        entryPoint: "vs_box",
        buffers: [
          {
            arrayStride: 16,
            stepMode: "vertex",
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 12, format: "float32" },
            ],
          },
        ],
      },
      fragment: { module: drawMod, entryPoint: "fs", targets: [color] },
      primitive: { topology: "triangle-list", cullMode: "none" },
    });
    this.bind = device.createBindGroup({
      layout: bgl,
      entries: [{ binding: 0, resource: { buffer: vram.getBuffer("uniforms")! } }],
    });
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.floor(r.width * dpr));
    const h = Math.max(2, Math.floor(r.height * dpr));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  frame(scene: SceneSpec) {
    const device = vram.device;
    if (!device || vram.status !== "mounted") return;
    this.resize();

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
    const f = this.uniformF;
    const u32 = this.uniformU;
    f[0] = time;
    f[1] = scene.clip.morph;
    f[2] = scene.clip.hollow;
    u32[3] = count;
    f[4] = sx;
    f[5] = sy;
    f[6] = sz;
    f[7] = scene.orbs.jitter;
    f[8] = Math.max(0.03, (scene.orbs.radius / maxDim) * 2.2);
    u32[9] = nx;
    u32[10] = ny;
    u32[11] = nz;
    f[12] = this.w;
    f[13] = this.h;
    f[14] = 0;
    f[15] = 0;
    vram.write("uniforms", this.uniformBytes);
    this.writeOrbs(scene, count, nx, ny, nz, sx, sy, sz, time);
    this.writeBox(sx, sy, sz, scene.clip.hollow);
    if (Math.abs(scene.clip.hollow - this.lastHollow) > 0.05) {
      this.bakeVolume(scene.clip.hollow);
      this.lastHollow = scene.clip.hollow;
    }

    const encoder = device.createCommandEncoder({ label: "forge.frame" });
    const view = this.ctx.getCurrentTexture().createView();
    const rp = encoder.beginRenderPass({
      colorAttachments: [
        {
          view,
          clearValue: { r: 0.055, g: 0.07, b: 0.09, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    rp.setBindGroup(0, this.bind);
    rp.setPipeline(this.boxPipe);
    rp.setVertexBuffer(0, vram.getBuffer("box")!);
    rp.draw(72);
    if (count > 0) {
      rp.setPipeline(this.orbPipe);
      rp.setVertexBuffer(0, vram.getBuffer("orbs")!);
      rp.draw(6, count);
    }
    rp.end();
    device.queue.submit([encoder.finish()]);
    vram.markFrame();
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
      x += Math.sin(seed) * jitter * 0.04 * sx;
      y += Math.cos(seed * 1.3) * jitter * 0.04 * sy;
      z += Math.sin(seed * 0.7) * jitter * 0.04 * sz;
      x += morph * 0.06 * sx * Math.sin(time * 1.4 + iy);
      z += morph * 0.04 * sz * Math.cos(time * 1.1 + ix);
      const b = i * 4;
      o[b] = x;
      o[b + 1] = y;
      o[b + 2] = z;
      o[b + 3] = r;
    }
    if (count > 0) vram.write("orbs", this.orbCpu.buffer.slice(0, count * 16));
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
    vram.write("box", out);
  }

  private bakeVolume(hollow: number) {
    const data = new Float32Array(VOL * VOL * VOL);
    const inner = 0.18 + hollow * 0.28;
    for (let z = 0; z < VOL; z++) {
      for (let y = 0; y < VOL; y++) {
        for (let x = 0; x < VOL; x++) {
          const fx = (x + 0.5) / VOL - 0.5;
          const fy = (y + 0.5) / VOL - 0.5;
          const fz = (z + 0.5) / VOL - 0.5;
          const box = Math.max(Math.abs(fx), Math.abs(fy), Math.abs(fz));
          data[x + y * VOL + z * VOL * VOL] = box < 0.48 && box > inner ? 1 : 0;
        }
      }
    }
    vram.write("volume", data);
  }

  dispose() {
    /* canvas context is owned by the element */
  }
}
