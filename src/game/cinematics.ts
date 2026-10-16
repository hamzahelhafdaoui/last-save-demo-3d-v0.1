import { gsap } from "gsap";
import * as T from "three";
export const EXTRACTION_DURATION = 36;
export type Shot = {
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  tz: number;
  approach: number;
  reach: number;
  strain: number;
  raise: number;
  grip: number;
  lift: number;
  sunrise: number;
  beam: number;
  flash: number;
};
export class Extraction {
  state: Shot = {
    x: 2.8,
    y: 2.3,
    z: 5,
    tx: 0,
    ty: 1.5,
    tz: 0,
    approach: 0,
    reach: 0,
    strain: 0,
    raise: 0,
    grip: 0,
    lift: 0,
    sunrise: 0,
    beam: 0,
    flash: 0,
  };
  timeline: gsap.core.Timeline;
  constructor() {
    const s = this.state,
      t = gsap.timeline({ paused: true, defaults: { ease: "sine.inOut" } });
    this.timeline = t;
    t.to(s, { approach: 1, duration: 4 }, 0).to(
      s,
      { x: 1.6, y: 1.9, z: 2.9, ty: 1.4, duration: 5 },
      0,
    );
    t.to(s, { reach: 1, grip: 1, duration: 3 }, 4).to(
      s,
      { x: 0.65, y: 1.65, z: 0.9, tx: 0.12, ty: 1.65, tz: -0.6, duration: 3 },
      5,
    );
    t.to(s, { strain: 1, lift: 0.12, duration: 5 }, 8).to(
      s,
      { x: -2.3, y: 1.3, z: 1.6, ty: 1.1, duration: 5 },
      8,
    );
    t.to(s, { x: -2.8, y: 2.8, z: -1.8, ty: 1.4, duration: 5 }, 13).to(
      s,
      { lift: 0.65, strain: 0.6, duration: 5 },
      13,
    );
    t.to(s, { x: 2.1, y: 2.1, z: -2.8, ty: 2, duration: 4 }, 18).to(
      s,
      { lift: 1.35, strain: 1, duration: 4 },
      18,
    );
    t.to(s, { flash: 1, duration: 0.18 }, 22).to(
      s,
      { flash: 0, duration: 1.6 },
      22.18,
    );
    t.to(
      s,
      { raise: 1, strain: 0, reach: 0.7, lift: 2.1, beam: 1, duration: 2.2 },
      22,
    ).to(s, { sunrise: 1, duration: 6 }, 22);
    t.to(s, { x: 12, y: 13, z: 16, ty: 2, duration: 7 }, 23)
      .to(s, { x: 1.8, y: 2, z: 3.4, ty: 1.6, duration: 4 }, 30)
      .to(s, { raise: 0.3, reach: 0.4, beam: 0.15, duration: 3 }, 32);
    t.to(s, { x: 1.1, y: 1.8, z: 2.7, duration: 2 }, 34);
  }
  sample(t: number) {
    this.timeline.seek(Math.min(EXTRACTION_DURATION, t));
    return this.state;
  }
  dispose() {
    this.timeline.kill();
  }
}
export function cameraPath(
  camera: T.PerspectiveCamera,
  points: T.Vector3[],
  target: T.Vector3,
  t: number,
  duration: number,
) {
  const c = new T.CatmullRomCurve3(points);
  camera.position.copy(c.getPoint(T.MathUtils.clamp(t / duration, 0, 1)));
  camera.lookAt(target);
  camera.fov = 55;
  camera.updateProjectionMatrix();
}
