import { MousePointer2, Scissors, Spline } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForge, type Tool } from "@/store/forge-store";

const TOOLS: { id: Tool; label: string; key: string; icon: typeof Spline }[] = [
  { id: "select", label: "Select", key: "V", icon: MousePointer2 },
  { id: "wire", label: "Wire", key: "W", icon: Spline },
  { id: "cut", label: "Cutter", key: "C", icon: Scissors },
];

export function ToolRail() {
  const tool = useForge((s) => s.tool);
  const setTool = useForge((s) => s.setTool);

  return (
    <div className="pointer-events-auto absolute top-3 left-3 z-20 flex flex-col gap-1 rounded-md bg-surface/95 p-1 shadow-[0_0_0_1px_var(--color-border)]">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const on = tool === t.id;
        return (
          <button
            key={t.id}
            type="button"
            title={`${t.label} (${t.key})`}
            onClick={() => setTool(t.id)}
            className={cn(
              "flex size-9 items-center justify-center rounded-sm text-muted transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]",
              on ? "bg-elevated text-fg shadow-[0_0_0_1px_var(--color-border)]" : "hover:text-fg",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            <span className="sr-only">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
