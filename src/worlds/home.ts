import { batchStatic } from "../render/optimize";
import * as T from "three";
import { Physics } from "../physics/world";
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
  disposeScene,
} from "../render/kit";
import { stars, updatePortals } from "./common";
import type { World } from "./types";
export async function createWorld(): Promise<World> {
  const scene = new T.Scene(),
    physics = new Physics(() => 0, 12.3);
  stars(scene);
  scene.fog = new T.FogExp2("#11152d", 0.006);
  scene.add(new T.HemisphereLight("#b5b3e5", "#5e3e37", 1.6));
  const sun = new T.DirectionalLight("#ffce95", 2.3);
  sun.position.set(-7, 13, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -17,
    right: 17,
    top: 18,
    bottom: -16,
    far: 45,
  });
  scene.add(sun);
  box(scene, 0, -0.32, 0, 26, 0.6, 28, "#4e3840");
  for (let i = 0; i < 26; i++) {
    const z = -13.5 + i * 1.06;
    box(scene, 0, 0, z, 25.8, 0.06, 1, "#70504a");
    for (let j = 0; j < 4; j++)
      box(
        scene,
        -10 + j * 6 + (i % 2) * 2,
        0.04,
        z,
        0.025,
        0.015,
        1,
        "#a17b5b",
      );
  }
  for (const x of [-12.9, 12.9]) {
    box(scene, x, 3.5, 0, 0.35, 7, 28, "#393042");
    physics.box(x, 3.5, 0, 0.25, 4, 14);
    for (let z = -12; z <= 12; z += 4)
      box(scene, x * 0.985, 3.5, z, 0.3, 7, 0.2, "#82674f");
  }
  box(scene, 0, 3.5, -13.8, 26, 7, 0.4, "#353044");
  physics.box(0, 3.5, -13.8, 13, 4, 0.25);
  for (const y of [0.25, 2.1, 6.8]) {
    box(scene, 0, y, -13.5, 26, 0.17, 0.2, "#a47f52");
    for (const x of [-12.6, 12.6])
      box(scene, x, y, 0, 0.17, 0.17, 28, "#a47f52");
  }
  // An open arched celestial window gives the room its luminous backdrop.
  for (const x of [-8, 8]) {
    box(scene, x, 3.5, 13.5, 10, 7, 0.3, "#3d3347");
    physics.box(x, 3.5, 13.5, 5, 4, 0.25);
  }
  physics.box(0, 1, 13.7, 13, 2, 0.2);
  box(scene, 0, 1.1, 13.4, 8, 0.3, 0.6, "#aa8862");
  for (const x of [-3.7, 0, 3.7])
    box(scene, x, 4.2, 13.4, 0.13, 6.1, 0.18, "#bfa578");
  const windowTop = ring(scene, 0, 5.8, 13.4, 3.7, 0.13, "#bfa578");
  windowTop.scale.y = 0.6;
  // Woven rug and the low seating area.
  box(scene, 0, 0.07, 4, 10, 0.05, 7, "#5f4161");
  for (const x of [-4.8, 4.8])
    box(scene, x, 0.105, 4, 0.09, 0.02, 6.8, "#c3a472");
  for (const z of [0.7, 7.3])
    box(scene, 0, 0.105, z, 9.6, 0.02, 0.09, "#c3a472");
  const sofa = new T.Group();
  sofa.position.set(2, 0, 6);
  scene.add(sofa);
  box(sofa, 0, 0.4, 0, 4, 0.6, 1.4, "#344e56");
  box(sofa, 0, 1, 0.55, 4, 1.1, 0.32, "#40616a");
  for (const x of [-1.8, 1.8]) box(sofa, x, 0.77, 0, 0.4, 0.95, 1.6, "#486875");
  for (const x of [-0.95, 0.95])
    box(sofa, x, 0.78, -0.12, 1.65, 0.23, 1.1, "#567b7e");
  physics.box(2, 0.65, 6, 2, 0.7, 0.8);
  for (let i = 0; i < 2; i++) {
    const cushion = box(
      sofa,
      -1.1 + i * 2.2,
      1.1,
      0.2,
      0.68,
      0.58,
      0.24,
      i ? "#d6b273" : "#9f687f",
    );
    cushion.rotation.z = i ? 0.18 : -0.14;
  }
  cyl(scene, 1, 0.65, 3, 1.25, 0.12, "#8e6552");
  for (const x of [0.3, 1.7]) box(scene, x, 0.3, 3, 0.1, 0.6, 0.1, "#4b3a3e");
  box(scene, 0.7, 0.77, 3, 0.6, 0.08, 0.45, "#798377");
  cyl(scene, 1.5, 0.85, 3, 0.1, 0.2, "#e0c4a1");
  // Fireplace, bookcases and Dawnwake's permanent mount.
  box(scene, -11.1, 1.9, -3, 3.4, 3.8, 3.1, "#76626a");
  box(scene, -9.35, 1.05, -3, 0.06, 1.8, 2.2, "#211c29");
  box(scene, -9.2, 2.8, -3, 0.65, 0.28, 3.6, "#c6ab89");
  box(scene, -10.5, 4.5, -3, 2.1, 2.1, 1.8, "#76626a");
  physics.box(-11.1, 2, -3, 1.5, 2, 1.6);
  for (let i = 0; i < 5; i++) {
    const log = cyl(scene, -9.4, 0.32, -3.6 + i * 0.3, 0.13, 1, "#54403b");
    log.rotation.z = Math.PI / 2;
  }
  const fire = new T.Group();
  fire.position.set(-9.3, 0.55, -3);
  scene.add(fire);
  for (let i = 0; i < 6; i++) {
    const flame = mesh(
      fire,
      new T.ConeGeometry(0.17, 0.9, 7),
      mat(i % 2 ? "#ffbd67" : "#ff754f", 0, 2.3),
      [Math.sin(i) * 0.15, 0, (i - 3) * 0.22],
    );
    flame.userData.phase = i;
  }
  const glow = new T.PointLight("#ff9c58", 22, 12, 2);
  glow.position.set(-8.5, 1.5, -3);
  scene.add(glow);
  const mounted = makeSword();
  mounted.position.set(-9.15, 4, -3);
  mounted.rotation.set(0, Math.PI / 2, Math.PI * 0.55);
  mounted.scale.setScalar(0.9);
  scene.add(mounted);
  for (const z of [-9, 3]) {
    box(scene, -12, 2.1, z, 1, 4.2, 3.5, "#644b48");
    for (let shelf = 0; shelf < 5; shelf++) {
      box(scene, -11.45, 0.25 + shelf * 0.87, z, 1.15, 0.12, 3.5, "#a07a59");
      for (let b = 0; b < 9; b++) {
        const book = box(
          scene,
          -11.6,
          0.55 + shelf * 0.87,
          z - 1.45 + b * 0.35,
          0.55,
          0.5 + (b % 3) * 0.07,
          0.24,
          ["#967557", "#527873", "#84617b", "#c5a66b"][b % 4],
        );
        book.rotation.x = ((b % 3) - 1) * 0.08;
      }
    }
    physics.box(-12, 2, z, 0.7, 2, 1.8);
  }
  const desk = new T.Group();
  desk.position.set(8, 0, 8);
  scene.add(desk);
  box(desk, 0, 1, 0, 3, 0.15, 1.6, "#a07654");
  for (const x of [-1.3, 1.3])
    for (const z of [-0.6, 0.6]) box(desk, x, 0.5, z, 0.14, 1, 0.14, "#655046");
  const journal = box(desk, 0, 1.15, 0, 0.7, 0.12, 0.85, "#375b68");
  journal.rotation.y = 0.23;
  text(scene, "YOUR STORY", 8, 1.32, 8, 0.65);
  lantern(scene, 9, 1.5, 8);
  physics.box(8, 0.6, 8, 1.5, 0.6, 0.8);
  // Wardrobe and the enchanted mirror are functional interaction anchors.
  box(scene, 10.6, 1.9, 1, 3.2, 3.8, 1.5, "#5b4d57");
  for (const x of [9.85, 11.35]) {
    box(scene, x, 2, 1.8, 1.35, 3.3, 0.1, "#7c6571");
    ball(scene, x + (x < 10 ? 0.5 : -0.5), 1.8, 1.9, 0.07, "#cbb582");
  }
  physics.box(10.6, 2, 1, 1.6, 2, 0.8);
  const mirror = ring(scene, -8, 2.1, 2, 1.25, 0.12, "#d0aa73");
  mirror.scale.y = 1.35;
  mirror.rotation.y = Math.PI / 2;
  const glass = mesh(
    scene,
    new T.CircleGeometry(1.15, 48),
    new T.MeshStandardMaterial({
      color: "#99babf",
      metalness: 0.7,
      roughness: 0.15,
      emissive: "#7191aa",
      emissiveIntensity: 0.2,
    }),
    [-7.98, 2.1, 2],
  );
  glass.scale.y = 1.35;
  glass.rotation.y = Math.PI / 2;
  const portals = [
    portal(scene, -5, 0, -9, "#81d8b9", "LUMENREACH"),
    portal(scene, 5, 0, -9, "#d985d5", "VELVET CITY"),
    portal(scene, 0, 0, -13, "#6d708b", "UNWRITTEN · LOCKED"),
  ];
  portals[2].scale.setScalar(0.7);
  for (const x of [-10, 10])
    for (const z of [-10, 9]) {
      lantern(scene, x, 4.8, z);
    }
  const keepsake = new T.Group();
  keepsake.position.set(6, 0, -4);
  scene.add(keepsake);
  cyl(keepsake, 0, 0.65, 0, 0.6, 1.3, "#7c6972");
  lantern(keepsake, 0, 1.75, 0, "#bfe2cd");
  text(keepsake, "A LIGHT FOR THE LOST", 0, 1.1, 0.65, 2, "#dcc8a8");
  const motes = new Motes(scene, 90, 22, "#ffd7a1");
  // The opening sees a complete house; the roof cuts away after the camera enters.
  const exterior = new T.Group();
  scene.add(exterior);
  for (const side of [-1, 1]) {
    const roof = box(exterior, side * 6.8, 9.3, 0, 14.5, 0.32, 29.7, "#4c526e");
    roof.rotation.z = -side * 0.3;
    for (let row = 0; row < 10; row++) {
      const x = side * (0.6 + row * 1.35),
        y = 11.45 - Math.abs(x) * 0.3;
      box(exterior, x, y + 0.15, 0, 0.08, 0.08, 29.8, "#7e7b93");
    }
    for (let z = -13; z <= 13; z += 3.1)
      box(
        exterior,
        side * 6.8,
        9.36,
        z,
        14.5,
        0.045,
        0.045,
        "#777087",
      ).rotation.z = -side * 0.3;
  }
  const shape = new T.Shape();
  shape.moveTo(-13.5, 7);
  shape.lineTo(0, 11.7);
  shape.lineTo(13.5, 7);
  shape.closePath();
  for (const z of [-14, 14])
    mesh(
      exterior,
      new T.ShapeGeometry(shape),
      new T.MeshStandardMaterial({ color: "#6f5960", side: T.DoubleSide }),
      [0, 0, z],
    );
  box(exterior, 0, 11.65, 0, 0.27, 0.24, 30.5, "#b49a76");
  for (const x of [-13.12, 13.12])
    for (const z of [-9, 0, 9]) {
      const g = new T.Group();
      g.position.set(x, 3.7, z);
      g.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2;
      exterior.add(g);
      box(g, 0, 0, 0, 2.7, 3.3, 0.12, "#9b7f68");
      mesh(
        g,
        new T.PlaneGeometry(2.4, 2.9),
        mat("#f4bd7e", 0, 0.7),
        [0, 0, 0.08],
      );
      box(g, 0, 0, 0.13, 0.12, 3, 0.12, "#776051");
      box(g, 0, 0, 0.13, 2.5, 0.12, 0.12, "#776051");
    }
  const island = mesh(
    exterior,
    new T.ConeGeometry(20, 15, 9),
    mat("#414359"),
    [0, -8, 0],
  );
  island.rotation.z = Math.PI;
  island.scale.z = 0.85;
  cyl(exterior, 0, -0.6, 0, 18, 1.1, "#5d625f");
  // Floating neighboring islands remain outside the playable room.
  for (let i = 0; i < 9; i++) {
    const x = Math.sin(i * 2.4) * 55,
      z = 40 + Math.cos(i * 2.4) * 35;
    const island = mesh(
      scene,
      new T.ConeGeometry(5 + (i % 3), 7, 7),
      mat("#343551"),
      [x, 2 + (i % 3) * 6, z],
    );
    island.rotation.z = Math.PI;
    mesh(
      scene,
      new T.CylinderGeometry(5 + (i % 3), 5 + (i % 3), 0.5, 10),
      mat("#526972"),
      [x, 5.6 + (i % 3) * 6, z],
    );
    if (i % 2 === 0) {
      const p = portal(scene, x, 6 + (i % 3) * 6, z, "#b69ad9", "");
      p.scale.setScalar(0.65);
    }
  }
  batchStatic(scene, [
    ...portals,
    fire,
    mounted,
    motes.object,
    exterior,
    keepsake,
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
        label: "Open wardrobe",
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
        label: "Display Dawnwake",
      },
      {
        id: "journal",
        position: new T.Vector3(7, 0, 7),
        label: "Read your journal",
      },
      {
        id: "portal-lumen",
        position: new T.Vector3(-5, 0, -7),
        label: "Travel to Lumenreach",
      },
      {
        id: "portal-city",
        position: new T.Vector3(5, 0, -7),
        label: "Travel to Velvet City",
      },
      {
        id: "locked",
        position: new T.Vector3(0, 0, -11),
        label: "An unwritten world",
      },
    ],
    update(t, dt, s) {
      keepsake.visible = s.inventory.includes("moonfern-lantern");
      exterior.visible = scene.userData.exterior === true;
      motes.update(t);
      updatePortals(scene, t);
      mounted.visible = s.home.sword;
      for (const o of fire.children) {
        o.scale.y = 0.8 + Math.sin(t * 5 + o.userData.phase) * 0.22;
        o.rotation.y = t * 0.4;
      }
      glow.intensity = 19 + Math.sin(t * 7) * 2;
      const city = portals[1].userData.portal as T.ShaderMaterial;
      city.uniforms.strength.value = s.quest.sword ? 1 : 0.2;
    },
    dispose() {
      physics.dispose();
      disposeScene(scene);
    },
  };
}
