import { test, before } from "node:test";
import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import { Physics } from "../src/physics/world";
import { walkoverSurface } from "../src/simulation/walkover";
import { ground } from "../src/simulation/terrain";
before(async () => {
  await RAPIER.init();
});
function settle(p: Physics) {
  for (let i = 0; i < 120; i++) p.step(0, 0, 0, false, 1 / 60);
}
test("capsule rests on terrain and advances through an open trail", () => {
  const p = new Physics();
  settle(p);
  assert.ok(p.grounded);
  assert.ok(Math.abs(p.position.y - ground(7, 25)) < 0.15);
  const z = p.position.z;
  for (let i = 0; i < 120; i++) p.step(0, -1, 3.25, false, 1 / 60);
  assert.ok(z - p.position.z > 5);
  p.world.free();
});
test("collision stops movement through a wall", () => {
  const p = new Physics();
  settle(p);
  const y = p.position.y;
  p.box(7, y + 2, 20, 5, 2, 0.5);
  for (let i = 0; i < 180; i++) p.step(0, -1, 6, false, 1 / 60);
  assert.ok(p.position.z > 20.7 && p.position.z < 22);
  p.world.free();
});
test("jump rises, lands and cannot be repeated in mid-air", () => {
  const p = new Physics();
  settle(p);
  const start = p.position.y;
  p.step(0, 0, 0, true, 1 / 60);
  for (let i = 0; i < 12; i++) p.step(0, 0, 0, false, 1 / 60);
  assert.ok(p.position.y > start + 0.6);
  const before = p.velocity.y;
  p.step(0, 0, 0, true, 1 / 60);
  assert.ok(p.velocity.y < before);
  for (let i = 0; i < 120; i++) p.step(0, 0, 0, false, 1 / 60);
  assert.ok(p.grounded);
  assert.ok(Math.abs(p.position.y - start) < 0.1);
  p.world.free();
});
test("camera ray detects scenery before the requested camera distance", () => {
  const p = new Physics();
  p.box(0, 4, 4, 2, 2, 0.5);
  p.world.step();
  const d = p.cameraDistance({ x: 0, y: 4, z: 0 }, { x: 0, y: 0, z: 1 }, 7);
  assert.ok(d > 3 && d < 3.6);
  p.world.free();
});

test("camera-only portal panel blocks the camera but remains passable for the character", async () => {
  await RAPIER.init();
  const p = new Physics(() => 0);
  p.cameraPanel(0, 0, 2);
  p.teleport(0, 0);
  p.world.step();
  const d = p.cameraDistance({ x: 0, y: 1.4, z: 0 }, { x: 0, y: 0, z: 1 }, 6);
  assert.ok(d < 2);
  for (let i = 0; i < 120; i++) p.step(0, 1, 3, false, 1 / 60);
  assert.ok(p.position.z > 3);
  p.dispose();
});

test("position restore lands on a bridge surface rather than in the river underneath", () => {
  const p = new Physics(() => -1);
  p.box(0, 2, 0, 2, 0.5, 4);
  p.world.step();
  p.teleport(0, 0);
  for (let i = 0; i < 90; i++) p.step(0, 0, 0, false, 1 / 60);
  assert.ok(p.position.y > 2.4 && p.position.y < 2.7);
  p.dispose();
});
test("teleport clears queued jumps, stale ground contact and movement velocity", () => {
  const p = new Physics(() => 0);
  settle(p);
  p.jumpBuffer = 0.14;
  p.coyote = 0.12;
  p.velocity = { x: 6, y: 7, z: -6 };
  p.teleport(0, 0);
  assert.equal(p.grounded, false);
  assert.equal(p.coyote, 0);
  assert.equal(p.jumpBuffer, 0);
  assert.deepEqual(p.velocity, { x: 0, y: 0, z: 0 });
  p.step(0, 0, 0, false, 1 / 60);
  assert(
    p.velocity.y <= 0,
    "a jump from the old location must not fire after arrival",
  );
  settle(p);
  assert(p.grounded);
  p.dispose();
});

test("oasis walkovers have matching gentle slopes that the actual capsule can cross", () => {
  const p = new Physics(() => 0);
  const { vertices, indices } = walkoverSurface(7, 21, 3, 2);
  p.surface(vertices, indices);
  settle(p);
  for (let i = 0; i < 180; i++) p.step(0, -1, 3, false, 1 / 60);
  assert(p.position.z < 19, "the stone crossing must not act as a hidden wall");
  p.dispose();
});
