import { useEffect } from "react";
import { Menu, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hydrateForge, useForge } from "@/store/forge-store";
import { ForgeCanvas } from "./canvas";
import { ConsolePanel } from "./console-panel";
import { ForgeHeader } from "./header";
import { Inspector } from "./inspector";
import { Library } from "./library";
import { Toolbar } from "./toolbar";
import { Viewport } from "./viewport";
import { BridgePanel } from "./bridge-panel";

export function AppShell() {
  const panel = useForge((s) => s.mobilePanel);
  const setPanel = useForge((s) => s.setMobilePanel);
  const removeSelected = useForge((s) => s.removeSelected);
  const undo = useForge((s) => s.undo);
  const redo = useForge((s) => s.redo);
  const runRemote = useForge((s) => s.runRemote);
  const setTool = useForge((s) => s.setTool);
  const setConnecting = useForge((s) => s.setConnecting);
  const setSnap = useForge((s) => s.setSnap);

  useEffect(() => {
    hydrateForge();
    void import("@/lib/forge/execute").then(async ({ executeGraph }) => {
      const result = await executeGraph(useForge.getState().doc, { agents: false });
      useForge.setState({ run: result, compile: result.compile });
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (e.key === "v" || e.key === "V") setTool("select");
      if (e.key === "w" || e.key === "W") setTool("wire");
      if (e.key === "c" || e.key === "C") {
        if (!e.metaKey && !e.ctrlKey) setTool("cut");
      }
      if (e.key === "Escape") {
        setConnecting(null);
        setSnap(null);
        setTool("select");
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        removeSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void runRemote();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [removeSelected, redo, runRemote, setConnecting, setSnap, setTool, undo]);

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <ForgeHeader />
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[260px] shrink-0 md:block">
          <Library />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border px-2 py-1.5 md:hidden">
            <Button size="sm" variant="ghost" onClick={() => setPanel(panel === "library" ? "none" : "library")}>
              <Menu className="size-3.5" />
              Library
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPanel(panel === "inspect" ? "none" : "inspect")}>
              <SlidersHorizontal className="size-3.5" />
              Inspect
            </Button>
          </div>
          {panel === "library" ? (
            <div className="h-56 shrink-0 overflow-hidden border-b border-border md:hidden">
              <Library />
            </div>
          ) : null}
          <div className="relative min-h-0 flex-1">
            <ForgeCanvas />
          </div>
          {panel === "inspect" ? (
            <div className="h-64 shrink-0 overflow-hidden md:hidden">
              <Inspector />
            </div>
          ) : null}
          <ConsolePanel />
          <Toolbar />
        </div>
        <div className="hidden w-[300px] shrink-0 flex-col lg:flex">
          <div className="min-h-0 flex-1">
            <Inspector />
          </div>
          <BridgePanel />
          <div className="min-h-0 flex-1">
            <Viewport />
          </div>
        </div>
      </div>
    </div>
  );
}
