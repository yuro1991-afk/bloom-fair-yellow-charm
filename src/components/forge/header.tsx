import { Link } from "@tanstack/react-router";
import { BookOpen, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { formatBytes, vram } from "@/lib/gpu/vram";
import { useBridge } from "@/store/bridge-store";
import { useForge } from "@/store/forge-store";

export function ForgeHeader() {
  const { user, isPending } = useCurrentUserState();
  const compile = useForge((s) => s.compile);
  const run = useForge((s) => s.run);
  const name = useForge((s) => s.doc.name);
  const setName = useForge((s) => s.setName);
  const live = compile?.ok ?? true;
  const [gpu, setGpu] = useState(vram.snapshot());
  const bridgeOn = useBridge((s) => s.online);

  useEffect(() => {
    const id = window.setInterval(() => setGpu(vram.snapshot()), 400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" className="shrink-0 font-mono text-[11px] font-medium tracking-[0.18em] text-fg">
          OMNI-FORGE
        </Link>
        <span className="hidden text-subtle sm:inline">/</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="hidden min-w-0 truncate bg-transparent font-mono text-xs text-muted outline-none focus:text-fg sm:block"
          aria-label="Deck name"
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted uppercase sm:flex">
          <Circle
            className={`size-2 fill-current ${gpu.status === "mounted" ? "text-live" : "text-subtle"}`}
            strokeWidth={0}
          />
          {gpu.status === "mounted"
            ? `${formatBytes(gpu.allocated)} vram`
            : gpu.status === "unavailable"
              ? "no webgpu"
              : gpu.status === "lost"
                ? "vram lost"
                : gpu.status === "requesting"
                  ? "vram…"
                  : "vram idle"}
        </span>
        <span className="hidden items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted uppercase sm:flex">
          <Circle
            className={`size-2 fill-current ${bridgeOn ? "text-live" : "text-subtle"}`}
            strokeWidth={0}
          />
          {bridgeOn ? "blender" : "bridge"}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted uppercase">
          <Circle
            className={`size-2 fill-current ${live ? "text-live" : "text-danger"}`}
            strokeWidth={0}
          />
          {run ? `ran ${run.ms.toFixed(1)}ms` : live ? "pipeline ready" : "compile errors"}
        </span>
        <Link
          to="/docs"
          className="hidden items-center gap-1.5 text-xs text-muted hover:text-fg sm:inline-flex"
        >
          <BookOpen className="size-3.5" strokeWidth={1.75} />
          API
        </Link>
        {isPending ? (
          <div className="size-8 animate-pulse rounded-full bg-elevated" />
        ) : (
          <>
            <SignedOut>
              <Link
                to="/login"
                className="rounded-sm px-2.5 py-1.5 text-xs text-muted shadow-[0_0_0_1px_var(--color-border)] hover:text-fg"
              >
                Sign in
              </Link>
            </SignedOut>
            <SignedIn>
              <div className="hidden sm:block">
                <UserButton />
              </div>
              {user ? (
                <span className="grid size-8 place-items-center rounded-full bg-elevated text-xs font-medium sm:hidden">
                  {(user.displayName ?? "?").charAt(0).toUpperCase()}
                </span>
              ) : null}
            </SignedIn>
          </>
        )}
      </div>
    </header>
  );
}
