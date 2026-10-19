import * as T from "three";
import { Physics } from "../physics/world";
import {
  ground,
  riverZ,
  trailX,
  hash,
  random,
  SIZE,
  SEGMENTS,
} from "../simulation/terrain";
import {
  mesh,
  mat,
  box,
  cyl,
  ring,
  ball,
  portal,
  text,
  makeSword,
  Motes,
  disposeScene,
} from "../render/kit";
import {
  slab,
  surface,
  cedar,
  dwelling,
  pottery,
  channel,
  awning,
  rug,
} from "../render/amazigh";
import { batchStatic } from "../render/optimize";
import { resident, animateResidents, updatePortals } from "./common";
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
    hot: Hotspot[] = [];
  scene.background = new T.Color("#9fbac0");
  scene.fog = new T.FogExp2("#a8b9af", 0.0065);
  scene.add(new T.HemisphereLight("#e0e6d6", "#91765a", 2));
  const sun = new T.DirectionalLight("#ffdb9a", 3.2);
  sun.position.set(-38, 65, 28);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -65,
    right: 65,
    top: 65,
    bottom: -65,
    far: 180,
  });
  sun.shadow.normalBias = 0.06;
  scene.add(sun, sun.target);
  const sky = mesh(
    scene,
    new T.SphereGeometry(420, 24, 12),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new T.Color("#619ba9") },
        bottom: { value: new T.Color("#e7d6b0") },
      },
      vertexShader:
        "varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec3 v;uniform vec3 top;uniform vec3 bottom;void main(){gl_FragColor=vec4(mix(bottom,top,clamp(normalize(v).y*1.8,0.,1.)),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
    }),
  );
  sky.castShadow = false;
  const geo = new T.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position,
    colors: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i),
      y = ground(x, z),
      n = hash(Math.floor(x), Math.floor(z));
    pos.setY(i, y);
    const col = new T.Color("#99966d").lerp(new T.Color("#b5a07a"), n * 0.35);
    if (x < -15 && z > 0) col.lerp(new T.Color("#667b59"), 0.55);
    if (Math.abs(x - trailX(z)) < 2.6 || Math.hypot(x - 2, z + 32) < 15)
      col.set("#c1b08b");
    if (Math.abs(z - riverZ(x)) < 6) col.set("#a79d7b");
    if (x > 20 && z < -22) col.lerp(new T.Color("#c2aa87"), 0.6);
    col.multiplyScalar(0.9 + n * 0.16);
    colors.push(col.r, col.g, col.b);
  }
  geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const land = mesh(
    scene,
    geo,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  );
  land.castShadow = false;
  const randomizer = random(1405);
  // Layered Atlas silhouettes, with snow kept above the settled valleys.
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2,
      r = 155 + (i % 3) * 18,
      h = 32 + (i % 5) * 8,
      x = Math.sin(a) * r,
      z = Math.cos(a) * r;
    const mountain = mesh(
      scene,
      new T.ConeGeometry(38, h, 6),
      mat(i % 2 ? "#87988d" : "#9ba897"),
      [x, h / 2 - 3, z],
    );
    mountain.rotation.y = i * 0.6;
    if (i % 3 === 0)
      mesh(scene, new T.ConeGeometry(13, h * 0.3, 6), mat("#e5e2cb"), [
        x,
        h * 0.85 - 3,
        z,
      ]);
  }
  // Broad spreading cedars, deliberately distinct from palms in the oasis.
  for (let i = 0; i < 105; i++) {
    const x = (randomizer() - 0.5) * 160,
      z = (randomizer() - 0.5) * 150;
    if (
      Math.abs(z - riverZ(x)) < 9 ||
      Math.abs(x - trailX(z)) < 5 ||
      Math.hypot(x - 2, z + 34) < 23 ||
      Math.hypot(x - 33, z + 38) < 14 ||
      Math.hypot(x + 25, z - 8) < 8 ||
      Math.hypot(x + 34, z + 34) < 12
    )
      continue;
    const s = 0.65 + randomizer() * 0.65;
    cedar(scene, x, ground(x, z), z, s);
    if (i % 2 === 0) physics.tree(x, ground(x, z), z, 0.3 * s, 6 * s);
  }
  // Sparse dry grasses and wild herbs, instanced rather than thousands of draws.
  const blades = new T.InstancedMesh(
      new T.ConeGeometry(0.11, 0.5, 3),
      mat("#a6a16a"),
      1800,
    ),
    dummy = new T.Object3D();
  let bi = 0;
  for (let i = 0; i < 1800; i++) {
    const x = (randomizer() - 0.5) * 155,
      z = (randomizer() - 0.5) * 150;
    if (
      Math.abs(z - riverZ(x)) < 7 ||
      Math.hypot(x - 2, z + 33) < 19 ||
      Math.abs(x - trailX(z)) < 3
    )
      continue;
    dummy.position.set(x, ground(x, z) + 0.2, z);
    dummy.rotation.y = randomizer() * 6;
    dummy.scale.setScalar(0.5 + randomizer());
    dummy.updateMatrix();
    blades.setMatrixAt(bi++, dummy.matrix);
  }
  blades.count = bi;
  scene.add(blades);
  const waterGeo = new T.PlaneGeometry(190, 7.4, 100, 2);
  waterGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < waterGeo.attributes.position.count; i++) {
    const x = waterGeo.attributes.position.getX(i);
    waterGeo.attributes.position.setXYZ(
      i,
      x,
      0.62,
      waterGeo.attributes.position.getZ(i) + riverZ(x),
    );
  }
  waterGeo.computeVertexNormals();
  const river = mesh(
    scene,
    waterGeo,
    new T.MeshPhysicalMaterial({
      color: "#5c9e94",
      roughness: 0.22,
      metalness: 0.1,
      clearcoat: 1,
    }),
  );
  river.castShadow = false;
  // The main bridge has a real collision deck and solid rails.
  const bridgeZ = riverZ(4),
    deckY = 3.25;
  slab(scene, 4, deckY, bridgeZ, 4.4, 0.55, 18, "#b4aa8b", "stone");
  physics.box(4, deckY, bridgeZ, 2.2, 0.275, 9);
  for (const side of [-1, 1]) {
    slab(
      scene,
      4 + side * 2.1,
      deckY + 0.45,
      bridgeZ,
      0.28,
      0.7,
      18,
      "#b6a98a",
      "stone",
    );
    physics.box(4 + side * 2.1, deckY + 0.45, bridgeZ, 0.14, 0.35, 9);
  }
  // Low approach ramps, exactly matched by physics triangles.
  for (const side of [-1, 1]) {
    const z0 = bridgeZ + side * 9,
      z1 = z0 + side * 6,
      y0 = deckY + 0.275,
      y1 = ground(4, z1) + 0.08;
    const verts = [1.8, y0, z0, 6.2, y0, z0, 1.8, y1, z1, 6.2, y1, z1],
      idx = side > 0 ? [0, 2, 1, 1, 2, 3] : [0, 1, 2, 1, 3, 2];
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    mesh(scene, g, surface("#b4aa8b", "stone"));
    physics.surface(verts, idx);
  }
  // Stone hillside homes, a communal forecourt and stepped cultivated land.
  for (const [x, z, w, h] of [
    [-7, -30, 6, 5.3],
    [14, -33, 6, 6],
    [-9, -42, 7, 5],
    [6, -46, 5, 7],
    [24, -51, 6, 4.8],
  ])
    dwelling(scene, physics, x, ground(x, z), z, w, 5, h);
  for (let i = 0; i < 4; i++) {
    const x = 16 + i * 3,
      z = -16 - i * 3,
      y = ground(x, z);
    slab(scene, x, y + 0.25, z, 9, 0.5, 2.8, "#8a8b6b", "stone");
    slab(scene, x, y + 0.52, z, 8.5, 0.04, 2.2, i % 2 ? "#728459" : "#7e8f58");
    for (let j = 0; j < 11; j++)
      cyl(scene, x - 3.8 + j * 0.73, y + 0.74, z, 0.07, 0.4, "#b6aa6c");
  }
  awning(scene, -3, ground(-3, -24) + 2.8, -24, 4.2, 3, "#9d6347");
  rug(scene, -3, ground(-3, -24) + 0.1, -24, 3, 2, "#934c36");
  for (let i = 0; i < 7; i++)
    pottery(
      scene,
      -4 + i * 0.4,
      ground(-4, -24) + 0.12,
      -24,
      0.7 + (i % 3) * 0.2,
    );
  awning(scene, 11, ground(11, -28) + 2.6, -28, 3.5, 2.5, "#617466");
  const granary = dwelling(scene, physics, -1, ground(-1, -47), -47, 9, 5, 7);
  for (let row = 0; row < 2; row++)
    for (let j = 0; j < 5; j++) {
      const x = -3.4 + j * 1.7,
        yy = 1.6 + row * 2.4;
      box(granary, x, yy, 2.55, 1.15, 1.65, 0.08, "#6a5239");
      box(granary, x, yy + 0.92, 2.7, 1.4, 0.18, 0.4, "#cfb68e");
      ring(granary, x + 0.3, yy, 2.65, 0.055, 0.012, "#b9ad88");
    }
  text(
    scene,
    "THE COMMUNAL STORES",
    -1,
    ground(-1, -47) + 8.4,
    -44,
    7,
    "#fff0ce",
  );
  const residents = await Promise.all([
    resident(scene, 4, ground(4, -27), -27, "#6c8170", 0),
    resident(scene, -3, ground(-3, -24), -24, "#b27c56", 1),
    resident(scene, 11, ground(11, -28), -28, "#526d6e", 2),
    resident(scene, 2, ground(2, -37), -37, "#9a684f", 3, true),
    resident(scene, -5, ground(-5, -38), -38, "#a69d7c", 4, true),
    resident(scene, 10, ground(10, -29), -29, "#8c5860", 5),
  ]);
  text(scene, "ITTO · WATER STEWARD", 4, ground(4, -27) + 2.5, -27, 3.5);
  hot.push({
    id: "edda",
    position: new T.Vector3(4, ground(4, -27), -25.8),
    label: "Speak with Itto",
    radius: 3,
  });
  hot.push({
    id: "healer",
    position: new T.Vector3(10, ground(10, -29), -28),
    label: "Speak with Hadda",
    radius: 2.7,
  });
  const home = portal(
    scene,
    -1,
    ground(-1, 24),
    24,
    "#d6b476",
    "THE COURTYARD",
  );
  home.scale.setScalar(0.72);
  physics.cameraPanel(-1, ground(-1, 24), 24);
  hot.push({
    id: "portal-home",
    position: new T.Vector3(-1, ground(-1, 24), 25),
    label: "Return to your courtyard",
  });
  const oasis = portal(scene, 8, ground(8, -25), -25, "#83bbb0", "TARGA OASIS");
  oasis.scale.setScalar(0.75);
  physics.cameraPanel(8, ground(8, -25), -25);
  hot.push({
    id: "portal-city",
    position: new T.Vector3(8, ground(8, -25), -23),
    label: "Travel to Targa Oasis",
    visible: (s) => s.quest.sword,
  });
  // A real water-restoration activity: three shutters, channels and a dry garden.
  const gates: T.Group[] = [],
    waters: T.Mesh[] = [];
  const gatePoints: [number, number][] = [
    [-24, 12],
    [-29, 7],
    [-20, 5],
  ];
  for (const [i, [x, z]] of gatePoints.entries()) {
    const y = ground(x, z),
      g = new T.Group();
    g.position.set(x, y, z);
    scene.add(g);
    for (const side of [-1, 1])
      slab(g, side * 0.65, 0.65, 0, 0.3, 1.3, 1.2, "#b9ac8a", "stone");
    box(g, 0, 1.2, 0, 1.6, 0.18, 0.3, "#816547");
    box(g, 0, 0.7, 0, 0.9, 1.1, 0.12, "#735d43");
    ring(g, 0, 1.8, 0, 0.38, 0.045, "#a99c78");
    text(g, ["I", "II", "III"][i], 0, 2.4, 0, 1.2);
    gates.push(g);
    const a = new T.Vector3(x, y + 0.08, z + 1),
      b = new T.Vector3(-25, ground(-25, 8) + 0.12, 8);
    waters.push(channel(scene, a, b, 0.6).water);
    hot.push({
      id: "flower-" + i,
      position: new T.Vector3(x, y, z + 1),
      label: "Open intake gate " + ["I", "II", "III"][i],
      radius: 2,
    });
  }
  const spring = channel(
    scene,
    new T.Vector3(-25, ground(-25, 8) + 0.14, 8),
    new T.Vector3(-25, ground(-25, 17) + 0.08, 17),
    1.1,
  );
  waters.push(spring.water);
  text(scene, "THE CEDAR SPRING", -25, ground(-25, 8) + 3.5, 8, 5);
  hot.push({
    id: "forest-echo",
    position: new T.Vector3(-25, ground(-25, 8), 8),
    label: "Record the restored watercourse",
    visible: (s) =>
      s.quest.flowers.length === 3 && !s.quest.echoes.includes("forest"),
  });
  // Reopen a caravan passage: the established physical traversal remains real.
  const cy = ground(-24, -28);
  slab(scene, -24, cy + 0.4, -28, 2, 0.8, 2, "#9c9172", "stone");
  const wheel = ring(scene, -24, cy + 1.2, -28, 0.7, 0.08, "#a89b75");
  wheel.rotation.x = Math.PI / 2;
  hot.push({
    id: "mechanism",
    position: new T.Vector3(-24, cy, -26.5),
    label: "Raise the passage winch",
  });
  const pads: T.Group[] = [],
    helpers: T.Group[] = [],
    colliders: ReturnType<Physics["box"]>[] = [];
  for (let i = 0; i < 3; i++) {
    const [x, z] = STEPS[i],
      g = new T.Group();
    g.position.set(x, STEP_Y - 0.3, z);
    scene.add(g);
    slab(g, 0, 0, 0, 2.7, 0.55, 2.7, "#b8ac8c", "stone");
    rug(g, 0, 0.29, 0, 1.5, 1.5, "#8a6650");
    text(g, String(i + 1), 0, 0.32, 0.02, 1.2).rotation.x = -Math.PI / 2;
    physics.box(x, STEP_Y - 0.3, z, 1.25, 0.275, 1.25);
    pads.push(g);
    const prev = i ? STEPS[i - 1] : [-25, -27],
      mx = (x + prev[0]) / 2,
      mz = (z + prev[1]) / 2;
    const helper = new T.Group();
    scene.add(helper);
    slab(helper, mx, STEP_Y - 0.32, mz, 3.4, 0.3, 3.4, "#a59777", "stone");
    helpers.push(helper);
    colliders.push(physics.box(mx, STEP_Y - 0.32, mz, 1.7, 0.15, 1.7));
  }
  // A walkable approach to the raised passage, shared by every difficulty.
  // Story Tour's connecting decks do not help if the first deck is unreachable.
  const ra = new T.Vector3(-25, ground(-25, -26) + 0.06, -26),
    rb = new T.Vector3(-27, STEP_Y - 0.17, -29);
  const dr = rb.clone().sub(ra),
    pr = new T.Vector3(-dr.z, 0, dr.x).normalize().multiplyScalar(1.15);
  const rv = [
    ra.clone().add(pr),
    ra.clone().sub(pr),
    rb.clone().add(pr),
    rb.clone().sub(pr),
  ].flatMap((v) => [v.x, v.y, v.z]);
  const rg = new T.BufferGeometry();
  rg.setAttribute("position", new T.Float32BufferAttribute(rv, 3));
  rg.setIndex([0, 2, 1, 1, 2, 3]);
  rg.computeVertexNormals();
  mesh(scene, rg, surface("#b6a382", "stone"));
  physics.surface(rv, [0, 2, 1, 1, 2, 3]);
  hot.push({
    id: "crossing-echo",
    position: new T.Vector3(-40, ground(-40, -40), -40),
    label: "Recover the caravan record",
    visible: (s) => s.quest.steps === 3 && !s.quest.echoes.includes("crossing"),
    radius: 3,
  });
  pottery(scene, -40, ground(-40, -40), -40, 1.8);
  text(scene, "THE REOPENED PASS", -35, STEP_Y + 4, -36, 7);
  // Granary records: a delivery measure, the family seals, the shared reserve.
  const archiveObjects: T.Group[] = [];
  for (const [i, [x, z]] of [
    [13, -46],
    [17, -46],
    [15, -50],
  ].entries()) {
    const y = ground(x, z),
      g = new T.Group();
    g.position.set(x, y, z);
    scene.add(g);
    slab(g, 0, 0.55, 0, 1.5, 1.1, 1.3, "#a99d7b", "stone");
    if (i === 0) pottery(g, 0, 1.1, 0, 1.2);
    else if (i === 1) {
      for (let n = 0; n < 3; n++)
        cyl(g, -0.25 + n * 0.25, 1.25, 0, 0.15, 0.2, "#9d714e");
    } else {
      box(g, 0, 1.2, 0, 0.8, 0.1, 0.9, "#cdb385");
      for (let n = 0; n < 5; n++)
        box(g, 0, 1.26, -0.3 + n * 0.15, 0.6, 0.008, 0.015, "#70543b");
    }
    text(
      g,
      ["1 · DELIVERY", "2 · FAMILY SEALS", "3 · SHARED RESERVE"][i],
      0,
      2.5,
      0,
      3,
    );
    archiveObjects.push(g);
    hot.push({
      id: "memory-" + i,
      position: new T.Vector3(x, y, z + 1),
      label: [
        "Examine the delivery measure",
        "Match the family seals",
        "Reconcile the shared reserve",
      ][i],
    });
  }
  const keeper = await resident(scene, 15, ground(15, -48), -48, "#8b795c", 6);
  residents.push(keeper);
  text(scene, "HAMMOU · GRANARY KEEPER", 15, ground(15, -48) + 2.5, -48, 4);
  hot.push({
    id: "granary",
    position: new T.Vector3(15, ground(15, -48), -48),
    label: "Speak with the granary keeper",
    visible: (s) => s.quest.memory === 3,
    radius: 2.2,
  });
  text(scene, "GRAIN IS KEPT IN TRUST", 15, ground(15, -48) + 4.2, -48, 7);
  // Original fantasy dawn sanctuary, made from the region's stone and timber.
  // It is not a reconstruction of a real religious or archaeological site.
  const base = new T.Vector3(33, ground(33, -38) + 0.2, -38);
  cyl(scene, base.x, base.y - 0.3, base.z, 6.8, 0.6, "#b6ad91", 6.8, 40);
  physics.box(base.x, base.y - 0.3, base.z, 5, 0.3, 5);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2,
      x = base.x + Math.sin(a) * 5.9,
      z = base.z + Math.cos(a) * 5.9;
    if (z > base.z + 3) continue;
    slab(scene, x, base.y + 2, z, 0.7, 4, 0.7, "#b9b096", "stone");
    box(scene, x, base.y + 4.1, z, 1.3, 0.3, 1.3, "#c9bd9c");
    physics.box(x, base.y + 2, z, 0.35, 2, 0.35);
  }
  const terraceRamp = [
    31.5,
    ground(33, -30) + 0.06,
    -30,
    34.5,
    ground(33, -30) + 0.06,
    -30,
    31.5,
    base.y + 0.03,
    -34,
    34.5,
    base.y + 0.03,
    -34,
  ];
  const terraceGeometry = new T.BufferGeometry();
  terraceGeometry.setAttribute(
    "position",
    new T.Float32BufferAttribute(terraceRamp, 3),
  );
  terraceGeometry.setIndex([0, 1, 2, 1, 3, 2]);
  terraceGeometry.computeVertexNormals();
  mesh(scene, terraceGeometry, surface("#b8aa88", "stone"));
  physics.surface(terraceRamp, [0, 1, 2, 1, 3, 2]);
  const pedestal = base.clone();
  cyl(scene, base.x, base.y + 0.45, base.z, 0.86, 0.9, "#968e78", 1.1, 9);
  const sword = makeSword();
  sword.position.set(base.x, base.y + 1.25, base.z);
  sword.scale.setScalar(0.8);
  scene.add(sword);
  const guardian = new T.Group();
  guardian.position.set(33, base.y + 1, -42);
  scene.add(guardian);
  const guardianRing = ring(guardian, 0, 1, 0, 1.1, 0.08, "#bcae77");
  ball(guardian, 0, 1, 0, 0.4, "#b0c8a7");
  text(scene, "THE DAWN TERRACE", 33, base.y + 6, -40, 8);
  hot.push({
    id: "guardian",
    position: new T.Vector3(33, ground(33, -34), -34),
    label: "Listen to the storykeeper",
    visible: (s) => s.quest.echoes.length === 3 && !s.quest.sword,
  });
  for (const [i, [x, z]] of [
    [28, -35],
    [33, -32],
    [38, -35],
  ].entries()) {
    const y = ground(x, z);
    cyl(scene, x, y + 0.35, z, 0.7, 0.7, "#a69b7c");
    text(scene, ["WATER", "PASSAGE", "TRUST"][i], x, y + 1.2, z, 2.5);
    hot.push({
      id: "guardian-" + i,
      position: new T.Vector3(x, y, z),
      label: [
        "Offer the water testimony",
        "Offer the passage record",
        "Offer the granary ledger",
      ][i],
      visible: (s) => s.quest.echoes.length === 3 && !s.quest.sword,
    });
  }
  hot.push({
    id: "sword",
    position: new T.Vector3(33, ground(33, -35.5), -35.5),
    label: "Claim the Dawnblade",
    radius: 3.1,
    visible: (s) => s.quest.guardian === 3 && !s.quest.sword,
  });
  const herbs = new T.Group();
  herbs.position.set(-16, ground(-16, 19), 19);
  scene.add(herbs);
  for (let i = 0; i < 12; i++) {
    const herb = ball(
      herbs,
      Math.sin(i) * 0.8,
      0.25 + (i % 3) * 0.12,
      Math.cos(i) * 0.7,
      0.16,
      "#90a88a",
    );
    herb.scale.y = 2;
  }
  hot.push({
    id: "herbs",
    position: new T.Vector3(-16, ground(-16, 19), 19),
    label: "Gather cedar-trail herbs",
    visible: (s) =>
      s.experience === "quest" && s.sideQuest.accepted && !s.sideQuest.herbs,
  });
  const motes = new Motes(scene, 100, 100, "#e7d6a5");
  const dynamic: T.Object3D[] = [
    home,
    oasis,
    river,
    wheel,
    sword,
    guardian,
    motes.object,
    herbs,
    ...gates,
    ...waters,
    ...pads,
    ...helpers,
    ...residents.map((r) => r.actor.root),
  ];
  batchStatic(scene, dynamic);
  return {
    id: "lumen",
    scene,
    physics,
    spawn: [7, 25],
    sun,
    sword,
    guardian,
    pedestal,
    interactions: hot,
    update(t, dt, s) {
      animateResidents(residents, t, dt);
      updatePortals(scene, t);
      motes.update(t);
      const sunrise = s.quest.sword ? 1 : Number(scene.userData.sunrise || 0);
      sun.color.set("#ffdb9a").lerp(new T.Color("#ffedb8"), sunrise);
      sun.intensity = 3.2 + sunrise * 0.7;
      (sky.material as T.ShaderMaterial).uniforms.top.value.set(
        sunrise > 0.5 ? "#6baec3" : "#619ba9",
      );
      for (let i = 0; i < gates.length; i++) {
        const shutter = gates[i].children[3];
        if (shutter)
          shutter.position.y = T.MathUtils.damp(
            shutter.position.y,
            s.quest.flowers.includes(i) ? 1.65 : 0.7,
            5,
            dt,
          );
        waters[i].visible = s.quest.flowers.includes(i);
      }
      spring.water.visible = s.quest.flowers.length === 3;
      wheel.rotation.z = s.quest.mechanism ? Math.sin(t * 0.3) * 0.03 : 0;
      for (let i = 0; i < helpers.length; i++) {
        helpers[i].visible = s.experience === "tour";
        colliders[i].setEnabled(s.experience === "tour");
      }
      pads.forEach(
        (p, i) => (p.visible = s.quest.mechanism || s.quest.steps > i),
      );
      sword.visible = !s.quest.sword;
      guardian.visible = s.quest.echoes.length === 3 && !s.quest.sword;
      guardianRing.rotation.z = t * 0.18;
      herbs.visible = !s.sideQuest.herbs;
      scene.userData.waterRestored = s.quest.flowers.length === 3;
    },
    dispose() {
      disposeScene(scene);
      physics.dispose();
    },
  };
}
