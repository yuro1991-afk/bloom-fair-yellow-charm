import { _ as Link, y as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/docs-r5dmJa07.js
var import_jsx_runtime = require_jsx_runtime();
var ENDPOINTS = [
	{
		method: "GET",
		path: "/api/v1/health",
		body: "—",
		note: "Liveness, catalog size, agent flag."
	},
	{
		method: "GET",
		path: "/api/v1/catalog",
		body: "—",
		note: "All node types, ports, params. Cache 60s."
	},
	{
		method: "POST",
		path: "/api/v1/compile",
		body: "{ graph }",
		note: "Validate + topo sort. Sub-ms typical."
	},
	{
		method: "POST",
		path: "/api/v1/execute",
		body: "{ graph, agents? }",
		note: "Compile, run DAG, return scene IR + BPY."
	},
	{
		method: "GET",
		path: "/api/v1/graphs",
		body: "auth",
		note: "List saved decks."
	},
	{
		method: "POST",
		path: "/api/v1/graphs",
		body: "{ name, graph }",
		note: "Create deck."
	},
	{
		method: "GET",
		path: "/api/v1/graphs/:id",
		body: "auth",
		note: "Load deck."
	},
	{
		method: "PUT",
		path: "/api/v1/graphs/:id",
		body: "{ name, graph }",
		note: "Replace deck."
	},
	{
		method: "DELETE",
		path: "/api/v1/graphs/:id",
		body: "auth",
		note: "Delete deck."
	},
	{
		method: "GET",
		path: "/api/v1/openapi",
		body: "—",
		note: "OpenAPI 3.1 document."
	}
];
function Docs() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-dvh bg-bg px-5 py-10 text-fg sm:px-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "font-mono text-[11px] tracking-[0.18em] text-muted hover:text-fg",
					children: "OMNI-FORGE"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 text-3xl font-medium tracking-tight",
					children: "HTTP API"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-sm leading-relaxed text-muted",
					children: "JSON in, JSON out. Compile is pure and typically under a millisecond. Execute walks topological levels and returns a scene IR plus a Blender Python script. There is no live Blender in this deck — the operator is the IR."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-6 overflow-x-auto rounded-md bg-surface p-4 font-mono text-[12px] text-muted shadow-[0_0_0_1px_var(--color-border)]",
					children: `curl -sX POST /api/v1/execute \\
  -H 'content-type: application/json' \\
  -d '{"graph":{...},"agents":false}'`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border font-mono text-[10px] tracking-wider text-subtle uppercase",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 pr-3",
									children: "Method"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 pr-3",
									children: "Path"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 pr-3",
									children: "Body"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "Notes"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: ENDPOINTS.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-line align-top",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 pr-3 font-mono text-xs text-muted",
									children: e.method
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 pr-3 font-mono text-xs",
									children: e.path
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 pr-3 font-mono text-xs text-muted",
									children: e.body
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 text-xs text-muted",
									children: e.note
								})
							]
						}, e.method + e.path)) })]
					})
				})
			]
		})
	});
}
//#endregion
export { Docs as component };
