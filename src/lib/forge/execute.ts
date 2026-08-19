import { CATALOG_BY_TYPE } from "./catalog";
import { compileGraph } from "./compile";
import type {
  ExecuteResult,
  GraphDoc,
  GraphNode,
  NodeRun,
  SceneSpec,
} from "./types";

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function blankScene(): SceneSpec {
  return {
    target: "Untitled volume",
    clip: {
      family: "Housing",
      part: "Clip-A",
      rev: "01",
      widthMm: 420,
      heightMm: 260,
      depthMm: 180,
      morph: 0,
      hollow: 0,
      bevel: 0,
      voxel: 0,
      retopo: 0,
      lattice: 0,
      symmetry: false,
      union: false,
      shell: 0.5,
    },
    orbs: { nx: 0, ny: 0, nz: 0, radius: 18, jitter: 0, strength: 0 },
    material: { metal: 0.22, roughness: 0.42, patina: 0, hex: "#c8c4bc" },
    measures: { lengthMm: 420, massKg: 4.8, collisions: 0, clearanceMm: 14 },
    bpy: "",
    notes: [],
    exportHint: "",
  };
}

type Ctx = {
  scene: SceneSpec;
  values: Map<string, Record<string, unknown>>;
  logs: string[];
  agents: boolean;
  agentNotes: string[];
};

function readIn(
  doc: GraphDoc,
  node: GraphNode,
  port: string,
  ctx: Ctx,
): unknown {
  const edge = doc.edges.find((e) => e.to === node.id && e.toPort === port);
  if (!edge) return undefined;
  const upstream = ctx.values.get(edge.from);
  if (!upstream) return undefined;
  return upstream[edge.fromPort] ?? upstream.out ?? upstream;
}

