import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({ component: Docs });

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/health", body: "—", note: "Liveness, catalog size, agent flag." },
  { method: "GET", path: "/api/v1/catalog", body: "—", note: "All node types, ports, params. Cache 60s." },
  { method: "POST", path: "/api/v1/compile", body: "{ graph }", note: "Validate + topo sort. Sub-ms typical." },
  {
    method: "POST",
    path: "/api/v1/execute",
    body: "{ graph, agents? }",
    note: "Compile, run DAG, return scene IR + BPY.",
  },
  { method: "GET", path: "/api/v1/graphs", body: "auth", note: "List saved decks." },
  { method: "POST", path: "/api/v1/graphs", body: "{ name, graph }", note: "Create deck." },
  { method: "GET", path: "/api/v1/graphs/:id", body: "auth", note: "Load deck." },
  { method: "PUT", path: "/api/v1/graphs/:id", body: "{ name, graph }", note: "Replace deck." },
  { method: "DELETE", path: "/api/v1/graphs/:id", body: "auth", note: "Delete deck." },
  { method: "GET", path: "/api/v1/openapi", body: "—", note: "OpenAPI 3.1 document." },
  { method: "GET", path: "/api/v1/bridge", body: "?token", note: "Bridge session + operator status." },
  { method: "GET", path: "/api/v1/bridge?addon=1", body: "—", note: "Download the Blender add-on." },
  {
    method: "POST",
    path: "/api/v1/bridge",
    body: "{ action, token, … }",
    note: "session | hello | push | pull | result | dryrun.",
  },
];

function Docs() {
  return (
    <main className="min-h-dvh bg-bg px-5 py-10 text-fg sm:px-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="font-mono text-[11px] tracking-[0.18em] text-muted hover:text-fg">
          OMNI-FORGE
        </Link>
        <h1 className="mt-4 text-3xl font-medium tracking-tight">HTTP API</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          JSON in, JSON out. Compile is pure and typically under a millisecond. Execute walks
          topological levels and returns a scene IR plus a Blender Python script. Push that script
          through the Blender bridge — a local add-on pulls jobs and runs them in bpy.app.
        </p>
        <pre className="mt-6 overflow-x-auto rounded-md bg-surface p-4 font-mono text-[12px] text-muted shadow-[0_0_0_1px_var(--color-border)]">
          {`curl -sX POST /api/v1/execute \\
  -H 'content-type: application/json' \\
  -d '{"graph":{...},"agents":false}'`}
        </pre>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] tracking-wider text-subtle uppercase">
                <th className="py-2 pr-3">Method</th>
                <th className="py-2 pr-3">Path</th>
                <th className="py-2 pr-3">Body</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={e.method + e.path} className="border-b border-line align-top">
                  <td className="py-2.5 pr-3 font-mono text-xs text-muted">{e.method}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{e.path}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-muted">{e.body}</td>
                  <td className="py-2.5 text-xs text-muted">{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
