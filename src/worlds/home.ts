import * as T from "three";
import { Physics } from "../physics/world";
import {
  box,
  cyl,
  ring,
  mesh,
  mat,
  text,
  lantern,
  portal,
  Motes,
  makeSword,
  disposeScene,
} from "../render/kit";
import { slab, rug, pottery, silverClasp, cedar } from "../render/amazigh";
import { stars, updatePortals } from "./common";
import { batchStatic } from "../render/optimize";
import type { World } from "./types";
export async function createWorld(): Promise<World> {
  const scene = new T.Scene(),
    physics = new Physics(() => 0, 12.3);
  stars(scene);
  scene.fog = new T.FogExp2("#202e35", 0.006);
  scene.add(new T.HemisphereLight("#cfdbcf", "#865b45", 1.8));
  const sun = new T.DirectionalLight("#ffdaad", 2.4);
  sun.position.set(-7, 13, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -18,
    right: 18,
    top: 20,
    bottom: -20,
    far: 50,
  });
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  slab(scene, 0, -0.3, 0, 26, 0.6, 28, "#c2aa84", "stone");
  for (let z = -13; z < 14; z += 1.4)
    for (let x = -12; x < 13; x += 1.6)
      slab(
        scene,
        x,
        0.025,
        z,
        1.56,
        0.04,
        1.36,
        Math.floor(x + z) % 3 ? "#b7a385" : "#c6b496",
        "stone",
      );
  for (const x of [-12.8, 12.8]) {
    slab(scene, x, 3.1, 0, 0.45, 6.2, 28, "#c8b696");
    physics.box(x, 3.1, 0, 0.22, 3.1, 14);
    for (const z of [-10, -4, 3, 10]) {
      slab(scene, x * 0.985, 3, z, 0.35, 6, 0.65, "#bba582", "stone");
      box(scene, x * 0.96, 2.8, z, 0.08, 1.6, 0.75, "#5f6557");
    }
  }
  slab(scene, 0, 3.1, -13.8, 26, 6.2, 0.4, "#bca17d");
  physics.box(0, 3.1, -13.8, 13, 3.1, 0.25);
  // Open courtyard skylight, with cedar beams above the sheltered edges.
  const exterior = new T.Group();
  scene.add(exterior);
  for (const side of [-1, 1]) {
    slab(exterior, side * 9, 6.3, 0, 8, 0.28, 28, "#bca78b");
    for (let z = -13; z <= 13; z += 1.4)
      box(scene, side * 9, 6.02, z, 8.5, 0.16, 0.17, "#765b41");
    for (let z = -11; z <= 11; z += 7.4) {
      slab(scene, side * 5.2, 2.9, z, 0.45, 5.8, 0.45, "#b59f7d", "stone");
      box(scene, side * 5.2, 5.85, z, 1, 0.18, 1, "#d1bc95");
    }
  }
  for (const x of [-8.5, 8.5]) {
    slab(scene, x, 2.7, 13.5, 8.5, 5.4, 0.35, "#c5b091");
    physics.box(x, 2.7, 13.5, 4.25, 2.7, 0.2);
  }
  slab(scene, 0, 0.65, 13.5, 9, 1.3, 0.4, "#baa380", "stone");
  physics.box(0, 0.65, 13.5, 4.5, 0.65, 0.2);
  for (const x of [-4.2, 4.2])
    slab(scene, x, 3.2, 13.5, 0.35, 5.2, 0.5, "#d0bb97", "stone");
  box(scene, 0, 5.9, 13.5, 9.2, 0.3, 0.65, "#71583e");
  rug(scene, 0, 0.085, 5, 9, 7, "#945b45");
  for (const x of [-3.7, 3.7]) {
    slab(scene, x, 0.37, 4, 0.95, 0.7, 5, "#657468", "weave");
    for (let z = 2; z < 7; z += 1.4)
      slab(
        scene,
        x,
        0.87,
        z,
        0.8,
        0.4,
        1.1,
        z % 2 ? "#b88a59" : "#a16c50",
        "weave",
      );
  }
  physics.box(1, 0.35, 3, 0.95, 0.35, 0.95);
  for (const x of [-3.7, 3.7]) physics.box(x, 0.35, 4, 0.475, 0.35, 2.5);
  for (const side of [-1, 1])
    for (let z = -11; z <= 11; z += 7.4)
      physics.box(side * 5.2, 2.9, z, 0.225, 2.9, 0.225);
  const table = cyl(scene, 1, 0.55, 3, 1, 0.12, "#94734f");
  pottery(scene, 1, 0.64, 3, 0.7, "#bd946a");
  cyl(scene, 0.4, 0.7, 3, 0.08, 0.13, "#d3bd95");
  // A small courtyard basin supports the home rather than blocking its paths.
  cyl(scene, 8, 0.25, -3, 1.3, 0.5, "#b5a17d");
  const basin = mesh(
    scene,
    new T.CircleGeometry(1.1, 32),
    new T.MeshPhysicalMaterial({
      color: "#77a9a0",
      roughness: 0.15,
      metalness: 0.15,
      clearcoat: 1,
    }),
    [8, 0.52, -3],
  );
  basin.rotation.x = -Math.PI / 2;
  physics.box(8, 0.25, -3, 1.2, 0.25, 1.2);
  // Warm hearth and the permanent cross-world weapon display.
  slab(scene, -11, 1.7, -3, 3.4, 3.4, 3.2, "#b79672");
  box(scene, -9.25, 1.05, -3, 0.07, 1.9, 2.2, "#3b3028");
  slab(scene, -9.1, 2.6, -3, 0.8, 0.22, 3.6, "#d4bc93", "stone");
  physics.box(-11, 1.7, -3, 1.5, 1.7, 1.6);
  const fire = new T.Group();
  fire.position.set(-9.15, 0.6, -3);
  scene.add(fire);
  for (let i = 0; i < 5; i++)
    mesh(
      fire,
      new T.ConeGeometry(0.16, 0.7, 6),
      mat(i % 2 ? "#ffc57a" : "#e9965a", 0, 1.5),
      [Math.sin(i) * 0.15, 0, (i - 2) * 0.25],
    );
  const glow = new T.PointLight("#f8ad68", 18, 13, 2);
  glow.position.set(-8.4, 1.5, -3);
  scene.add(glow);
  const mounted = makeSword();
  mounted.position.set(-9.1, 3.7, -3);
  mounted.rotation.set(0, Math.PI / 2, Math.PI * 0.55);
  mounted.scale.setScalar(0.9);
  scene.add(mounted);
  // Woven wall hangings, pottery, a cedar chest and family notebooks.
  for (const z of [-10, 5]) {
    slab(scene, -11.5, 0.7, z, 1.8, 1.4, 3.5, "#7e6547");
    physics.box(-11.5, 0.7, z, 0.9, 0.7, 1.75);
    for (let i = 0; i < 5; i++)
      pottery(scene, -11.3, 1.4, z - 1.3 + i * 0.6, 0.6 + (i % 2) * 0.4);
    const textile = slab(
      scene,
      -12.3,
      3.6,
      z,
      0.035,
      3,
      2.7,
      "#9d6850",
      "weave",
    );
  }
  const mirror = ring(scene, -8, 2.1, 2, 1.2, 0.1, "#b7b3a1");
  mirror.scale.y = 1.35;
  mirror.rotation.y = Math.PI / 2;
  const glass = mesh(
    scene,
    new T.CircleGeometry(1.1, 40),
    new T.MeshStandardMaterial({
      color: "#9cb8ae",
      metalness: 0.65,
      roughness: 0.18,
    }),
    [-7.98, 2.1, 2],
  );
  glass.scale.y = 1.35;
  glass.rotation.y = Math.PI / 2;
  slab(scene, 10.6, 1.6, 1, 3.2, 3.2, 1.5, "#8c6d4e");
  slab(scene, 10.6, 1.7, 1.79, 2.8, 2.8, 0.03, "#6a7a69", "weave");
  physics.box(10.6, 1.6, 1, 1.6, 1.6, 0.8);
  slab(scene, 8, 0.85, 8, 3, 0.14, 1.6, "#a4825b");
  for (const x of [6.7, 9.3])
    for (const z of [7.4, 8.6])
      box(scene, x, 0.42, z, 0.14, 0.84, 0.14, "#73593f");
  box(scene, 8, 1, 8, 0.8, 0.12, 1, "#70594a");
  text(scene, "YOUR JOURNEYS", 8, 1.25, 8, 0.9);
  lantern(scene, 9, 1.35, 8);
  physics.box(8, 0.5, 8, 1.5, 0.5, 0.8);
  const clasp = new T.Group();
  clasp.position.set(5, 0.8, -4);
  scene.add(clasp);
  slab(scene, 5, 0.35, -4, 1, 0.7, 1, "#9b8062");
  silverClasp(clasp, 0, 0.8, 0, 1.8);
  const keepsake = new T.Group();
  keepsake.position.set(7, 0.8, -6);
  scene.add(keepsake);
  pottery(keepsake, 0, 0, 0, 1.3, "#a6754e");
  lantern(keepsake, 0, 1.1, 0);
  text(scene, "A HOME FOR EVERY STORY", 0, 5.7, -12, 9, "#f2dcac");
  const portals = [
    portal(scene, -5, 0, -9, "#91b89a", "TIZI HIGHLANDS"),
    portal(scene, 5, 0, -9, "#75b7ad", "TARGA OASIS"),
    portal(scene, 0, 0, -13, "#8a8b78", "OTHER REGIONS · LOCKED"),
  ];
  portals[2].scale.setScalar(0.65);
  for (const x of [-5, 5]) physics.cameraPanel(x, 0, -9);
  physics.cameraPanel(0, 0, -13);
  for (const x of [-10, 10])
    for (const z of [-10, 9]) lantern(scene, x, 4.3, z, "#e7be80");
  for (let i = 0; i < 9; i++) {
    const x = Math.sin(i * 2.4) * 55,
      z = 40 + Math.cos(i * 2.4) * 35;
    const rock = mesh(
      scene,
      new T.CylinderGeometry(4 + (i % 3), 6, 7, 7),
      mat("#596c68"),
      [x, -3 + (i % 3) * 4, z],
    );
    if (i % 2 === 0) cedar(scene, x, 0.6 + (i % 3) * 4, z, 0.65);
  }
  const motes = new Motes(scene, 65, 22, "#e8c99d");
  batchStatic(scene, [
    ...portals,
    fire,
    mounted,
    clasp,
    keepsake,
    motes.object,
    exterior,
    basin,
  ]);
  return {
    id: "home",
    scene,
    physics,
    spawn: [0, 7],
    sun,
    interactions: [
      {
        id: "wardrobe",
        position: new T.Vector3(9, 0, 2),
        label: "Open your woven chest",
        radius: 2.7,
      },
      {
        id: "mirror",
        position: new T.Vector3(-6.5, 0, 2),
        label: "Meet your reflection",
      },
      {
        id: "display",
        position: new T.Vector3(-8, 0, -3),
        label: "Display the Dawnblade",
      },
      {
        id: "journal",
        position: new T.Vector3(7, 0, 7),
        label: "Open your journey book",
      },
      {
        id: "portal-lumen",
        position: new T.Vector3(-5, 0, -7),
        label: "Travel to Tizi Highlands",
        radius: 2.7,
      },
      {
        id: "portal-city",
        position: new T.Vector3(5, 0, -7),
        label: "Travel to Targa Oasis",
        radius: 2.7,
      },
      {
        id: "locked",
        position: new T.Vector3(0, 0, -11),
        label: "Look toward future regions",
        radius: 2,
      },
    ],
    update(t, dt, s) {
      updatePortals(scene, t);
      motes.update(t);
      fire.children.forEach(
        (o, i) => (o.scale.y = 0.8 + Math.sin(t * 7 + i) * 0.2),
      );
      glow.intensity = 17 + Math.sin(t * 8);
      mounted.visible = s.home.sword;
      clasp.visible = s.inventory.includes("oasis-clasp");
      keepsake.visible = s.inventory.includes("moonfern-lantern");
      exterior.visible = Boolean(scene.userData.exterior);
    },
    dispose() {
      disposeScene(scene);
      physics.dispose();
    },
  };
}
