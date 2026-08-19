import { CATALOG_BY_TYPE } from "@/lib/forge/catalog";
import { NodeIcon } from "@/lib/forge/icons";
import { HEADER_H, NODE_W, nodeHeight, PORT_H, BODY_PAD } from "@/lib/forge/layout";
import type { GraphNode } from "@/lib/forge/types";
import { cn } from "@/lib/utils";
import { useForge } from "@/store/forge-store";

export function NodeCard({
  node,
  selected,
  onPortDown,
}: {
  node: GraphNode;
  selected: boolean;
  onPortDown: (side: "in" | "out", portId: string, e: React.PointerEvent) => void;
}) {
  const def = CATALOG_BY_TYPE[node.type];
  const runs = useForge((s) => s.run?.runs);
  const snap = useForge((s) => s.snap);
  const run = runs?.find((r) => r.nodeId === node.id);
  const h = nodeHeight(node.type);
  if (!def) return null;

  return (
    <div
      data-node={node.id}
      className={cn(
        "absolute select-none rounded-md bg-surface shadow-[0_0_0_1px_var(--color-border),0_12px_32px_rgba(0,0,0,0.35)]",
        selected && "shadow-[0_0_0_1px_var(--color-primary),0_12px_32px_rgba(0,0,0,0.35)]",
      )}
      style={{ left: node.x, top: node.y, width: NODE_W, height: h }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b border-border px-2.5"
        style={{ height: HEADER_H }}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <NodeIcon name={def.icon} className="size-3.5 shrink-0 text-muted" />
          <span className="truncate text-[12px] font-medium">{def.title}</span>
        </span>
        <span
          className={cn(
            "font-mono text-[10px] text-subtle",
            run?.status === "ok" && "text-live",
            run?.status === "error" && "text-danger",
          )}
        >
          {run ? run.status : def.category}
        </span>
      </div>
      <div className="relative" style={{ padding: `${BODY_PAD}px 0` }}>
        {def.inputs.map((p, i) => (
          <PortRow
            key={`in-${p.id}`}
            nodeId={node.id}
            portId={p.id}
            label={p.label}
            kind={p.kind}
            side="in"
            top={BODY_PAD + i * PORT_H}
            magnet={
              snap?.nodeId === node.id && snap.portId === p.id
                ? snap.compatible
                  ? "snap"
                  : "hot"
                : null
            }
            onDown={(e) => onPortDown("in", p.id, e)}
          />
        ))}
        {def.outputs.map((p, i) => (
          <PortRow
            key={`out-${p.id}`}
            nodeId={node.id}
            portId={p.id}
            label={p.label}
            kind={p.kind}
            side="out"
            top={BODY_PAD + (def.inputs.length + i) * PORT_H}
            magnet={null}
            onDown={(e) => onPortDown("out", p.id, e)}
          />
        ))}
      </div>
    </div>
  );
}

function PortRow({
  nodeId,
  portId,
  label,
  kind,
  side,
  top,
  magnet,
  onDown,
}: {
  nodeId: string;
  portId: string;
  label: string;
  kind: string;
  side: "in" | "out";
  top: number;
  magnet: "snap" | "hot" | null;
  onDown: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      className={cn(
        "absolute flex w-full items-center gap-1.5 px-2.5 text-[11px] text-muted",
        side === "out" && "justify-end",
        magnet === "snap" && "text-snap",
        magnet === "hot" && "text-danger",
      )}
      style={{ top, height: PORT_H }}
    >
      {side === "in" && (
        <button
          type="button"
          aria-label={`${label} input`}
          onPointerDown={onDown}
          data-port-side="in"
          data-port-id={portId}
          data-port-node={nodeId}
          className={cn(
            "size-2.5 shrink-0 rounded-full bg-wire transition-[transform,box-shadow,background-color] duration-150 ease-out",
            magnet === "snap" && "port-snap",
            magnet === "hot" && "port-hot",
          )}
        />
      )}
      <span className="truncate">
        {label}
        <span className="ml-1 text-subtle">{kind}</span>
      </span>
      {side === "out" && (
        <button
          type="button"
          aria-label={`${label} output`}
          onPointerDown={onDown}
          data-port-side="out"
          data-port-id={portId}
          data-port-node={nodeId}
          className="size-2.5 shrink-0 rounded-full bg-wire"
        />
      )}
    </div>
  );
}
