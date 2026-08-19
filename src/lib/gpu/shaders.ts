export const DRAW_WGSL = /* wgsl */ `
struct Uniforms {
  time: f32,
  morph: f32,
  hollow: f32,
  count: u32,
  extent: vec3f,
  jitter: f32,
  radius: f32,
  nx: u32,
  ny: u32,
  nz: u32,
  resolution: vec2f,
  pad: vec2f,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VsOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
  @location(1) shade: f32,
  @location(2) kind: f32,
};

fn orbit() -> mat4x4f {
  let a = u.time * 0.22;
  let eye = vec3f(cos(a) * 1.85, 1.05, sin(a) * 1.85);
  let up = vec3f(0.0, 1.0, 0.0);
  let z = normalize(eye);
  let x = normalize(cross(up, z));
  let y = cross(z, x);
  let view = mat4x4f(
    vec4f(x.x, y.x, z.x, 0.0),
    vec4f(x.y, y.y, z.y, 0.0),
    vec4f(x.z, y.z, z.z, 0.0),
    vec4f(-dot(x, eye), -dot(y, eye), -dot(z, eye), 1.0),
  );
  let aspect = max(u.resolution.x / max(u.resolution.y, 1.0), 0.2);
  let p = 1.15;
  let n = 0.08;
  let f = 14.0;
  let proj = mat4x4f(
    vec4f(p / aspect, 0.0, 0.0, 0.0),
    vec4f(0.0, p, 0.0, 0.0),
    vec4f(0.0, 0.0, f / (n - f), -1.0),
    vec4f(0.0, 0.0, (n * f) / (n - f), 0.0),
  );
  return proj * view;
}

@vertex
fn vs_orb(
  @location(0) inst: vec4f,
  @builtin(vertex_index) vid: u32,
) -> VsOut {
  var o: VsOut;
  let corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
  );
  let uv = corners[vid];
  let vp = orbit();
  let center = vp * vec4f(inst.xyz, 1.0);
  let px = max(inst.w, 0.03);
  let aspect = max(u.resolution.x / max(u.resolution.y, 1.0), 0.2);
  o.pos = center + vec4f(uv.x * px * center.w, uv.y * px * aspect * center.w, 0.0, 0.0);
  o.uv = uv;
  o.shade = 0.6 + 0.4 * clamp(inst.y * 1.4 + 0.5, 0.0, 1.0);
  o.kind = 1.0;
  return o;
}

@vertex
fn vs_box(@location(0) p: vec3f, @location(1) kind: f32) -> VsOut {
  var o: VsOut;
  o.pos = orbit() * vec4f(p, 1.0);
  o.uv = vec2f(0.0);
  o.shade = 1.0;
  o.kind = kind;
  return o;
}

@fragment
fn fs(i: VsOut) -> @location(0) vec4f {
  if (i.kind < 0.5) {
    return vec4f(0.78, 0.82, 0.86, 0.18);
  }
  if (i.kind > 1.5) {
    return vec4f(0.62, 0.70, 0.76, 0.85);
  }
  let d = length(i.uv);
  if (d > 1.0) { discard; }
  let rim = smoothstep(0.7, 1.0, d);
  let rgb = mix(vec3f(0.78, 0.80, 0.82) * i.shade, vec3f(0.95, 0.96, 0.97), rim);
  return vec4f(rgb, 1.0);
}
`;
