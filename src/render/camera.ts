import * as T from "three";
import { Physics } from "../physics/world";
export class FollowCamera {
  yaw = 0.16;
  pitch = 0.29;
  distance = 7;
  motion = true;
  private target = new T.Vector3();
  private currentDistance = 7;
  private initialized = false;
  constructor(
    public camera: T.PerspectiveCamera,
    private physics: Physics,
  ) {}
  update(
    position: { x: number; y: number; z: number },
    look: { x: number; y: number },
    dt: number,
    speed: number,
    time: number,
  ) {
    this.yaw -= look.x * 0.004;
    this.pitch = T.MathUtils.clamp(this.pitch + look.y * 0.003, -0.12, 1.14);
    const target = new T.Vector3(position.x, position.y + 1.35, position.z);
    if (!this.initialized) {
      this.target.copy(target);
      this.initialized = true;
    } else this.target.lerp(target, 1 - Math.exp(-dt * 14));
    const dir = new T.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    );
    const possible = this.physics.cameraDistance(
      this.target,
      dir,
      this.distance,
    );
    this.currentDistance =
      possible < this.currentDistance
        ? possible
        : T.MathUtils.lerp(
            this.currentDistance,
            possible,
            1 - Math.exp(-dt * (possible < this.currentDistance ? 35 : 6)),
          );
    const desired = this.target
      .clone()
      .addScaledVector(dir, this.currentDistance);
    this.camera.position.copy(desired);
    if (this.motion && speed > 3)
      this.camera.position.y += Math.sin(time * 8) * 0.025;
    this.camera.lookAt(this.target);
    this.camera.fov = T.MathUtils.lerp(
      this.camera.fov,
      60 + (speed > 4 ? 3 : 0),
      1 - Math.exp(-dt * 3),
    );
    this.camera.updateProjectionMatrix();
  }
  reset() {
    this.initialized = false;
  }
}
