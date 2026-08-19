import { createFileRoute } from "@tanstack/react-router";
import { ADDON_FILENAME, BLENDER_ADDON } from "@/lib/forge/blender-addon";
import {
  createSession,
  dryRun,
  finishJob,
  getSession,
  hello,
  pullJob,
  pushJob,
  requireSession,
  snapshotOf,
} from "@/lib/forge/bridge";
import { json, jsonError, readJson } from "@/lib/forge/http";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-forge-token",
};

type Body = {
  action?: string;
  token?: string;
  bpy?: string;
  name?: string;
  target?: string;
  blender?: string;
  addon?: string;
  jobId?: string;
  ok?: boolean;
  logs?: string[];
  preview?: string | null;
  dryrun?: boolean;
};

function tok(request: Request, body?: Body | null): string | null {
  return (
    request.headers.get("x-forge-token") ||
    body?.token ||
    new URL(request.url).searchParams.get("token") ||
    null
  );
}

export const Route = createFileRoute("/api/v1/bridge")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("addon") === "1") {
          return new Response(BLENDER_ADDON, {
            status: 200,
            headers: {
              "content-type": "text/x-python; charset=utf-8",
              "content-disposition": `attachment; filename="${ADDON_FILENAME}"`,
              "cache-control": "no-store",
              ...CORS,
            },
          });
        }
        const session = tok(request) ? requireSession(tok(request)) : createSession();
        return json(snapshotOf(session), 200, CORS);
      },
      POST: async ({ request }) => {
        const body = await readJson<Body>(request);
        const action = body?.action || "session";
        if (action === "session") {
          return json(snapshotOf(createSession()), 200, CORS);
        }
        const session = action === "hello" || action === "pull" || action === "result"
          ? getSession(tok(request, body))
          : requireSession(tok(request, body));
        if (!session) return json({ ok: false, error: "Unknown token" }, 401, CORS);

        if (action === "hello") {
          return json(hello(session, { blender: body?.blender, addon: body?.addon }), 200, CORS);
        }
        if (action === "push") {
          const job = pushJob(session, {
            bpy: body?.bpy,
            name: body?.name,
            target: body?.target,
          });
          if (body?.dryrun) dryRun(session, job);
          return json({ job, ...snapshotOf(session) }, 200, CORS);
        }
        if (action === "pull") {
          const job = pullJob(session);
          return json({ job, ...snapshotOf(session) }, 200, CORS);
        }
        if (action === "result") {
          if (!body?.jobId) return jsonError(422, "jobId required");
          const job = finishJob(session, body.jobId, {
            ok: body.ok,
            logs: body.logs,
            preview: body.preview,
          });
          if (!job) return json({ ok: false, error: "Unknown job" }, 404, CORS);
          return json({ job, ...snapshotOf(session) }, 200, CORS);
        }
        if (action === "dryrun") {
          const job = body?.jobId
            ? session.jobs.find((j) => j.id === body.jobId)
            : pushJob(session, { bpy: body?.bpy, name: body?.name, target: body?.target, source: "dryrun" });
          if (!job) return json({ ok: false, error: "Unknown job" }, 404, CORS);
          dryRun(session, job);
          return json({ job, ...snapshotOf(session) }, 200, CORS);
        }
        return jsonError(422, "Unknown action");
      },
    },
  },
});
