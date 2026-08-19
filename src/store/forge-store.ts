import { create } from "zustand";
import { CATALOG_BY_TYPE } from "@/lib/forge/catalog";
import { compileGraph } from "@/lib/forge/compile";
import { demoGraph } from "@/lib/forge/demo";
import { canConnect, makeNode, replaceEdge } from "@/lib/forge/graph";
import type { CompileResult, ExecuteResult, GraphDoc, GraphEdge, SavedGraph } from "@/lib/forge/types";
import { uid } from "@/lib/utils";
import { edgesHitByStroke, nearestEdge, CUT_HIT } from "@/lib/forge/wiring";

const LS_KEY = "omni-forge.graph.v4";

function snapshot(doc: GraphDoc): GraphDoc {
  return {
    version: 1,
    name: doc.name,
    nodes: doc.nodes.map((n) => ({ ...n, params: { ...n.params } })),
    edges: doc.edges.map((e) => ({ ...e })),
  };
}

function loadLocal(): GraphDoc {
  if (typeof window === "undefined") return demoGraph();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return demoGraph();
    const parsed = JSON.parse(raw) as GraphDoc;
    if (parsed?.version === 1 && Array.isArray(parsed.nodes)) return parsed;
  } catch {
    /* ignore */
  }
  return demoGraph();
}

export type Tool = "select" | "wire" | "cut";

type Cam = { x: number; y: number; zoom: number };
export type Connecting = { from: string; fromPort: string } | null;
export type SnapTarget = {
  nodeId: string;
  portId: string;
  compatible: boolean;
  x: number;
  y: number;
} | null;
export type ShortSpark = { id: string; x: number; y: number; born: number };

type ForgeState = {
  doc: GraphDoc;
  cam: Cam;
  tool: Tool;
  selected: string | null;
  selectedEdge: string | null;
  connecting: Connecting;
  snap: SnapTarget;
  shorts: ShortSpark[];
  cutStroke: { x: number; y: number }[] | null;
  cursor: { x: number; y: number };
  history: GraphDoc[];
  future: GraphDoc[];
  compile: CompileResult | null;
  run: ExecuteResult | null;
  running: boolean;
  agents: boolean;
  savedId: string | null;
  libraryQuery: string;
  mobilePanel: "none" | "library" | "inspect";
  toast: string | null;
  push: () => void;
  setDoc: (doc: GraphDoc) => void;
  setName: (name: string) => void;
  setCam: (cam: Partial<Cam>) => void;
  setTool: (tool: Tool) => void;
  select: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setConnecting: (c: Connecting) => void;
  setSnap: (s: SnapTarget) => void;
  setCursor: (p: { x: number; y: number }) => void;
  setCutStroke: (s: { x: number; y: number }[] | null) => void;
  addNode: (type: string, x: number, y: number) => void;
  moveNode: (id: string, x: number, y: number) => void;
  updateParam: (id: string, key: string, value: string | number | boolean) => void;
  connect: (from: string, fromPort: string, to: string, toPort: string) => boolean;
  shortAt: (x: number, y: number, message: string) => void;
  pruneShorts: () => void;
  cutEdges: (ids: string[]) => void;
  cutStrokeFinish: () => void;
  cutNearest: (pt: { x: number; y: number }) => void;
  removeSelected: () => void;
  undo: () => void;
  redo: () => void;
  resetDemo: () => void;
  persist: () => void;
  setLibraryQuery: (q: string) => void;
  setMobilePanel: (p: ForgeState["mobilePanel"]) => void;
  setAgents: (v: boolean) => void;
  setSavedId: (id: string | null) => void;
  localCompile: () => CompileResult;
  runRemote: () => Promise<void>;
  saveRemote: () => Promise<SavedGraph | null>;
  loadRemote: (id: string) => Promise<void>;
};

