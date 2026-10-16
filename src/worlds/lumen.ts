import * as T from "three";
import { Physics } from "../physics/world";
import { Environment } from "../render/environment";
import { ground } from "../simulation/terrain";
import {
  box,
  ball,
  cyl,
  ring,
  mesh,
  mat,
  text,
  lantern,
  portal,
  Motes,
  makeSword,
  banner,
  stone,
  disposeScene,
} from "../render/kit";
import {
  resident,
  animateResidents,
  crystal,
  updatePortals,
  type Resident,
} from "./common";
import type { World, Hotspot } from "./types";
export const STEPS: [number, number][] = [
  [-29, -31],
  [-33, -34],
  [-37, -37],
];
export const STEP_Y = ground(-29, -31) + 1.25;
export async function createWorld(): Promise<World> {
  const scene = new T.Scene(),
    physics = new Physics(),
    base = new Environment(scene, physics),
    hot: Hotspot[] = [];
  // Dense, lived-in Bellhaven: stalls, awnings, benches, baskets, ivy and banners.
  for (const [x, z, col] of [
    [-3, -28, "#9c5c73"],
    [12, -31, "#497f80"],
    [-5, -43, "#a38456"],
  ] as [number, number, string][]) {
    const y = ground(x, z),
      g = new T.Group();
    g.position.set(x, y, z);
    scene.add(g);
    box(g, 0, 0.8, 0, 3.3, 0.16, 1.5, "#a57d57");
    for (const xx of [-1.5, 1.5]) {
      box(g, xx, 1.6, 0.5, 0.12, 3.2, 0.12, "#685042");
      box(g, xx, 0.4, -0.5, 0.12, 0.8, 0.12, "#685042");
    }
    for (let i = 0; i < 8; i++) {
      const awning = box(g, -1.6 + i * 0.45, 2.9, 0, 0.46, 0.08, 2, col);
      awning.rotation.x = 0.15;
      if (i % 2 === 0)
        (awning.material as T.MeshStandardMaterial) = mat("#d7c4a3");
    }
    for (let i = 0; i < 14; i++)
      ball(
        g,
        -1.3 + (i % 7) * 0.4,
        1.02,
        Math.floor(i / 7) * 0.4 - 0.3,
        0.16,
        i % 2 ? "#cf9871" : "#94ac60",
      );
    physics.box(x, y + 0.5, z, 1.7, 0.5, 0.8);
    banner(scene, x, y + 3.6, z + 0.6, col);
  }
  for (const [x, z] of [
    [-9, -26],
    [7, -34],
    [-10, -39],
    [4, -46],
    [17, -29],
  ]) {
    const y = ground(x, z);
    lantern(scene, x, y + 2.8, z);
    cyl(scene, x, y + 1.3, z, 0.06, 2.6, "#635344");
  }
  for (const [x, z] of [
    [-7, -31],
    [9, -38],
    [-11, -44],
  ]) {
    const y = ground(x, z);
    for (let i = 0; i < 16; i++) {
      const leaf = ball(
        scene,
        x + 2.7 + Math.sin(i * 0.7) * 0.4,
        y + 0.5 + i * 0.2,
        z + 0.7,
        0.16,
        "#587b57",
      );
      leaf.scale.y = 0.7;
    }
  }
  for (const [x, z] of [
    [-4, -36],
    [7, -30],
  ]) {
    const y = ground(x, z);
    box(scene, x, y + 0.45, z, 2.8, 0.16, 0.7, "#866b54");
    for (const xx of [-1.1, 1.1])
      box(scene, x + xx, y + 0.2, z, 0.12, 0.5, 0.5, "#665044");
  }
  const residents: Resident[] = await Promise.all([
    resident(scene, 4, ground(4, -27), -27, "#8876a1", 0),
    resident(scene, -3, ground(-3, -29), -29, "#e0c09b", 1),
    resident(scene, 11, ground(11, -33), -33, "#61566a", 2),
    resident(scene, -7, ground(-7, -41), -41, "#6d976e", 3),
    resident(scene, 2, ground(2, -34), -34, "#a16d62", 4, true),
    resident(scene, 13, ground(13, -43), -43, "#4d7b89", 5, true),
  ]);
  text(scene, "EDDA · BELLKEEPER", 4, ground(4, -27) + 2.35, -27, 3, "#e5d4a9");
  hot.push({
    id: "edda",
    position: new T.Vector3(4, ground(4, -27), -25.8),
    label: "Speak with Edda",
    radius: 3,
  });
  physics.cameraPanel(-1, ground(-1, 24), 24);
  physics.cameraPanel(8, ground(8, -25), -25);
  const home = portal(
    scene,
    -1,
    ground(-1, 24),
    24,
    "#dab581",
    "THE WAYFARER’S ROOM",
  );
  home.scale.setScalar(0.72);
  hot.push({
    id: "portal-home",
    position: new T.Vector3(-1, ground(-1, 24), 25),
    label: "Return to your room",
  });
  const city = portal(scene, 8, ground(8, -25), -25, "#d27adc", "VELVET CITY");
  city.scale.setScalar(0.75);
  hot.push({
    id: "portal-city",
    position: new T.Vector3(8, ground(8, -25), -23),
    label: "Step into Velvet City",
    visible: (s) => s.quest.sword,
  });
  // The living bramble grove: each flower is a physical, animated sculpture.
  const forest = new T.Group();
  forest.position.set(-25, ground(-25, 8), 8);
  scene.add(forest);
  const vines: T.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2,
      r = 2.4;
    const v = ring(
      forest,
      Math.sin(a) * r,
      1,
      Math.cos(a) * r,
      1.3,
      0.09,
      "#64526d",
    );
    v.rotation.set(i * 0.42, a, i * 0.3);
    vines.push(v);
    for (let j = 0; j < 3; j++) {
      const thorn = mesh(
        forest,
        new T.ConeGeometry(0.12, 0.45, 5),
        mat("#766180"),
        [Math.sin(a) * r, 1.4 + j * 0.23, Math.cos(a) * r],
      );
      thorn.rotation.z = 0.6;
    }
  }
  const creature = new T.Group();
  creature.position.y = 1.15;
  forest.add(creature);
  const orb = ball(creature, 0, 0, 0, 0.28, "#b6efca");
  (orb.material as T.MeshStandardMaterial).emissiveIntensity = 1.6;
  for (const s of [-1, 1]) {
    const w = mesh(
      creature,
      new T.SphereGeometry(0.22, 12, 8),
      mat("#bceee2", 0, 1),
      [s * 0.29, 0.04, 0],
    );
    w.scale.set(1.3, 0.18, 0.7);
    ball(creature, s * 0.09, 0.04, 0.26, 0.035, "#293b53");
  }
  const flowers: T.Group[] = [];
  for (const [i, p] of [
    [0, [-24, 12]],
    [1, [-29, 7]],
    [2, [-20, 5]],
  ] as [number, [number, number]][]) {
    const [x, z] = p,
      y = ground(x, z),
      g = new T.Group();
    g.position.set(x, y, z);
    scene.add(g);
    cyl(g, 0, 0.35, 0, 0.04, 0.7, "#668b67");
    for (let j = 0; j < 6; j++) {
      const a = (j / 6) * Math.PI * 2,
        petal = ball(
          g,
          Math.sin(a) * 0.3,
          0.78,
          Math.cos(a) * 0.3,
          0.22,
          "#c9b4e3",
        );
      petal.scale.set(0.9, 0.35, 1.6);
      petal.rotation.y = -a;
    }
    ball(g, 0, 0.82, 0, 0.14, "#edd9a2");
    flowers.push(g);
    hot.push({
      id: "flower-" + i,
      position: new T.Vector3(x, y, z),
      label: "Wake moonflower",
      radius: 2,
    });
  }
  const forestCrystal = crystal(scene, -25, ground(-25, 8) + 1.7, 8);
  hot.push({
    id: "forest-echo",
    position: new T.Vector3(-25, ground(-25, 8), 8),
    label: "Welcome the little light",
    visible: (s) =>
      s.quest.flowers.length === 3 && !s.quest.echoes.includes("forest"),
  });
  // The crossing is an optional-height platform route with physical gaps and forgiving recovery.
  const cy = ground(-24, -28);
  cyl(scene, -24, cy + 0.45, -28, 0.8, 0.8, "#8e8e95");
  const wheel = ring(scene, -24, cy + 1.2, -28, 0.7, 0.08, "#c2aa76");
  wheel.rotation.x = Math.PI / 2;
  hot.push({
    id: "mechanism",
    position: new T.Vector3(-24, cy, -26.5),
    label: "Turn the ancient crossing",
  });
  const padColliders: ReturnType<Physics["box"]>[] = [];
  const helpers: T.Group[] = [];
  const helperColliders: ReturnType<Physics["box"]>[] = [];
  const pads: T.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const [x, z] = STEPS[i],
      g = new T.Group();
    g.position.set(x, STEP_Y - 0.3, z);
    scene.add(g);
    cyl(g, 0, 0, 0, 1.35, 0.55, "#8e91a1", 1.1);
    ring(g, 0, 0.3, 0, 0.8, 0.035, "#ccae79").rotation.x = Math.PI / 2;
    text(g, ["I", "II", "III"][i], 0, 0.32, 0.02, 1.3).rotation.x =
      -Math.PI / 2;
    padColliders.push(physics.box(x, STEP_Y - 0.3, z, 1.05, 0.275, 1.05));
    pads.push(g);
  }
  for (let i = 0; i < 2; i++) {
    const a = new T.Vector3(STEPS[i][0], STEP_Y - 0.13, STEPS[i][1]),
      b = new T.Vector3(STEPS[i + 1][0], STEP_Y - 0.13, STEPS[i + 1][1]),
      mid = a.clone().lerp(b, 0.5),
      g = new T.Group();
    scene.add(g);
    g.position.copy(mid);
    g.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    box(g, 0, 0, 0, 1.5, 0.12, a.distanceTo(b), "#a28d78");
    helpers.push(g);
    helperColliders.push(
      physics.box(
        mid.x,
        mid.y,
        mid.z,
        0.75,
        0.06,
        a.distanceTo(b) / 2,
        g.rotation.y,
      ),
    );
  }
  // Ramped first platform makes the route approachable without hidden physics shortcuts.
  const h = ground(-26, -29),
    vertices = [-25, h, -28, -27, h, -28, -28, STEP_Y, -30, -30, STEP_Y, -30];
  physics.surface(vertices, [0, 2, 1, 1, 2, 3]);
  const ramp = new T.BufferGeometry();
  ramp.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  ramp.setIndex([0, 2, 1, 1, 2, 3]);
  ramp.computeVertexNormals();
  mesh(
    scene,
    ramp,
    new T.MeshStandardMaterial({ color: "#8c8f9b", side: T.DoubleSide }),
  );
  for (const [x, z] of STEPS) {
    const o = stone(scene, x, ground(x, z) - 0.3, z, 2);
    o.scale.y = 0.3;
  }
  const cross = crystal(scene, -40, ground(-40, -40) + 1.5, -40, "#e5c69a");
  hot.push({
    id: "crossing-echo",
    position: new T.Vector3(-40, ground(-40, -40), -40),
    label: "Take the echo of courage",
    visible: (s) => s.quest.mechanism && !s.quest.echoes.includes("crossing"),
  });
  // The archive is open to the sky; its objects tell one concise, ordered memory.
  const ax = 15,
    az = -48,
    ay = ground(ax, az);
  box(scene, ax, ay + 0.1, az, 11, 0.2, 9, "#9093a0");
  for (const dx of [-5, 5]) {
    box(scene, ax + dx, ay + 1.7, az, 0.65, 3.5, 8, "#aaa7ae");
    physics.box(ax + dx, ay + 1.7, az, 0.35, 1.8, 4);
    for (let k = 0; k < 3; k++)
      cyl(scene, ax + dx, ay + 3.6, az - 3 + k * 3, 0.7, 0.22, "#c8bdab");
  }
  text(scene, "THE MEMORY ARCHIVE", ax, ay + 4.8, az - 3.5, 7);
  const memory: T.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const x = ax - 3 + i * 3,
      y = ground(x, az);
    cyl(scene, x, y + 0.65, az, 0.7, 1.3, "#7f8494");
    const g = new T.Group();
    g.position.set(x, y + 1.4, az);
    scene.add(g);
    if (i === 0) lantern(g, 0, 0.3, 0);
    if (i === 1) {
      cyl(g, 0, 0.3, 0, 0.22, 0.4, "#c0a979", 0.4);
      ring(g, 0, 0.06, 0, 0.4, 0.03, "#e2c591").rotation.x = Math.PI / 2;
    }
    if (i === 2) {
      const b = box(g, 0, 0.12, 0, 0.7, 0.18, 0.8, "#5a7188");
      b.rotation.z = 0.15;
    }
    memory.push(g);
    text(scene, ["LIGHT", "CALL", "REMEMBER"][i], x, y + 2.5, az, 2);
    hot.push({
      id: "memory-" + i,
      position: new T.Vector3(x, y, az + 1.8),
      label: ["Light the road", "Call them home", "Remember their story"][i],
      radius: 2,
    });
  }
  const herb = new T.Group();
  herb.position.set(-16, ground(-16, 19), 19);
  scene.add(herb);
  for (let i = 0; i < 7; i++) {
    const leaf = ball(
      herb,
      Math.sin(i) * 0.4,
      0.45 + (i % 2) * 0.2,
      Math.cos(i) * 0.4,
      0.3,
      "#b1c7b5",
    );
    leaf.scale.set(0.25, 1, 0.6);
  }
  hot.push(
    {
      id: "herbs",
      position: new T.Vector3(-16, ground(-16, 19), 19),
      label: "Gather moonfern",
      visible: (s) =>
        s.experience === "quest" && s.sideQuest.accepted && !s.sideQuest.herbs,
    },
    {
      id: "healer",
      position: new T.Vector3(10, ground(10, -29), -29),
      label: "Speak with Mira",
      visible: (s) => s.experience === "quest",
    },
  );
  residents.push(await resident(scene, 10, ground(10, -30), -30, "#6d8a8a", 6));
  text(scene, "MIRA · HEALER", 10, ground(10, -30) + 2.4, -30, 3);
  // Crownstone: monumental marble, fractured capitals, golden inscriptions and suspended stone.
  const sx = 33,
    sz = -38,
    sy = ground(sx, sz);
  for (let i = 0; i < 3; i++) {
    cyl(scene, sx, sy + i * 0.11, sz, 6.3 - i * 0.3, 0.22, "#b2abb0");
    physics.tree(sx, sy - 0.1, sz, 6.3 - i * 0.3, 0.2 + i * 0.11);
  }
  const entry = [
      30.2,
      ground(33, -24) + 0.03,
      -24,
      35.8,
      ground(33, -24) + 0.03,
      -24,
      30.2,
      sy + 0.34,
      -32,
      35.8,
      sy + 0.34,
      -32,
    ],
    entryIndices = [0, 1, 2, 1, 3, 2];
  physics.surface(entry, entryIndices);
  const entryGeo = new T.BufferGeometry();
  entryGeo.setAttribute("position", new T.Float32BufferAttribute(entry, 3));
  entryGeo.setIndex(entryIndices);
  entryGeo.computeVertexNormals();
  mesh(
    scene,
    entryGeo,
    new T.MeshStandardMaterial({
      color: "#b2abb0",
      roughness: 1,
      side: T.DoubleSide,
    }),
  );
  for (let i = 0; i < 9; i++) {
    const a = (i / 10) * Math.PI * 2,
      x = sx + Math.sin(a) * 5.3,
      z = sz + Math.cos(a) * 5.3,
      y = ground(x, z);
    if (z > sz + 2 && Math.abs(x - sx) < 3) continue;
    const height = i % 3 === 0 ? 3.2 : 6.8;
    cyl(scene, x, y + 0.25, z, 0.8, 0.5, "#d1c7b7");
    cyl(scene, x, y + height / 2, z, 0.43, height, "#bcb9c2", 0.58);
    cyl(scene, x, y + height, z, 0.8, 0.35, "#ddd0bb");
    for (let k = 0; k < 5; k++) {
      const ang = (k / 5) * Math.PI * 2;
      cyl(
        scene,
        x + Math.sin(ang) * 0.44,
        y + height / 2,
        z + Math.cos(ang) * 0.44,
        0.045,
        height - 0.4,
        "#d1c9cb",
      );
    }
    physics.tree(x, y, z, 0.62, height);
    if (i % 3 !== 0) banner(scene, x, y + height - 0.6, z + 0.1, "#615274");
  }
  const fragments: T.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const piece = mesh(
      scene,
      new T.CylinderGeometry(
        0.45,
        0.62,
        0.75,
        4,
        1,
        false,
        a,
        Math.PI / 4 - 0.035,
      ),
      mat("#9f9aa9"),
      [sx, sy + 0.55, sz - 1.3],
    );
    piece.userData.angle = a + Math.PI / 8;
    fragments.push(piece);
  }
  const fissures = new T.Group();
  fissures.position.set(sx, sy + 0.94, sz - 1.3);
  fissures.scale.setScalar(0.55);
  scene.add(fissures);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const crack = box(
      fissures,
      Math.sin(a) * 0.5,
      0,
      Math.cos(a) * 0.5,
      0.025,
      0.018,
      1,
      "#ffe1a3",
    );
    crack.rotation.y = a;
    (crack.material as T.MeshStandardMaterial).emissiveIntensity = 2;
  }
  const pedestal = new T.Vector3(sx, sy, sz - 1.3);
  const sword = makeSword();
  sword.position.set(sx, sy + 1.25, sz - 1.3);
  sword.scale.setScalar(0.8);
  scene.add(sword);
  const runes: T.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = box(
      scene,
      sx + Math.sin(a) * 3.4,
      sy + 0.24,
      sz + Math.cos(a) * 3.4,
      0.12,
      0.035,
      0.42,
      "#d4b17c",
    );
    r.rotation.y = -a;
    runes.push(r);
  }
  const floating: T.Object3D[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    floating.push(
      stone(
        scene,
        sx + Math.sin(a) * 8,
        sy + 3 + (i % 3) * 1.1,
        sz + Math.cos(a) * 8,
        0.45 + (i % 3) * 0.15,
      ),
    );
  }
  const guardian = new T.Group();
  guardian.position.set(sx, sy + 3, sz - 4);
  scene.add(guardian);
  mesh(guardian, new T.OctahedronGeometry(0.7), mat("#c7c5ec", 0.4, 1));
  for (let i = 0; i < 3; i++) {
    const r = ring(guardian, 0, 0, 0, 1 + i * 0.26, 0.03, "#dacb9d");
    r.rotation.set(i * 0.6, i * 0.8, 0);
  }
  const guardianHot: [number, number][] = [
    [30, -34],
    [33, -32],
    [36, -34],
  ];
  guardianHot.forEach(([x, z], i) => {
    const y = ground(x, z);
    cyl(scene, x, y + 0.15, z, 0.65, 0.25, "#9e95a3");
    const r = ring(scene, x, y + 0.32, z, 0.5, 0.04, "#d7b77e");
    r.rotation.x = Math.PI / 2;
    text(scene, ["KINDNESS", "COURAGE", "BELONGING"][i], x, y + 1.15, z, 2);
    hot.push({
      id: "guardian-" + i,
      position: new T.Vector3(x, y, z),
      label: "Answer: " + ["kindness", "courage", "belonging"][i],
      radius: 2,
      visible: (s) => s.quest.echoes.length === 3 && s.quest.guardian < 3,
    });
  });
  hot.push(
    {
      id: "guardian",
      position: new T.Vector3(33, sy, -34.5),
      label: "Listen to the memory guardian",
      radius: 3,
      visible: (s) => s.quest.echoes.length === 3 && s.quest.guardian === 0,
    },
    {
      id: "sword",
      position: new T.Vector3(33, sy, -36.5),
      label: "Claim Dawnwake",
      radius: 2.8,
      visible: (s) => s.quest.guardian === 3 && !s.quest.sword,
    },
  );
  const beam = mesh(
    scene,
    new T.CylinderGeometry(0.35, 2, 110, 24, 1, true),
    new T.MeshBasicMaterial({
      color: "#ffe6ad",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
    }),
    [sx, sy + 52, sz - 1.3],
  );
  beam.name = "dawn-beam";
  // Waterfall ribbons against the wooded ridge, with drifting turquoise spray.
  const fall = new T.Group();
  fall.position.set(-57, ground(-57, -17), -17);
  scene.add(fall);
  for (let i = 0; i < 6; i++) {
    stone(fall, -3 + i * 1.1, 4 + (i % 2), 0, 2.2);
    const ribbon = mesh(
      fall,
      new T.PlaneGeometry(0.7, 9),
      new T.MeshStandardMaterial({
        color: "#83c9c9",
        emissive: "#4ca9bd",
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.7,
        side: T.DoubleSide,
      }),
      [-2 + i * 0.75, 4.6, 1.5],
    );
    ribbon.rotation.y = 0.12;
  }
  const dust = new Motes(scene, 150, 120, "#dcc4e9"),
    sun = base.sun;
  let warmth = 0;
  return {
    id: "lumen",
    scene,
    physics,
    spawn: [7, 25],
    interactions: hot,
    sword,
    sun,
    guardian,
    pedestal,
    update(t, dt, s) {
      base.update(t, dt);
      herb.visible = s.experience === "quest" && !s.sideQuest.herbs;
      padColliders.forEach((c) => c.setEnabled(s.quest.mechanism));
      helpers.forEach(
        (g) => (g.visible = s.quest.mechanism && s.experience === "tour"),
      );
      helperColliders.forEach((c) =>
        c.setEnabled(s.quest.mechanism && s.experience === "tour"),
      );
      const fracture = scene.userData.fracture || 0;
      fragments.forEach((f) => {
        const a = f.userData.angle;
        f.position.set(
          sx + Math.sin(a) * fracture * 0.65,
          sy + 0.55 - fracture * 0.25,
          sz - 1.3 + Math.cos(a) * fracture * 0.65,
        );
        f.rotation.z = Math.sin(a) * fracture * 0.3;
      });
      fissures.visible = (scene.userData.cracks || 0) > 0.05;
      fissures.scale.setScalar((scene.userData.cracks || 0) * 0.55);
      animateResidents(residents, t, dt);
      updatePortals(scene, t);
      dust.update(t);
      const open = s.quest.flowers.length === 3;
      for (const v of vines) {
        v.scale.setScalar(open ? 0.14 : 1);
        v.rotation.y += dt * 0.025;
      }
      creature.position.y = 1.25 + Math.sin(t * 2) * 0.18;
      creature.rotation.y = t * 0.45;
      forestCrystal.visible = open && !s.quest.echoes.includes("forest");
      forestCrystal.rotation.y = t;
      cross.visible = !s.quest.echoes.includes("crossing");
      cross.rotation.y = t * 0.8;
      flowers.forEach((f, i) => {
        f.scale.setScalar(s.quest.flowers.includes(i) ? 1.3 : 1);
        f.rotation.y = Math.sin(t + i) * 0.08;
      });
      pads.forEach((p, i) => {
        p.visible = s.quest.mechanism;
        const m = (p.children[0] as T.Mesh).material as T.MeshStandardMaterial;
        m.emissiveIntensity = i < s.quest.steps ? 0.35 : 0;
      });
      memory.forEach((m, i) => {
        m.rotation.y = Math.sin(t * 0.3 + i) * 0.08;
        m.scale.setScalar(i < s.quest.memory ? 1.2 : 1);
      });
      guardian.rotation.y = t * 0.35;
      guardian.position.y = sy + 3 + Math.sin(t) * 0.22;
      guardian.visible = s.quest.guardian < 3;
      sword.visible = !s.quest.sword;
      floating.forEach((f, i) => {
        f.position.y = sy + 3 + (i % 3) * 1.1 + Math.sin(t * 0.6 + i) * 0.35;
        f.rotation.y += dt * 0.1;
      });
      const cinematicWarm = scene.userData.sunrise || 0;
      warmth = T.MathUtils.lerp(
        warmth,
        s.quest.sword ? 1 : cinematicWarm,
        1 - Math.exp(-dt * 2),
      );
      sun.color.set("#ffd6b4").lerp(new T.Color("#ffe6ab"), warmth);
      sun.intensity = 2.6 + warmth * 1.5;
      scene.fog!.color.set("#7a7897").lerp(new T.Color("#b1b7a4"), warmth);
      const skyMat = base.sky.material as T.ShaderMaterial;
      skyMat.uniforms.top.value
        .set("#484b83")
        .lerp(new T.Color("#7facd2"), warmth);
      skyMat.uniforms.bottom.value
        .set("#d0a5bc")
        .lerp(new T.Color("#ffe1af"), warmth);
      (beam.material as T.MeshBasicMaterial).opacity =
        (scene.userData.beam || 0) * 0.42;
      runes.forEach(
        (r) =>
          ((r.material as T.MeshStandardMaterial).emissiveIntensity =
            s.quest.echoes.length === 3 ? 0.7 : 0),
      );
      (city.userData.portal as T.ShaderMaterial).uniforms.strength.value = s
        .quest.sword
        ? 1
        : 0.08;
    },
    dispose() {
      physics.dispose();
      disposeScene(scene);
    },
  };
}
