import { o as __toESM } from "../_runtime.mjs";
import { R as require_react, _ as Link, y as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as CloudRain, C as FileSpreadsheet, D as Crosshair, E as Cuboid, F as BookOpen, I as Blend, L as BadgeCheck, M as CircleDot, N as CircleDashed, O as Cpu, P as Box, R as Aperture, S as FlipHorizontal2, T as Download, _ as Menu, a as SquareDashed, b as Grid3x3, c as Shuffle, d as Save, f as Ruler, g as Paintbrush, h as Pentagon, i as Square, j as Circle, k as Combine, l as Scan, m as Play, n as Type, o as Spline, p as RotateCcw, s as SlidersHorizontal, t as Workflow, u as Scale, v as ListTree, w as Eye, x as GitBranch, y as ImagePlus } from "../_libs/lucide-react.mjs";
import { d as compileGraph, f as CATALOG, g as portsCompatible, h as defaultParams, i as uid, l as blankScene, m as CATEGORY_LABEL, n as clamp, p as CATALOG_BY_TYPE, r as cn } from "./router-Cvjey6fZ.mjs";
import { i as signOut, n as authClient, t as Button } from "./client-D3Ta-b2t.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-W1nnVxAE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEMO_NAME = "Hollow lattice — starter";
function demoGraph() {
	const p = (type, extra = {}) => ({
		...defaultParams(type),
		...extra
	});
	return {
		version: 1,
		name: DEMO_NAME,
		nodes: [
			{
				id: "n_prompt",
				type: "In_PromptBox",
				x: 40,
				y: 40,
				params: p("In_PromptBox")
			},
			{
				id: "n_spec",
				type: "In_SpecSheet",
				x: 40,
				y: 240,
				params: p("In_SpecSheet")
			},
			{
				id: "n_router",
				type: "Router_Agent",
				x: 300,
				y: 40,
				params: p("Router_Agent")
			},
			{
				id: "n_matrix",
				type: "Matrix_Spawner",
				x: 300,
				y: 240,
				params: p("Matrix_Spawner")
			},
			{
				id: "n_morph",
				type: "Orb_Morpher",
				x: 560,
				y: 160,
				params: p("Orb_Morpher")
			},
			{
				id: "n_mirror",
				type: "Symmetry_Mirror",
				x: 560,
				y: 380,
				params: p("Symmetry_Mirror")
			},
			{
				id: "n_hollow",
				type: "Interior_Hollower",
				x: 820,
				y: 160,
				params: p("Interior_Hollower")
			},
			{
				id: "n_pbr",
				type: "Shader_PBR",
				x: 820,
				y: 380,
				params: p("Shader_PBR")
			},
			{
				id: "n_caliper",
				type: "Measure_Caliper",
				x: 1080,
				y: 60,
				params: p("Measure_Caliper")
			},
			{
				id: "n_op",
				type: "Blender_Operator",
				x: 1080,
				y: 240,
				params: p("Blender_Operator")
			}
		],
		edges: [
			{
				id: "e1",
				from: "n_prompt",
				fromPort: "out",
				to: "n_router",
				toPort: "prompt"
			},
			{
				id: "e2",
				from: "n_spec",
				fromPort: "out",
				to: "n_router",
				toPort: "spec"
			},
			{
				id: "e3",
				from: "n_router",
				fromPort: "spatial",
				to: "n_matrix",
				toPort: "drive"
			},
			{
				id: "e4",
				from: "n_spec",
				fromPort: "out",
				to: "n_matrix",
				toPort: "spec"
			},
			{
				id: "e5",
				from: "n_matrix",
				fromPort: "out",
				to: "n_morph",
				toPort: "matrix"
			},
			{
				id: "e6",
				from: "n_morph",
				fromPort: "mesh",
				to: "n_mirror",
				toPort: "mesh"
			},
			{
				id: "e7",
				from: "n_mirror",
				fromPort: "mesh",
				to: "n_hollow",
				toPort: "mesh"
			},
			{
				id: "e8",
				from: "n_hollow",
				fromPort: "mesh",
				to: "n_pbr",
				toPort: "mesh"
			},
			{
				id: "e9",
				from: "n_hollow",
				fromPort: "mesh",
				to: "n_caliper",
				toPort: "mesh"
			},
			{
				id: "e10",
				from: "n_morph",
				fromPort: "morph",
				to: "n_op",
				toPort: "morph"
			},
			{
				id: "e11",
				from: "n_pbr",
				fromPort: "mesh",
				to: "n_op",
				toPort: "mesh"
			},
			{
				id: "e12",
				from: "n_pbr",
				fromPort: "mat",
				to: "n_op",
				toPort: "mat"
			}
		]
	};
}
function makeNode(type, x, y, id) {
	if (!CATALOG_BY_TYPE[type]) return null;
	return {
		id,
		type,
		x,
		y,
		params: defaultParams(type)
	};
}
function canConnect(doc, from, fromPort, to, toPort) {
	if (from === to) return {
		level: "error",
		code: "self",
		message: "Cannot wire a node to itself."
	};
	const a = doc.nodes.find((n) => n.id === from);
	const b = doc.nodes.find((n) => n.id === to);
	if (!a || !b) return {
		level: "error",
		code: "missing",
		message: "Unknown node."
	};
	const da = CATALOG_BY_TYPE[a.type];
	const db = CATALOG_BY_TYPE[b.type];
	if (!da || !db) return {
		level: "error",
		code: "unknown_type",
		message: "Unknown node type."
	};
	const op = da.outputs.find((p) => p.id === fromPort);
	const ip = db.inputs.find((p) => p.id === toPort);
	if (!op || !ip) return {
		level: "error",
		code: "port",
		message: "Unknown port."
	};
	if (!portsCompatible(op.kind, ip.kind)) return {
		level: "error",
		code: "type",
		message: `Port mismatch: ${op.kind} → ${ip.kind}.`
	};
	return null;
}
function replaceEdge(edges, next) {
	return [...edges.filter((e) => !(e.to === next.to && e.toPort === next.toPort)), next];
}
var LS_KEY = "omni-forge.graph.v2";
function snapshot(doc) {
	return {
		version: 1,
		name: doc.name,
		nodes: doc.nodes.map((n) => ({
			...n,
			params: { ...n.params }
		})),
		edges: doc.edges.map((e) => ({ ...e }))
	};
}
function loadLocal() {
	if (typeof window === "undefined") return demoGraph();
	try {
		const raw = window.localStorage.getItem(LS_KEY);
		if (!raw) return demoGraph();
		const parsed = JSON.parse(raw);
		if (parsed?.version === 1 && Array.isArray(parsed.nodes)) return parsed;
	} catch {}
	return demoGraph();
}
var useForge = create((set, get) => ({
	doc: demoGraph(),
	cam: {
		x: 16,
		y: 12,
		zoom: .68
	},
	selected: "n_prompt",
	selectedEdge: null,
	connecting: null,
	cursor: {
		x: 0,
		y: 0
	},
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
		set({
			history: [...history.slice(-39), snapshot(doc)],
			future: []
		});
	},
	setDoc: (doc) => set({ doc }),
	setName: (name) => set({ doc: {
		...get().doc,
		name
	} }),
	setCam: (cam) => set({ cam: {
		...get().cam,
		...cam
	} }),
	select: (id) => set({
		selected: id,
		selectedEdge: null
	}),
	selectEdge: (id) => set({
		selectedEdge: id,
		selected: null
	}),
	setConnecting: (c) => set({ connecting: c }),
	setCursor: (p) => set({ cursor: p }),
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
			doc: {
				...get().doc,
				nodes: [...get().doc.nodes, node]
			},
			selected: node.id
		});
		get().persist();
	},
	moveNode: (id, x, y) => {
		set({ doc: {
			...get().doc,
			nodes: get().doc.nodes.map((n) => n.id === id ? {
				...n,
				x,
				y
			} : n)
		} });
	},
	updateParam: (id, key, value) => {
		get().push();
		set({ doc: {
			...get().doc,
			nodes: get().doc.nodes.map((n) => n.id === id ? {
				...n,
				params: {
					...n.params,
					[key]: value
				}
			} : n)
		} });
		get().persist();
	},
	connect: (from, fromPort, to, toPort) => {
		const err = canConnect(get().doc, from, fromPort, to, toPort);
		if (err) {
			set({ toast: err.message });
			return;
		}
		get().push();
		const edge = {
			id: uid("e"),
			from,
			fromPort,
			to,
			toPort
		};
		set({
			doc: {
				...get().doc,
				edges: replaceEdge(get().doc.edges, edge)
			},
			connecting: null
		});
		get().persist();
	},
	removeSelected: () => {
		const { selected, selectedEdge, doc } = get();
		if (selectedEdge) {
			get().push();
			set({
				doc: {
					...doc,
					edges: doc.edges.filter((e) => e.id !== selectedEdge)
				},
				selectedEdge: null
			});
			get().persist();
			return;
		}
		if (!selected) return;
		get().push();
		set({
			doc: {
				...doc,
				nodes: doc.nodes.filter((n) => n.id !== selected),
				edges: doc.edges.filter((e) => e.from !== selected && e.to !== selected)
			},
			selected: null
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
			future: [snapshot(doc), ...future].slice(0, 40)
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
			history: [...history, snapshot(doc)]
		});
		get().persist();
	},
	resetDemo: () => {
		get().push();
		set({
			doc: demoGraph(),
			selected: "n_prompt",
			run: null,
			compile: null,
			savedId: null
		});
		get().persist();
	},
	persist: () => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem(LS_KEY, JSON.stringify(get().doc));
		} catch {}
	},
	localCompile: () => {
		const result = compileGraph(get().doc);
		set({ compile: result });
		return result;
	},
	runRemote: async () => {
		set({
			running: true,
			toast: null
		});
		try {
			const res = await fetch("/api/v1/execute", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					graph: get().doc,
					agents: get().agents
				})
			});
			const data = await res.json();
			if (!res.ok && !data.compile) {
				set({
					toast: data.error ?? "Execute failed",
					running: false
				});
				return;
			}
			set({
				run: data,
				compile: data.compile,
				running: false
			});
		} catch {
			set({
				toast: "Network error",
				running: false
			});
		}
	},
	saveRemote: async () => {
		try {
			const id = get().savedId;
			const url = id ? `/api/v1/graphs/${id}` : "/api/v1/graphs";
			const res = await fetch(url, {
				method: id ? "PUT" : "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					name: get().doc.name,
					graph: get().doc
				})
			});
			const data = await res.json();
			if (!res.ok || !data.graph) {
				set({ toast: data.error ?? "Save failed" });
				return null;
			}
			set({
				savedId: data.graph.id,
				toast: "Deck saved"
			});
			return data.graph;
		} catch {
			set({ toast: "Save failed" });
			return null;
		}
	},
	loadRemote: async (id) => {
		const res = await fetch(`/api/v1/graphs/${id}`);
		const data = await res.json();
		if (!res.ok || !data.graph) {
			set({ toast: data.error ?? "Load failed" });
			return;
		}
		get().push();
		set({
			doc: data.graph,
			savedId: id,
			run: null
		});
		get().persist();
	}
}));
function hydrateForge() {
	const doc = loadLocal();
	useForge.setState({ doc });
}
function nodeHeight(type) {
	const def = CATALOG_BY_TYPE[type];
	if (!def) return 88;
	return 54 + Math.max(def.inputs.length + def.outputs.length, 1) * 22 + 18;
}
function portCenter(node, portId, side) {
	const def = CATALOG_BY_TYPE[node.type];
	const idx = (side === "in" ? def?.inputs ?? [] : def?.outputs ?? []).findIndex((p) => p.id === portId);
	const i = idx < 0 ? 0 : idx;
	const offset = side === "out" ? def?.inputs.length ?? 0 : 0;
	const y = node.y + 34 + 10 + (offset + i) * 22 + 11;
	return {
		x: side === "in" ? node.x : node.x + 228,
		y
	};
}
function bezier(x1, y1, x2, y2) {
	const dx = Math.max(48, Math.abs(x2 - x1) * .45);
	return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}
