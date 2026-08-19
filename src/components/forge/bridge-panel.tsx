import { useEffect } from "react";
import { Cable, Download, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADDON_FILENAME } from "@/lib/forge/blender-addon";
import { cn } from "@/lib/utils";
import { useBridge } from "@/store/bridge-store";
import { useForge } from "@/store/forge-store";

export function BridgePanel() {
  const token = useBridge((s) => s.token);
  const online = useBridge((s) => s.online);
  const operator = useBridge((s) => s.operator);
  const jobs = useBridge((s) => s.jobs);
  const queued = useBridge((s) => s.queued);
  const busy = useBridge((s) => s.busy);
  const error = useBridge((s) => s.error);
  const origin = useBridge((s) => s.origin);
  const ensure = useBridge((s) => s.ensure);
  const refresh = useBridge((s) => s.refresh);
  const push = useBridge((s) => s.push);
  const scene = useForge((s) => s.run?.scene);
  const latest = jobs[0];

  useEffect(() => {
    void ensure();
    const id = window.setInterval(() => void refresh(), 2000);
    return () => window.clearInterval(id);
  }, [ensure, refresh]);

  function send(dryrun: boolean) {
    const bpy = scene?.bpy ?? "";
    if (!bpy) {
      useForge.setState({ toast: "Execute first — no BPY yet" });
      return;
    }
    void push(bpy, scene?.target || "forge-job", "4.2", dryrun);
  }

  return (
    <div className="flex shrink-0 flex-col border-t border-border bg-surface">
      <div className="flex items-center justify-between px-3 py-1.5">
        <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
          <Cable className="size-3" strokeWidth={1.75} />
          Blender bridge
        </p>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
          <span className={cn("size-1.5 rounded-full", online ? "bg-live" : "bg-subtle")} />
          {online ? operator?.blender ?? "online" : "no operator"}
        </span>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-3">
        <p className="truncate font-mono text-[10px] text-subtle">
          {queued ? `${queued} queued` : latest ? `${latest.status} · ${latest.name}` : "idle"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" onClick={() => send(false)} disabled={busy}>
            <Radio className="size-3.5" />
            Push
          </Button>
          <Button size="sm" variant="ghost" onClick={() => send(true)} disabled={busy}>
            Dry-run
          </Button>
          <a
            href="/api/v1/bridge?addon=1"
            download={ADDON_FILENAME}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-xs text-muted hover:text-fg"
          >
            <Download className="size-3.5" strokeWidth={1.75} />
            Addon
          </a>
        </div>
        {token ? (
          <p className="break-all font-mono text-[10px] leading-relaxed text-subtle">
            {origin} · {token}
          </p>
        ) : null}
        {error ? <p className="font-mono text-[10px] text-danger">{error}</p> : null}
        {latest?.logs[0] ? (
          <p className="truncate font-mono text-[10px] text-muted">{latest.logs[0]}</p>
        ) : null}
      </div>
    </div>
  );
}
