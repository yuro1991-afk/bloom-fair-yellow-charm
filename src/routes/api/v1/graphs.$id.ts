import { createFileRoute } from "@tanstack/react-router";
import { isGraphDoc, json, jsonError, readJson } from "@/lib/forge/http";
import {
  deleteGraph,
  getGraph,
  upsertGraph,
  userIdFromRequest,
} from "@/lib/forge/graphs.server";
import type { GraphDoc } from "@/lib/forge/types";

export const Route = createFileRoute("/api/v1/graphs/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const userId = await userIdFromRequest(request);
        if (!userId) return jsonError(401, "Sign in to load decks");
        const row = await getGraph(userId, params.id);
        if (!row) return jsonError(404, "Deck not found");
        return json({ ok: true, ...row });
      },
      PUT: async ({ request, params }) => {
        const userId = await userIdFromRequest(request);
        if (!userId) return jsonError(401, "Sign in to save decks");
        const body = await readJson<{ name?: string; graph?: GraphDoc }>(request);
        if (!isGraphDoc(body?.graph)) return jsonError(422, "Body must include graph");
        const name = (body?.name ?? body?.graph.name ?? "untitled").slice(0, 80);
        const meta = await upsertGraph(userId, params.id, name, { ...body!.graph!, name });
        return json({ ok: true, graph: meta });
      },
      DELETE: async ({ request, params }) => {
        const userId = await userIdFromRequest(request);
        if (!userId) return jsonError(401, "Sign in to delete decks");
        const gone = await deleteGraph(userId, params.id);
        if (!gone) return jsonError(404, "Deck not found");
        return json({ ok: true });
      },
    },
  },
});
