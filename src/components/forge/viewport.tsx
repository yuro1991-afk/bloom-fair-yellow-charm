import { useEffect, useRef, useState } from "react";
import { blankScene } from "@/lib/forge/execute";
import type { SceneSpec } from "@/lib/forge/types";
import { GlViewport } from "@/lib/gpu/gl-renderer";
import { emptyVram, formatBytes, vram, type VramSnapshot } from "@/lib/gpu/vram";
import { cn } from "@/lib/utils";
import { useForge } from "@/store/forge-store";

export function Viewport() {
  const glRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<GlViewport | null>(null);
  const scene = useForge((s) => s.run?.scene) ?? blankScene();
  const run = useForge((s) => s.run);
  const [snap, setSnap] = useState<VramSnapshot>(emptyVram);
  const heapMb = heapFromRun(run);

  useEffect(() => {
    let stop = false;
    let tries = 0;
    const attach = () => {
      const el = glRef.current;
      if (stop || !el || renderer.current) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) {
        if (tries++ < 40) requestAnimationFrame(attach);
        return false;
      }
      try {
        vram.scratchBytes = Math.round(heapMb * 1024 * 1024);
        renderer.current = new GlViewport(el);
        setSnap(vram.snapshot());
        return true;
      } catch (err) {
        vram.status = "unavailable";
        vram.reason = err instanceof Error ? err.message : "WebGL2 mount failed";
        setSnap(vram.snapshot());
        return false;
      }
    };
    const raf = requestAnimationFrame(attach);
    const ro = new ResizeObserver(() => attach());
    const el = glRef.current;
    if (el) ro.observe(el);
    void vram.mount(heapMb).then(() => {
      if (!stop && vram.status === "mounted") setSnap(vram.snapshot());
    });
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [heapMb]);

  useEffect(() => {
    let raf = 0;
    let lastHud = 0;
    const loop = () => {
      const el = glRef.current;
      if (renderer.current && el && vram.status === "mounted") {
        renderer.current.frame(el, scene);
      }
      const now = performance.now();
      if (now - lastHud > 200) {
        lastHud = now;
        setSnap(vram.snapshot());
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  async function toggle() {
    if (vram.status === "mounted") {
      renderer.current?.dispose();
      renderer.current = null;
      vram.unmount();
      setSnap(vram.snapshot());
      return;
    }
    const el = glRef.current;
    if (!el) return;
    vram.scratchBytes = Math.round(heapMb * 1024 * 1024);
    renderer.current = new GlViewport(el);
    await vram.mount(heapMb);
    setSnap(vram.snapshot());
  }

  const live = snap.status === "mounted";
  const label = live
    ? `${formatBytes(snap.allocated)} · ${snap.backend || "gpu"}`
    : snap.status === "requesting"
      ? "requesting"
      : snap.reason || snap.status;

  return (
    <div className="flex h-full min-h-[180px] flex-col border-t border-border bg-bg">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
        <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">Viewport</p>
        <button
          type="button"
          onClick={() => void toggle()}
          className="font-mono text-[10px] tracking-wide text-muted uppercase hover:text-fg"
        >
          {live ? "Unmount" : "Mount VRAM"}
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 pb-1">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] text-muted">
          <span className={cn("size-1.5 shrink-0 rounded-full", live ? "bg-live" : "bg-subtle")} />
          <span className="truncate">{live ? "VRAM mounted" : "VRAM"} · {label}</span>
        </span>
      </div>
      <canvas ref={glRef} className="min-h-0 w-full flex-1" />
      <div className="border-t border-line px-3 py-1.5 font-mono text-[10px] leading-relaxed text-subtle">
        {live ? (
          <>
            {snap.fps.toFixed(0)} fps · {snap.orbs} orbs · vol {snap.volumeDim}³ · {snap.writes}/s
            <br />
            scratch {formatBytes(snap.scratchBytes)}
            {snap.description ? ` · ${snap.description}` : ""}
          </>
        ) : (
          <span>GPU heap idle</span>
        )}
      </div>
    </div>
  );
}

function heapFromRun(run: { runs?: { type: string; output: Record<string, unknown> }[] } | null): number {
  const hit = run?.runs?.find((r) => r.type === "VRAM_Mount");
  const n = Number(hit?.output.heapMb);
  return Number.isFinite(n) && n > 0 ? n : 4;
}
