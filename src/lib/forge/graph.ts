import { CATALOG_BY_TYPE, defaultParams, portsCompatible } from "./catalog";
import type { CompileIssue, GraphDoc, GraphEdge, GraphNode } from "./types";

export function emptyGraph(name = "untitled"): GraphDoc {
  return { version: 1, name, nodes: [], edges: [] };
}

export function makeNode(type: string, x: number, y: number, id: string): GraphNode | null {
  if (!CATALOG_BY_TYPE[type]) return null;
  return { id, type, x, y, params: defaultParams(type) };
}

export function incoming(doc: GraphDoc, nodeId: string, port: string): GraphEdge | undefined {
  return doc.edges.find((e) => e.to === nodeId && e.toPort === port);
}

export function outgoing(doc: GraphDoc, nodeId: string, port: string): GraphEdge[] {
  return doc.edges.filter((e) => e.from === nodeId && e.fromPort === port);
}

export function canConnect(
  doc: GraphDoc,
  from: string,
  fromPort: string,
  to: string,
  toPort: string,
): CompileIssue | null {
  if (from === to) {
    return { level: "error", code: "self", message: "Cannot wire a node to itself." };
  }
  const a = doc.nodes.find((n) => n.id === from);
  const b = doc.nodes.find((n) => n.id === to);
  if (!a || !b) return { level: "error", code: "missing", message: "Unknown node." };
  const da = CATALOG_BY_TYPE[a.type];
  const db = CATALOG_BY_TYPE[b.type];
  if (!da || !db) return { level: "error", code: "unknown_type", message: "Unknown node type." };
  const op = da.outputs.find((p) => p.id === fromPort);
  const ip = db.inputs.find((p) => p.id === toPort);
  if (!op || !ip) return { level: "error", code: "port", message: "Unknown port." };
  if (!portsCompatible(op.kind, ip.kind)) {
    return {
      level: "error",
      code: "type",
      message: `Port mismatch: ${op.kind} → ${ip.kind}.`,
    };
  }
  return null;
}

export function replaceEdge(
  edges: GraphEdge[],
  next: GraphEdge,
): GraphEdge[] {
  return [...edges.filter((e) => !(e.to === next.to && e.toPort === next.toPort)), next];
}

export function nodeById(doc: GraphDoc, id: string): GraphNode | undefined {
  return doc.nodes.find((n) => n.id === id);
}
