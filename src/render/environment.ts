import * as T from "three";
import {
  ground,
  riverZ,
  trailX,
  random,
  hash,
  SIZE,
  SEGMENTS,
} from "../simulation/terrain";
import { Physics } from "../physics/world";
import { material, noiseTexture } from "./materials";
import { batchStatic } from "./optimize";
import { particleTexture } from "./kit";
export type Interaction = {
  id: string;
  position: T.Vector3;
  label: string;
  kind: string;
};
export class Environment {
  interactions: Interaction[] = [];
  water: T.Mesh;
  bell: T.Group;
  gate: T.Group;
  smoke: T.Points;
  fireflies: T.Points;
  windmill: T.Group;
  lit = false;
  private leaves: T.InstancedMesh;
  private bladeMaterial: T.MeshStandardMaterial;
  sky: T.Mesh;
  sun!: T.DirectionalLight;
  constructor(
    public scene: T.Scene,
    public physics: Physics,
  ) {
    scene.background = new T.Color("#68698d");
    scene.fog = new T.FogExp2("#7a7897", 0.0068);
    const hemi = new T.HemisphereLight("#b1a4da", "#6e6558", 1.55);
    scene.add(hemi);
    const sun = new T.DirectionalLight("#ffd6b4", 2.6);
    this.sun = sun;
    sun.position.set(-38, 65, 28);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -58;
    sun.shadow.camera.right = 58;
    sun.shadow.camera.top = 58;
    sun.shadow.camera.bottom = -58;
    sun.shadow.camera.far = 160;
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.03;
    scene.add(sun);
    scene.add(sun.target);
    this.sky = new T.Mesh(
      new T.SphereGeometry(420, 32, 16),
      new T.ShaderMaterial({
        side: T.BackSide,
        uniforms: {
          top: { value: new T.Color("#484b83") },
          bottom: { value: new T.Color("#d0a5bc") },
        },
        vertexShader:
          "varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "varying vec3 v;uniform vec3 top;uniform vec3 bottom;void main(){float h=clamp(normalize(v).y*1.6,0.,1.);gl_FragColor=vec4(mix(bottom,top,h),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
        depthWrite: false,
      }),
    );
    scene.add(this.sky);
    // Curved terrain with a painted trail, riverbed, meadow and wooded ridges.
    const geo = new T.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position,
      col = [];
    const a = new T.Color(),
      grass = new T.Color("#638c5b"),
      path = new T.Color("#b7ab7e"),
      shore = new T.Color("#b4b69a");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i),
        y = ground(x, z);
      pos.setY(i, y);
      const n = hash(Math.floor(x * 2), Math.floor(z * 2));
      a.copy(grass).multiplyScalar(0.88 + n * 0.22);
      const track = Math.abs(x - trailX(z));
      if (track < 2.1 && z < 40 && z > -52)
        a.lerp(path, Math.min(1, (2.1 - track) * 1.6));
      if (Math.abs(z - riverZ(x)) < 7) a.lerp(shore, 0.7);
      if (x > 19 && z < -23) a.lerp(new T.Color("#8e9860"), 0.24);
      col.push(a.r, a.g, a.b);
    }
    geo.setAttribute("color", new T.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const land = new T.Mesh(
      geo,
      new T.MeshStandardMaterial({
        vertexColors: true,
        map: noiseTexture(),
        roughness: 1,
      }),
    );
    land.receiveShadow = true;
    scene.add(land);
    const wg = new T.PlaneGeometry(190, 7.4, 150, 4);
    wg.rotateX(-Math.PI / 2);
    for (let i = 0; i < wg.attributes.position.count; i++) {
      const x = wg.attributes.position.getX(i),
        z = wg.attributes.position.getZ(i);
      wg.attributes.position.setXYZ(i, x, 0.62, z + riverZ(x));
    }
    wg.computeVertexNormals();
    this.water = new T.Mesh(
      wg,
      new T.MeshPhysicalMaterial({
        color: "#5faaa7",
        roughness: 0.22,
        metalness: 0.2,
        transparent: true,
        opacity: 0.84,
        clearcoat: 1,
      }),
    );
    this.water.receiveShadow = true;
    scene.add(this.water);
    const rand = random(1701),
      dummy = new T.Object3D();
    // Mixed-height woodland, with pooled geometry for the forest canopy.
    const trunks = new T.InstancedMesh(
      new T.CylinderGeometry(0.32, 0.54, 1, 7),
      material("#66523c"),
      300,
    );
    this.leaves = new T.InstancedMesh(
      new T.IcosahedronGeometry(1, 2),
      material("#527c42"),
      1200,
    );
    const pines = new T.InstancedMesh(
      new T.ConeGeometry(1, 1, 11),
      material("#41674a"),
      900,
    );
    const treeList: Array<[number, number, number]> = [];
    let ti = 0,
      li = 0,
      pi = 0;
    for (let i = 0; i < 300; i++) {
      const x = (rand() - 0.5) * 155,
        z = (rand() - 0.5) * 155;
      if (
        Math.abs(z - riverZ(x)) < 8 ||
        Math.abs(x - trailX(z)) < 4.2 ||
        Math.hypot(x, z + 35) < 21 ||
        Math.hypot(x - 32, z + 36) < 9 ||
        Math.hypot(x - 7, z - 25) < 6
      )
        continue;
      const y = ground(x, z),
        h = 5 + rand() * 8,
        sz = 0.8 + rand() * 0.5;
      treeList.push([x, z, h]);
      dummy.position.set(x, y + h * 0.4, z);
      dummy.rotation.set(0, rand() * 6.28, (rand() - 0.5) * 0.1);
      dummy.scale.set(sz, h * 0.8, sz);
      dummy.updateMatrix();
      trunks.setMatrixAt(ti++, dummy.matrix);
      this.physics.tree(x, y, z, 0.35 * sz, h * 0.75);
      this.physics.canopy(x, y + h * 0.85, z, h * 0.25);
      if (rand() > 0.55) {
        for (let j = 0; j < 3; j++) {
          dummy.position.set(x, y + h * (0.58 + j * 0.17), z);
          dummy.rotation.set(0, rand() * 6.28, 0);
          dummy.scale.set(
            h * (0.29 - j * 0.055),
            h * 0.43,
            h * (0.29 - j * 0.055),
          );
          dummy.updateMatrix();
          pines.setMatrixAt(pi++, dummy.matrix);
        }
      } else
        for (let j = 0; j < 4; j++) {
          dummy.position.set(
            x + Math.cos(j * 2) * h * 0.13,
            y + h * (0.75 + (j % 2) * 0.15),
            z + Math.sin(j * 2) * h * 0.13,
          );
          dummy.rotation.set(rand() * 0.5, rand() * 6.28, 0);
          dummy.scale.set(h * 0.3, h * 0.22, h * 0.29);
          dummy.updateMatrix();
          this.leaves.setMatrixAt(li, dummy.matrix);
          this.leaves.setColorAt(
            li,
            new T.Color().setHSL(
              0.22 + rand() * 0.045,
              0.28,
              0.28 + rand() * 0.09,
            ),
          );
          li++;
        }
    }
    trunks.count = ti;
    this.leaves.count = li;
    pines.count = pi;
    for (const m of [trunks, this.leaves, pines]) {
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    }
    this.leaves.instanceColor!.needsUpdate = true;
    // Grass clumps and meadow flowers. Each blade has a deliberate silhouette.
    const bg = new T.BufferGeometry(),
      verts: number[] = [];
    for (let j = 0; j < 3; j++) {
      const ang = (j * Math.PI) / 3,
        dx = Math.cos(ang) * 0.1,
        dz = Math.sin(ang) * 0.1;
      verts.push(-dx, 0, -dz, dx, 0, dz, dx * 0.35, 0.36 + 0.06 * j, dz * 0.35);
    }
    bg.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    bg.computeVertexNormals();
    this.bladeMaterial = new T.MeshStandardMaterial({
      color: "#8fae5c",
      side: T.DoubleSide,
      roughness: 1,
    });
    const blades = new T.InstancedMesh(bg, this.bladeMaterial, 6000),
      flowers = new T.InstancedMesh(
        new T.IcosahedronGeometry(0.08, 0),
        material("#eddab5"),
        1000,
      );
    let bi = 0,
      fi = 0;
    for (let i = 0; i < 6500; i++) {
      const x = (rand() - 0.5) * 145,
        z = (rand() - 0.5) * 145;
      if (
        Math.abs(z - riverZ(x)) < 6.4 ||
        Math.abs(x - trailX(z)) < 2.2 ||
        Math.hypot(x, z + 35) < 17
      )
        continue;
      const h = ground(x, z);
      dummy.position.set(x, h, z);
      dummy.rotation.set(0, rand() * 6.28, 0);
      const s = 0.45 + rand() * 0.8;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      blades.setMatrixAt(bi++, dummy.matrix);
      if (i % 8 === 0) {
        dummy.position.y += 0.35;
        dummy.scale.set(1.1, 0.65, 1.1);
        dummy.updateMatrix();
        flowers.setMatrixAt(fi, dummy.matrix);
        flowers.setColorAt(
          fi,
          new T.Color(i % 3 === 0 ? "#c3a6ce" : i % 2 ? "#f1d79d" : "#e8e6ce"),
        );
        fi++;
      }
    }
    blades.count = bi;
    flowers.count = fi;
    scene.add(blades, flowers);
    const rocks = new T.InstancedMesh(
      new T.IcosahedronGeometry(1, 1),
      material("#969c85"),
      340,
    );
    let ri = 0;
    for (let i = 0; i < 340; i++) {
      const x = (rand() - 0.5) * 170,
        z =
          i < 200
            ? riverZ(x) + (i % 2 ? 1 : -1) * (5 + rand() * 2)
            : (rand() - 0.5) * 165;
      if (Math.abs(x - trailX(z)) < 3) continue;
      dummy.position.set(x, ground(x, z) - 0.2, z);
      dummy.rotation.set(rand(), rand() * 6.28, rand());
      const s = 0.3 + rand() * 0.9;
      dummy.scale.set(s, s * 0.65, s * 1.3);
      dummy.updateMatrix();
      rocks.setMatrixAt(ri++, dummy.matrix);
    }
    rocks.count = ri;
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    scene.add(rocks);
    // Bridge is a proper collision surface, raised above the river.
    this.bridge(-0.5, -12);
    this.cottage(-8, -30, 0, 1.05, "#6d777a");
    this.cottage(9, -37, -0.35, 1.1, "#966b50");
    this.cottage(-12, -43, 0.5, 0.85, "#657a72");
    this.cottage(2, -50, 0.15, 0.9, "#8c6259");
    this.well(0, -34);
    this.sign(7, 16, "BELLHAVEN", -0.2);
    this.sign(15, -24, "CROWNSTONE SANCTUARY", 0.5);
    this.bell = this.bellTower(4, -38);
    this.gate = this.portal(-7, -49);
    this.windmill = this.mill(-37, -62);
    this.interactions.push(
      {
        id: "bell",
        position: new T.Vector3(33, ground(33, -38), -36),
        label: "Ring the homeward bell",
        kind: "CROWNSTONE SANCTUARY",
      },
      {
        id: "well",
        position: new T.Vector3(0, ground(0, -34), -32),
        label: "Rest by the well",
        kind: "BELLHAVEN",
      },
      {
        id: "gate",
        position: new T.Vector3(-7, ground(-7, -49), -47),
        label: "Listen at the old doorway",
        kind: "A WORLD BEYOND",
      },
    );
    this.interactions = [];
    // Broken walls and towers on the distant ridge, visible as an exploration promise.
    this.ruins(-7, -78);
    this.mountains(rand);
    const smokePos = [];
    for (let i = 0; i < 28; i++)
      smokePos.push(
        -8 + (rand() - 0.5) * 0.4,
        ground(-8, -30) + 6 + i * 0.18,
        -30,
      );
    this.smoke = new T.Points(
      new T.BufferGeometry().setAttribute(
        "position",
        new T.Float32BufferAttribute(smokePos, 3),
      ),
      new T.PointsMaterial({
        map: particleTexture(),
        color: "#e9dfcc",
        size: 0.7,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      }),
    );
    scene.add(this.smoke);
    const fp = [];
    for (let i = 0; i < 65; i++)
      fp.push((rand() - 0.5) * 90, 1 + rand() * 9, (rand() - 0.5) * 85);
    this.fireflies = new T.Points(
      new T.BufferGeometry().setAttribute(
        "position",
        new T.Float32BufferAttribute(fp, 3),
      ),
      new T.PointsMaterial({
        map: particleTexture(),
        color: "#fff0bc",
        size: 0.07,
        transparent: true,
        opacity: 0.7,
      }),
    );
    scene.add(this.fireflies);
    batchStatic(scene, [
      this.sky,
      this.water,
      this.bell,
      this.gate,
      this.windmill,
      this.smoke,
      this.fireflies,
    ]);
  }
  mesh(
    g: T.BufferGeometry,
    m: T.Material,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D = this.scene,
  ) {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  box(
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    color: string,
    parent: T.Object3D = this.scene,
  ) {
    return this.mesh(
      new T.BoxGeometry(sx, sy, sz),
      material(color),
      x,
      y,
      z,
      parent,
    );
  }
  bridge(x: number, z: number) {
    const y = 2.75;
    this.box(x, y, z, 5, 0.65, 21, "#9d9c89");
    this.physics.box(x, y, z, 2.5, 0.325, 10.5);
    for (const side of [-1, 1]) {
      const edge = z + side * 10.5,
        outer = edge + side * 4.3,
        low = ground(x, outer) + 0.04,
        high = y + 0.325;
      const vertices = [
          x - 2.5,
          high,
          edge,
          x + 2.5,
          high,
          edge,
          x - 2.5,
          low,
          outer,
          x + 2.5,
          low,
          outer,
        ],
        indices = side > 0 ? [0, 2, 1, 1, 2, 3] : [0, 1, 2, 1, 3, 2];
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const ramp = new T.Mesh(
        geo,
        new T.MeshStandardMaterial({
          color: "#a5a18b",
          roughness: 1,
          side: T.DoubleSide,
        }),
      );
      ramp.receiveShadow = true;
      this.scene.add(ramp);
      this.physics.surface(vertices, indices);
    }
    for (const side of [-1, 1]) {
      for (let j = 0; j < 6; j++) {
        const zz = z - 9 + j * 3.6;
        this.box(x + side * 2.35, y + 0.8, zz, 0.45, 1.8, 0.6, "#a6a28c");
      }
      this.box(x + side * 2.35, y + 1.1, z, 0.32, 0.24, 20.4, "#777c6a");
      this.physics.box(x + side * 2.35, y + 0.85, z, 0.24, 0.9, 10.2);
    }
    for (let i = 0; i < 16; i++)
      this.box(x, y + 0.34, z - 9.6 + i * 1.27, 4.8, 0.06, 0.045, "#777e6c");
    for (const zz of [z - 9, z + 9])
      this.box(x, y - 1.4, zz, 5, 2.8, 1.6, "#929782");
  }
  cottage(x: number, z: number, angle: number, scale: number, roof: string) {
    const y = ground(x, z),
      g = new T.Group();
    g.position.set(x, y, z);
    g.rotation.y = angle;
    g.scale.setScalar(scale);
    this.scene.add(g);
    this.box(0, 1.6, 0, 5, 3.2, 4, "#dbcda5", g);
    this.box(0, 0.15, 0, 5.4, 0.4, 4.4, "#96947e", g);
    for (const xx of [-2.45, 0, 2.45])
      this.box(xx, 1.6, 2.03, 0.13, 3.2, 0.14, "#65513a", g);
    for (const yy of [0.5, 2.9])
      this.box(0, yy, 2.05, 5.15, 0.13, 0.13, "#65513a", g);
    // Gabled roof, with overhanging eaves and repeated tile courses.
    const rg = new T.BufferGeometry();
    rg.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        [
          -2.9, 3.15, -2.5, 2.9, 3.15, -2.5, 0, 5.1, -2.5, -2.9, 3.15, 2.5, 0,
          5.1, 2.5, 2.9, 3.15, 2.5, -2.9, 3.15, -2.5, 0, 5.1, -2.5, -2.9, 3.15,
          2.5, 0, 5.1, -2.5, 0, 5.1, 2.5, -2.9, 3.15, 2.5, 0, 5.1, -2.5, 2.9,
          3.15, -2.5, 0, 5.1, 2.5, 2.9, 3.15, -2.5, 2.9, 3.15, 2.5, 0, 5.1, 2.5,
        ],
        3,
      ),
    );
    rg.computeVertexNormals();
    this.mesh(
      rg,
      new T.MeshStandardMaterial({
        color: roof,
        roughness: 1,
        side: T.DoubleSide,
      }),
      0,
      0,
      0,
      g,
    );
    for (const side of [-1, 1])
      for (let i = 0; i < 7; i++) {
        const xx = side * (0.18 + i * 0.42),
          yy = 5.1 - Math.abs(xx) * 0.675;
        this.box(xx, yy + 0.035, 0, 0.065, 0.06, 5.1, "#465e58", g);
      }
    this.box(-0.7, 1.2, 2.09, 1.05, 2.4, 0.12, "#526b61", g);
    this.box(-0.7, 2.46, 2.13, 1.35, 0.17, 0.15, "#68533c", g);
    this.mesh(
      new T.SphereGeometry(0.055, 8, 6),
      material("#c9aa66"),
      -0.36,
      1.1,
      2.22,
      g,
    );
    for (const xx of [1.35, -1.65]) {
      this.box(xx, 1.85, 2.09, 0.78, 0.86, 0.13, "#68654c", g);
      this.box(xx, 1.85, 2.18, 0.61, 0.69, 0.03, "#f2d393", g);
      this.box(xx, 1.85, 2.22, 0.04, 0.76, 0.04, "#66533c", g);
      this.box(xx, 1.85, 2.22, 0.7, 0.04, 0.04, "#66533c", g);
      this.box(xx, 1.25, 2.25, 1, 0.22, 0.45, "#79674b", g);
      for (let j = 0; j < 5; j++)
        this.mesh(
          new T.IcosahedronGeometry(0.12, 0),
          material(j % 2 ? "#b58a9b" : "#6e8749"),
          xx - 0.35 + j * 0.17,
          1.46,
          2.25,
          g,
        );
    }
    this.box(1.4, 4.8, -0.65, 0.65, 2, 0.7, "#aaa08a", g);
    this.box(1.4, 5.8, -0.65, 0.85, 0.2, 0.9, "#736f60", g);
    this.physics.box(
      x,
      y + 1.8 * scale,
      z,
      2.5 * scale,
      1.8 * scale,
      2 * scale,
      angle,
    );
  }
  well(x: number, z: number) {
    const y = ground(x, z);
    this.mesh(
      new T.CylinderGeometry(1.2, 1.3, 0.9, 12),
      material("#a8a48c"),
      x,
      y + 0.45,
      z,
    );
    this.mesh(
      new T.CylinderGeometry(0.85, 0.85, 0.93, 16),
      material("#334f50"),
      x,
      y + 0.48,
      z,
    );
    for (const xx of [-1.4, 1.4])
      this.box(x + xx, y + 1.6, z, 0.18, 3.2, 0.18, "#69553b");
    this.box(x, y + 3.2, z, 3.1, 0.15, 0.25, "#69553b");
    this.physics.tree(x, y, z, 1.15, 1);
  }
  sign(x: number, z: number, text: string, angle: number) {
    const y = ground(x, z),
      g = new T.Group();
    g.position.set(x, y, z);
    g.rotation.y = angle;
    this.scene.add(g);
    this.box(0, 0.9, 0, 0.12, 1.8, 0.14, "#695740", g);
    this.box(0, 1.7, 0, 1.9, 0.4, 0.12, "#79644a", g);
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#e5d9b8";
    ctx.font = "bold 28px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(text, 256, 74);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    const m = new T.Mesh(
      new T.PlaneGeometry(1.75, 0.36),
      new T.MeshBasicMaterial({ map: t, transparent: true }),
    );
    m.position.set(0, 1.7, 0.07);
    g.add(m);
  }
  bellTower(x: number, z: number) {
    const y = ground(x, z),
      g = new T.Group();
    g.position.set(x, y, z);
    this.scene.add(g);
    this.box(0, 0.2, 0, 4, 0.4, 4, "#a6a48a", g);
    for (const xx of [-1.4, 1.4])
      for (const zz of [-1.2, 1.2]) {
        this.box(xx, 2.5, zz, 0.24, 5, 0.24, "#65543d", g);
        this.physics.box(x + xx, y + 2.5, z + zz, 0.13, 2.5, 0.13);
      }
    this.box(0, 4.8, 0, 3.4, 0.25, 3.2, "#705d41", g);
    const roof = this.mesh(
      new T.ConeGeometry(2.9, 1.4, 4),
      material("#5e7877"),
      0,
      5.5,
      0,
      g,
    );
    roof.rotation.y = Math.PI / 4;
    const bell = new T.Group();
    bell.position.set(0, 4.2, 0);
    g.add(bell);
    this.mesh(
      new T.CylinderGeometry(0.36, 0.72, 0.95, 24, 1, true),
      new T.MeshStandardMaterial({
        color: "#b69c61",
        metalness: 0.55,
        roughness: 0.45,
        side: T.DoubleSide,
      }),
      0,
      -0.5,
      0,
      bell,
    );
    this.mesh(
      new T.TorusGeometry(0.7, 0.07, 8, 24),
      material("#c6b17c"),
      0,
      -0.98,
      0,
      bell,
    ).rotation.x = Math.PI / 2;
    this.mesh(
      new T.SphereGeometry(0.12, 12, 8),
      material("#574c34"),
      0,
      -0.9,
      0,
      bell,
    );
    this.box(0.65, 2.1, 0, 0.025, 3.6, 0.025, "#ae9872", g);
    return bell;
  }
  portal(x: number, z: number) {
    const y = ground(x, z),
      g = new T.Group();
    g.position.set(x, y, z);
    this.scene.add(g);
    for (const side of [-1, 1]) {
      this.box(side * 1.4, 2, 0, 0.65, 4, 0.8, "#979d8b", g);
      this.physics.box(x + side * 1.4, y + 2, z, 0.33, 2, 0.4);
    }
    const top = this.mesh(
      new T.TorusGeometry(1.4, 0.33, 6, 20, Math.PI),
      material("#a9ab94"),
      0,
      4,
      0,
      g,
    );
    top.rotation.z = 0;
    this.box(0, 0.12, 0, 3.8, 0.25, 1.5, "#a5aa91", g);
    const film = new T.Mesh(
      new T.PlaneGeometry(2.3, 3.8),
      new T.MeshBasicMaterial({
        color: "#95cfc5",
        transparent: true,
        opacity: 0.03,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    film.name = "gate-light";
    film.position.set(0, 2.1, 0);
    g.add(film);
    return g;
  }
  mill(x: number, z: number) {
    const y = ground(x, z),
      g = new T.Group();
    g.position.set(x, y, z);
    this.scene.add(g);
    this.mesh(
      new T.CylinderGeometry(1.2, 2.1, 8, 8),
      material("#d1c5a4"),
      0,
      4,
      0,
      g,
    );
    this.mesh(new T.ConeGeometry(2, 3, 8), material("#647874"), 0, 9, 0, g);
    const rotor = new T.Group();
    rotor.position.set(0, 7, 1.45);
    g.add(rotor);
    for (let i = 0; i < 4; i++) {
      const arm = new T.Group();
      arm.rotation.z = (i * Math.PI) / 2;
      rotor.add(arm);
      this.box(0, 2.4, 0, 0.12, 4.8, 0.13, "#675842", arm);
      this.box(0.55, 3.2, 0, 1, 2.5, 0.06, "#d9d2ad", arm);
    }
    return rotor;
  }
  ruins(x: number, z: number) {
    const y = ground(x, z) + 6;
    for (let i = 0; i < 5; i++) {
      const xx = x + i * 5 - 10;
      this.box(xx, y + 4, z, 4.8, 8, 2.5, "#9aab9f");
      for (let j = 0; j < 3; j++)
        this.box(xx - 1.5 + j * 1.5, y + 8.6, z, 0.8, 1.3, 2.6, "#a5b4a5");
    }
    for (const xx of [x - 14, x + 14]) {
      this.mesh(
        new T.CylinderGeometry(3.2, 3.5, 17, 9),
        material("#9eafa4"),
        xx,
        y + 8,
        z,
      );
      this.mesh(
        new T.ConeGeometry(4, 7, 9),
        material("#6a8c8c"),
        xx,
        y + 20,
        z,
      );
    }
  }
  mountains(rand: () => number) {
    for (let i = 0; i < 19; i++) {
      const a = (i / 19) * Math.PI * 2,
        dist = 140 + rand() * 40,
        h = 30 + rand() * 65;
      const m = this.mesh(
        new T.ConeGeometry(25 + rand() * 40, h, 5 + Math.floor(rand() * 4)),
        material(i % 2 ? "#8eaaa5" : "#789c9b"),
        Math.sin(a) * dist,
        h / 2 - 8,
        Math.cos(a) * dist,
      );
      m.rotation.y = rand() * 6.28;
      m.castShadow = false;
    }
  }
  ring() {
    this.lit = true;
    const m = (this.gate.getObjectByName("gate-light") as T.Mesh)
      .material as T.MeshBasicMaterial;
    m.opacity = 0.44;
  }
  update(time: number, dt: number) {
    this.windmill.rotation.z = time * 0.12;
    this.fireflies.rotation.y = time * 0.003;
    this.smoke.rotation.y = Math.sin(time * 0.1) * 0.015;
    const a = this.water.geometry.attributes.position;
    for (let i = 0; i < a.count; i++)
      a.setY(i, 0.62 + Math.sin(a.getX(i) * 0.7 + time * 1.5) * 0.027);
    a.needsUpdate = true;
  }
}
