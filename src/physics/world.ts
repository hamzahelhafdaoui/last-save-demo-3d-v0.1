import RAPIER from "@dimforge/rapier3d-compat";
import { ground, SIZE, SEGMENTS } from "../simulation/terrain";
export class Physics {
  world: RAPIER.World;
  controller: RAPIER.KinematicCharacterController;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  velocity = { x: 0, y: 0, z: 0 };
  grounded = false;
  coyote = 0;
  jumpBuffer = 0;
  constructor(
    public height: (x: number, z: number) => number = ground,
    public bounds = 87,
  ) {
    this.world = new RAPIER.World({ x: 0, y: -22, z: 0 });
    const vertices: number[] = [],
      indices: number[] = [];
    for (let z = 0; z <= SEGMENTS; z++)
      for (let x = 0; x <= SEGMENTS; x++) {
        const px = (x / SEGMENTS - 0.5) * SIZE,
          pz = (z / SEGMENTS - 0.5) * SIZE;
        vertices.push(px, this.height(px, pz), pz);
      }
    for (let z = 0; z < SEGMENTS; z++)
      for (let x = 0; x < SEGMENTS; x++) {
        const i = z * (SEGMENTS + 1) + x;
        indices.push(
          i,
          i + SEGMENTS + 1,
          i + 1,
          i + 1,
          i + SEGMENTS + 1,
          i + SEGMENTS + 2,
        );
      }
    this.world.createCollider(
      RAPIER.ColliderDesc.trimesh(
        new Float32Array(vertices),
        new Uint32Array(indices),
      ).setFriction(0.8),
    );
    for (const [x, z, sx, sz] of [
      [-bounds - 2, 0, 2, bounds + 4],
      [bounds + 2, 0, 2, bounds + 4],
      [0, -bounds - 2, bounds + 4, 2],
      [0, bounds + 2, bounds + 4, 2],
    ])
      this.box(x, 15, z, sx, 40, sz);
    this.body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        7,
        this.height(7, 25) + 0.9,
        25,
      ),
    );
    this.collider = this.world.createCollider(
      RAPIER.ColliderDesc.capsule(0.5, 0.3).setFriction(0),
      this.body,
    );
    this.controller = this.world.createCharacterController(0.02);
    this.controller.enableAutostep(0.32, 0.18, true);
    this.controller.enableSnapToGround(0.28);
    this.controller.setMaxSlopeClimbAngle(Math.PI * 0.27);
    this.controller.setMinSlopeSlideAngle(Math.PI * 0.29);
    this.controller.setApplyImpulsesToDynamicBodies(true);
  }
  box(
    x: number,
    y: number,
    z: number,
    hx: number,
    hy: number,
    hz: number,
    angle = 0,
  ) {
    const d = RAPIER.ColliderDesc.cuboid(hx, hy, hz)
      .setTranslation(x, y, z)
      .setRotation({
        x: 0,
        y: Math.sin(angle / 2),
        z: 0,
        w: Math.cos(angle / 2),
      });
    return this.world.createCollider(d);
  }
  tree(x: number, y: number, z: number, r: number, h: number) {
    return this.world.createCollider(
      RAPIER.ColliderDesc.cylinder(h / 2, r).setTranslation(x, y + h / 2, z),
    );
  }
  step(dx: number, dz: number, speed: number, jump: boolean, dt: number) {
    if (jump) this.jumpBuffer = 0.14;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = this.grounded ? 0.12 : Math.max(0, this.coyote - dt);
    const ease = 1 - Math.exp(-dt * (this.grounded ? 14 : 5));
    this.velocity.x += (dx * speed - this.velocity.x) * ease;
    this.velocity.z += (dz * speed - this.velocity.z) * ease;
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.velocity.y = 7.2;
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.grounded = false;
    } else
      this.velocity.y = this.grounded
        ? -2
        : Math.max(-24, this.velocity.y - 22 * dt);
    this.controller.computeColliderMovement(
      this.collider,
      {
        x: this.velocity.x * dt,
        y: this.velocity.y * dt,
        z: this.velocity.z * dt,
      },
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
    );
    const m = this.controller.computedMovement(),
      p = this.body.translation();
    this.body.setNextKinematicTranslation({
      x: p.x + m.x,
      y: p.y + m.y,
      z: p.z + m.z,
    });
    this.grounded = this.controller.computedGrounded();
    this.world.timestep = dt;
    this.world.step();
  }
  teleport(x: number, z: number) {
    // Restore onto the actual walkable surface, including bridges and raised floors.
    const ray = new RAPIER.Ray(
      { x, y: this.height(x, z) + 35, z },
      { x: 0, y: -1, z: 0 },
    );
    const hit = this.world.castRay(
      ray,
      70,
      true,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      this.collider,
    );
    const surface = hit ? ray.origin.y - hit.timeOfImpact : this.height(x, z);
    this.body.setTranslation({ x, y: surface + 1.1, z }, true);
    this.body.setNextKinematicTranslation(this.body.translation());
    this.velocity = { x: 0, y: 0, z: 0 };
  }
  cameraDistance(
    origin: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
    distance: number,
  ) {
    const hit = this.world.castRay(
      new RAPIER.Ray(origin, dir),
      distance,
      true,
      undefined,
      undefined,
      this.collider,
    );
    return hit ? Math.max(0.6, hit.timeOfImpact - 0.2) : distance;
  }
  cameraPanel(x: number, y: number, z: number, angle = 0) {
    return this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(1.9, 2.4, 0.1)
        .setTranslation(x, y + 2.2, z)
        .setRotation({
          x: 0,
          y: Math.sin(angle / 2),
          z: 0,
          w: Math.cos(angle / 2),
        })
        .setSensor(true),
    );
  }
  surface(vertices: number[], indices: number[]) {
    return this.world.createCollider(
      RAPIER.ColliderDesc.trimesh(
        new Float32Array(vertices),
        new Uint32Array(indices),
      ),
    );
  }
  canopy(x: number, y: number, z: number, r: number) {
    return this.world.createCollider(
      RAPIER.ColliderDesc.ball(r).setTranslation(x, y, z).setSensor(true),
    );
  }
  get position() {
    const p = this.body.translation();
    return { x: p.x, y: p.y - 0.8, z: p.z };
  }
  dispose() {
    this.world.free();
  }
}
