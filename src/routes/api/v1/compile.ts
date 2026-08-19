import { createFileRoute } from "@tanstack/react-router";
import { compileGraph } from "@/lib/forge/compile";
import { isGraphDoc, json, jsonError, readJson } from "@/lib/forge/http";
import type { GraphDoc } from "@/lib/forge/types";

export const Route = createFileRoute("/api/v1/compile")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await readJson<{ graph?: GraphDoc }>(request);
        const graph = body?.graph;
        if (!isGraphDoc(graph)) return jsonError(422, "Body must be { graph }");
        const result = compileGraph(graph);
        return json(
          { ok: result.ok, compile: result },
          result.ok ? 200 : 422,
          { "x-forge-compile-ms": result.ms.toFixed(3), "x-forge-hash": result.hash },
        );
      },
    },
  },
});
