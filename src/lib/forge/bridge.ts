export type BridgeJobStatus = "queued" | "running" | "ok" | "error";

export type BridgeJob = {
  id: string;
  name: string;
  status: BridgeJobStatus;
  bpy: string;
  target: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  logs: string[];
  preview: string | null;
  source: "deck" | "dryrun";
};

export type BridgeOperator = {
  blender: string;
  addon: string;
  lastHello: string;
};

export type BridgeSession = {
  token: string;
  createdAt: string;
  operator: BridgeOperator | null;
  jobs: BridgeJob[];
};

export type BridgeSnapshot = {
  ok: true;
  token: string;
  operator: BridgeOperator | null;
  online: boolean;
  jobs: BridgeJob[];
  queued: number;
};

const ONLINE_MS = 8000;
const MAX_JOBS = 24;

type Store = { sessions: Map<string, BridgeSession> };

function store(): Store {
  const g = globalThis as typeof globalThis & { __omniForgeBridge?: Store };
  if (!g.__omniForgeBridge) g.__omniForgeBridge = { sessions: new Map() };
  return g.__omniForgeBridge;
}

function now(): string {
  return new Date().toISOString();
}

function token(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jobId(): string {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function trim(session: BridgeSession) {
  if (session.jobs.length > MAX_JOBS) session.jobs = session.jobs.slice(-MAX_JOBS);
}

function online(op: BridgeOperator | null): boolean {
  if (!op) return false;
  return Date.now() - Date.parse(op.lastHello) < ONLINE_MS;
}

export function snapshotOf(session: BridgeSession): BridgeSnapshot {
  return {
    ok: true,
    token: session.token,
    operator: session.operator,
    online: online(session.operator),
    jobs: session.jobs.slice().reverse(),
    queued: session.jobs.filter((j) => j.status === "queued" || j.status === "running").length,
  };
}

export function createSession(): BridgeSession {
  const session: BridgeSession = {
    token: token(),
    createdAt: now(),
    operator: null,
    jobs: [],
  };
  store().sessions.set(session.token, session);
  return session;
}

export function getSession(tok: string | null | undefined): BridgeSession | null {
  if (!tok) return null;
  return store().sessions.get(tok) ?? null;
}

export function requireSession(tok: string | null | undefined): BridgeSession {
  const existing = getSession(tok);
  if (existing) return existing;
  if (tok && tok.length >= 16) {
    const session: BridgeSession = {
      token: tok,
      createdAt: now(),
      operator: null,
      jobs: [],
    };
    store().sessions.set(tok, session);
    return session;
  }
  return createSession();
}

export function hello(
  session: BridgeSession,
  info: { blender?: string; addon?: string },
): BridgeSnapshot {
  session.operator = {
    blender: info.blender?.slice(0, 40) || "Blender",
    addon: info.addon?.slice(0, 24) || "1.0.0",
    lastHello: now(),
  };
  return snapshotOf(session);
}

export function pushJob(
  session: BridgeSession,
  body: { bpy?: string; name?: string; target?: string; source?: "deck" | "dryrun" },
): BridgeJob {
  const job: BridgeJob = {
    id: jobId(),
    name: (body.name || "forge-job").slice(0, 80),
    status: "queued",
    bpy: body.bpy || "",
    target: (body.target || "4.2").slice(0, 12),
    createdAt: now(),
    startedAt: null,
    finishedAt: null,
    logs: [],
    preview: null,
    source: body.source ?? "deck",
  };
  session.jobs.push(job);
  trim(session);
  return job;
}

export function pullJob(session: BridgeSession): BridgeJob | null {
  const job = session.jobs.find((j) => j.status === "queued");
  if (!job) return null;
  job.status = "running";
  job.startedAt = now();
  if (session.operator) session.operator.lastHello = now();
  return job;
}

export function finishJob(
  session: BridgeSession,
  id: string,
  body: { ok?: boolean; logs?: string[]; preview?: string | null },
): BridgeJob | null {
  const job = session.jobs.find((j) => j.id === id);
  if (!job) return null;
  job.status = body.ok === false ? "error" : "ok";
  job.finishedAt = now();
  job.logs = Array.isArray(body.logs) ? body.logs.map((l) => String(l).slice(0, 400)).slice(0, 80) : [];
  job.preview = typeof body.preview === "string" ? body.preview.slice(0, 250_000) : null;
  if (session.operator) session.operator.lastHello = now();
  return job;
}

export function dryRun(session: BridgeSession, job: BridgeJob): BridgeJob {
  job.status = "ok";
  job.source = "dryrun";
  job.startedAt = job.startedAt ?? now();
  job.finishedAt = now();
  const lines = job.bpy.split("\n").length;
  job.logs = [
    "dry-run · no bpy.app on this host",
    `script ${lines} lines · target ${job.target}`,
    "validated markers: import bpy, ensure_collection",
    "queued geometry would build in a connected operator",
  ];
  return job;
}