function execNode(doc: GraphDoc, node: GraphNode, ctx: Ctx): Record<string, unknown> {
  const p = node.params;
  const s = ctx.scene;
  const c = s.clip;

  switch (node.type) {
    case "In_PromptBox": {
      const prompt = str(p.prompt, "");
      s.target = prompt.split("—")[0]?.trim() || prompt.slice(0, 80) || s.target;
      ctx.logs.push(`prompt: ${prompt.slice(0, 140)}`);
      return { out: prompt, priority: p.priority };
    }
    case "In_ViewportDrop":
      ctx.logs.push(`plate ${str(p.plate, "?")} (${str(p.view, "front")})`);
      return { out: { plate: p.plate, view: p.view } };
    case "In_CADImport":
      ctx.logs.push(`cad ${str(p.handle, "?")} [${str(p.units, "mm")}]`);
      return { out: { handle: p.handle, units: p.units } };
    case "In_SpecSheet": {
      c.family = str(p.family, c.family);
      c.part = str(p.part, c.part);
      c.rev = str(p.rev, c.rev);
      c.widthMm = num(p.widthMm, c.widthMm);
      c.heightMm = num(p.heightMm, c.heightMm);
      c.depthMm = num(p.depthMm, c.depthMm);
      s.measures.massKg = num(p.massKg, s.measures.massKg);
      s.measures.lengthMm = c.widthMm;
      ctx.logs.push(`spec ${c.family} ${c.part} r${c.rev} ${c.widthMm}×${c.heightMm}×${c.depthMm} mm`);
      return { out: { ...c, massKg: s.measures.massKg } };
    }
    case "In_ReferenceScan":
      ctx.logs.push(`scan ${str(p.cloud, "?")} d=${num(p.density, 0)}`);
      return { out: { cloud: p.cloud, density: p.density } };
    case "In_CurveProfile":
      ctx.logs.push(`curve ${str(p.profile, "?")}`);
      return { out: { profile: p.profile, tension: p.tension } };
    case "Router_Agent": {
      const prompt = String(readIn(doc, node, "prompt", ctx) ?? "");
      const spatial = bool(p.spatialBias, true);
      const plan = ctx.agents
        ? ctx.agentNotes.find((n) => n.startsWith("route:")) ?? "route: heuristic"
        : "route: heuristic";
      if (spatial) c.shell = Math.min(1, c.shell + 0.08);
      ctx.logs.push(`router ${str(p.loop, "ooda")} · ${plan}`);
      return { agent: { plan, prompt }, spatial: { seed: spatial ? 1 : 0 } };
    }
    case "VLM_Critic": {
      const score = 0.68 + c.shell * 0.15 - Math.abs(c.morph - 0.5) * 0.1;
      const pass = score >= num(p.threshold, 0.72);
      ctx.logs.push(`vlm ${str(p.focus, "silhouette")} score=${score.toFixed(2)} ${pass ? "pass" : "flag"}`);
      s.notes.push(`VLM ${pass ? "pass" : "below threshold"} (${score.toFixed(2)})`);
      return { agent: { score, pass, focus: p.focus } };
    }
    case "Planner_Agent": {
      const steps = Math.round(num(p.steps, 6));
      const ops = ["spawn orbs", "morph field", "mirror", "bevel", "hollow", "shade"].slice(0, steps);
      ctx.logs.push(`plan ${ops.join(" → ")}`);
      return { agent: { ops } };
    }
    case "QC_Inspector": {
      const clearance = s.measures.clearanceMm;
      const pass = clearance >= num(p.minClearance, 8) && s.measures.collisions < 3;
      ctx.logs.push(`qc clearance=${clearance.toFixed(1)}mm collisions=${s.measures.collisions} ${pass ? "ok" : "hold"}`);
      if (!pass) s.notes.push("QC hold — check clearance / collisions.");
      return { exec: { pass, block: bool(p.blockExport, false) && !pass } };
    }
    case "Matrix_Spawner": {
      s.orbs.nx = Math.round(num(p.nx, 7));
      s.orbs.ny = Math.round(num(p.ny, 5));
      s.orbs.nz = Math.round(num(p.nz, 3));
      s.orbs.radius = num(p.radius, 18);
      s.orbs.jitter = num(p.jitter, 0.12);
      ctx.logs.push(`orbs ${s.orbs.nx}×${s.orbs.ny}×${s.orbs.nz} r=${s.orbs.radius}mm`);
      return { out: { ...s.orbs } };
    }
    case "Orb_Morpher": {
      s.orbs.strength = num(p.strength, 0.62);
      c.morph = Math.min(1, s.orbs.strength * 0.85);
      ctx.logs.push(`morph ${str(p.falloff, "smooth")} ×${s.orbs.strength.toFixed(2)}`);
      return { morph: { strength: s.orbs.strength, falloff: p.falloff }, mesh: { morph: c.morph } };
    }
    case "Interior_Hollower": {
      c.hollow = Math.min(1, num(p.thickness, 3.2) / 8);
      s.measures.massKg *= 0.72;
      s.measures.clearanceMm = Math.max(2, s.measures.clearanceMm - num(p.thickness, 3.2) * 0.4);
      ctx.logs.push(`hollow wall=${num(p.thickness, 3.2)}mm keepSkin=${bool(p.keepSkin, true)}`);
      return { mesh: { hollow: c.hollow } };
    }
    case "Surface_Retopo":
      c.retopo = Math.min(1, num(p.faces, 18000) / 40000);
      ctx.logs.push(`retopo budget=${Math.round(num(p.faces, 18000))} faces`);
      return { mesh: { faces: p.faces } };
    case "Lattice_Deform":
      c.lattice = Math.min(1, Math.abs(num(p.amount, 0.18)));
      ctx.logs.push(`lattice div=${Math.round(num(p.divisions, 4))} amt=${num(p.amount, 0.18)}`);
      return { mesh: { lattice: p.amount } };
    case "Symmetry_Mirror":
      c.symmetry = true;
      ctx.logs.push(`mirror ${str(p.axis, "x")} weld=${num(p.weld, 0.4)}mm`);
      return { mesh: { mirrored: true } };
    case "Bevel_Chamfer":
      c.bevel = Math.min(1, num(p.width, 2.4) / 8);
      ctx.logs.push(`bevel ${num(p.width, 2.4)}mm ×${Math.round(num(p.segments, 2))}`);
      return { mesh: { bevel: p.width } };
    case "Voxel_Voxelizer":
      c.voxel = Math.min(1, 12 / Math.max(2, num(p.cell, 8)));
      ctx.logs.push(`voxel cell=${num(p.cell, 8)}mm`);
      return { mesh: { cell: p.cell } };
    case "Boolean_Union":
      c.union = true;
      ctx.logs.push(`boolean union ${str(p.solver, "exact")}`);
      return { mesh: { union: true } };
    case "Shader_PBR":
      s.material.hex = str(p.hex, s.material.hex);
      s.material.metal = num(p.metal, s.material.metal);
      s.material.roughness = num(p.rough, s.material.roughness);
      ctx.logs.push(`pbr ${s.material.hex} m=${s.material.metal} r=${s.material.roughness}`);
      return { mat: { ...s.material }, mesh: { shaded: true } };
    case "Paint_Decal":
      ctx.logs.push(`decal ${str(p.decal, "?")} op=${num(p.opacity, 0.9)}`);
      return { mat: { decal: p.decal }, mesh: { decaled: true } };
    case "Weather_Patina":
      s.material.patina = num(p.age, 0.16);
      s.material.roughness = Math.min(1, s.material.roughness + num(p.dust, 0.1) * 0.2);
      ctx.logs.push(`patina age=${s.material.patina} dust=${num(p.dust, 0.1)}`);
      return { mat: { ...s.material } };
    case "Measure_Caliper":
      s.measures.lengthMm =
        str(p.axis, "x") === "y" ? c.heightMm : str(p.axis, "x") === "z" ? c.depthMm : c.widthMm;
      ctx.logs.push(`caliper ${p.axis}=${s.measures.lengthMm}mm`);
      return { out: { ...s.measures } };
    case "Collision_Probe": {
      const samples = num(p.samples, 400);
      s.measures.collisions = Math.max(
        0,
        Math.round((c.hollow * 2 + c.morph * 1.4 + c.voxel * 1.1) * (samples / 400) - 0.6),
      );
      ctx.logs.push(`probe hits=${s.measures.collisions} n=${samples}`);
      return { out: { collisions: s.measures.collisions } };
    }
    case "Mass_Estimator": {
      const alloy = str(p.alloy, "aluminum");
      const dens = alloy === "aluminum" ? 0.62 : alloy === "steel" ? 1 : 0.84;
      s.measures.massKg = Math.round(s.measures.massKg * dens * (c.hollow ? 0.78 : 1) * 10) / 10;
      ctx.logs.push(`mass ${s.measures.massKg}kg (${alloy})`);
      return { out: { massKg: s.measures.massKg } };
    }
    case "Blender_Operator": {
      s.bpy = emitBpy(s, str(p.target, "4.2"), bool(p.applyMods, true));
      ctx.logs.push(`operator blender ${p.target} · ${s.bpy.split("\n").length} lines`);
      return { out: { bpy: s.bpy, target: p.target } };
    }
    case "Blender_Bridge": {
      const autoPush = bool(p.autoPush, true);
      const dryIfOffline = bool(p.dryIfOffline, true);
      ctx.logs.push(
        `bridge queued · auto=${autoPush} dryIfOffline=${dryIfOffline} · ${s.bpy ? `${s.bpy.split("\n").length} lines` : "no bpy yet"}`,
      );
      return { out: { bridge: true, autoPush, dryIfOffline, lines: s.bpy.split("\n").length } };
    }
    case "VRAM_Mount": {
      const heapMb = num(p.heapMb, 4);
      const resident = str(p.resident, "both");
      s.notes.push(`VRAM mount requested · ${heapMb}MB scratch · ${resident}`);
      ctx.logs.push(`vram request ${heapMb}MB (${resident}) — client WebGPU`);
      return { out: { vram: true, heapMb, resident } };
    }
    case "Export_GLB":
      s.exportHint = str(p.filename, "clip-a.glb");
      ctx.logs.push(`export ${s.exportHint} draco=${bool(p.draco, true)}`);
      return { out: { file: s.exportHint } };
    case "Snapshot_Render":
      ctx.logs.push(`snapshot ${str(p.camera, "front")}`);
      return { out: { camera: p.camera } };
    default:
      ctx.logs.push(`noop ${node.type}`);
      return { out: true };
  }
}

