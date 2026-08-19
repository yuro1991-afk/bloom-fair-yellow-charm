import { CATALOG_BY_TYPE, portsCompatible } from "./catalog";
import { hashGraph } from "./hash";
import type { CompileIssue, CompileResult, GraphDoc } from "./types";

export function compileGraph(doc: GraphDoc): CompileResult {
  const t0 = performance.now();
  const issues: CompileIssue[] = [];
  const nodes = new Map(doc.nodes.map((n) => [n.id, n]));

  if (doc.nodes.length === 0) {
    issues.push({ level: "error", code: "empty", message: "Graph has no nodes." });
  }

  const seen = new Set<string>();
  for (const n of doc.nodes) {
    if (seen.has(n.id)) {
      issues.push({ level: "error", nodeId: n.id, code: "dup_id", message: `Duplicate node id ${n.id}.` });
    }
    seen.add(n.id);
    if (!CATALOG_BY_TYPE[n.type]) {
      issues.push({
        level: "error",
        nodeId: n.id,
        code: "unknown_type",
        message: `Unknown type ${n.type}.`,
      });
    }
  }

  const edgeSeen = new Set<string>();
  const inbound = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of doc.nodes) {
    inbound.set(n.id, 0);
    adj.set(n.id, []);
  }

  for (const e of doc.edges) {
    const key = `${e.from}:${e.fromPort}->${e.to}:${e.toPort}`;
    if (edgeSeen.has(key)) {
      issues.push({ level: "warn", edgeId: e.id, code: "dup_edge", message: "Duplicate wire ignored." });
      continue;
    }
    edgeSeen.add(key);

    const a = nodes.get(e.from);
    const b = nodes.get(e.to);
    if (!a || !b) {
      issues.push({ level: "error", edgeId: e.id, code: "dangling", message: "Wire points at a missing node." });
      continue;
    }
    const da = CATALOG_BY_TYPE[a.type];
    const db = CATALOG_BY_TYPE[b.type];
    if (!da || !db) continue;
    const op = da.outputs.find((p) => p.id === e.fromPort);
    const ip = db.inputs.find((p) => p.id === e.toPort);
    if (!op || !ip) {
      issues.push({ level: "error", edgeId: e.id, code: "port", message: "Wire uses an unknown port." });
      continue;
    }
    if (!portsCompatible(op.kind, ip.kind)) {
      issues.push({
        level: "error",
        edgeId: e.id,
        nodeId: b.id,
        code: "type",
        message: `${a.type}.${op.id} (${op.kind}) cannot feed ${b.type}.${ip.id} (${ip.kind}).`,
      });
    }
    adj.get(a.id)!.push(b.id);
    inbound.set(b.id, (inbound.get(b.id) ?? 0) + 1);
  }

  for (const n of doc.nodes) {
    const def = CATALOG_BY_TYPE[n.type];
    if (!def) continue;
    const wired = new Set(
      doc.edges.filter((e) => e.to === n.id).map((e) => e.toPort),
    );
    for (const input of def.inputs) {
      if (!wired.has(input.id) && input.kind !== "any") {
        // optional-ish: agents/exec often have unused sockets
        if (def.category === "execution" || def.category === "agent") {
          issues.push({
            level: "warn",
            nodeId: n.id,
            code: "unwired",
            message: `${def.title} has unwired ${input.label} port.`,
          });
        }
      }
    }
  }

  const order: string[] = [];
  const levels: string[][] = [];
  const indeg = new Map(inbound);
  let frontier = [...indeg.entries()].filter(([, d]) => d === 0).map(([id]) => id);

  while (frontier.length) {
    levels.push(frontier.slice());
    const next: string[] = [];
    for (const id of frontier) {
      order.push(id);
      for (const t of adj.get(id) ?? []) {
        const d = (indeg.get(t) ?? 1) - 1;
        indeg.set(t, d);
        if (d === 0) next.push(t);
      }
    }
    frontier = next;
  }

  if (order.length !== doc.nodes.length) {
    const cyclic = doc.nodes.filter((n) => !order.includes(n.id)).map((n) => n.id);
    issues.push({
      level: "error",
      code: "cycle",
      message: `Cycle in graph involving ${cyclic.join(", ")}.`,
    });
  }

  const ok = !issues.some((i) => i.level === "error");
  return {
    ok,
    hash: hashGraph(doc),
    order,
    levels,
    issues,
    ms: performance.now() - t0,
  };
}
