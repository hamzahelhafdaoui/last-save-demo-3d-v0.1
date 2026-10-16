import { test } from "node:test";
import assert from "node:assert/strict";
import { radialStick, cameraRelative } from "../src/input/math.js";
test("joystick deadzone rests without drift and a partial tilt produces analog speed", () => {
  assert.deepEqual(radialStick(3, 4, 50), { x: 0, y: 0, strength: 0 });
  const half = radialStick(0, -25, 50);
  assert.ok(half.strength > 0 && half.strength < 0.5);
  assert.equal(half.x, 0);
  assert.equal(half.y, half.strength);
});
test("dragging outside the stick stays bounded, including diagonal input", () => {
  for (const [x, y] of [
    [500, 0],
    [400, 400],
    [-400, 300],
  ]) {
    const s = radialStick(x, y, 50);
    assert.ok(Math.abs(Math.hypot(s.x, s.y) - 1) < 1e-9);
    assert.equal(s.strength, 1);
  }
});
test("movement is camera-relative without diagonal speed boost", () => {
  assert.deepEqual(cameraRelative(0, 1, 0), { x: 0, z: -1 });
  const west = cameraRelative(0, 1, Math.PI / 2);
  assert.ok(Math.abs(west.x + 1) < 1e-9 && Math.abs(west.z) < 1e-9);
  const diag = cameraRelative(1, 1, 0.3);
  assert.ok(Math.abs(Math.hypot(diag.x, diag.z) - 1) < 1e-9);
});
