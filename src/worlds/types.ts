import type * as T from "three";
import type { Physics } from "../physics/world";
import type { Save, WorldId } from "../state/model";
export type Hotspot = {
  id: string;
  position: T.Vector3;
  label: string;
  radius?: number;
  visible?: (s: Save) => boolean;
};
export type World = {
  id: WorldId;
  scene: T.Scene;
  physics: Physics;
  interactions: Hotspot[];
  spawn: [number, number];
  update: (t: number, dt: number, s: Save) => void;
  dispose: () => void;
  sword?: T.Group;
  sun?: T.DirectionalLight;
  guardian?: T.Group;
  pedestal?: T.Vector3;
};
