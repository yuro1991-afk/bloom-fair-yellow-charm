/// <reference types="@webgpu/types" />

export type VramStatus = "idle" | "requesting" | "mounted" | "unavailable" | "lost";

export type VramAlloc = {
  name: string;
  bytes: number;
  kind: "buffer" | "texture";
};

export type VramSnapshot = {
  status: VramStatus;
  reason: string;
  vendor: string;
  architecture: string;
  device: string;
  description: string;
  features: string[];
  maxBufferSize: number;
  maxStorageBuffer: number;
  maxTexture3d: number;
  allocated: number;
  allocs: VramAlloc[];
  writes: number;
  fps: number;
  orbs: number;
  volumeDim: number;
  scratchBytes: number;
  backend: string;
};

const EMPTY: VramSnapshot = {
  status: "idle",
  reason: "",
  vendor: "",
  architecture: "",
  device: "",
  description: "",
  backend: "",
  features: [],
  maxBufferSize: 0,
  maxStorageBuffer: 0,
  maxTexture3d: 0,
  allocated: 0,
  allocs: [],
  writes: 0,
  fps: 0,
  orbs: 0,
  volumeDim: 0,
  scratchBytes: 0,
};

type NamedBuffer = { buf: GPUBuffer; bytes: number };
type NamedTex = { tex: GPUTexture; bytes: number };

export class VramHeap {
  status: VramStatus = "idle";
  reason = "";
  adapter: GPUAdapter | null = null;
  device: GPUDevice | null = null;
  format: GPUTextureFormat = "bgra8unorm";
  vendor = "";
  architecture = "";
  deviceLabel = "";
  description = "";
  features: string[] = [];
  maxBufferSize = 0;
  maxStorageBuffer = 0;
  maxTexture3d = 0;
  orbs = 0;
  volumeDim = 0;
  scratchBytes = 0;
  backend = "";
  private extraAllocs: VramAlloc[] = [];

  private buffers = new Map<string, NamedBuffer>();
  private textures = new Map<string, NamedTex>();
  private inflight: Promise<VramSnapshot> | null = null;
  private writeCount = 0;
  private writeWindow = 0;
  private writeStamp = 0;
  private frames = 0;
  private fpsStamp = 0;
  private fps = 0;
  private lostHook: (() => void) | null = null;

  available(): boolean {
    return typeof navigator !== "undefined" && Boolean(navigator.gpu);
  }

