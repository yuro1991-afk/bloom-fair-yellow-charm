import type { NodeCategory, NodeTypeDef, ParamField } from "./types";

const t = {
  text: (key: string, label: string, def: string, placeholder?: string): ParamField => ({
    key,
    label,
    kind: "text",
    default: def,
    placeholder,
  }),
  area: (key: string, label: string, def: string, placeholder?: string): ParamField => ({
    key,
    label,
    kind: "textarea",
    default: def,
    placeholder,
  }),
  num: (
    key: string,
    label: string,
    def: number,
    extra?: { min?: number; max?: number; step?: number; unit?: string },
  ): ParamField => ({
    key,
    label,
    kind: "number",
    default: def,
    ...extra,
  }),
  sel: (
    key: string,
    label: string,
    def: string,
    options: { value: string; label: string }[],
  ): ParamField => ({ key, label, kind: "select", default: def, options }),
  tog: (key: string, label: string, def: boolean): ParamField => ({
    key,
    label,
    kind: "toggle",
    default: def,
  }),
};

export const CATALOG: NodeTypeDef[] = [
  {
    type: "In_PromptBox",
    title: "Prompt Box",
    category: "input",
    icon: "Type",
    summary: "Primary intent stream for the forge.",
    detail:
      "Freeform target brief. Downstream agents treat this as the mission statement. Name the part, the region, and the constraint that matters.",
    params: [
      t.area(
        "prompt",
        "Target brief",
        "Hollow lattice volume — spawn a control-orb field, morph the shell, then subtract the interior cavity.",
      ),
      t.sel("priority", "Priority", "geometry", [
        { value: "geometry", label: "Geometry first" },
        { value: "surface", label: "Surface first" },
        { value: "fitment", label: "Fitment first" },
      ]),
    ],
    inputs: [],
    outputs: [{ id: "out", label: "Prompt", kind: "prompt" }],
  },
  {
    type: "In_ViewportDrop",
    title: "Viewport Drop",
    category: "input",
    icon: "ImagePlus",
    summary: "Reference still or screenshot as an image stream.",
    detail:
      "Accepts a named plate (front, 3/4, section). Used by the VLM critic and decal projection. Bind a plate id — the deck does not ship binary images.",
    params: [
      t.text("plate", "Plate id", "hero-01"),
      t.sel("view", "View", "front", [
        { value: "front", label: "Front" },
        { value: "three_quarter", label: "3/4" },
        { value: "side", label: "Side" },
        { value: "section", label: "Section" },
      ]),
    ],
    inputs: [],
    outputs: [{ id: "out", label: "Image", kind: "image" }],
  },
  {
    type: "In_CADImport",
    title: "CAD Import",
    category: "input",
    icon: "Box",
    summary: "Named mesh / STEP / OBJ handle.",
    detail:
      "Points at an already-staged asset. The operator resolves the handle at execute time; the deck never ships binary CAD.",
    params: [
      t.text("handle", "Asset handle", "parts/clip-a.step"),
      t.sel("units", "Units", "mm", [
        { value: "mm", label: "Millimetres" },
        { value: "in", label: "Inches" },
        { value: "m", label: "Metres" },
      ]),
    ],
    inputs: [],
    outputs: [{ id: "out", label: "Mesh", kind: "mesh" }],
  },
  {
    type: "In_SpecSheet",
    title: "Spec Sheet",
    category: "input",
    icon: "FileSpreadsheet",
    summary: "Hard dimensions and mass envelope.",
    detail:
      "Locks the working volume so spatial gadgets stay in real units. Defaults are a generic clip housing — swap them for whatever you are forging.",
    params: [
      t.text("family", "Family", "Housing"),
      t.text("part", "Part", "Clip-A"),
      t.text("rev", "Rev", "01"),
      t.num("widthMm", "Width", 420, { min: 20, max: 4000, unit: "mm" }),
      t.num("heightMm", "Height", 260, { min: 20, max: 4000, unit: "mm" }),
      t.num("depthMm", "Depth", 180, { min: 10, max: 4000, unit: "mm" }),
      t.num("massKg", "Mass", 4.8, { min: 0.01, max: 8000, step: 0.1, unit: "kg" }),
    ],
    inputs: [],
    outputs: [{ id: "out", label: "Spec", kind: "spec" }],
  },
  {
    type: "In_ReferenceScan",
    title: "Reference Scan",
    category: "input",
    icon: "Scan",
    summary: "Photogrammetry / lidar cloud handle.",
    detail: "Sparse cloud used to bias orb placement toward captured surfaces.",
    params: [
      t.text("cloud", "Cloud handle", "scans/clip-a-01.ply"),
      t.num("density", "Density", 0.45, { min: 0, max: 1, step: 0.01 }),
    ],
    inputs: [],
    outputs: [{ id: "out", label: "Cloud", kind: "mesh" }],
  },
  {
    type: "In_CurveProfile",
    title: "Curve Profile",
    category: "input",
    icon: "Spline",
    summary: "2D profile used as a loft or trim guide.",
    detail: "Lip, crown, or section curve as a named spline.",
    params: [
      t.sel("profile", "Profile", "outer_lip", [
        { value: "outer_lip", label: "Outer lip" },
        { value: "crown", label: "Crown" },
        { value: "section", label: "Section" },
        { value: "trim", label: "Trim" },
      ]),
      t.num("tension", "Tension", 0.35, { min: 0, max: 1, step: 0.01 }),
    ],
    inputs: [],
    outputs: [{ id: "out", label: "Curve", kind: "mesh" }],
  },
  {
    type: "Router_Agent",
    title: "Router Agent",
    category: "agent",
    icon: "GitBranch",
    summary: "OODA loop — classifies intent and routes the graph.",
    detail:
      "Reads the prompt (and optional spec). When agents are enabled it asks Grok for a routing plan; otherwise it uses a deterministic heuristic.",
    params: [
      t.sel("loop", "Loop", "ooda", [
        { value: "ooda", label: "OODA" },
        { value: "greedy", label: "Greedy" },
        { value: "conservative", label: "Conservative" },
      ]),
      t.tog("spatialBias", "Bias spatial gadgets", true),
    ],
    inputs: [
      { id: "prompt", label: "Prompt", kind: "prompt" },
      { id: "spec", label: "Spec", kind: "spec" },
    ],
    outputs: [
      { id: "agent", label: "Plan", kind: "agent" },
      { id: "spatial", label: "Spatial", kind: "matrix" },
    ],
  },
  {
    type: "VLM_Critic",
    title: "VLM Critic",
    category: "agent",
    icon: "Eye",
    summary: "Vision critic against a plate and current mesh.",
    detail:
      "Scores silhouette, proportion, and surface continuity. Writes notes into the scene log. Live VLM only when agents are on.",
    params: [
      t.num("threshold", "Pass threshold", 0.72, { min: 0, max: 1, step: 0.01 }),
      t.sel("focus", "Focus", "silhouette", [
        { value: "silhouette", label: "Silhouette" },
        { value: "gaps", label: "Gaps" },
        { value: "proportions", label: "Proportions" },
      ]),
    ],
    inputs: [
      { id: "image", label: "Plate", kind: "image" },
      { id: "mesh", label: "Mesh", kind: "mesh" },
    ],
    outputs: [{ id: "agent", label: "Critique", kind: "agent" }],
  },
  {
    type: "Planner_Agent",
    title: "Planner Agent",
    category: "agent",
    icon: "ListTree",
    summary: "Breaks the brief into ordered spatial ops.",
    detail: "Emits a short op list the operator can echo as comments in BPY.",
    params: [t.num("steps", "Max steps", 6, { min: 2, max: 12, step: 1 })],
    inputs: [
      { id: "prompt", label: "Prompt", kind: "prompt" },
      { id: "plan", label: "Prior", kind: "agent" },
    ],
    outputs: [{ id: "agent", label: "Ops", kind: "agent" }],
  },
  {
    type: "QC_Inspector",
    title: "QC Inspector",
    category: "agent",
    icon: "BadgeCheck",
    summary: "Gate on measures + critic before export.",
    detail: "Fails the run (warn, not hard stop) if clearance or critic score is below spec.",
    params: [
      t.num("minClearance", "Min clearance", 8, { min: 0, max: 40, unit: "mm" }),
      t.tog("blockExport", "Block export on fail", false),
    ],
    inputs: [
      { id: "measure", label: "Measures", kind: "measure" },
      { id: "critic", label: "Critique", kind: "agent" },
    ],
    outputs: [{ id: "exec", label: "Gate", kind: "exec" }],
  },
  {
    type: "Matrix_Spawner",
    title: "Matrix Spawner",
    category: "spatial",
    icon: "Grid3x3",
    summary: "Deploys a volume of control orbs.",
    detail:
      "Orbs are the forge's primary deformer. Density is in cells, not millimetres — radius is world-mm.",
    params: [
      t.num("nx", "Count X", 7, { min: 1, max: 24, step: 1 }),
      t.num("ny", "Count Y", 5, { min: 1, max: 24, step: 1 }),
      t.num("nz", "Count Z", 3, { min: 1, max: 12, step: 1 }),
      t.num("radius", "Orb radius", 18, { min: 2, max: 200, unit: "mm" }),
      t.num("jitter", "Jitter", 0.12, { min: 0, max: 1, step: 0.01 }),
    ],
    inputs: [
      { id: "drive", label: "Drive", kind: "any" },
      { id: "spec", label: "Spec", kind: "spec" },
    ],
    outputs: [{ id: "out", label: "Orbs", kind: "matrix" }],
  },
  {
    type: "Orb_Morpher",
    title: "Orb Morpher",
    category: "spatial",
    icon: "Circles",
    summary: "Pushes mesh along the orb field.",
    detail: "Radial falloff with optional crease preserve. Strength 1.0 is a full cell-radius offset.",
    params: [
      t.num("strength", "Strength", 0.62, { min: 0, max: 2, step: 0.01 }),
      t.sel("falloff", "Falloff", "smooth", [
        { value: "smooth", label: "Smooth" },
        { value: "linear", label: "Linear" },
        { value: "crease", label: "Crease preserve" },
      ]),
    ],
    inputs: [
      { id: "matrix", label: "Orbs", kind: "matrix" },
      { id: "mesh", label: "Mesh", kind: "mesh" },
    ],
    outputs: [
      { id: "morph", label: "Morph", kind: "morph" },
      { id: "mesh", label: "Mesh", kind: "mesh" },
    ],
  },
  {
    type: "Interior_Hollower",
    title: "Interior Hollower",
    category: "spatial",
    icon: "CircleDashed",
    summary: "Boolean-subtracts an interior cavity.",
    detail: "Wall thickness in mm. Keep-skin preserves the outer shell so the silhouette stays readable.",
    params: [
      t.num("thickness", "Wall", 3.2, { min: 0.6, max: 20, step: 0.1, unit: "mm" }),
      t.tog("keepSkin", "Keep outer skin", true),
    ],
    inputs: [{ id: "mesh", label: "Mesh", kind: "mesh" }],
    outputs: [{ id: "mesh", label: "Hollow", kind: "mesh" }],
  },
  {
    type: "Surface_Retopo",
    title: "Surface Retopo",
    category: "spatial",
    icon: "Workflow",
    summary: "Rebuilds a cleaner quad-ish cage.",
    detail: "Target face count is a budget, not a guarantee. Higher = tighter fillets.",
    params: [
      t.num("faces", "Target faces", 18000, { min: 500, max: 200000, step: 500 }),
      t.tog("preserveCreases", "Preserve creases", true),
    ],
    inputs: [{ id: "mesh", label: "Mesh", kind: "mesh" }],
    outputs: [{ id: "mesh", label: "Retopo", kind: "mesh" }],
  },
  {
    type: "Lattice_Deform",
    title: "Lattice Deform",
    category: "spatial",
    icon: "BoxSelect",
    summary: "Cage deform over the working volume.",
    detail: "Use for broad stance / rake changes without tearing the orb field.",
    params: [
      t.num("divisions", "Divisions", 4, { min: 2, max: 12, step: 1 }),
      t.num("amount", "Amount", 0.18, { min: -1, max: 1, step: 0.01 }),
    ],
    inputs: [{ id: "mesh", label: "Mesh", kind: "mesh" }],
    outputs: [{ id: "mesh", label: "Lattice", kind: "mesh" }],
  },
  {
    type: "Symmetry_Mirror",
    title: "Symmetry Mirror",
    category: "spatial",
    icon: "FlipHorizontal2",
    summary: "Mirrors across the part centerline.",
    detail: "Weld threshold in mm. Run after unilateral sculpt, before hollow.",
    params: [
      t.sel("axis", "Axis", "x", [
        { value: "x", label: "X (centerline)" },
        { value: "y", label: "Y" },
        { value: "z", label: "Z" },
      ]),
      t.num("weld", "Weld", 0.4, { min: 0, max: 4, step: 0.05, unit: "mm" }),
    ],
    inputs: [{ id: "mesh", label: "Mesh", kind: "mesh" }],
    outputs: [{ id: "mesh", label: "Mirrored", kind: "mesh" }],
  },
  {
    type: "Bevel_Chamfer",
    title: "Bevel / Chamfer",
    category: "spatial",
    icon: "Pentagon",
    summary: "Edge treatment on hard body lines.",
    detail: "Width is world-mm. Segments > 1 turn a chamfer into a bevel.",
    params: [
      t.num("width", "Width", 2.4, { min: 0.1, max: 20, step: 0.1, unit: "mm" }),
      t.num("segments", "Segments", 2, { min: 1, max: 8, step: 1 }),
    ],
    inputs: [{ id: "mesh", label: "Mesh", kind: "mesh" }],
    outputs: [{ id: "mesh", label: "Bevel", kind: "mesh" }],
  },
  {
    type: "Voxel_Voxelizer",
    title: "Voxelizer",
    category: "spatial",
    icon: "Cuboid",
    summary: "Discretizes the volume for solid ops.",
    detail: "Cell size in mm. Smaller cells explode memory — stay ≥ 4 mm for a full housing.",
    params: [
      t.num("cell", "Cell", 8, { min: 2, max: 40, unit: "mm" }),
      t.tog("fill", "Solid fill", true),
    ],
    inputs: [{ id: "mesh", label: "Mesh", kind: "mesh" }],
    outputs: [{ id: "mesh", label: "Voxels", kind: "mesh" }],
  },
  {
    type: "Boolean_Union",
    title: "Boolean Union",
    category: "spatial",
    icon: "Combine",
    summary: "Merges two mesh streams.",
    detail: "Weld add-ons onto the primary solid.",
    params: [
      t.sel("solver", "Solver", "exact", [
        { value: "exact", label: "Exact" },
        { value: "fast", label: "Fast" },
      ]),
    ],
    inputs: [
      { id: "a", label: "A", kind: "mesh" },
      { id: "b", label: "B", kind: "mesh" },
    ],
    outputs: [{ id: "mesh", label: "Union", kind: "mesh" }],
  },
  {
    type: "Shader_PBR",
    title: "PBR Shader",
    category: "material",
    icon: "Blend",
    summary: "Base metallic / roughness stack.",
    detail: "Neutral alloy default. Metal is a mix, not a binary.",
    params: [
      t.text("hex", "Color", "#c8c4bc"),
      t.num("metal", "Metal", 0.22, { min: 0, max: 1, step: 0.01 }),
      t.num("rough", "Roughness", 0.42, { min: 0, max: 1, step: 0.01 }),
    ],
    inputs: [{ id: "mesh", label: "Mesh", kind: "mesh" }],
    outputs: [
      { id: "mat", label: "Material", kind: "material" },
      { id: "mesh", label: "Mesh", kind: "mesh" },
    ],
  },
  {
    type: "Paint_Decal",
    title: "Paint Decal",
    category: "material",
    icon: "Paintbrush",
    summary: "Projects a named decal onto the mesh.",
    detail: "Badge, stamp, or inspection mark. Opacity is linear.",
    params: [
      t.text("decal", "Decal", "part-stamp"),
      t.num("opacity", "Opacity", 0.9, { min: 0, max: 1, step: 0.01 }),
    ],
    inputs: [
      { id: "mesh", label: "Mesh", kind: "mesh" },
      { id: "image", label: "Art", kind: "image" },
    ],
    outputs: [
      { id: "mat", label: "Material", kind: "material" },
      { id: "mesh", label: "Mesh", kind: "mesh" },
    ],
  },
  {
    type: "Weather_Patina",
    title: "Weather Patina",
    category: "material",
    icon: "CloudRain",
    summary: "Age, dust, and edge wear.",
    detail: "Shop-floor default. Higher values read as neglected, not styled.",
    params: [
      t.num("age", "Age", 0.16, { min: 0, max: 1, step: 0.01 }),
      t.num("dust", "Dust", 0.1, { min: 0, max: 1, step: 0.01 }),
    ],
    inputs: [{ id: "mat", label: "Material", kind: "material" }],
    outputs: [{ id: "mat", label: "Weathered", kind: "material" }],
  },
  {
    type: "Measure_Caliper",
    title: "Caliper",
    category: "analysis",
    icon: "Ruler",
    summary: "Records overall dimensions.",
    detail: "Writes length / height / width into the scene measures block.",
    params: [
      t.sel("axis", "Primary axis", "x", [
        { value: "x", label: "Width (X)" },
        { value: "y", label: "Height (Y)" },
        { value: "z", label: "Depth (Z)" },
      ]),
    ],
    inputs: [{ id: "mesh", label: "Mesh", kind: "mesh" }],
    outputs: [{ id: "out", label: "Measure", kind: "measure" }],
  },
  {
    type: "Collision_Probe",
    title: "Collision Probe",
    category: "analysis",
    icon: "Crosshair",
    summary: "Counts self-intersections and tight gaps.",
    detail: "Used by QC. Sample count trades speed for recall.",
    params: [t.num("samples", "Samples", 400, { min: 40, max: 4000, step: 20 })],
    inputs: [{ id: "mesh", label: "Mesh", kind: "mesh" }],
    outputs: [{ id: "out", label: "Probe", kind: "measure" }],
  },
  {
    type: "Mass_Estimator",
    title: "Mass Estimator",
    category: "analysis",
    icon: "Scale",
    summary: "Estimates mass from volume and alloy.",
    detail: "Steel / aluminum mix. Hollowed meshes drop mass roughly with cavity ratio.",
    params: [
      t.sel("alloy", "Alloy", "aluminum", [
        { value: "aluminum", label: "Aluminum" },
        { value: "steel_al", label: "Steel + aluminum" },
        { value: "steel", label: "Mild steel" },
      ]),
    ],
    inputs: [
      { id: "mesh", label: "Mesh", kind: "mesh" },
      { id: "spec", label: "Spec", kind: "spec" },
    ],
    outputs: [{ id: "out", label: "Mass", kind: "measure" }],
  },
  {
    type: "Blender_Operator",
    title: "Blender Operator",
    category: "execution",
    icon: "Cpu",
    summary: "Compiles the DAG into a BPY script + scene IR.",
    detail:
      "Emits a ready-to-run BPY script and the viewport IR. Pair with Blender Bridge to push the job to a live operator.",
    params: [
      t.sel("target", "Target", "4.2", [
        { value: "4.2", label: "Blender 4.2" },
        { value: "4.1", label: "Blender 4.1" },
        { value: "3.6", label: "Blender 3.6 LTS" },
      ]),
      t.tog("applyMods", "Apply modifiers", true),
    ],
    inputs: [
      { id: "mesh", label: "Mesh", kind: "mesh" },
      { id: "morph", label: "Morph", kind: "morph" },
      { id: "mat", label: "Material", kind: "material" },
      { id: "gate", label: "Gate", kind: "exec" },
    ],
    outputs: [{ id: "out", label: "Job", kind: "exec" }],
  },
  {
    type: "Blender_Bridge",
    title: "Blender Bridge",
    category: "execution",
    icon: "Cable",
    summary: "Pushes the compiled BPY job to a connected Blender operator.",
    detail:
      "The deck never runs bpy.app. This node queues the operator script on the bridge. Install the add-on in local Blender, paste host + token, and jobs pull automatically. Dry-run validates the script here if no operator is online.",
    params: [
      t.tog("autoPush", "Auto-push on execute", true),
      t.tog("dryIfOffline", "Dry-run if offline", true),
    ],
    inputs: [{ id: "job", label: "Job", kind: "exec" }],
    outputs: [{ id: "out", label: "Receipt", kind: "exec" }],
  },
  {
    type: "VRAM_Mount",
    title: "VRAM Mount",
    category: "execution",
    icon: "MemoryStick",
    summary: "Reserves a live WebGPU heap in this browser.",
    detail:
      "Mounts the local GPU via navigator.gpu. Scratch size is reserved in VRAM. The viewport then simulates the orb field on-device. No server GPU — this is your machine.",
    params: [
      t.num("heapMb", "Scratch", 4, { min: 1, max: 64, step: 1, unit: "MB" }),
      t.sel("resident", "Resident", "both", [
        { value: "both", label: "Orbs + volume" },
        { value: "orbs", label: "Orbs only" },
        { value: "volume", label: "Volume only" },
      ]),
    ],
    inputs: [{ id: "job", label: "Job", kind: "exec" }],
    outputs: [{ id: "out", label: "Heap", kind: "exec" }],
  },
  {
    type: "Export_GLB",
    title: "Export GLB",
    category: "execution",
    icon: "Download",
    summary: "Packages the IR as a glTF 2.0 intent.",
    detail: "Writes an export hint. Binary GLB is produced by the local Blender side, not the deck.",
    params: [
      t.text("filename", "Filename", "clip-a.glb"),
      t.tog("draco", "Draco compress", true),
    ],
    inputs: [{ id: "job", label: "Job", kind: "exec" }],
    outputs: [{ id: "out", label: "Asset", kind: "exec" }],
  },
  {
    type: "Snapshot_Render",
    title: "Snapshot Render",
    category: "execution",
    icon: "Aperture",
    summary: "Orthographic plate of the compiled scene.",
    detail: "Drives the on-deck viewport camera, not an offline renderer.",
    params: [
      t.sel("camera", "Camera", "front", [
        { value: "front", label: "Front ortho" },
        { value: "three_quarter", label: "3/4" },
        { value: "top", label: "Top" },
      ]),
    ],
    inputs: [{ id: "job", label: "Job", kind: "exec" }],
    outputs: [{ id: "out", label: "Frame", kind: "image" }],
  },
];

export const CATALOG_BY_TYPE: Record<string, NodeTypeDef> = Object.fromEntries(
  CATALOG.map((n) => [n.type, n]),
);

export const CATEGORY_LABEL: Record<NodeCategory, string> = {
  input: "Input",
  agent: "Agents",
  spatial: "Spatial",
  material: "Surface",
  analysis: "Analysis",
  execution: "Execution",
};

export function defaultParams(type: string): Record<string, string | number | boolean> {
  const def = CATALOG_BY_TYPE[type];
  const out: Record<string, string | number | boolean> = {};
  if (!def) return out;
  for (const p of def.params) out[p.key] = p.default;
  return out;
}

export function portsCompatible(a: string, b: string): boolean {
  if (a === "any" || b === "any") return true;
  return a === b;
}
