import * as T from "three";
import { box, cyl, mesh, mat, ring, ball } from "./kit";
import { Physics } from "../physics/world";
import { hash } from "../simulation/terrain";

// Original procedural materials and motifs. Geometric textile designs below are
// authored for AMAN, not transcriptions of sacred symbols or a universal alphabet.
const surfaces = new Map<string, T.MeshStandardMaterial>();
export function surface(
  color: string,
  kind: "earth" | "stone" | "weave" = "earth",
) {
  const key = color + kind;
  if (surfaces.has(key)) return surfaces.get(key)!;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3400; i++) {
    ctx.globalAlpha = 0.06 + hash(i, 7) * 0.13;
    ctx.fillStyle = i % 2 ? "#fff4da" : "#35291d";
    ctx.fillRect(
      hash(i, 1) * 256,
      hash(i, 2) * 256,
      kind === "weave" ? 1 : 2,
      kind === "weave" ? 12 : 2,
    );
  }
  ctx.globalAlpha = 0.28;
  if (kind === "stone") {
    ctx.strokeStyle = "#443b2d";
    ctx.lineWidth = 3;
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
      for (let x = y % 64 ? 0 : -32; x < 256; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 4, y + 32);
        ctx.stroke();
      }
    }
  }
  if (kind === "earth")
    for (let y = 28; y < 256; y += 56) {
      ctx.fillStyle = "#82664d";
      ctx.fillRect(0, y, 256, 2);
    }
  if (kind === "weave") {
    ctx.globalAlpha = 0.9;
    for (let y = 10; y < 256; y += 32) {
      ctx.fillStyle = y % 64 ? "#dfc59c" : "#514335";
      ctx.fillRect(0, y, 256, 5);
      for (let x = 12; x < 256; x += 32) {
        ctx.save();
        ctx.translate(x, y + 16);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = "#e4c9a2";
        ctx.lineWidth = 2;
        ctx.strokeRect(-6, -6, 12, 12);
        ctx.restore();
      }
    }
  }
  const map = new T.CanvasTexture(c);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.anisotropy = 4;
  const m = new T.MeshStandardMaterial({
    color: "#ffffff",
    map,
    roughness: kind === "weave" ? 1 : 0.96,
  });
  surfaces.set(key, m);
  return m;
}
export function slab(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: string,
  kind: "earth" | "stone" | "weave" = "earth",
) {
  return mesh(p, new T.BoxGeometry(w, h, d), surface(color, kind), [x, y, z]);
}
export function rug(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  color = "#854b3b",
) {
  slab(p, x, y, z, w, 0.035, d, color, "weave");
  for (let i = 0; i < 18; i++)
    for (const side of [-1, 1])
      box(
        p,
        x - w / 2 + (i * w) / 18,
        y,
        z + side * (d / 2 + 0.08),
        0.025,
        0.018,
        0.18,
        "#dfccaa",
      );
}
export function pottery(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  s = 1,
  color = "#b87952",
) {
  const points = [
    [0.12, 0],
    [0.25, 0.08],
    [0.3, 0.3],
    [0.25, 0.53],
    [0.12, 0.65],
    [0.11, 0.77],
    [0.15, 0.81],
  ].map(([r, h]) => new T.Vector2(r * s, h * s));
  const m = mesh(p, new T.LatheGeometry(points, 16), surface(color), [x, y, z]);
  ring(p, x, y + 0.79 * s, z, 0.14 * s, 0.018 * s, "#d6b58d").rotation.x =
    Math.PI / 2;
  return m;
}
export function silverClasp(p: T.Object3D, x = 0, y = 0, z = 0, s = 1) {
  const g = new T.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  p.add(g);
  const shape = new T.Shape();
  shape.moveTo(-0.25, -0.2);
  shape.lineTo(0.25, -0.2);
  shape.lineTo(0, 0.24);
  shape.closePath();
  mesh(
    g,
    new T.ExtrudeGeometry(shape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelSize: 0.018,
      bevelThickness: 0.012,
      bevelSegments: 2,
      steps: 1,
    }),
    mat("#cbd0c7", 0.82),
  );
  ring(g, 0, 0.35, 0, 0.13, 0.025, "#cbd0c7");
  for (const xx of [-0.13, 0, 0.13]) ball(g, xx, -0.1, 0.07, 0.035, "#b5c4b8");
  box(g, 0, 0.15, 0.06, 0.018, 0.4, 0.018, "#edf1dc");
  return g;
}
export function cedar(p: T.Object3D, x: number, y: number, z: number, s = 1) {
  const g = new T.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  p.add(g);
  cyl(g, 0, 3.3, 0, 0.23, 6.6, "#73614a", 0.43, 9);
  for (let k = 0; k < 5; k++) {
    const h = 3 + k * 0.85,
      r = 2.5 - k * 0.33;
    for (let j = 0; j < 3; j++) {
      const a = j * 2.09 + k * 1.3;
      const b = cyl(
        g,
        Math.cos(a) * r * 0.3,
        h,
        Math.sin(a) * r * 0.3,
        0.07,
        r,
        "#796649",
        0.12,
        5,
      );
      b.rotation.z = 1.1;
      b.rotation.y = a;
      const c = mesh(
        g,
        new T.SphereGeometry(1, 9, 5),
        mat(["#355747", "#426a52", "#57765b"][j]),
        [Math.cos(a) * r * 0.42, h + 0.2, Math.sin(a) * r * 0.42],
      );
      c.scale.set(r, 0.42, r * 0.77);
    }
  }
  return g;
}
export function palm(p: T.Object3D, x: number, y: number, z: number, s = 1) {
  const g = new T.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  p.add(g);
  const trunk = cyl(g, 0.2, 2.8, 0, 0.16, 5.6, "#a48559", 0.32, 9);
  trunk.rotation.z = -0.06;
  for (let k = 0; k < 12; k++)
    ring(
      g,
      0.2,
      k * 0.46 + 0.2,
      0,
      0.18 + k * 0.007,
      0.027,
      "#876b4d",
    ).rotation.x = Math.PI / 2;
  for (let j = 0; j < 9; j++) {
    const a = (j * Math.PI * 2) / 9,
      verts: number[] = [],
      indices: number[] = [];
    for (let k = 0; k < 7; k++) {
      const r = k * 0.53,
        h = 5.7 + Math.sin((k / 6) * Math.PI) * 0.7 - k * 0.1,
        w = Math.sin(((k + 1) / 8) * Math.PI) * 0.3;
      for (const side of [-1, 1])
        verts.push(
          0.3 + Math.cos(a) * r - Math.sin(a) * w * side,
          h,
          Math.sin(a) * r + Math.cos(a) * w * side,
        );
      if (k < 6) {
        const i = k * 2;
        indices.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const m = mat(j % 2 ? "#567451" : "#6c8951").clone();
    m.side = T.DoubleSide;
    mesh(g, geo, m);
  }
  for (let i = 0; i < 3; i++) {
    const b = ball(
      g,
      0.3 + Math.sin(i * 2) * 0.4,
      5.1,
      Math.cos(i * 2) * 0.4,
      0.23,
      "#a7793f",
    );
    b.scale.y = 1.5;
  }
  return g;
}
export function dwelling(
  p: T.Object3D,
  physics: Physics | undefined,
  x: number,
  y: number,
  z: number,
  w = 6,
  d = 5,
  h = 5,
  oasis = false,
  rotation = 0,
) {
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotation;
  p.add(g);
  const color = oasis ? "#b77856" : "#b3a083",
    kind = oasis ? "earth" : "stone";
  slab(g, 0, h / 2, 0, w, h, d, color, kind);
  slab(
    g,
    0,
    0.35,
    0,
    w + 0.3,
    0.7,
    d + 0.3,
    oasis ? "#8d6147" : "#8b816c",
    "stone",
  );
  slab(g, 0, h, 0, w + 0.4, 0.22, d + 0.4, oasis ? "#cc9468" : "#c8b99d");
  // Flat roof, parapet and timber drainage beams suit this fictional region's
  // climate. No medieval European pitched roofs or decorative minarets.
  for (const xx of [-1, 1])
    slab(g, (xx * w) / 2, h + 0.4, 0, 0.22, 0.8, d, color, kind);
  for (const zz of [-1, 1])
    slab(g, 0, h + 0.4, (zz * d) / 2, w, 0.8, 0.22, color, kind);
  for (let i = 0; i < 5; i++)
    box(
      g,
      -w * 0.4 + i * w * 0.2,
      h - 0.2,
      d / 2 + 0.21,
      0.13,
      0.13,
      0.65,
      "#68543c",
    );
  box(g, 0, 1.25, d / 2 + 0.035, 1.3, 2.5, 0.06, "#433b2b");
  for (let i = 0; i < 6; i++)
    box(g, -0.55 + i * 0.22, 1.2, d / 2 + 0.08, 0.18, 2.35, 0.045, "#806044");
  box(g, 0, 2.6, d / 2 + 0.16, 1.7, 0.24, 0.33, "#70593d");
  ring(g, 0.4, 1.3, d / 2 + 0.15, 0.065, 0.015, "#b8ac8e");
  for (let f = 0; f < Math.max(1, Math.floor(h / 2.3)); f++)
    for (const side of [-1, 1]) {
      const xx = side * w * 0.31,
        yy = 1.55 + f * 2.25;
      box(g, xx, yy, d / 2 + 0.025, 0.62, 0.85, 0.05, "#3c3b30");
      box(g, xx, yy + 0.52, d / 2 + 0.16, 0.94, 0.15, 0.35, "#7b6043");
      for (const dx of [-0.2, 0, 0.2])
        box(g, xx + dx, yy, d / 2 + 0.1, 0.025, 0.85, 0.07, "#b99c72");
    }
  for (let i = 0; i < 3; i++)
    pottery(
      g,
      -w * 0.35 + i * 0.5,
      0,
      d / 2 + 0.7,
      0.85,
      i % 2 ? "#bc8b62" : "#996045",
    );
  if (oasis) {
    for (const side of [-1, 1])
      for (let i = 0; i < 4; i++)
        slab(
          g,
          side * w * 0.39,
          h + 0.6 + i * 0.16,
          side * d * 0.39,
          0.9 - i * 0.12,
          0.2,
          0.9 - i * 0.12,
          "#b47c57",
        );
  } else rug(g, 0, h + 0.14, 0, w * 0.6, d * 0.55, "#9b6150");
  if (physics) physics.box(x, y + h / 2, z, w / 2, h / 2, d / 2, rotation);
  return g;
}
export function channel(
  p: T.Object3D,
  a: T.Vector3,
  b: T.Vector3,
  width = 0.65,
) {
  const g = new T.Group(),
    delta = b.clone().sub(a),
    len = delta.length();
  g.position.copy(a);
  g.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), delta.normalize());
  p.add(g);
  slab(g, 0, -0.08, len / 2, width + 0.28, 0.18, len, "#8c8870", "stone");
  for (const side of [-1, 1])
    slab(
      g,
      side * (width / 2 + 0.1),
      0.08,
      len / 2,
      0.18,
      0.3,
      len,
      "#b6ad8c",
      "stone",
    );
  const water = mesh(
    g,
    new T.BoxGeometry(width, 0.025, len),
    new T.MeshPhysicalMaterial({
      color: "#5ba6a0",
      metalness: 0.1,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1,
    }),
    [0, 0.07, len / 2],
  );
  return { group: g, water };
}
export function awning(
  p: T.Object3D,
  x: number,
  y: number,
  z: number,
  w = 4,
  d = 3,
  color = "#88523f",
) {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  for (const xx of [-w / 2, w / 2])
    for (const zz of [-d / 2, d / 2])
      cyl(g, xx, y > 2 ? -y / 2 : -1, zz, 0.045, y, "#786047");
  const cloth = slab(g, 0, 0, 0, w, 0.035, d, color, "weave");
  cloth.rotation.x = 0.06;
  return g;
}
