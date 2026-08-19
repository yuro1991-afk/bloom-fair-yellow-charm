export const PORT_KINDS = [
  "prompt",
  "spec",
  "image",
  "mesh",
  "matrix",
  "morph",
  "material",
  "measure",
  "agent",
  "exec",
  "any",
] as const;

export type PortKind = (typeof PORT_KINDS)[number];

export const NODE_CATEGORIES = [
  "input",
  "agent",
  "spatial",
  "material",
  "analysis",
  "execution",
] as const;

export type NodeCategory = (typeof NODE_CATEGORIES)[number];

export type ParamField =
  | {
      key: string;
      label: string;
      kind: "text";
      default: string;
      placeholder?: string;
    }
  | {
      key: string;
      label: string;
      kind: "textarea";
      default: string;
      placeholder?: string;
    }
  | {
      key: string;
      label: string;
      kind: "number";
      default: number;
      min?: number;
      max?: number;
      step?: number;
      unit?: string;
    }
  | {
      key: string;
      label: string;
      kind: "select";
      default: string;
      options: { value: string; label: string }[];
    }
  | { key: string; label: string; kind: "toggle"; default: boolean };

export type PortDef = {
  id: string;
  label: string;
  kind: PortKind;
};

export type NodeTypeDef = {
  type: string;
  title: string;
  category: NodeCategory;
  summary: string;
  detail: string;
  icon: string;
  params: ParamField[];
  inputs: PortDef[];
  outputs: PortDef[];
};

export type GraphNode = {
  id: string;
  type: string;
  x: number;
  y: number;
  params: Record<string, string | number | boolean>;
};

export type GraphEdge = {
  id: string;
  from: string;
  fromPort: string;
  to: string;
  toPort: string;
};

export type GraphDoc = {
  version: 1;
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type CompileIssue = {
  level: "error" | "warn";
  nodeId?: string;
  edgeId?: string;
  code: string;
  message: string;
};

export type CompileResult = {
  ok: boolean;
  hash: string;
  order: string[];
  levels: string[][];
  issues: CompileIssue[];
  ms: number;
};

export type NodeRun = {
  nodeId: string;
  type: string;
  status: "ok" | "skip" | "error";
  ms: number;
  output: Record<string, unknown>;
  log?: string;
};

export type SceneSpec = {
  target: string;
  clip: {
    family: string;
    part: string;
    rev: string;
    widthMm: number;
    heightMm: number;
    depthMm: number;
    morph: number;
    hollow: number;
    bevel: number;
    voxel: number;
    retopo: number;
    lattice: number;
    symmetry: boolean;
    union: boolean;
    shell: number;
  };
  orbs: {
    nx: number;
    ny: number;
    nz: number;
    radius: number;
    jitter: number;
    strength: number;
  };
  material: {
    metal: number;
    roughness: number;
    patina: number;
    hex: string;
  };
  measures: {
    lengthMm: number;
    massKg: number;
    collisions: number;
    clearanceMm: number;
  };
  bpy: string;
  notes: string[];
  exportHint: string;
};

export type ExecuteResult = {
  ok: boolean;
  compile: CompileResult;
  runs: NodeRun[];
  scene: SceneSpec;
  logs: string[];
  ms: number;
  agents: boolean;
};

export type SavedGraph = {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
};
