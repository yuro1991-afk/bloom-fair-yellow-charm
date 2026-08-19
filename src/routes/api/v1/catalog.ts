import { createFileRoute } from "@tanstack/react-router";
import { CATALOG, CATEGORY_LABEL } from "@/lib/forge/catalog";
import { json } from "@/lib/forge/http";

export const Route = createFileRoute("/api/v1/catalog")({
  server: {
    handlers: {
      GET: () =>
        json(
          {
            ok: true,
            version: 1,
            categories: CATEGORY_LABEL,
            nodes: CATALOG,
          },
          200,
          { "cache-control": "public, max-age=60" },
        ),
    },
  },
});
