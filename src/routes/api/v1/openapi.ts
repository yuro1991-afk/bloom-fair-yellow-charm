import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/forge/http";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Omni-Forge API",
    version: "1.0.0",
    description:
      "Compile and execute node-graph fabrication decks. Compile is pure and typically sub-millisecond. Execute walks the DAG in topological levels and returns a scene IR plus a Blender Python script.",
  },
  paths: {
    "/api/v1/health": {
      get: { summary: "Liveness + catalog size", responses: { "200": { description: "ok" } } },
    },
    "/api/v1/catalog": {
      get: { summary: "Node type catalog", responses: { "200": { description: "ok" } } },
    },
    "/api/v1/compile": {
      post: {
        summary: "Validate + topological sort",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: { "200": { description: "compiled" }, "422": { description: "invalid graph" } },
      },
    },
    "/api/v1/execute": {
      post: {
        summary: "Compile and run. Optional { agents: true } invokes Grok for router nodes.",
        responses: { "200": { description: "ran" }, "422": { description: "failed" } },
      },
    },
    "/api/v1/graphs": {
      get: { summary: "List saved decks (auth)" },
      post: { summary: "Create a deck (auth)" },
    },
    "/api/v1/graphs/{id}": {
      get: { summary: "Load a deck (auth)" },
      put: { summary: "Replace a deck (auth)" },
      delete: { summary: "Delete a deck (auth)" },
    },
    "/api/v1/bridge": {
      get: { summary: "Bridge session status. ?addon=1 downloads the Blender add-on." },
      post: {
        summary: "session | hello | push | pull | result | dryrun",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  },
};

export const Route = createFileRoute("/api/v1/openapi")({
  server: {
    handlers: {
      GET: () => json(spec, 200, { "cache-control": "public, max-age=120" }),
    },
  },
});