var MAP = {
	Type,
	ImagePlus,
	Box,
	FileSpreadsheet,
	Scan,
	Spline,
	GitBranch,
	Eye,
	ListTree,
	BadgeCheck,
	Grid3x3,
	Circles: CircleDot,
	CircleDashed,
	Workflow,
	BoxSelect: SquareDashed,
	FlipHorizontal2,
	Pentagon,
	Cuboid,
	Combine,
	Blend,
	Paintbrush,
	CloudRain,
	Ruler,
	Crosshair,
	Scale,
	Cpu,
	Download,
	Aperture
};
function NodeIcon({ name, className }) {
	const Icon = MAP[name] ?? Box;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
		className,
		strokeWidth: 1.75
	});
}
function NodeCard({ node, selected, onPortDown }) {
	const def = CATALOG_BY_TYPE[node.type];
	const run = useForge((s) => s.run?.runs)?.find((r) => r.nodeId === node.id);
	const h = nodeHeight(node.type);
	if (!def) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-node": node.id,
		className: cn("absolute select-none rounded-md bg-surface shadow-[0_0_0_1px_var(--color-border),0_12px_32px_rgba(0,0,0,0.35)]", selected && "shadow-[0_0_0_1px_var(--color-primary),0_12px_32px_rgba(0,0,0,0.35)]"),
		style: {
			left: node.x,
			top: node.y,
			width: 228,
			height: h
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2 border-b border-border px-2.5",
			style: { height: 34 },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex min-w-0 items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeIcon, {
					name: def.icon,
					className: "size-3.5 shrink-0 text-muted"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate text-[12px] font-medium",
					children: def.title
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("font-mono text-[10px] text-subtle", run?.status === "ok" && "text-live", run?.status === "error" && "text-danger"),
				children: run ? run.status : def.category
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			style: { padding: `10px 0` },
			children: [def.inputs.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortRow, {
				label: p.label,
				kind: p.kind,
				side: "in",
				top: 10 + i * 22,
				onDown: (e) => onPortDown("in", p.id, e)
			}, `in-${p.id}`)), def.outputs.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortRow, {
				label: p.label,
				kind: p.kind,
				side: "out",
				top: 10 + (def.inputs.length + i) * 22,
				onDown: (e) => onPortDown("out", p.id, e)
			}, `out-${p.id}`))]
		})]
	});
}
function PortRow({ label, kind, side, top, onDown }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("absolute flex w-full items-center gap-1.5 px-2.5 text-[11px] text-muted", side === "out" && "justify-end"),
		style: {
			top,
			height: 22
		},
		children: [
			side === "in" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": `${label} input`,
				onPointerDown: onDown,
				className: "size-2.5 shrink-0 rounded-full bg-wire",
				"data-port-side": "in"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "truncate",
				children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-1 text-subtle",
					children: kind
				})]
			}),
			side === "out" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": `${label} output`,
				onPointerDown: onDown,
				className: "size-2.5 shrink-0 rounded-full bg-wire",
				"data-port-side": "out"
			})
		]
	});
}
function ForgeCanvas() {
	const wrap = (0, import_react.useRef)(null);
	const doc = useForge((s) => s.doc);
	const cam = useForge((s) => s.cam);
	const selected = useForge((s) => s.selected);
	const selectedEdge = useForge((s) => s.selectedEdge);
	const connecting = useForge((s) => s.connecting);
	const cursor = useForge((s) => s.cursor);
	const setCam = useForge((s) => s.setCam);
	const select = useForge((s) => s.select);
	const selectEdge = useForge((s) => s.selectEdge);
	const setConnecting = useForge((s) => s.setConnecting);
	const setCursor = useForge((s) => s.setCursor);
	const moveNode = useForge((s) => s.moveNode);
	const connect = useForge((s) => s.connect);
	const addNode = useForge((s) => s.addNode);
	const push = useForge((s) => s.push);
	const persist = useForge((s) => s.persist);
	const drag = (0, import_react.useRef)(null);
	function worldFromEvent(e) {
		const el = wrap.current;
		if (!el) return {
			x: 0,
			y: 0
		};
		const r = el.getBoundingClientRect();
		const { x, y, zoom } = useForge.getState().cam;
		return {
			x: (e.clientX - r.left - x) / zoom,
			y: (e.clientY - r.top - y) / zoom
		};
	}
	(0, import_react.useEffect)(() => {
		const el = wrap.current;
		if (!el) return;
		const onWheel = (ev) => {
			ev.preventDefault();
			const state = useForge.getState();
			const r = el.getBoundingClientRect();
			const mx = ev.clientX - r.left;
			const my = ev.clientY - r.top;
			const old = state.cam.zoom;
			const next = clamp(old * (ev.deltaY > 0 ? .92 : 1.08), .35, 1.8);
			const wx = (mx - state.cam.x) / old;
			const wy = (my - state.cam.y) / old;
			setCam({
				zoom: next,
				x: mx - wx * next,
				y: my - wy * next
			});
		};
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}, [setCam]);
	(0, import_react.useEffect)(() => {
		const onMove = (e) => {
			setCursor(worldFromEvent(e));
			const d = drag.current;
			if (!d) return;
			if (d.kind === "pan") setCam({
				x: d.ox + (e.clientX - d.sx),
				y: d.oy + (e.clientY - d.sy)
			});
			else if (d.kind === "node" && d.id) {
				const z = useForge.getState().cam.zoom;
				moveNode(d.id, d.ox + (e.clientX - d.sx) / z, d.oy + (e.clientY - d.sy) / z);
			}
		};
		const onUp = () => {
			if (drag.current?.kind === "node") persist();
			drag.current = null;
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
	}, [
		moveNode,
		persist,
		setCam,
		setCursor
	]);
	function onBackgroundDown(e) {
		if (e.target.closest("[data-node]")) return;
		select(null);
		drag.current = {
			kind: "pan",
			sx: e.clientX,
			sy: e.clientY,
			ox: cam.x,
			oy: cam.y
		};
	}
	function onNodePointerDown(id, e) {
		if (e.target.closest("[data-port-side]")) return;
		e.stopPropagation();
		select(id);
		const node = doc.nodes.find((n) => n.id === id);
		if (!node) return;
		push();
		drag.current = {
			kind: "node",
			id,
			sx: e.clientX,
			sy: e.clientY,
			ox: node.x,
			oy: node.y
		};
	}
	function onPortDown(nodeId, side, portId, e) {
		e.stopPropagation();
		e.preventDefault();
		if (side === "out") {
			setConnecting({
				from: nodeId,
				fromPort: portId
			});
			return;
		}
		const c = useForge.getState().connecting;
		if (c) connect(c.from, c.fromPort, nodeId, portId);
		else setConnecting(null);
	}
	const nodesById = new Map(doc.nodes.map((n) => [n.id, n]));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrap,
		className: "canvas-dots relative h-full w-full overflow-hidden",
		onPointerDown: onBackgroundDown,
		onContextMenu: (e) => e.preventDefault(),
		onDragOver: (e) => {
			if (e.dataTransfer.types.includes("application/x-forge-type")) e.preventDefault();
		},
		onDrop: (e) => {
			const type = e.dataTransfer.getData("application/x-forge-type");
			if (!type) return;
			const w = worldFromEvent(e);
			addNode(type, w.x - 114, w.y - 20);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute left-0 top-0 origin-top-left",
			style: { transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})` },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				className: "pointer-events-none absolute overflow-visible",
				width: "1",
				height: "1",
				children: [doc.edges.map((e) => {
					const a = nodesById.get(e.from);
					const b = nodesById.get(e.to);
					if (!a || !b) return null;
					const p1 = portCenter(a, e.fromPort, "out");
					const p2 = portCenter(b, e.toPort, "in");
					const on = selectedEdge === e.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: bezier(p1.x, p1.y, p2.x, p2.y),
						fill: "none",
						stroke: on ? "var(--color-primary)" : "var(--color-wire)",
						strokeWidth: on ? 2 : 1.4,
						className: "pointer-events-auto",
						onPointerDown: (ev) => {
							ev.stopPropagation();
							selectEdge(e.id);
						}
					}, e.id);
				}), connecting ? (() => {
					const a = nodesById.get(connecting.from);
					if (!a) return null;
					const p1 = portCenter(a, connecting.fromPort, "out");
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: bezier(p1.x, p1.y, cursor.x, cursor.y),
						fill: "none",
						stroke: "var(--color-primary)",
						strokeWidth: 1.4,
						strokeDasharray: "4 3"
					});
				})() : null]
			}), doc.nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				onPointerDown: (e) => onNodePointerDown(n.id, e),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeCard, {
					node: n,
					selected: selected === n.id,
					onPortDown: (side, portId, e) => onPortDown(n.id, side, portId, e)
				})
			}, n.id))]
		})
	});
}
function ConsolePanel() {
	const run = useForge((s) => s.run);
	const compile = useForge((s) => s.compile);
	const logs = run?.logs ?? [];
	const issues = compile?.issues ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-36 shrink-0 flex-col border-t border-border bg-surface",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-3 py-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] tracking-[0.16em] text-subtle uppercase",
				children: "Console"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-[10px] text-muted",
				children: [compile ? `hash ${compile.hash} · ${compile.ms.toFixed(2)}ms compile` : "idle", run ? ` · ${run.ms.toFixed(1)}ms exec` : ""]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-auto px-3 pb-2 font-mono text-[11px] leading-relaxed",
			children: [
				issues.map((i, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: i.level === "error" ? "text-danger" : "text-warn",
					children: [
						i.level,
						" ",
						i.code,
						": ",
						i.message
					]
				}, `i${n}`)),
				logs.map((line, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-muted",
					children: line
				}, `l${n}`)),
				!logs.length && !issues.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-subtle",
					children: "No output yet. Compile or execute."
				})
			]
		})]
	});
}
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled (default) -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
/** Render children only when a user is present (real session, or the disabled-auth dev user). */
function SignedIn({ children }) {
	const { user } = useCurrentUserState();
	return user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children }) : null;
}
/**
* Render children only once we KNOW the visitor is signed out (`isPending` has
* cleared and there is no user). Hidden while the session is still loading.
*/
function SignedOut({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending || user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of).
*/
function UserButton() {
	const user = useCurrentUser();
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => void signOut(),
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline",
				children: "Sign out"
			})
		]
	});
}
function ForgeHeader() {
	const { user, isPending } = useCurrentUserState();
	const compile = useForge((s) => s.compile);
	const run = useForge((s) => s.run);
	const name = useForge((s) => s.doc.name);
	const setName = useForge((s) => s.setName);
	const live = compile?.ok ?? true;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:px-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "shrink-0 font-mono text-[11px] font-medium tracking-[0.18em] text-fg",
					children: "OMNI-FORGE"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden text-subtle sm:inline",
					children: "/"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: name,
					onChange: (e) => setName(e.target.value),
					className: "hidden min-w-0 truncate bg-transparent font-mono text-xs text-muted outline-none focus:text-fg sm:block",
					"aria-label": "Deck name"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted uppercase",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, {
						className: `size-2 fill-current ${live ? "text-live" : "text-danger"}`,
						strokeWidth: 0
					}), run ? `ran ${run.ms.toFixed(1)}ms` : live ? "pipeline ready" : "compile errors"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/docs",
					className: "hidden items-center gap-1.5 text-xs text-muted hover:text-fg sm:inline-flex",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
						className: "size-3.5",
						strokeWidth: 1.75
					}), "API"]
				}),
				isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-8 animate-pulse rounded-full bg-elevated" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					className: "rounded-sm px-2.5 py-1.5 text-xs text-muted shadow-[0_0_0_1px_var(--color-border)] hover:text-fg",
					children: "Sign in"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SignedIn, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden sm:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
				}), user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-8 place-items-center rounded-full bg-elevated text-xs font-medium sm:hidden",
					children: (user.displayName ?? "?").charAt(0).toUpperCase()
				}) : null] })] })
			]
		})]
	});
}
function Inspector() {
	const doc = useForge((s) => s.doc);
	const selected = useForge((s) => s.selected);
	const updateParam = useForge((s) => s.updateParam);
	const compile = useForge((s) => s.compile);
	const node = doc.nodes.find((n) => n.id === selected);
	const def = node ? CATALOG_BY_TYPE[node.type] : null;
	const issues = compile?.issues.filter((i) => !node || i.nodeId === node.id) ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "flex h-full w-full flex-col border-l border-border bg-surface",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-b border-border px-3 py-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] tracking-[0.16em] text-subtle uppercase",
				children: "Inspector"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 truncate text-sm font-medium",
				children: def?.title ?? "No selection"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-3 py-3",
			children: [def && node ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-[12px] leading-relaxed text-muted",
				children: def.detail
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-3",
				children: def.params.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					field,
					value: node.params[field.key],
					onChange: (v) => updateParam(node.id, field.key, v)
				}, field.key))
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Select a node to edit its parameters."
			}), issues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-1.5",
				children: issues.map((i, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: i.level === "error" ? "text-xs text-danger" : "text-xs text-warn",
					children: i.message
				}, `${i.code}-${idx}`))
			})]
		})]
	});
}
function Field({ field, value, onChange }) {
	const label = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "mb-1 block font-mono text-[10px] tracking-wide text-subtle uppercase",
		children: [field.label, field.kind === "number" && field.unit ? ` (${field.unit})` : ""]
	});
	if (field.kind === "textarea") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		value: String(value ?? ""),
		onChange: (e) => onChange(e.target.value),
		rows: 4,
		className: "w-full resize-y rounded-sm bg-elevated px-2 py-1.5 text-xs text-fg outline-none shadow-[0_0_0_1px_var(--color-border)]"
	})] });
	if (field.kind === "number") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type: "number",
		value: Number(value ?? field.default),
		min: field.min,
		max: field.max,
		step: field.step ?? 1,
		onChange: (e) => onChange(Number(e.target.value)),
		className: "h-8 w-full rounded-sm bg-elevated px-2 font-mono text-xs text-fg outline-none shadow-[0_0_0_1px_var(--color-border)]"
	})] });
	if (field.kind === "select") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		value: String(value ?? field.default),
		onChange: (e) => onChange(e.target.value),
		className: "h-8 w-full rounded-sm bg-elevated px-2 text-xs text-fg outline-none shadow-[0_0_0_1px_var(--color-border)]",
		children: field.options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: o.value,
			children: o.label
		}, o.value))
	})] });
	if (field.kind === "toggle") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex items-center justify-between gap-2 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: field.label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "checkbox",
			checked: Boolean(value),
			onChange: (e) => onChange(e.target.checked),
			className: "size-4 accent-primary"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		value: String(value ?? ""),
		onChange: (e) => onChange(e.target.value),
		className: "h-8 w-full rounded-sm bg-elevated px-2 text-xs text-fg outline-none shadow-[0_0_0_1px_var(--color-border)]"
	})] });
}
var ORDER = [
	"input",
	"agent",
	"spatial",
	"material",
	"analysis",
	"execution"
];
function Library() {
	const q = useForge((s) => s.libraryQuery).toLowerCase();
	const setQ = useForge((s) => s.setLibraryQuery);
	const addNode = useForge((s) => s.addNode);
	const cam = useForge((s) => s.cam);
	const filtered = CATALOG.filter((n) => {
		if (!q) return true;
		return n.title.toLowerCase().includes(q) || n.type.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "flex h-full w-full flex-col border-r border-border bg-surface",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-b border-border px-3 py-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase",
				children: "Library"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: useForge((s) => s.libraryQuery),
				onChange: (e) => setQ(e.target.value),
				placeholder: "Filter nodes",
				className: "h-8 w-full rounded-sm bg-elevated px-2 font-mono text-xs text-fg outline-none shadow-[0_0_0_1px_var(--color-border)] placeholder:text-subtle"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-2 py-2",
			children: ORDER.map((cat) => {
				const items = filtered.filter((n) => n.category === cat);
				if (!items.length) return null;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-1.5 px-1 font-mono text-[10px] tracking-[0.14em] text-subtle uppercase",
						children: CATEGORY_LABEL[cat]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-1",
						children: items.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							draggable: true,
							onDragStart: (e) => {
								e.dataTransfer.setData("application/x-forge-type", n.type);
								e.dataTransfer.effectAllowed = "copy";
							},
							onClick: () => {
								const x = (160 - cam.x) / cam.zoom;
								const y = (80 - cam.y) / cam.zoom;
								addNode(n.type, x + Math.random() * 40, y + Math.random() * 40);
							},
							className: "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-elevated",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeIcon, {
								name: n.icon,
								className: "mt-0.5 size-3.5 shrink-0 text-muted"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-xs font-medium text-fg",
									children: n.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-[11px] text-subtle",
									children: n.summary
								})]
							})]
						}) }, n.type))
					})]
				}, cat);
			})
		})]
	});
}
function Toolbar() {
	const running = useForge((s) => s.running);
	const agents = useForge((s) => s.agents);
	const toast = useForge((s) => s.toast);
	const localCompile = useForge((s) => s.localCompile);
	const runRemote = useForge((s) => s.runRemote);
	const resetDemo = useForge((s) => s.resetDemo);
	const saveRemote = useForge((s) => s.saveRemote);
	const setAgents = useForge((s) => s.setAgents);
	const { user, isPending } = useCurrentUserState();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-surface px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: () => void runRemote(),
				disabled: running,
				children: [running ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5" }), running ? "Running" : "Compile & execute"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: () => localCompile(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, { className: "size-3.5" }), "Compile"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: () => resetDemo(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), "Reset"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: () => void saveRemote(),
				disabled: isPending || !user,
				title: user ? "Save to account" : "Sign in to save",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-3.5" }), "Save"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ml-auto flex items-center gap-2 font-mono text-[11px] text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: agents,
					onChange: (e) => setAgents(e.target.checked),
					className: "accent-primary"
				}), "Agents"]
			}),
			toast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-[11px] text-warn",
				children: toast
			}) : null
		]
	});
}
function Viewport() {
	const canvas = (0, import_react.useRef)(null);
	const scene = useForge((s) => s.run?.scene) ?? blankScene();
	(0, import_react.useEffect)(() => {
		const el = canvas.current;
		if (!el) return;
		const ctx = el.getContext("2d");
		if (!ctx) return;
		let frame = 0;
		let raf = 0;
		const draw = () => {
			frame += 1;
			paint(ctx, el, scene, frame);
			raf = requestAnimationFrame(draw);
		};
		const ro = new ResizeObserver(() => {
			const r = el.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			el.width = Math.max(1, Math.floor(r.width * dpr));
			el.height = Math.max(1, Math.floor(r.height * dpr));
		});
		ro.observe(el);
		raf = requestAnimationFrame(draw);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	}, [scene]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-[180px] flex-col border-t border-border bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-3 py-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] tracking-[0.16em] text-subtle uppercase",
				children: "Viewport"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "truncate font-mono text-[10px] text-muted",
				children: [
					scene.clip.family,
					" ",
					scene.clip.part,
					" · ",
					scene.clip.widthMm,
					"×",
					scene.clip.heightMm,
					"×",
					scene.clip.depthMm
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvas,
			className: "min-h-0 w-full flex-1"
		})]
	});
}
function paint(ctx, el, scene, frame) {
	const w = el.width;
	const h = el.height;
	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = "#09090b";
	ctx.fillRect(0, 0, w, h);
	ctx.strokeStyle = "#1c1c22";
	ctx.lineWidth = 1;
	const step = 28 * (el.width / Math.max(el.clientWidth, 1));
	for (let x = 0; x < w; x += step) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, h);
		ctx.stroke();
	}
	for (let y = 0; y < h; y += step) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(w, y);
		ctx.stroke();
	}
	const cx = w * .5;
	const cy = h * .52;
	const scale = Math.min(w, h) * .00115;
	const bw = scene.clip.widthMm * scale;
	const bh = scene.clip.heightMm * scale;
	const morph = scene.clip.morph;
	const hollow = scene.clip.hollow;
	const pulse = .5 + .5 * Math.sin(frame * .03);
	ctx.save();
	ctx.translate(cx, cy);
	ctx.strokeStyle = "#d4d6db";
	ctx.lineWidth = 1.6;
	rounded(ctx, -bw / 2, -bh / 2, bw, bh, 10 + morph * 18);
	ctx.stroke();
	if (hollow > 0) {
		ctx.setLineDash([6, 4]);
		ctx.strokeStyle = "#8b8b94";
		const inset = 12 + hollow * 18;
		rounded(ctx, -bw / 2 + inset, -bh / 2 + inset, bw - inset * 2, bh - inset * 2, 6);
		ctx.stroke();
		ctx.setLineDash([]);
	}
	const ox = scene.orbs.nx;
	const oy = scene.orbs.ny;
	if (ox > 0 && oy > 0) {
		const gx = bw * .72;
		const gy = bh * .62;
		ctx.fillStyle = `rgba(212,214,219,${.35 + pulse * .15})`;
		for (let i = 0; i < ox; i++) for (let j = 0; j < oy; j++) {
			const u = ox === 1 ? .5 : i / (ox - 1);
			const v = oy === 1 ? .5 : j / (oy - 1);
			const jx = Math.sin(i * 12.9 + j * 3.1) * scene.orbs.jitter * 10 / (scale * 40);
			const x = -gx / 2 + u * gx + jx + morph * Math.sin(j + frame * .02) * 4;
			const y = -gy / 2 + v * gy;
			const r = Math.max(2.2, scene.orbs.radius * scale * .55);
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		}
	}
	ctx.restore();
	ctx.fillStyle = "#8b8b94";
	ctx.font = `${11 * (el.width / Math.max(el.clientWidth, 1))}px "IBM Plex Mono", monospace`;
	ctx.fillText(scene.target.slice(0, 56), 12, 18);
	ctx.fillText(`morph ${scene.clip.morph.toFixed(2)}  hollow ${scene.clip.hollow.toFixed(2)}  mass ${scene.measures.massKg}kg`, 12, h - 12);
}
function rounded(ctx, x, y, w, h, r) {
	const rr = Math.min(r, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + rr, y);
	ctx.arcTo(x + w, y, x + w, y + h, rr);
	ctx.arcTo(x + w, y + h, x, y + h, rr);
	ctx.arcTo(x, y + h, x, y, rr);
	ctx.arcTo(x, y, x + w, y, rr);
	ctx.closePath();
}
function AppShell() {
	const panel = useForge((s) => s.mobilePanel);
	const setPanel = useForge((s) => s.setMobilePanel);
	const removeSelected = useForge((s) => s.removeSelected);
	const undo = useForge((s) => s.undo);
	const redo = useForge((s) => s.redo);
	const runRemote = useForge((s) => s.runRemote);
	(0, import_react.useEffect)(() => {
		hydrateForge();
		import("./execute-DYdkQEGw.mjs").then(async ({ executeGraph }) => {
			const result = await executeGraph(useForge.getState().doc, { agents: false });
			useForge.setState({
				run: result,
				compile: result.compile
			});
		});
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const t = e.target;
			if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
			if ((e.key === "Delete" || e.key === "Backspace") && !e.metaKey && !e.ctrlKey) {
				e.preventDefault();
				removeSelected();
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				undo();
			}
			if ((e.metaKey || e.ctrlKey) && (e.key === "y" || e.key === "z" && e.shiftKey)) {
				e.preventDefault();
				redo();
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				runRemote();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		removeSelected,
		redo,
		runRemote,
		undo
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForgeHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-0 flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden w-[260px] shrink-0 md:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-1 flex-col",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 border-b border-border px-2 py-1.5 md:hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => setPanel(panel === "library" ? "none" : "library"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-3.5" }), "Library"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => setPanel(panel === "inspect" ? "none" : "inspect"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-3.5" }), "Inspect"]
							})]
						}),
						panel === "library" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-56 shrink-0 overflow-hidden border-b border-border md:hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, {})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative min-h-0 flex-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForgeCanvas, {})
						}),
						panel === "inspect" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-64 shrink-0 overflow-hidden md:hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConsolePanel, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toolbar, {})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden w-[300px] shrink-0 flex-col lg:flex",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-h-0 flex-[1.1]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-h-0 flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Viewport, {})
					})]
				})
			]
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
