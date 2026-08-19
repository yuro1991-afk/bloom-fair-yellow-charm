import { CATALOG, CATEGORY_LABEL } from "@/lib/forge/catalog";
import type { NodeCategory } from "@/lib/forge/types";
import { NodeIcon } from "@/lib/forge/icons";
import { useForge } from "@/store/forge-store";

const ORDER: NodeCategory[] = [
  "input",
  "agent",
  "spatial",
  "material",
  "analysis",
  "execution",
];

export function Library() {
  const q = useForge((s) => s.libraryQuery).toLowerCase();
  const setQ = useForge((s) => s.setLibraryQuery);
  const addNode = useForge((s) => s.addNode);
  const cam = useForge((s) => s.cam);

  const filtered = CATALOG.filter((n) => {
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q)
    );
  });

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-3 py-2.5">
        <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
          Library
        </p>
        <input
          value={useForge((s) => s.libraryQuery)}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter nodes"
          className="h-8 w-full rounded-sm bg-elevated px-2 font-mono text-xs text-fg outline-none shadow-[0_0_0_1px_var(--color-border)] placeholder:text-subtle"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {ORDER.map((cat) => {
          const items = filtered.filter((n) => n.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="mb-3">
              <p className="mb-1.5 px-1 font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
                {CATEGORY_LABEL[cat]}
              </p>
              <ul className="flex flex-col gap-1">
                {items.map((n) => (
                  <li key={n.type}>
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/x-forge-type", n.type);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => {
                        const x = (160 - cam.x) / cam.zoom;
                        const y = (80 - cam.y) / cam.zoom;
                        addNode(n.type, x + Math.random() * 40, y + Math.random() * 40);
                      }}
                      className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-elevated"
                    >
                      <NodeIcon name={n.icon} className="mt-0.5 size-3.5 shrink-0 text-muted" />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-fg">{n.title}</span>
                        <span className="block truncate text-[11px] text-subtle">{n.summary}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
