import { CATALOG_BY_TYPE, portsCompatible } from "./catalog";
import { bezier, portCenter } from "./layout";
import type { GraphDoc, GraphEdge } from "./types";

export const SNAP_RADIUS = 58;
export const SHORT_RADIUS = 34;
export const CUT_HIT = 10;

export type PortHit = {
  nodeId: string;
  portId: string;
  side: "in" | "out";
  kind: string;
  x: number;
  y: number;
  dist: number;
};

export function listPorts(doc: GraphDoc, side?: "in" | "out"): PortHit[] {
  const out: PortHit[] = [];
  for (const node of doc.nodes) {
    const def = CATALOG_BY_TYPE[node.type];
    if (!def) continue;
    if (!side || side === "in") {
      for (const p of def.inputs) {
        const c = portCenter(node, p.id, "in");
        out.push({ nodeId: node.id, portId: p.id, side: "in", kind: p.kind, x: c.x, y: c.y, dist: 0 });
      }
    }
    if (!side || side === "out") {
      for (const p of def.outputs) {
        const c = portCenter(node, p.id, "out");
        out.push({ nodeId: node.id, portId: p.id, side: "out", kind: p.kind, x: c.x, y: c.y, dist: 0 });
      }
    }
  }
  return out;
}

export function nearestPort(
  doc: GraphDoc,
  pt: { x: number; y: number },
  opts: { side?: "in" | "out"; excludeNode?: string; max: number },
): PortHit | null {
  let best: PortHit | null = null;
  for (const p of listPorts(doc, opts.side)) {
    if (opts.excludeNode && p.nodeId === opts.excludeNode) continue;
    const d = Math.hypot(p.x - pt.x, p.y - pt.y);
    if (d > opts.max) continue;
    if (!best || d < best.dist) best = { ...p, dist: d };
  }
  return best;
}

export function kindsCompatible(fromKind: string, toKind: string): boolean {
  return portsCompatible(fromKind, toKind);
}

export function sourceKind(doc: GraphDoc, nodeId: string, portId: string): string | null {
  const node = doc.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  return CATALOG_BY_TYPE[node.type]?.outputs.find((p) => p.id === portId)?.kind ?? null;
}

function cubic(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export function bezierPoints(x1: number, y1: number, x2: number, y2: number, n = 18): { x: number; y: number }[] {
  const dx = Math.max(48, Math.abs(x2 - x1) * 0.45);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({
      x: cubic(t, x1, x1 + dx, x2 - dx, x2),
      y: cubic(t, y1, y1, y2, y2),
    });
  }
  return pts;
}

function orient(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
}

function onSeg(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): boolean {
  return (
    Math.min(ax, bx) - 0.01 <= cx &&
    cx <= Math.max(ax, bx) + 0.01 &&
    Math.min(ay, by) - 0.01 <= cy &&
    cy <= Math.max(ay, by) + 0.01
  );
}

export function segmentsCross(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
): boolean {
  const o1 = orient(a.x, a.y, b.x, b.y, c.x, c.y);
  const o2 = orient(a.x, a.y, b.x, b.y, d.x, d.y);
  const o3 = orient(c.x, c.y, d.x, d.y, a.x, a.y);
  const o4 = orient(c.x, c.y, d.x, d.y, b.x, b.y);
  if (o1 === 0 && onSeg(a.x, a.y, b.x, b.y, c.x, c.y)) return true;
  if (o2 === 0 && onSeg(a.x, a.y, b.x, b.y, d.x, d.y)) return true;
  if (o3 === 0 && onSeg(c.x, c.y, d.x, d.y, a.x, a.y)) return true;
  if (o4 === 0 && onSeg(c.x, c.y, d.x, d.y, b.x, b.y)) return true;
  return o1 * o2 < 0 && o3 * o4 < 0;
}

export function polylineHits(a: { x: number; y: number }[], b: { x: number; y: number }[]): boolean {
  for (let i = 1; i < a.length; i++) {
    for (let j = 1; j < b.length; j++) {
      if (segmentsCross(a[i - 1]!, a[i]!, b[j - 1]!, b[j]!)) return true;
    }
  }
  return false;
}

export function distToPolyline(pt: { x: number; y: number }, poly: { x: number; y: number }[]): number {
  let best = Infinity;
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1]!;
    const b = poly[i]!;
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const len2 = abx * abx + aby * aby || 1;
    const t = Math.max(0, Math.min(1, ((pt.x - a.x) * abx + (pt.y - a.y) * aby) / len2));
    const d = Math.hypot(pt.x - (a.x + abx * t), pt.y - (a.y + aby * t));
    if (d < best) best = d;
  }
  return best;
}

export function edgePolyline(doc: GraphDoc, edge: GraphEdge): { x: number; y: number }[] | null {
  const a = doc.nodes.find((n) => n.id === edge.from);
  const b = doc.nodes.find((n) => n.id === edge.to);
  if (!a || !b) return null;
  const p1 = portCenter(a, edge.fromPort, "out");
  const p2 = portCenter(b, edge.toPort, "in");
  return bezierPoints(p1.x, p1.y, p2.x, p2.y);
}

export function edgesHitByStroke(doc: GraphDoc, stroke: { x: number; y: number }[]): string[] {
  if (stroke.length < 2) return [];
  const ids: string[] = [];
  for (const e of doc.edges) {
    const poly = edgePolyline(doc, e);
    if (poly && polylineHits(poly, stroke)) ids.push(e.id);
  }
  return ids;
}

export function nearestEdge(doc: GraphDoc, pt: { x: number; y: number }, max: number): string | null {
  let best: { id: string; d: number } | null = null;
  for (const e of doc.edges) {
    const poly = edgePolyline(doc, e);
    if (!poly) continue;
    const d = distToPolyline(pt, poly);
    if (d > max) continue;
    if (!best || d < best.d) best = { id: e.id, d };
  }
  return best?.id ?? null;
}

export { bezier };