export const useForge = create<ForgeState>((set, get) => ({
  doc: demoGraph(),
  cam: { x: 16, y: 12, zoom: 0.68 },
  tool: "select",
  selected: "n_prompt",
  selectedEdge: null,
  connecting: null,
  snap: null,
  shorts: [],
  cutStroke: null,
  cursor: { x: 0, y: 0 },
  history: [],
  future: [],
  compile: null,
  run: null,
  running: false,
  agents: false,
  savedId: null,
  libraryQuery: "",
  mobilePanel: "none",
  toast: null,

  push: () => {
    const { doc, history } = get();
    set({ history: [...history.slice(-39), snapshot(doc)], future: [] });
  },
  setDoc: (doc) => set({ doc }),
  setName: (name) => set({ doc: { ...get().doc, name } }),
  setCam: (cam) => set({ cam: { ...get().cam, ...cam } }),
  setTool: (tool) =>
    set({
      tool,
      connecting: null,
      snap: null,
      cutStroke: null,
      selected: tool === "cut" ? null : get().selected,
    }),
  select: (id) => set({ selected: id, selectedEdge: null }),
  selectEdge: (id) => set({ selectedEdge: id, selected: null }),
  setConnecting: (c) => set({ connecting: c, snap: c ? get().snap : null }),
  setSnap: (s) => set({ snap: s }),
  setCursor: (p) => set({ cursor: p }),
  setCutStroke: (s) => set({ cutStroke: s }),
  setLibraryQuery: (q) => set({ libraryQuery: q }),
  setMobilePanel: (p) => set({ mobilePanel: p }),
  setAgents: (v) => set({ agents: v }),
  setSavedId: (id) => set({ savedId: id }),

  addNode: (type, x, y) => {
    if (!CATALOG_BY_TYPE[type]) return;
    get().push();
    const node = makeNode(type, x, y, uid("n"));
    if (!node) return;
    set({
      doc: { ...get().doc, nodes: [...get().doc.nodes, node] },
      selected: node.id,
      tool: "select",
    });
    get().persist();
  },
  moveNode: (id, x, y) => {
    set({
      doc: {
        ...get().doc,
        nodes: get().doc.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
      },
    });
  },
  updateParam: (id, key, value) => {
    get().push();
    set({
      doc: {
        ...get().doc,
        nodes: get().doc.nodes.map((n) =>
          n.id === id ? { ...n, params: { ...n.params, [key]: value } } : n,
        ),
      },
    });
    get().persist();
  },
  connect: (from, fromPort, to, toPort) => {
    const err = canConnect(get().doc, from, fromPort, to, toPort);
    if (err) return false;
    get().push();
    const edge: GraphEdge = { id: uid("e"), from, fromPort, to, toPort };
    set({
      doc: { ...get().doc, edges: replaceEdge(get().doc.edges, edge) },
      connecting: null,
      snap: null,
    });
    get().persist();
    return true;
  },
  shortAt: (x, y, message) => {
    const spark: ShortSpark = { id: uid("s"), x, y, born: Date.now() };
    set({
      shorts: [...get().shorts.slice(-8), spark],
      connecting: null,
      snap: null,
      toast: message,
    });
  },
  pruneShorts: () => {
    const now = Date.now();
    const next = get().shorts.filter((s) => now - s.born < 520);
    if (next.length !== get().shorts.length) set({ shorts: next });
  },
  cutEdges: (ids) => {
    if (!ids.length) return;
    const setIds = new Set(ids);
    get().push();
    set({
      doc: { ...get().doc, edges: get().doc.edges.filter((e) => !setIds.has(e.id)) },
      selectedEdge: null,
      toast: ids.length === 1 ? "Wire cut" : `${ids.length} wires cut`,
    });
    get().persist();
  },
  cutStrokeFinish: () => {
    const stroke = get().cutStroke;
    set({ cutStroke: null });
    if (!stroke || stroke.length < 2) return;
    const travel = stroke.reduce((acc, p, i) => {
      if (i === 0) return 0;
      return acc + Math.hypot(p.x - stroke[i - 1]!.x, p.y - stroke[i - 1]!.y);
    }, 0);
    if (travel < 6) {
      get().cutNearest(stroke[stroke.length - 1]!);
      return;
    }
    get().cutEdges(edgesHitByStroke(get().doc, stroke));
  },
  cutNearest: (pt) => {
    const id = nearestEdge(get().doc, pt, CUT_HIT);
    if (id) get().cutEdges([id]);
  },
  removeSelected: () => {
    const { selected, selectedEdge, doc } = get();
    if (selectedEdge) {
      get().cutEdges([selectedEdge]);
      return;
    }
    if (!selected) return;
    get().push();
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.filter((n) => n.id !== selected),
        edges: doc.edges.filter((e) => e.from !== selected && e.to !== selected),
      },
      selected: null,
    });
    get().persist();
  },
  undo: () => {
    const { history, doc, future } = get();
    const prev = history[history.length - 1];
    if (!prev) return;
    set({
      doc: prev,
      history: history.slice(0, -1),
      future: [snapshot(doc), ...future].slice(0, 40),
    });
    get().persist();
  },
  redo: () => {
    const { future, doc, history } = get();
    const next = future[0];
    if (!next) return;
    set({
      doc: next,
      future: future.slice(1),
      history: [...history, snapshot(doc)],
    });
    get().persist();
  },
  resetDemo: () => {
    get().push();
    set({ doc: demoGraph(), selected: "n_prompt", run: null, compile: null, savedId: null });
    get().persist();
  },
  persist: () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(get().doc));
    } catch {
      /* ignore */
    }
  },
  localCompile: () => {
    const result = compileGraph(get().doc);
    set({ compile: result });
    return result;
  },
  runRemote: async () => {
    set({ running: true, toast: null });
    try {
      const res = await fetch("/api/v1/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ graph: get().doc, agents: get().agents }),
      });
      const data = (await res.json()) as ExecuteResult & { error?: string };
      if (!res.ok && !data.compile) {
        set({ toast: data.error ?? "Execute failed", running: false });
        return;
      }
      set({ run: data, compile: data.compile, running: false });
      const bridgeNode = get().doc.nodes.find((n) => n.type === "Blender_Bridge");
      if (bridgeNode && bridgeNode.params.autoPush !== false && data.scene?.bpy) {
        void import("@/store/bridge-store").then(({ useBridge }) => {
          const b = useBridge.getState();
          const dry = !b.online && bridgeNode.params.dryIfOffline !== false;
          void b.push(data.scene.bpy, data.scene.target, "4.2", dry);
        });
      }
    } catch {
      set({ toast: "Network error", running: false });
    }
  },
  saveRemote: async () => {
    try {
      const id = get().savedId;
      const url = id ? `/api/v1/graphs/${id}` : "/api/v1/graphs";
      const res = await fetch(url, {
        method: id ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: get().doc.name, graph: get().doc }),
      });
      const data = (await res.json()) as { ok?: boolean; graph?: SavedGraph; error?: string };
      if (!res.ok || !data.graph) {
        set({ toast: data.error ?? "Save failed" });
        return null;
      }
      set({ savedId: data.graph.id, toast: "Deck saved" });
      return data.graph;
    } catch {
      set({ toast: "Save failed" });
      return null;
    }
  },
  loadRemote: async (id) => {
    const res = await fetch(`/api/v1/graphs/${id}`);
    const data = (await res.json()) as { graph?: GraphDoc; error?: string };
    if (!res.ok || !data.graph) {
      set({ toast: data.error ?? "Load failed" });
      return;
    }
    get().push();
    set({ doc: data.graph, savedId: id, run: null });
    get().persist();
  },
}));

export function hydrateForge() {
  const doc = loadLocal();
  useForge.setState({ doc });
}
