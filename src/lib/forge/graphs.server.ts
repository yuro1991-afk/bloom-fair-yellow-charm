import { getSql } from "@/lib/db";
import { auth, authConfigured } from "@/lib/auth/server";
import type { GraphDoc, SavedGraph } from "./types";
import { isGraphDoc } from "./http";

export async function userIdFromRequest(request: Request): Promise<string | null> {
  if (!authConfigured) return "dev-user";
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

type Row = {
  id: string;
  name: string;
  graph: GraphDoc | string;
  created_at: string;
  updated_at: string;
};

function parseGraph(raw: GraphDoc | string): GraphDoc {
  if (typeof raw === "string") return JSON.parse(raw) as GraphDoc;
  return raw;
}

export async function listGraphs(userId: string): Promise<SavedGraph[]> {
  const sql = await getSql();
  const rows = await sql<Row>`
    select id, name, created_at, updated_at
    from forge_graphs
    where user_id = ${userId}
    order by updated_at desc
    limit 50
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getGraph(
  userId: string,
  id: string,
): Promise<{ meta: SavedGraph; graph: GraphDoc } | null> {
  const sql = await getSql();
  const rows = await sql<Row>`
    select id, name, graph, created_at, updated_at
    from forge_graphs
    where id = ${id} and user_id = ${userId}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  const graph = parseGraph(row.graph);
  if (!isGraphDoc(graph)) return null;
  return {
    meta: {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    graph,
  };
}

export async function upsertGraph(
  userId: string,
  id: string,
  name: string,
  graph: GraphDoc,
): Promise<SavedGraph> {
  const sql = await getSql();
  const payload = JSON.stringify(graph);
  await sql`
    insert into forge_graphs (id, user_id, name, graph, updated_at)
    values (${id}, ${userId}, ${name}, ${payload}::jsonb, now())
    on conflict (id) do update
      set name = excluded.name,
          graph = excluded.graph,
          updated_at = now()
      where forge_graphs.user_id = ${userId}
  `;
  const rows = await sql<Row>`
    select id, name, created_at, updated_at
    from forge_graphs
    where id = ${id} and user_id = ${userId}
    limit 1
  `;
  const row = rows[0];
  if (!row) throw new Error("Save failed");
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function deleteGraph(userId: string, id: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ id: string }>`
    delete from forge_graphs
    where id = ${id} and user_id = ${userId}
    returning id
  `;
  return rows.length > 0;
}
