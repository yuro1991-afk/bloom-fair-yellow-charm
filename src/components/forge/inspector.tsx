import { CATALOG_BY_TYPE } from "@/lib/forge/catalog";
import type { ParamField } from "@/lib/forge/types";
import { useForge } from "@/store/forge-store";

export function Inspector() {
  const doc = useForge((s) => s.doc);
  const selected = useForge((s) => s.selected);
  const updateParam = useForge((s) => s.updateParam);
  const compile = useForge((s) => s.compile);
  const node = doc.nodes.find((n) => n.id === selected);
  const def = node ? CATALOG_BY_TYPE[node.type] : null;
  const issues = compile?.issues.filter((i) => !node || i.nodeId === node.id) ?? [];

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-surface">
      <div className="border-b border-border px-3 py-2.5">
        <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">Inspector</p>
        <p className="mt-1 truncate text-sm font-medium">{def?.title ?? "No selection"}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {def && node ? (
          <>
            <p className="mb-3 text-[12px] leading-relaxed text-muted">{def.detail}</p>
            <div className="flex flex-col gap-3">
              {def.params.map((field) => (
                <Field
                  key={field.key}
                  field={field}
                  value={node.params[field.key]}
                  onChange={(v) => updateParam(node.id, field.key, v)}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted">Select a node to edit its parameters.</p>
        )}
        {issues.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {issues.map((i, idx) => (
              <li
                key={`${i.code}-${idx}`}
                className={i.level === "error" ? "text-xs text-danger" : "text-xs text-warn"}
              >
                {i.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: ParamField;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}) {
  const label = (
    <label className="mb-1 block font-mono text-[10px] tracking-wide text-subtle uppercase">
      {field.label}
      {field.kind === "number" && field.unit ? ` (${field.unit})` : ""}
    </label>
  );
  if (field.kind === "textarea") {
    return (
      <div>
        {label}
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-sm bg-elevated px-2 py-1.5 text-xs text-fg outline-none shadow-[0_0_0_1px_var(--color-border)]"
        />
      </div>
    );
  }
  if (field.kind === "number") {
    return (
      <div>
        {label}
        <input
          type="number"
          value={Number(value ?? field.default)}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 w-full rounded-sm bg-elevated px-2 font-mono text-xs text-fg outline-none shadow-[0_0_0_1px_var(--color-border)]"
        />
      </div>
    );
  }
  if (field.kind === "select") {
    return (
      <div>
        {label}
        <select
          value={String(value ?? field.default)}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full rounded-sm bg-elevated px-2 text-xs text-fg outline-none shadow-[0_0_0_1px_var(--color-border)]"
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.kind === "toggle") {
    return (
      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted">{field.label}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 accent-primary"
        />
      </label>
    );
  }
  return (
    <div>
      {label}
      <input
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-sm bg-elevated px-2 text-xs text-fg outline-none shadow-[0_0_0_1px_var(--color-border)]"
      />
    </div>
  );
}