  async mount(scratchMb = 4): Promise<VramSnapshot> {
    if (this.status === "mounted") {
      if (this.device) this.ensureScratch(scratchMb);
      return this.snapshot();
    }
    if (this.inflight) {
      await this.inflight;
      if (this.device) this.ensureScratch(scratchMb);
      return this.snapshot();
    }
    this.inflight = this.mountInner(scratchMb).finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async mountInner(scratchMb: number): Promise<VramSnapshot> {
    if (!this.available()) {
      if (this.extraAllocs.length) return this.snapshot();
      this.status = "unavailable";
      this.reason = "This browser has no navigator.gpu";
      return this.snapshot();
    }
    this.status = "requesting";
    this.reason = "";
    try {
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
      if (!adapter) {
        if (this.extraAllocs.length) return this.snapshot();
        this.status = "unavailable";
        this.reason = "No GPU adapter (WebGPU blocked or no device)";
        return this.snapshot();
      }
      const device = await adapter.requestDevice({ label: "omni-forge.vram" });
      this.adapter = adapter;
      this.device = device;
      this.format = navigator.gpu.getPreferredCanvasFormat();
      const info = adapter.info;
      this.vendor = info.vendor || "unknown";
      this.architecture = info.architecture || "";
      this.deviceLabel = info.device || "";
      this.description = info.description || "WebGPU";
      this.features = [...adapter.features.values()];
      this.maxBufferSize = adapter.limits.maxBufferSize;
      this.maxStorageBuffer = adapter.limits.maxStorageBufferBindingSize;
      this.maxTexture3d = adapter.limits.maxTextureDimension3D;
      this.status = "mounted";
      this.reason = "";
      device.addEventListener("uncapturederror", (ev) => {
        this.reason = ev.error?.message ?? "gpu error";
      });
      device.lost.then((lost) => {
        if (this.device !== device) return;
        for (const { buf } of this.buffers.values()) buf.destroy();
        for (const { tex } of this.textures.values()) tex.destroy();
        this.buffers.clear();
        this.textures.clear();
        this.device = null;
        this.adapter = null;
        if (this.backend.includes("webgl2") && this.extraAllocs.length) {
          this.backend = "webgl2";
          this.status = "mounted";
          return;
        }
        this.status = "lost";
        this.reason = lost.message || lost.reason;
        this.lostHook?.();
      });
      this.ensureScratch(scratchMb);
    } catch (err) {
      if (this.extraAllocs.length) {
        this.status = "mounted";
        this.backend = "webgl2";
        return this.snapshot();
      }
      this.status = "unavailable";
      this.reason = err instanceof Error ? err.message : "requestDevice failed";
      this.teardown();
    }
    return this.snapshot();
  }

  onLost(fn: () => void) {
    this.lostHook = fn;
  }

  unmount() {
    this.teardown();
    this.status = "idle";
    this.reason = "unmounted";
  }

  adoptGl(gl: WebGL2RenderingContext, allocs: VramAlloc[], scratchMb = 4) {
    this.status = "mounted";
    this.reason = "";
    this.backend = this.device ? "webgpu+webgl2" : "webgl2";
    this.vendor = this.vendor || (gl.getParameter(gl.VENDOR) as string) || "WebGL2";
    this.description = this.description || (gl.getParameter(gl.RENDERER) as string) || "WebGL2";
    this.scratchBytes = Math.round(clamp(scratchMb, 1, 64) * 1024 * 1024);
    this.extraAllocs = allocs.map((a) =>
      a.name === "gl.scratch" ? { ...a, bytes: this.scratchBytes } : a,
    );
  }

  noteWrites(n: number) {
    this.writeCount += n;
  }

  buffer(name: string, bytes: number, usage: GPUBufferUsageFlags): GPUBuffer {
    const device = this.requireDevice();
    const size = align256(Math.max(bytes, 16));
    const prev = this.buffers.get(name);
    if (prev && prev.bytes === size) return prev.buf;
    prev?.buf.destroy();
    const buf = device.createBuffer({ label: `vram.${name}`, size, usage });
    this.buffers.set(name, { buf, bytes: size });
    return buf;
  }

  texture(name: string, desc: GPUTextureDescriptor, bytesHint?: number): GPUTexture {
    const device = this.requireDevice();
    const prev = this.textures.get(name);
    prev?.tex.destroy();
    const tex = device.createTexture({ ...desc, label: desc.label ?? `vram.${name}` });
    const size = extentSize(desc.size);
    const bytes = bytesHint ?? size.w * size.h * size.d * bytesPerPixel(desc.format);
    this.textures.set(name, { tex, bytes });
    return tex;
  }

  getBuffer(name: string): GPUBuffer | null {
    return this.buffers.get(name)?.buf ?? null;
  }

  getTexture(name: string): GPUTexture | null {
    return this.textures.get(name)?.tex ?? null;
  }

  write(name: string, data: ArrayBuffer | ArrayBufferView, offset = 0) {
    const device = this.requireDevice();
    const buf = this.buffers.get(name)?.buf;
    if (!buf) return;
    device.queue.writeBuffer(buf, offset, data as GPUAllowSharedBufferSource);
    this.writeCount += 1;
  }

  writeTexture(name: string, data: ArrayBuffer | ArrayBufferView, bytesPerRow: number, size: GPUExtent3DStrict) {
    const device = this.requireDevice();
    const tex = this.textures.get(name)?.tex;
    if (!tex) return;
    device.queue.writeTexture({ texture: tex }, data as GPUAllowSharedBufferSource, { bytesPerRow }, size);
    this.writeCount += 1;
  }

  markFrame() {
    const now = performance.now();
    this.frames += 1;
    if (!this.fpsStamp) this.fpsStamp = now;
    if (now - this.fpsStamp >= 500) {
      this.fps = (this.frames * 1000) / (now - this.fpsStamp);
      this.frames = 0;
      this.fpsStamp = now;
    }
    if (!this.writeStamp) this.writeStamp = now;
    if (now - this.writeStamp >= 1000) {
      this.writeWindow = this.writeCount;
      this.writeCount = 0;
      this.writeStamp = now;
    }
  }

  snapshot(): VramSnapshot {
    const allocs: VramAlloc[] = [
      ...[...this.buffers.entries()].map(([name, v]) => ({
        name,
        bytes: v.bytes,
        kind: "buffer" as const,
      })),
      ...[...this.textures.entries()].map(([name, v]) => ({
        name,
        bytes: v.bytes,
        kind: "texture" as const,
      })),
      ...this.extraAllocs,
    ];
    return {
      status: this.status,
      reason: this.reason,
      vendor: this.vendor,
      architecture: this.architecture,
      device: this.deviceLabel,
      description: this.description,
      features: this.features,
      maxBufferSize: this.maxBufferSize,
      maxStorageBuffer: this.maxStorageBuffer,
      maxTexture3d: this.maxTexture3d,
      allocated: allocs.reduce((s, a) => s + a.bytes, 0),
      allocs,
      writes: this.writeWindow,
      fps: this.fps,
      orbs: this.orbs,
      volumeDim: this.volumeDim,
      scratchBytes: this.scratchBytes,
      backend: this.backend || (this.device ? "webgpu" : ""),
    };
  }

  private ensureScratch(mb: number) {
    const bytes = Math.round(clamp(mb, 1, 64) * 1024 * 1024);
    this.scratchBytes = bytes;
    this.buffer(
      "scratch",
      bytes,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    );
  }

  private requireDevice(): GPUDevice {
    if (!this.device) throw new Error("VRAM is not mounted");
    return this.device;
  }

  private teardown() {
    for (const { buf } of this.buffers.values()) buf.destroy();
    for (const { tex } of this.textures.values()) tex.destroy();
    this.buffers.clear();
    this.textures.clear();
    this.device?.destroy();
    this.device = null;
    this.adapter = null;
    this.orbs = 0;
    this.volumeDim = 0;
    this.scratchBytes = 0;
    this.backend = "";
    this.extraAllocs = [];
  }
}

export const vram = new VramHeap();

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export { EMPTY as emptyVram };

function align256(n: number): number {
  return Math.ceil(n / 256) * 256;
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function extentSize(size: GPUExtent3D): { w: number; h: number; d: number } {
  if (Array.isArray(size)) {
    return { w: size[0] ?? 1, h: size[1] ?? 1, d: size[2] ?? 1 };
  }
  const dict = size as GPUExtent3DDict;
  return { w: dict.width, h: dict.height ?? 1, d: dict.depthOrArrayLayers ?? 1 };
}

function bytesPerPixel(format: GPUTextureFormat): number {
  if (format === "r32float") return 4;
  if (format === "rgba16float") return 8;
  if (format === "depth24plus") return 4;
  return 4;
}
