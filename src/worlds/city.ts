import * as T from "three";
import { Physics } from "../physics/world";
import {
  box,
  cyl,
  mesh,
  mat,
  text,
  portal,
  Motes,
  disposeScene,
} from "../render/kit";
import {
  dwelling,
  palm,
  pottery,
  channel,
  awning,
  rug,
  slab,
  surface,
  silverClasp,
} from "../render/amazigh";
import { batchStatic } from "../render/optimize";
import { resident, animateResidents, updatePortals } from "./common";
import type { World, Hotspot } from "./types";
export async function createWorld(): Promise<World> {
  const scene = new T.Scene(),
    physics = new Physics(() => 0, 25),
    hot: Hotspot[] = [];
  scene.background = new T.Color("#d2b58d");
  scene.fog = new T.FogExp2("#d5bc94", 0.011);
  scene.add(new T.HemisphereLight("#dce1d1", "#906044", 2.2));
  const sun = new T.DirectionalLight("#ffe1a1", 3.7);
  sun.position.set(-18, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, {
    left: -35,
    right: 35,
    top: 35,
    bottom: -35,
    far: 90,
  });
  sun.shadow.normalBias = 0.06;
  scene.add(sun);
  const ground = mesh(
    scene,
    new T.PlaneGeometry(220, 220, 70, 70),
    surface("#cbb088"),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  // Earthen fortified silhouettes belong to this southern oasis chapter.
  for (const [x, z, w, d, h] of [
    [-16, -16, 8, 7, 10],
    [17, -18, 7, 6, 12],
    [-17, -2, 7, 7, 7],
    [18, 3, 7, 7, 9],
    [-16, 16, 7, 7, 6],
    [16, 19, 7, 7, 8],
    [-2, -22, 10, 5, 7],
  ])
    dwelling(scene, physics, x, 0, z, w, d, h, true);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2,
      x = Math.sin(a) * 22,
      z = Math.cos(a) * 22;
    palm(scene, x, 0, z, 0.85 + (i % 3) * 0.16);
    if (i % 3 === 0) physics.tree(x, 0, z, 0.25, 6);
  }
  for (const [x, z] of [
    [7, -12],
    [14, -8],
    [9, 4],
    [-11, -13],
    [-10, 8],
    [6, 17],
  ])
    palm(scene, x, 0, z, 1.05);
  // A courtyard for weaving, water records, conversation and low seating.
  awning(scene, -7, 3, -7, 7, 6, "#86684d");
  rug(scene, -7, 0.06, -7, 5.5, 4.5, "#8f5947");
  for (const x of [-10, -4])
    slab(scene, x, 0.4, -7, 1, 0.75, 4, "#ab8e6c", "weave");
  const loom = new T.Group();
  loom.position.set(-8.5, 0, -10);
  scene.add(loom);
  for (const x of [-1, 1]) box(loom, x, 1.4, 0, 0.12, 2.8, 0.16, "#70533b");
  for (const y of [0.3, 2.7]) box(loom, 0, y, 0, 2.3, 0.14, 0.18, "#72593c");
  slab(loom, 0, 1.5, 0.02, 1.65, 2, 0.04, "#426d6a", "weave");
  for (let i = 0; i < 14; i++)
    box(loom, -0.85 + i * 0.13, 1.5, 0.06, 0.014, 2.5, 0.014, "#d6c398");
  for (let i = 0; i < 8; i++)
    pottery(scene, -10 + i * 0.6, 0, -3, 0.8 + (i % 2) * 0.25, "#b97950");
  const residents = await Promise.all([
    resident(scene, -6, 0, -8, "#b8a078", 0),
    resident(scene, -9, 0, -6, "#4f7772", 1),
    resident(scene, 6, 0, 5, "#ae7751", 2, true),
    resident(scene, 4, 0, -15, "#b3ae8a", 3, true),
    resident(scene, -10, 0, 8, "#91765f", 4),
  ]);
  text(scene, "THE WEAVING COURTYARD", -6, 4.5, -8, 7, "#f1e0bb");
  text(scene, "TARGA", 0, 6, -20, 10, "#f7e7c2");
  hot.push({
    id: "sable",
    position: new T.Vector3(-6, 0, -7),
    label: "Speak with the channel keeper",
    radius: 3,
  });
  // Khettara-inspired gallery outlet. This surface scene shows headworks and
  // inspection shafts; it does not pretend an underground tunnel is playable.
  slab(scene, 11, 0.6, -17, 6, 1.2, 4, "#b77c53");
  box(scene, 10, 1.3, -15, 1.2, 1.7, 0.08, "#534632");
  for (let i = 0; i < 5; i++) {
    const z = -24 - i * 5,
      x = 11 + i * 0.3;
    cyl(scene, x, 0.15, z, 0.65, 0.3, "#937653", 0.85, 12);
    cyl(scene, x, 0.3, z, 0.4, 0.03, "#4c4936", 0.4, 12);
  }
  const garden = new T.Group();
  scene.add(garden);
  for (let i = 0; i < 4; i++) {
    slab(scene, 8, 0.12, -4 + i * 3, 8, 0.24, 2, "#887c50");
    for (let j = 0; j < 9; j++) {
      const sprout = mesh(
        garden,
        new T.ConeGeometry(0.16, 0.65, 5),
        mat(i % 2 ? "#6f8f50" : "#849c54"),
        [5 + j * 0.75, 0.48, -4 + i * 3],
      );
      sprout.rotation.z = Math.sin(j) * 0.15;
    }
  }
  const channels = [
    channel(
      scene,
      new T.Vector3(10, 0.08, -15),
      new T.Vector3(12, 0.08, 0),
      0.75,
    ),
    channel(scene, new T.Vector3(12, 0.08, 0), new T.Vector3(3, 0.08, 0), 0.75),
    channel(scene, new T.Vector3(3, 0.08, 0), new T.Vector3(1, 0.08, -6), 0.75),
    channel(
      scene,
      new T.Vector3(1, 0.08, -6),
      new T.Vector3(-3, 0.08, -12),
      0.65,
    ),
  ];
  // Walk-over planks let the player cross channels without getting trapped.
  for (const [x, z, w, d] of [
    [7, 0, 2.5, 2],
    [1, -7, 2, 2.6],
    [11, -7, 3, 2],
  ]) {
    slab(scene, x, 0.29, z, w, 0.15, d, "#a79672", "stone");
    physics.box(x, 0.29, z, w / 2, 0.075, d / 2);
  }
  const basin = cyl(scene, 0, 0.12, -1, 2, 0.25, "#9b8f6e", 2.1, 32);
  const basinWater = mesh(
    scene,
    new T.CircleGeometry(1.8, 40),
    new T.MeshPhysicalMaterial({
      color: "#579e96",
      roughness: 0.18,
      metalness: 0.15,
      clearcoat: 1,
    }),
    [0, 0.27, -1],
  );
  basinWater.rotation.x = -Math.PI / 2;
  basinWater.castShadow = false;
  const repairs = [
    new T.Vector3(10, 0, -15),
    new T.Vector3(12, 0, 0),
    new T.Vector3(1, 0, -6),
  ];
  const repairObjects: T.Group[] = [];
  for (const [i, p] of repairs.entries()) {
    const g = new T.Group();
    g.position.copy(p);
    scene.add(g);
    if (i === 0) {
      for (let j = 0; j < 5; j++)
        box(g, -0.4 + j * 0.2, 0.65, 0, 0.07, 1, 0.12, "#867450");
    }
    if (i === 1) {
      box(g, 0, 0.3, 0, 0.7, 0.4, 1.3, "#897857");
      box(g, 0, 0.55, 0, 0.8, 0.1, 0.7, "#bd946b");
    }
    if (i === 2) {
      for (const x of [-0.5, 0.5])
        slab(g, x, 0.6, 0, 0.15, 1.2, 0.25, "#a58c66", "stone");
      box(g, 0, 0.5, 0, 0.85, 0.9, 0.12, "#725f43");
    }
    text(
      g,
      ["HEADWORKS", "GARDEN CHANNEL", "SHARED CISTERN"][i],
      0,
      2.1,
      0,
      3.5,
    );
    repairObjects.push(g);
    hot.push({
      id: "oasis-repair-" + i,
      position: p.clone().add(new T.Vector3(0, 0, 1.2)),
      label: [
        "Clear the headworks filter",
        "Seal the garden channel",
        "Open the sharing gate",
      ][i],
      radius: 2.6,
      visible: (s) => s.oasis.accepted && !s.oasis.repairs.includes(i),
    });
  }
  const gift = new T.Group();
  gift.position.set(-4.2, 1.4, -7);
  scene.add(gift);
  silverClasp(gift, 0, 0, 0, 1.3);
  text(scene, "WATER FOR EVERY COURTYARD", 0, 3, -6, 6);
  const doorway = portal(scene, 0, 0, 14, "#d3b880", "THE COURTYARD");
  doorway.scale.setScalar(0.8);
  physics.cameraPanel(0, 0, 14);
  hot.push({
    id: "portal-home",
    position: new T.Vector3(0, 0, 12),
    label: "Bring your stories home",
    radius: 2.7,
  });
  const atlas = portal(scene, -8, 0, 14, "#8cae8c", "TIZI HIGHLANDS");
  atlas.scale.setScalar(0.65);
  physics.cameraPanel(-8, 0, 14);
  hot.push({
    id: "portal-lumen",
    position: new T.Vector3(-8, 0, 12),
    label: "Return to Tizi Highlands",
    radius: 2.7,
  });
  // Rocky Saharan horizon and dunes beyond the protected playable gardens.
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2,
      x = Math.sin(a) * 80,
      z = Math.cos(a) * 80;
    const dune = mesh(
      scene,
      new T.SphereGeometry(1, 16, 8),
      mat(i % 2 ? "#c39b70" : "#d0ad7b"),
      [x, -2, z],
    );
    dune.scale.set(28, 8 + (i % 4) * 2, 15);
    dune.rotation.y = a;
    if (i % 3 === 0) {
      const rock = mesh(
        scene,
        new T.CylinderGeometry(7, 12, 20 + (i % 4) * 3, 6),
        mat("#a68b6b"),
        [x * 1.5, 8, z * 1.5],
      );
      rock.rotation.y = a;
    }
  }
  const motes = new Motes(scene, 75, 45, "#efc58d");
  batchStatic(scene, [
    doorway,
    atlas,
    garden,
    basinWater,
    gift,
    motes.object,
    ...channels.map((c) => c.water),
    ...repairObjects,
    ...residents.map((r) => r.actor.root),
  ]);
  return {
    id: "city",
    scene,
    physics,
    spawn: [0, 9],
    sun,
    interactions: hot,
    update(t, dt, s) {
      animateResidents(residents, t, dt);
      updatePortals(scene, t);
      motes.update(t);
      channels.forEach(
        (c, i) =>
          (c.water.visible =
            i === 0
              ? s.oasis.repairs.includes(0)
              : i === 1
                ? s.oasis.repairs.includes(0) && s.oasis.repairs.includes(1)
                : s.oasis.restored),
      );
      basinWater.visible = s.oasis.restored;
      garden.scale.y = T.MathUtils.damp(
        garden.scale.y,
        s.oasis.restored ? 1 : 0.35,
        3,
        dt,
      );
      gift.visible = s.oasis.restored && !s.inventory.includes("oasis-clasp");
      repairObjects.forEach((o, i) => {
        if (i === 0) o.rotation.z = s.oasis.repairs.includes(0) ? 0.15 : 0;
        if (i === 2)
          o.position.y = T.MathUtils.damp(
            o.position.y,
            s.oasis.repairs.includes(2) ? 1 : 0,
            4,
            dt,
          );
      });
      scene.userData.waterRestored = s.oasis.restored;
    },
    dispose() {
      disposeScene(scene);
      physics.dispose();
    },
  };
}
