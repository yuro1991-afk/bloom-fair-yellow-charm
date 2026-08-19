import { defaultParams } from "./catalog";
import type { GraphDoc } from "./types";

export const DEMO_NAME = "Hollow lattice — starter";

export function demoGraph(): GraphDoc {
  const p = (type: string, extra: Record<string, string | number | boolean> = {}) => ({
    ...defaultParams(type),
    ...extra,
  });
  return {
    version: 1,
    name: DEMO_NAME,
    nodes: [
      {
        id: "n_prompt",
        type: "In_PromptBox",
        x: 40,
        y: 40,
        params: p("In_PromptBox"),
      },
      {
        id: "n_spec",
        type: "In_SpecSheet",
        x: 40,
        y: 240,
        params: p("In_SpecSheet"),
      },
      {
        id: "n_router",
        type: "Router_Agent",
        x: 300,
        y: 40,
        params: p("Router_Agent"),
      },
      {
        id: "n_matrix",
        type: "Matrix_Spawner",
        x: 300,
        y: 240,
        params: p("Matrix_Spawner"),
      },
      {
        id: "n_morph",
        type: "Orb_Morpher",
        x: 560,
        y: 160,
        params: p("Orb_Morpher"),
      },
      {
        id: "n_mirror",
        type: "Symmetry_Mirror",
        x: 560,
        y: 380,
        params: p("Symmetry_Mirror"),
      },
      {
        id: "n_hollow",
        type: "Interior_Hollower",
        x: 820,
        y: 160,
        params: p("Interior_Hollower"),
      },
      {
        id: "n_pbr",
        type: "Shader_PBR",
        x: 820,
        y: 380,
        params: p("Shader_PBR"),
      },
      {
        id: "n_caliper",
        type: "Measure_Caliper",
        x: 1080,
        y: 60,
        params: p("Measure_Caliper"),
      },
      {
        id: "n_op",
        type: "Blender_Operator",
        x: 1080,
        y: 240,
        params: p("Blender_Operator"),
      },
      {
        id: "n_vram",
        type: "VRAM_Mount",
        x: 1080,
        y: 420,
        params: p("VRAM_Mount"),
      },
      {
        id: "n_bridge",
        type: "Blender_Bridge",
        x: 1340,
        y: 240,
        params: p("Blender_Bridge"),
      },
    ],
    edges: [
      { id: "e1", from: "n_prompt", fromPort: "out", to: "n_router", toPort: "prompt" },
      { id: "e2", from: "n_spec", fromPort: "out", to: "n_router", toPort: "spec" },
      { id: "e3", from: "n_router", fromPort: "spatial", to: "n_matrix", toPort: "drive" },
      { id: "e4", from: "n_spec", fromPort: "out", to: "n_matrix", toPort: "spec" },
      { id: "e5", from: "n_matrix", fromPort: "out", to: "n_morph", toPort: "matrix" },
      { id: "e6", from: "n_morph", fromPort: "mesh", to: "n_mirror", toPort: "mesh" },
      { id: "e7", from: "n_mirror", fromPort: "mesh", to: "n_hollow", toPort: "mesh" },
      { id: "e8", from: "n_hollow", fromPort: "mesh", to: "n_pbr", toPort: "mesh" },
      { id: "e9", from: "n_hollow", fromPort: "mesh", to: "n_caliper", toPort: "mesh" },
      { id: "e10", from: "n_morph", fromPort: "morph", to: "n_op", toPort: "morph" },
      { id: "e11", from: "n_pbr", fromPort: "mesh", to: "n_op", toPort: "mesh" },
      { id: "e12", from: "n_pbr", fromPort: "mat", to: "n_op", toPort: "mat" },
      { id: "e13", from: "n_op", fromPort: "out", to: "n_vram", toPort: "job" },
      { id: "e14", from: "n_op", fromPort: "out", to: "n_bridge", toPort: "job" },
    ],
  };
}
