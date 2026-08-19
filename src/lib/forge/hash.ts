import type { GraphDoc } from "./types";

/** Fast stable FNV-1a 32 of a canonical graph (positions ignored). */
export function hashGraph(doc: GraphDoc): string {
  const payload = {
    v: doc.version,
    n: [...doc.nodes]
      .map((n) => ({ id: n.id, type: n.type, params: n.params }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    e: [...doc.edges]
      .map((e) => ({
        f: e.from,
        fp: e.fromPort,
        t: e.to,
        tp: e.toPort,
      }))
      .sort((a, b) => `${a.f}${a.fp}${a.t}${a.tp}`.localeCompare(`${b.f}${b.fp}${b.t}${b.tp}`)),
  };
  const s = JSON.stringify(payload);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
