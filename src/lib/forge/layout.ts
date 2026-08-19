import { CATALOG_BY_TYPE } from "./catalog";
import type { GraphNode } from "./types";

export const NODE_W = 228;
export const HEADER_H = 34;
export const PORT_H = 22;
export const BODY_PAD = 10;

export function nodeHeight(type: string): number {
  const def = CATALOG_BY_TYPE[type];
  if (!def) return 88;
  const rows = Math.max(def.inputs.length + def.outputs.length, 1);
  return HEADER_H + BODY_PAD * 2 + rows * PORT_H + 18;
}

export function portCenter(
  node: GraphNode,
  portId: string,
  side: "in" | "out",
): { x: number; y: number } {
  const def = CATALOG_BY_TYPE[node.type];
  const list = side === "in" ? def?.inputs ?? [] : def?.outputs ?? [];
  const idx = list.findIndex((p) => p.id === portId);
  const i = idx < 0 ? 0 : idx;
  const offset = side === "out" ? (def?.inputs.length ?? 0) : 0;
  const y = node.y + HEADER_H + BODY_PAD + (offset + i) * PORT_H + PORT_H / 2;
  const x = side === "in" ? node.x : node.x + NODE_W;
  return { x, y };
}

export function bezier(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(48, Math.abs(x2 - x1) * 0.45);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}
