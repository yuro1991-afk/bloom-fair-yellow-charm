import { createFileRoute } from "@tanstack/react-router";
import { executeGraph } from "@/lib/forge/execute";
import { isGraphDoc, json, jsonError, readJson } from "@/lib/forge/http";
import type { GraphDoc } from "@/lib/forge/types";

export const Route = createFileRoute("/api/v1/execute")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await readJson<{ graph?: GraphDoc; agents?: boolean }>(request);
        const graph = body?.graph;
        if (!isGraphDoc(graph)) return jsonError(422, "Body must be { graph }");
        const result = await executeGraph(graph, { agents: Boolean(body?.agents) });
        return json(result, result.ok ? 200 : 422, {
          "x-forge-compile-ms": result.compile.ms.toFixed(3),
          "x-forge-execute-ms": result.ms.toFixed(3),
          "x-forge-hash": result.compile.hash,
        });
      },
    },
  },
});
