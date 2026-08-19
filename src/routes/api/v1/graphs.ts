import { createFileRoute } from "@tanstack/react-router";
import { uid } from "@/lib/utils";
import { isGraphDoc, json, jsonError, readJson } from "@/lib/forge/http";
import { listGraphs, upsertGraph, userIdFromRequest } from "@/lib/forge/graphs.server";
import type { GraphDoc } from "@/lib/forge/types";

export const Route = createFileRoute("/api/v1/graphs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await userIdFromRequest(request);
        if (!userId) return jsonError(401, "Sign in to list decks");
        const graphs = await listGraphs(userId);
        return json({ ok: true, graphs });
      },
      POST: async ({ request }) => {
        const userId = await userIdFromRequest(request);
        if (!userId) return jsonError(401, "Sign in to save decks");
        const body = await readJson<{ name?: string; graph?: GraphDoc; id?: string }>(request);
        if (!isGraphDoc(body?.graph)) return jsonError(422, "Body must include graph");
        const id = body?.id && /^[a-zA-Z0-9_-]{6,40}$/.test(body.id) ? body.id : uid("g");
        const name = (body?.name ?? body?.graph.name ?? "untitled").slice(0, 80);
        const meta = await upsertGraph(userId, id, name, { ...body!.graph!, name });
        return json({ ok: true, graph: meta }, 201);
      },
    },
  },
});
