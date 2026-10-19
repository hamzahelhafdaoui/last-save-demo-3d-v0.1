import * as T from "three";
import { random } from "../simulation/terrain";
const cache = new Map<string, T.MeshStandardMaterial>();
let softParticle: T.CanvasTexture | null = null;
export function particleTexture() {
  if (softParticle) return softParticle;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!,
    gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(255,255,255,.8)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return (softParticle = new T.CanvasTexture(c));
}
export function mat(color: string, metal = 0, emission = 0) {
  const key = color + metal + emission;
  if (!cache.has(key))
    cache.set(
      key,
      new T.MeshStandardMaterial({
        color,
        roughness: metal ? 0.34 : 0.84,
        metalness: metal,
        emissive: color,
        emissiveIntensity: emission,
      }),
    );
  return cache.get(key)!;
}
export function mesh(
  parent: T.Object3D,
  g: T.BufferGeometry,
  m: T.Material,
  p: [number, number, number] = [0, 0, 0],
) {
  const o = new T.Mesh(g, m);
  o.position.set(...p);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
export function box(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  c: string,
) {
  return mesh(p, new T.BoxGeometry(w, h, d), mat(c), [x, y, z]);
}
export function ball(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  r: number,
  c: string,
) {
  return mesh(p, new T.SphereGeometry(r, 16, 10), mat(c), [x, y, z]);
}
export function cyl(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  c: string,
  r2 = r,
  segments = 20,
) {
  return mesh(p, new T.CylinderGeometry(r, r2, h, segments), mat(c), [x, y, z]);
}
export function ring(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  r: number,
  t: number,
  c: string,
) {
  const o = mesh(p, new T.TorusGeometry(r, t, 8, 48), mat(c, 0.5, 0.25), [
    x,
    y,
    z,
  ]);
  return o;
}
export function text(
  p: T.Object3D,
  label: string,
  x: number,
  y: number,
  z: number,
  width: number,
  color = "#f1dba9",
  bg = "transparent",
) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  if (bg !== "transparent") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 256);
  }
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "500 68px Georgia";
  ctx.fillText(label, 512, 130, 990);
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  const o = mesh(
    p,
    new T.PlaneGeometry(width, width / 4),
    new T.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: T.DoubleSide,
      depthWrite: false,
    }),
    [x, y, z],
  );
  o.castShadow = false;
  return o;
}
export function lantern(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  color = "#ffd38c",
) {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  cyl(g, 0, 0, 0, 0.17, 0.47, "#4e3d36");
  mesh(g, new T.CylinderGeometry(0.12, 0.12, 0.35, 8), mat(color, 0, 2));
  cyl(g, 0, 0.27, 0, 0.23, 0.1, "#79604a");
  cyl(g, 0, -0.26, 0, 0.21, 0.1, "#79604a");
  ring(g, 0, 0.4, 0, 0.09, 0.025, "#79604a");
  return g;
}
export function portal(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  color: string,
  label: string,
) {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  const outer = ring(g, 0, 2.2, 0, 1.95, 0.16, "#a9a285");
  for (const side of [-1, 1]) {
    box(g, side * 2.05, 2.1, 0, 0.26, 4.2, 0.4, "#897052");
    for (let i = 0; i < 6; i++)
      box(
        g,
        side * 2.05,
        0.4 + i * 0.65,
        0.23,
        0.3,
        0.12,
        0.04,
        i % 2 ? "#c9b584" : "#698675",
      );
  }
  box(g, 0, 4.45, 0, 4.7, 0.25, 0.55, "#bda77d");
  outer.scale.y = 1.18;
  const inner = ring(g, 0, 2.2, 0.02, 1.73, 0.045, color);
  inner.scale.y = 1.18;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = ball(
      g,
      Math.sin(a) * 1.96,
      2.2 + Math.cos(a) * 2.3,
      0.2,
      0.07,
      color,
    );
    (r.material as T.MeshStandardMaterial).emissiveIntensity = 2;
  }
  const material = new T.ShaderMaterial({
    transparent: true,
    side: T.DoubleSide,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      color: { value: new T.Color(color) },
      strength: { value: 1 },
    },
    vertexShader:
      "varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec2 v;uniform float time;uniform vec3 color;uniform float strength;void main(){vec2 q=(v-.5)*2.;float r=length(q);float a=atan(q.y,q.x);float swirl=sin(a*5.+r*18.-time*1.8)*.5+.5;float edge=1.-smoothstep(.78,1.,r);gl_FragColor=vec4(color*(.35+swirl*.7)+(1.-r)*.15,edge*(.65+.23*swirl)*strength);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
  });
  const film = mesh(g, new T.CircleGeometry(1.69, 64), material, [0, 2.2, 0]);
  film.scale.y = 1.18;
  film.castShadow = false;
  box(g, 0, 0, 0, 4.8, 0.2, 2, "#6c6575");
  text(g, label, 0, 5.05, 0, 4);
  g.userData.portal = material;
  return g;
}
export class Motes {
  object: T.Points;
  orig: Float32Array;
  constructor(
    parent: T.Object3D,
    count: number,
    span: number,
    color: string,
    seed = 12,
  ) {
    const rand = random(seed),
      v = [];
    for (let i = 0; i < count; i++)
      v.push((rand() - 0.5) * span, rand() * 8, (rand() - 0.5) * span);
    this.orig = new Float32Array(v);
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
    this.object = new T.Points(
      g,
      new T.PointsMaterial({
        map: particleTexture(),
        color,
        size: 0.075,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    parent.add(this.object);
  }
  update(t: number) {
    const a = this.object.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      a.setY(i, this.orig[i * 3 + 1] + Math.sin(t * 0.65 + i) * 0.3);
      a.setX(i, this.orig[i * 3] + Math.sin(t * 0.3 + i * 0.7) * 0.25);
    }
    a.needsUpdate = true;
  }
}
export function makeSword() {
  const g = new T.Group();
  g.name = "The Dawnblade";
  const shape = new T.Shape();
  shape.moveTo(0, -1.55);
  shape.lineTo(-0.15, -1.22);
  shape.lineTo(-0.125, -0.12);
  shape.lineTo(-0.21, 0.03);
  shape.lineTo(0.21, 0.03);
  shape.lineTo(0.125, -0.12);
  shape.lineTo(0.15, -1.22);
  shape.closePath();
  const blade = new T.ExtrudeGeometry(shape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.018,
    bevelThickness: 0.018,
  });
  mesh(g, blade, mat("#d8edf0", 0.86));
  box(g, 0, -0.64, 0.085, 0.018, 1.14, 0.015, "#d9b96f");
  const guard = box(g, 0, 0.07, 0, 0.76, 0.1, 0.16, "#bfc6bc");
  guard.rotation.z = 0.04;
  for (const s of [-1, 1]) {
    const end = ball(g, s * 0.36, 0.08, 0, 0.1, "#d3d5c3");
    end.scale.set(1, 0.65, 0.75);
  }
  cyl(g, 0, 0.3, 0, 0.065, 0.42, "#73503d");
  for (let i = 0; i < 5; i++)
    ring(g, 0, 0.13 + i * 0.07, 0, 0.066, 0.012, "#c5a56b").rotation.x =
      Math.PI / 2;
  ball(g, 0, 0.57, 0, 0.105, "#bbc5b7");
  const crystal = mesh(
    g,
    new T.OctahedronGeometry(0.16),
    mat("#8be6dc", 0.5, 1.7),
    [0, 0.08, 0.1],
  );
  crystal.scale.set(0.65, 1.3, 0.6);
  for (let i = 0; i < 5; i++) {
    const rune = box(
      g,
      0,
      -0.25 - i * 0.19,
      0.092,
      0.046,
      0.045,
      0.008,
      "#9cebe1",
    );
    (rune.material as T.MeshStandardMaterial).emissiveIntensity = 1.7;
    rune.rotation.z = Math.PI / 4;
  }
  return g;
}
export function stone(p: T.Object3D, x: number, y: number, z: number, s = 1) {
  const o = mesh(p, new T.IcosahedronGeometry(1, 1), mat("#7c8699"), [x, y, z]);
  o.scale.set(s, s * 0.65, s * 0.9);
  o.rotation.set(0.1, x, 0);
  return o;
}
export function banner(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  c: string,
) {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  box(g, 0, 0, 0, 1.6, 0.075, 0.075, "#b49a69");
  const shape = new T.Shape();
  shape.moveTo(-0.65, 0);
  shape.lineTo(0.65, 0);
  shape.lineTo(0.65, -1.8);
  shape.lineTo(0, -2.2);
  shape.lineTo(-0.65, -1.8);
  shape.closePath();
  mesh(
    g,
    new T.ShapeGeometry(shape),
    new T.MeshStandardMaterial({ color: c, side: T.DoubleSide }),
    [0, 0, 0.02],
  );
  text(g, "✦", 0, -0.85, 0.04, 0.9);
  return g;
}
export function disposeScene(root: T.Object3D) {
  root.traverse((o) => {
    if (o instanceof T.Mesh || o instanceof T.Points) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (![...cache.values()].includes(m)) m.dispose();
      }
    }
  });
  root.clear();
}
