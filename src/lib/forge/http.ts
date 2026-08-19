export function json(data: unknown, status = 200, extra: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extra,
    },
  });
}

export function jsonError(status: number, error: string, details?: unknown): Response {
  return json({ ok: false, error, details }, status);
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function isGraphDoc(v: unknown): v is import("./types").GraphDoc {
  if (!v || typeof v !== "object") return false;
  const g = v as Record<string, unknown>;
  return g.version === 1 && Array.isArray(g.nodes) && Array.isArray(g.edges);
}
