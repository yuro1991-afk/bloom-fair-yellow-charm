import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/forge/http";
import { CATALOG } from "@/lib/forge/catalog";
import { dbSource } from "@/lib/db";

export const Route = createFileRoute("/api/v1/health")({
  server: {
    handlers: {
      GET: () =>
        json(
          {
            ok: true,
            service: "omni-forge",
            version: "1",
            nodes: CATALOG.length,
            db: dbSource,
            agents: Boolean(process.env.XAI_API_KEY),
            now: new Date().toISOString(),
          },
          200,
          { "cache-control": "no-store" },
        ),
    },
  },
});
