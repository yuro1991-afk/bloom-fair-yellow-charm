import { create } from "zustand";
import type { BridgeJob, BridgeSnapshot } from "@/lib/forge/bridge";

const LS = "omni-forge.bridge.token";

type BridgeState = {
  token: string | null;
  online: boolean;
  operator: BridgeSnapshot["operator"];
  jobs: BridgeJob[];
  queued: number;
  busy: boolean;
  error: string | null;
  origin: string;
  ensure: () => Promise<void>;
  refresh: () => Promise<void>;
  push: (bpy: string, name: string, target: string, dryrun?: boolean) => Promise<void>;
};

export const useBridge = create<BridgeState>((set, get) => ({
  token: typeof window !== "undefined" ? window.localStorage.getItem(LS) : null,
  online: false,
  operator: null,
  jobs: [],
  queued: 0,
  busy: false,
  error: null,
  origin: typeof window !== "undefined" ? window.location.origin : "",

  ensure: async () => {
    let token = get().token;
    if (!token && typeof window !== "undefined") token = window.localStorage.getItem(LS);
    try {
      const url = token ? `/api/v1/bridge?token=${encodeURIComponent(token)}` : "/api/v1/bridge";
      const res = await fetch(url);
      const data = (await res.json()) as BridgeSnapshot & { error?: string };
      if (!res.ok || !data.token) {
        const created = await fetch("/api/v1/bridge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "session" }),
        });
        const next = (await created.json()) as BridgeSnapshot;
        if (typeof window !== "undefined") window.localStorage.setItem(LS, next.token);
        set({
          token: next.token,
          online: next.online,
          operator: next.operator,
          jobs: next.jobs,
          queued: next.queued,
          origin: window.location.origin,
          error: null,
        });
        return;
      }
      if (typeof window !== "undefined") window.localStorage.setItem(LS, data.token);
      set({
        token: data.token,
        online: data.online,
        operator: data.operator,
        jobs: data.jobs,
        queued: data.queued,
        origin: window.location.origin,
        error: null,
      });
    } catch {
      set({ error: "Bridge unreachable" });
    }
  },

  refresh: async () => {
    await get().ensure();
  },

  push: async (bpy, name, target, dryrun = false) => {
    set({ busy: true, error: null });
    try {
      await get().ensure();
      const res = await fetch("/api/v1/bridge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: dryrun ? "dryrun" : "push",
          token: get().token,
          bpy,
          name,
          target,
        }),
      });
      const data = (await res.json()) as BridgeSnapshot & { error?: string };
      if (!res.ok) {
        set({ busy: false, error: data.error ?? "Push failed" });
        return;
      }
      set({
        busy: false,
        online: data.online,
        operator: data.operator,
        jobs: data.jobs,
        queued: data.queued,
      });
    } catch {
      set({ busy: false, error: "Push failed" });
    }
  },
}));
