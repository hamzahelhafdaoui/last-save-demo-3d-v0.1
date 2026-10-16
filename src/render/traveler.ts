import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Appearance } from "../state/model";
import { makeSword, box, mat } from "./kit";
let template: Promise<T.Group> | null = null;
export class Traveler {
  root = new T.Group();
  visual: T.Object3D;
  private parts = new Map<string, T.Object3D>();
  private base = new Map<string, T.Vector3>();
  private gait = 0;
  sword = makeSword();
  private jacket = new T.Group();
  private appearanceKey = "";
  private constructor(visual: T.Object3D) {
    this.visual = visual;
    this.root.add(visual);
    this.root.rotation.y = Math.PI;
    visual.traverse((o) => {
      if ((o as T.Mesh).isMesh) {
        const m = o as T.Mesh;
        if (!Array.isArray(m.material)) m.material = m.material.clone();
        m.castShadow = true;
        m.receiveShadow = true;
      }
      this.parts.set(o.name, o);
      this.base.set(o.name, o.position.clone());
    });
    this.root.updateMatrixWorld(true);
    for (const side of ["L", "R"]) {
      const paw = this.parts.get("Paw_" + side)!;
      for (let i = 0; i < 3; i++) {
        const finger = this.parts.get("Finger_" + side + "_" + i);
        if (finger) paw.attach(finger);
      }
    }
    this.sword.scale.setScalar(0.72);
    this.sword.position.set(0.22, 1.18, -0.23);
    this.sword.rotation.set(0.1, 0, -0.48);
    this.root.add(this.sword);
    this.sword.visible = false;
    box(this.jacket, 0, 1.02, 0, 0.58, 0.52, 0.44, "#24263e");
    box(this.jacket, 0, 1.27, -0.02, 0.55, 0.12, 0.42, "#e3bc82");
    for (const s of [-1, 1]) {
      const lapel = box(
        this.jacket,
        s * 0.16,
        1.19,
        0.24,
        0.13,
        0.34,
        0.07,
        "#d6ab84",
      );
      lapel.rotation.z = -s * 0.28;
      box(this.jacket, s * 0.2, 0.92, 0.245, 0.14, 0.035, 0.025, "#8c57ad");
    }
    this.root.add(this.jacket);
    this.jacket.visible = false;
  }
  static async load() {
    template ||= new GLTFLoader()
      .loadAsync("/assets/traveler.glb")
      .then((g) => g.scene);
    return new Traveler((await template).clone(true));
  }
  appearance(a: Appearance, jacket = false, sword = false) {
    this.sword.visible = sword;
    this.jacket.visible = jacket;
    const key = JSON.stringify(a) + jacket;
    if (key === this.appearanceKey) return;
    this.appearanceKey = key;
    this.visual.traverse((o) => {
      if (!(o instanceof T.Mesh) || Array.isArray(o.material)) return;
      const m = o.material as T.MeshStandardMaterial;
      if (m.name.includes("Warm ochre")) m.color.set(a.fur);
      if (m.name.includes("Deep teal"))
        m.color.set(jacket ? "#24263e" : a.primary);
      if (m.name.includes("Scarf amber")) m.color.set(a.secondary);
      if (m.name.includes("Forelock")) m.color.set(a.hair);
      if (
        o.name.startsWith("Eye") &&
        !o.name.includes("white") &&
        !o.name.includes("sparkle")
      )
        m.color.set(a.eyes);
      if (o.name.startsWith("Forelock"))
        o.scale.setScalar(1 + a.hairStyle * 0.28);
      if (o.name.startsWith("Ear"))
        o.scale.y =
          a.preset === "moon" ? 0.72 : a.preset === "russet" ? 1.16 : 1;
      if (o.name.includes("Satchel") || o.name.includes("strap"))
        o.visible = a.accessory;
    });
  }
  pose(reach: number, strain: number, raise: number, grip: number) {
    const part = (n: string) => this.parts.get(n)!;
    part("Arm_R").rotation.x = -reach * 1.65 - raise * 0.95;
    part("Arm_L").rotation.x = -reach * 1.2 - raise * 0.7;
    part("Forearm_R").rotation.x = -0.3 - reach * 0.55 + raise * 0.3;
    part("Forearm_L").rotation.x = -0.35 - reach * 0.7;
    part("Body").rotation.x = strain * 0.24;
    part("Head").rotation.x = -raise * 0.3;
    for (const side of ["L", "R"])
      for (let i = 0; i < 3; i++) {
        const p = this.parts.get("Finger_" + side + "_" + i);
        if (p) p.rotation.x = grip * 1.25;
      }
  }
  // Two-bone reach keeps the animated paw on a moving hilt rather than near it.
  grasp(target: T.Vector3, weight: number) {
    for (const side of ["R", "L"]) {
      const upper = this.parts.get("Arm_" + side)!,
        lower = this.parts.get("Forearm_" + side)!,
        paw = this.parts.get("Paw_" + side)!;
      this.root.updateMatrixWorld(true);
      const shoulder = upper.getWorldPosition(new T.Vector3()),
        elbow = lower.getWorldPosition(new T.Vector3()),
        hand = paw.getWorldPosition(new T.Vector3());
      const goal = hand
        .clone()
        .lerp(
          target.clone().add(new T.Vector3(0, side === "L" ? 0.07 : 0, 0)),
          weight,
        );
      const direction = goal.clone().sub(shoulder),
        distance = direction.length();
      direction.normalize();
      const l1 = shoulder.distanceTo(elbow),
        restL2 = elbow.distanceTo(hand),
        l2 = Math.max(restL2, distance - l1 + 0.015);
      const along = T.MathUtils.clamp(
        (l1 * l1 - l2 * l2 + distance * distance) /
          (2 * Math.max(0.001, distance)),
        0,
        l1,
      );
      const bend = new T.Vector3(side === "L" ? 0.25 : -0.25, -1, 0.1)
        .addScaledVector(
          direction,
          -new T.Vector3(side === "L" ? 0.25 : -0.25, -1, 0.1).dot(direction),
        )
        .normalize();
      const desiredElbow = shoulder
        .clone()
        .addScaledVector(direction, along)
        .addScaledVector(bend, Math.sqrt(Math.max(0, l1 * l1 - along * along)));
      const elbowLocal = upper
        .parent!.worldToLocal(desiredElbow)
        .sub(upper.position);
      upper.quaternion.setFromUnitVectors(
        lower.position.clone().normalize(),
        elbowLocal.normalize(),
      );
      this.root.updateMatrixWorld(true);
      const desired = lower
          .parent!.worldToLocal(goal.clone())
          .sub(lower.position),
        rest = paw.position.clone();
      const stretch = Math.max(
        0.8,
        desired.length() / Math.max(0.01, rest.length()),
      );
      lower.scale.setScalar(stretch);
      lower.quaternion.setFromUnitVectors(
        rest.normalize(),
        desired.normalize(),
      );
      // Keep the hand silhouette while the sleeve extends into the reach.
      for (const child of lower.children)
        if (child.name.startsWith("Paw") || child.name.startsWith("Finger"))
          child.scale.setScalar(1 / stretch);
    }
    this.root.updateMatrixWorld(true);
  }
  handPosition() {
    const p = this.parts.get("Paw_R") || this.parts.get("Forearm_R")!;
    return p.getWorldPosition(new T.Vector3());
  }
  update(
    position: { x: number; y: number; z: number },
    velocity: { x: number; y: number; z: number },
    grounded: boolean,
    dt: number,
    time: number,
  ) {
    this.root.position.set(position.x, position.y, position.z);
    for (const side of ["L", "R"]) {
      const arm = this.parts.get("Arm_" + side)!,
        forearm = this.parts.get("Forearm_" + side)!;
      arm.rotation.set(0, 0, 0);
      forearm.rotation.set(0, 0, 0);
      forearm.scale.setScalar(1);
      for (const c of forearm.children)
        if (c.name.startsWith("Paw") || c.name.startsWith("Finger"))
          c.scale.setScalar(1);
    }

    const speed = Math.hypot(velocity.x, velocity.z),
      moving = Math.min(1, speed / 2),
      run = Math.min(1, Math.max(0, (speed - 3) / 3));
    if (speed > 0.12) {
      const target = Math.atan2(velocity.x, velocity.z);
      const delta =
        T.MathUtils.euclideanModulo(
          target - this.root.rotation.y + Math.PI,
          Math.PI * 2,
        ) - Math.PI;
      this.root.rotation.y += delta * (1 - Math.exp(-dt * 12));
    }
    this.gait += dt * (speed > 3.5 ? 11 : 8) * moving;
    const swing = Math.sin(this.gait) * (run * 0.3 + 0.42) * moving;
    for (const [name, side] of [
      ["Arm_L", 1],
      ["Arm_R", -1],
      ["Leg_L", -1],
      ["Leg_R", 1],
    ] as const) {
      const o = this.parts.get(name);
      if (o)
        o.rotation.x = grounded
          ? swing * side
          : name.startsWith("Arm")
            ? -0.35
            : 0.3;
    }
    for (const name of ["Forearm_L", "Forearm_R"]) {
      const o = this.parts.get(name);
      if (o) o.rotation.x = -0.18 - run * 0.45;
    }
    const body = this.parts.get("Body");
    if (body) {
      body.position.y =
        this.base.get("Body")!.y +
        (grounded ? Math.abs(Math.sin(this.gait)) * moving * 0.045 : 0);
      body.rotation.x = run * 0.1;
      body.rotation.z = Math.sin(this.gait) * moving * 0.025;
    }
    const head = this.parts.get("Head");
    if (head) {
      head.rotation.z = Math.sin(time * 0.8) * 0.025 * (1 - moving);
      head.rotation.x = -run * 0.04;
    }
    const tail = this.parts.get("Tail");
    if (tail)
      tail.rotation.z =
        Math.sin(time * 3) * 0.12 + Math.sin(this.gait) * moving * 0.15;
  }
}
