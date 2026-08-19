import { Play, RotateCcw, Save, Shuffle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useForge } from "@/store/forge-store";

export function Toolbar() {
  const running = useForge((s) => s.running);
  const agents = useForge((s) => s.agents);
  const toast = useForge((s) => s.toast);
  const tool = useForge((s) => s.tool);
  const localCompile = useForge((s) => s.localCompile);
  const runRemote = useForge((s) => s.runRemote);
  const resetDemo = useForge((s) => s.resetDemo);
  const saveRemote = useForge((s) => s.saveRemote);
  const setAgents = useForge((s) => s.setAgents);
  const { user, isPending } = useCurrentUserState();

  const toolHint =
    tool === "wire"
      ? "Wire · drag from an output — compatible ports snap"
      : tool === "cut"
        ? "Cutter · drag across a wire"
        : "Select · V  Wire · W  Cutter · C";

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-surface px-3 py-2">
      <Button size="sm" onClick={() => void runRemote()} disabled={running}>
        {running ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
        {running ? "Running" : "Compile & execute"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => localCompile()}>
        <Shuffle className="size-3.5" />
        Compile
      </Button>
      <Button size="sm" variant="ghost" onClick={() => resetDemo()}>
        <RotateCcw className="size-3.5" />
        Reset
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => void saveRemote()}
        disabled={isPending || !user}
        title={user ? "Save to account" : "Sign in to save"}
      >
        <Save className="size-3.5" />
        Save
      </Button>
      <span className="hidden font-mono text-[11px] text-muted sm:inline">{toolHint}</span>
      <label className="ml-auto flex items-center gap-2 font-mono text-[11px] text-muted">
        <input
          type="checkbox"
          checked={agents}
          onChange={(e) => setAgents(e.target.checked)}
          className="accent-primary"
        />
        Agents
      </label>
      {toast ? <span className="font-mono text-[11px] text-warn">{toast}</span> : null}
    </div>
  );
}