function emitBpy(s: SceneSpec, version: string, apply: boolean): string {
  const c = s.clip;
  const o = s.orbs;
  return `# Omni-Forge compiled job — Blender ${version}
# Target: ${s.target}
# FORGE_JOB ${s.clip.family}_${s.clip.part} rev ${s.clip.rev}
import bpy
from mathutils import Vector

def ensure_collection(name):
    col = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if col.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(col)
    return col

col = ensure_collection("OMNI_FORGE")
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, ${((c.heightMm / 1000) * 0.5).toFixed(3)}))
clip = bpy.context.active_object
clip.name = ${JSON.stringify(`${c.family}_${c.part}`)}
clip.scale = (${(c.widthMm / 1000).toFixed(3)}, ${(c.depthMm / 1000).toFixed(3)}, ${(c.heightMm / 1000).toFixed(3)})
${o.nx ? `orbs = ensure_collection("ORBS")
for i in range(${o.nx}):
    for j in range(${o.ny}):
        for k in range(${o.nz}):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=${(o.radius / 1000).toFixed(4)})
            ob = bpy.context.active_object
            ob.location = Vector(((i-${(o.nx / 2).toFixed(1)})*0.18, (k-${(o.nz / 2).toFixed(1)})*0.16, 0.4+j*0.16))
            orbs.objects.link(ob)
