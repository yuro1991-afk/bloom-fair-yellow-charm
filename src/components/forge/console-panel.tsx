import { useForge } from "@/store/forge-store";

export function ConsolePanel() {
  const run = useForge((s) => s.run);
  const compile = useForge((s) => s.compile);
  const logs = run?.logs ?? [];
  const issues = compile?.issues ?? [];

  return (
    <div className="flex h-36 shrink-0 flex-col border-t border-border bg-surface">
      <div className="flex items-center justify-between px-3 py-1.5">
        <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">Console</p>
        <p className="font-mono text-[10px] text-muted">
          {compile ? `hash ${compile.hash} · ${compile.ms.toFixed(2)}ms compile` : "idle"}
          {run ? ` · ${run.ms.toFixed(1)}ms exec` : ""}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-2 font-mono text-[11px] leading-relaxed">
        {issues.map((i, n) => (
          <div key={`i${n}`} className={i.level === "error" ? "text-danger" : "text-warn"}>
            {i.level} {i.code}: {i.message}
          </div>
        ))}
        {logs.map((line, n) => (
          <div key={`l${n}`} className="text-muted">
            {line}
          </div>
        ))}
        {!logs.length && !issues.length && <div className="text-subtle">No output yet. Compile or execute.</div>}
      </div>
    </div>
  );
}
