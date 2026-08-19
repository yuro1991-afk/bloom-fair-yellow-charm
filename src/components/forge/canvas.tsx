import { useEffect, useRef } from "react";
import { Scissors } from "lucide-react";
import { CATALOG_BY_TYPE } from "@/lib/forge/catalog";
import { bezier, portCenter } from "@/lib/forge/layout";
import { clamp } from "@/lib/utils";
import {
  SHORT_RADIUS,
  SNAP_RADIUS,
  kindsCompatible,
  nearestPort,
  sourceKind,
} from "@/lib/forge/wiring";
import { useForge } from "@/store/forge-store";
import { NodeCard } from "./node-card";
import { ToolRail } from "./tool-rail";

function inputKind(type: string, portId: string): string | null {
  return CATALOG_BY_TYPE[type]?.inputs.find((p) => p.id === portId)?.kind ?? null;
}

function fieldClass(tool: string): string {
  const base = "canvas-blueprint-field relative h-full w-full overflow-hidden";
  if (tool === "wire") return `${base} cursor-wire`;
  if (tool === "cut") return `${base} cursor-cut`;
  return base;
}

export function ForgeCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const space = useRef(false);
  const doc = useForge((s) => s.doc);
  const cam = useForge((s) => s.cam);
  const tool = useForge((s) => s.tool);
  const selected = useForge((s) => s.selected);
  const selectedEdge = useForge((s) => s.selectedEdge);
  const connecting = useForge((s) => s.connecting);
  const snap = useForge((s) => s.snap);
  const shorts = useForge((s) => s.shorts);
  const cutStroke = useForge((s) => s.cutStroke);
  const cursor = useForge((s) => s.cursor);
  const setCam = useForge((s) => s.setCam);
  const select = useForge((s) => s.select);
  const selectEdge = useForge((s) => s.selectEdge);
  const setConnecting = useForge((s) => s.setConnecting);
  const setSnap = useForge((s) => s.setSnap);
  const setCursor = useForge((s) => s.setCursor);
  const moveNode = useForge((s) => s.moveNode);
  const connect = useForge((s) => s.connect);
  const addNode = useForge((s) => s.addNode);
  const push = useForge((s) => s.push);
  const persist = useForge((s) => s.persist);
  const shortAt = useForge((s) => s.shortAt);
  const pruneShorts = useForge((s) => s.pruneShorts);
  const setCutStroke = useForge((s) => s.setCutStroke);
  const cutStrokeFinish = useForge((s) => s.cutStrokeFinish);

  const drag = useRef<{
    kind: "pan" | "node";
    id?: string;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const wireGesture = useRef({ live: false, dragged: false, x: 0, y: 0 });

  function worldFromEvent(e: { clientX: number; clientY: number }) {
    const el = wrap.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const { x, y, zoom } = useForge.getState().cam;
    return { x: (e.clientX - r.left - x) / zoom, y: (e.clientY - r.top - y) / zoom };
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        space.current = true;
        if ((e.target as HTMLElement).tagName === "BODY" || (e.target as HTMLElement).tagName === "HTML") {
          e.preventDefault();
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") space.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const state = useForge.getState();
      const r = el.getBoundingClientRect();
      const mx = ev.clientX - r.left;
      const my = ev.clientY - r.top;
      const old = state.cam.zoom;
      const next = clamp(old * (ev.deltaY > 0 ? 0.92 : 1.08), 0.35, 1.8);
      const wx = (mx - state.cam.x) / old;
      const wy = (my - state.cam.y) / old;
      setCam({ zoom: next, x: mx - wx * next, y: my - wy * next });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setCam]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      pruneShorts();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pruneShorts]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const w = worldFromEvent(e);
      const state = useForge.getState();
      setCursor(w);

      const d = drag.current;
      if (d?.kind === "pan") {
        setCam({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
        return;
      }
      if (d?.kind === "node" && d.id) {
        const z = state.cam.zoom;
        moveNode(d.id, d.ox + (e.clientX - d.sx) / z, d.oy + (e.clientY - d.sy) / z);
        return;
      }

      if (state.cutStroke) {
        const last = state.cutStroke[state.cutStroke.length - 1];
        if (!last || Math.hypot(w.x - last.x, w.y - last.y) > 3) {
          setCutStroke([...state.cutStroke, w]);
        }
        return;
      }

      if (state.connecting) {
        const g = wireGesture.current;
        if (g.live && !g.dragged && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 7) {
          g.dragged = true;
        }
        const kind = sourceKind(state.doc, state.connecting.from, state.connecting.fromPort);
        const hit = nearestPort(state.doc, w, {
          side: "in",
          excludeNode: state.connecting.from,
          max: SNAP_RADIUS,
        });
        if (!hit || !kind) {
          setSnap(null);
          return;
        }
        const ok = kindsCompatible(kind, hit.kind);
        if (ok) {
          setSnap({
            nodeId: hit.nodeId,
            portId: hit.portId,
            compatible: true,
            x: hit.x,
            y: hit.y,
          });
        } else if (hit.dist <= SHORT_RADIUS) {
          setSnap({
            nodeId: hit.nodeId,
            portId: hit.portId,
            compatible: false,
            x: hit.x,
            y: hit.y,
          });
        } else {
          setSnap(null);
        }
      }
    };

    const onUp = () => {
      const state = useForge.getState();
      if (drag.current?.kind === "node") persist();
      drag.current = null;

      if (state.cutStroke) {
        cutStrokeFinish();
        return;
      }

      if (state.connecting) {
        const c = state.connecting;
        const s = state.snap;
        const g = wireGesture.current;
        if (s?.compatible && g.dragged) {
          connect(c.from, c.fromPort, s.nodeId, s.portId);
        } else if (s && !s.compatible && g.dragged) {
          const fromK = sourceKind(state.doc, c.from, c.fromPort) ?? "?";
          const toNode = state.doc.nodes.find((n) => n.id === s.nodeId);
          const toK = toNode ? (inputKind(toNode.type, s.portId) ?? "?") : "?";
          shortAt(s.x, s.y, `Short circuit — ${fromK} cannot feed ${toK}`);
        } else if (g.dragged) {
          setConnecting(null);
          setSnap(null);
        }
        wireGesture.current = { live: false, dragged: false, x: 0, y: 0 };
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [
    connect,
    cutStrokeFinish,
    moveNode,
    persist,
    setCam,
    setConnecting,
    setCursor,
    setCutStroke,
    setSnap,
    shortAt,
  ]);

  function onBackgroundDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    if ((e.target as HTMLElement).closest("[data-tool-rail]")) return;
    const w = worldFromEvent(e);
    const t = useForge.getState().tool;

    if (space.current || e.button === 1 || e.altKey || t === "select") {
      if (t === "select") select(null);
      if (t === "select" || space.current || e.button === 1 || e.altKey) {
        drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: cam.x, oy: cam.y };
      }
    }
    if (t === "cut" && !space.current && e.button === 0) {
      setCutStroke([w]);
    }
    if (t === "wire" && !space.current) {
      select(null);
    }
  }

  function onNodePointerDown(id: string, e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-port-side]")) return;
    e.stopPropagation();
    const t = useForge.getState().tool;
    if (space.current) {
      drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: cam.x, oy: cam.y };
      return;
    }
    if (t === "cut") {
      setCutStroke([worldFromEvent(e)]);
      return;
    }
    if (t === "wire") {
      select(id);
      return;
    }
    select(id);
    const node = doc.nodes.find((n) => n.id === id);
    if (!node) return;
    push();
    drag.current = { kind: "node", id, sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y };
  }

  function onPortDown(nodeId: string, side: "in" | "out", portId: string, e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (useForge.getState().tool === "cut") return;
    if (side === "out") {
      setConnecting({ from: nodeId, fromPort: portId });
      setSnap(null);
      wireGesture.current = { live: true, dragged: false, x: e.clientX, y: e.clientY };
      return;
    }
    const c = useForge.getState().connecting;
    if (!c) return;
    const kind = sourceKind(useForge.getState().doc, c.from, c.fromPort);
    const toNode = useForge.getState().doc.nodes.find((n) => n.id === nodeId);
    const toKind = toNode ? inputKind(toNode.type, portId) : null;
    const n = useForge.getState().doc.nodes.find((x) => x.id === nodeId);
    const pos = n ? portCenter(n, portId, "in") : { x: 0, y: 0 };
    if (kind && toKind && kindsCompatible(kind, toKind)) {
      connect(c.from, c.fromPort, nodeId, portId);
    } else {
      shortAt(pos.x, pos.y, `Short circuit — ${kind ?? "?"} cannot feed ${toKind ?? "?"}`);
    }
  }

  const nodesById = new Map(doc.nodes.map((n) => [n.id, n]));
  const wireEnd = snap ? { x: snap.x, y: snap.y } : cursor;
  const wireStroke = snap
    ? snap.compatible
      ? "var(--color-snap)"
      : "var(--color-danger)"
    : "var(--color-primary)";

  return (
    <div
      ref={wrap}
      className={fieldClass(tool)}
      onPointerDown={onBackgroundDown}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("application/x-forge-type")) e.preventDefault();
      }}
      onDrop={(e) => {
        const type = e.dataTransfer.getData("application/x-forge-type");
        if (!type) return;
        const w = worldFromEvent(e);
        addNode(type, w.x - 114, w.y - 20);
      }}
    >
      <div data-tool-rail="">
        <ToolRail />
      </div>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})` }}
      >
        <div
          className="canvas-blueprint-sheet pointer-events-none absolute"
          style={{ left: -4800, top: -3200, width: 14000, height: 9000 }}
        />
        <svg className="pointer-events-none absolute overflow-visible" width="1" height="1">
          {doc.edges.map((e) => {
            const a = nodesById.get(e.from);
            const b = nodesById.get(e.to);
            if (!a || !b) return null;
            const p1 = portCenter(a, e.fromPort, "out");
            const p2 = portCenter(b, e.toPort, "in");
            const on = selectedEdge === e.id;
            return (
              <g key={e.id}>
                <path
                  d={bezier(p1.x, p1.y, p2.x, p2.y)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  className="pointer-events-auto"
                  onPointerDown={(ev) => {
                    ev.stopPropagation();
                    if (useForge.getState().tool === "cut") {
                      useForge.getState().cutEdges([e.id]);
                      return;
                    }
                    selectEdge(e.id);
                  }}
                />
                <path
                  d={bezier(p1.x, p1.y, p2.x, p2.y)}
                  fill="none"
                  stroke={on ? "var(--color-primary)" : "var(--color-blueprint-ink)"}
                  strokeWidth={on ? 2.2 : 1.5}
                />
              </g>
            );
          })}
          {connecting
            ? (() => {
                const a = nodesById.get(connecting.from);
                if (!a) return null;
                const p1 = portCenter(a, connecting.fromPort, "out");
                return (
                  <path
                    d={bezier(p1.x, p1.y, wireEnd.x, wireEnd.y)}
                    fill="none"
                    stroke={wireStroke}
                    strokeWidth={snap?.compatible ? 2.2 : 1.6}
                    strokeDasharray={snap?.compatible ? undefined : "5 4"}
                  />
                );
              })()
            : null}
          {cutStroke && cutStroke.length > 1 ? (
            <polyline
              points={cutStroke.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="var(--color-danger)"
              strokeWidth={1.6}
              strokeDasharray="5 4"
            />
          ) : null}
          {shorts.map((s) => (
            <g key={s.id} className="short-burst" style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                return (
                  <line
                    key={i}
                    x1={s.x}
                    y1={s.y}
                    x2={s.x + Math.cos(a) * 18}
                    y2={s.y + Math.sin(a) * 18}
                    stroke="var(--color-danger)"
                    strokeWidth={1.4}
                  />
                );
              })}
              <circle cx={s.x} cy={s.y} r={5} fill="none" stroke="var(--color-danger)" strokeWidth={1.2} />
            </g>
          ))}
        </svg>
        {doc.nodes.map((n) => (
          <div key={n.id} onPointerDown={(e) => onNodePointerDown(n.id, e)}>
            <NodeCard
              node={n}
              selected={selected === n.id}
              onPortDown={(side, portId, e) => onPortDown(n.id, side, portId, e)}
            />
          </div>
        ))}
      </div>
      {tool === "cut" ? (
        <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-blueprint-ink uppercase">
          <Scissors className="size-3" strokeWidth={1.75} />
          Drag across a wire to cut
        </div>
      ) : null}
    </div>
  );
}