` : ""}# morph=${c.morph.toFixed(3)} hollow=${c.hollow.toFixed(3)} bevel=${c.bevel.toFixed(3)}
${c.hollow ? "bpy.ops.mesh.inset_faces(thickness=0.02)\nbpy.ops.mesh.extrude_region_move(TRANSFORM_OT_translate={'value': (0,0,-0.08)})\n" : ""}${apply ? "bpy.ops.object.convert(target='MESH')\n" : ""}print("forge ready:", ${JSON.stringify(s.exportHint || "in-memory")})
`;
}

async function maybeAgents(doc: GraphDoc, ctx: Ctx): Promise<void> {
  if (!ctx.agents) return;
  const apiKey = typeof process !== "undefined" ? process.env.XAI_API_KEY : undefined;
  if (!apiKey) {
    ctx.logs.push("agents: no XAI_API_KEY — heuristic fallback");
    return;
  }
  const promptNode = doc.nodes.find((n) => n.type === "In_PromptBox");
  const brief = promptNode ? str(promptNode.params.prompt, "") : ctx.scene.target;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content:
              "You are the Omni-Forge router. Reply in 4 short lines: OBSERVE, ORIENT, DECIDE, ACT. No markdown.",
          },
          { role: "user", content: `Brief: ${brief.slice(0, 400)}` },
        ],
      }),
    });
    if (!res.ok) {
      ctx.logs.push(`agents: xAI ${res.status}`);
      return;
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (text) {
      ctx.agentNotes.push(`route: ${text.replace(/\s+/g, " ").slice(0, 280)}`);
      ctx.scene.notes.push(text.split("\n").filter(Boolean)[0] ?? text.slice(0, 120));
      ctx.logs.push("agents: router replied");
    }
  } catch {
    ctx.logs.push("agents: request failed — heuristic fallback");
  }
}

export async function executeGraph(
  doc: GraphDoc,
  opts: { agents?: boolean } = {},
): Promise<ExecuteResult> {
  const t0 = performance.now();
  const compile = compileGraph(doc);
  const scene = blankScene();
  const ctx: Ctx = {
    scene,
    values: new Map(),
    logs: [],
    agents: Boolean(opts.agents),
    agentNotes: [],
  };
  const runs: NodeRun[] = [];

  if (ctx.agents && doc.nodes.some((n) => CATALOG_BY_TYPE[n.type]?.category === "agent")) {
    await maybeAgents(doc, ctx);
  }

  for (const level of compile.levels) {
    for (const id of level) {
      const node = doc.nodes.find((n) => n.id === id);
      if (!node) continue;
      const n0 = performance.now();
      try {
        const output = execNode(doc, node, ctx);
        ctx.values.set(id, output);
        runs.push({
          nodeId: id,
          type: node.type,
          status: "ok",
          ms: performance.now() - n0,
          output,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "node failed";
        ctx.logs.push(`error ${node.type}: ${message}`);
        runs.push({
          nodeId: id,
          type: node.type,
          status: "error",
          ms: performance.now() - n0,
          output: {},
          log: message,
        });
      }
    }
  }

  if (!scene.bpy) scene.bpy = emitBpy(scene, "4.2", true);

  return {
    ok: compile.ok && runs.every((r) => r.status !== "error"),
    compile,
    runs,
    scene,
    logs: ctx.logs,
    ms: performance.now() - t0,
    agents: ctx.agents,
  };
}
