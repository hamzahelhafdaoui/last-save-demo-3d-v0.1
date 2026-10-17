import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { Encounter } from "../src/game/encounter";
import { freshSave } from "../src/state/model";
import { useGame } from "../src/state/store";
import { act } from "../src/state/actions";
function enemy(x: number, z: number) {
  const root = new T.Group();
  root.position.set(x, 0, z);
  return {
    actor: { root, update: () => {}, pose: () => {} } as any,
    hp: 3,
    cooldown: 0,
    wind: 0,
    hit: false,
    flash: 0,
    origin: new T.Vector3(x, 0, z),
    telegraph: new T.Mesh(),
  };
}
test("melee checks facing and range, respects cooldown, and grants no free win", () => {
  useGame.setState({ save: freshSave() });
  const c = new Encounter(new T.Scene(), { cue: () => {} } as any);
  c.ready = true;
  c.active = true;
  c.enemies = [enemy(0, 1.5), enemy(0, -1.5), enemy(8, 0)];
  c.strike(new T.Vector3(), 0);
  assert.deepEqual(
    c.enemies.map((e) => e.hp),
    [2, 3, 3],
  );
  c.strike(new T.Vector3(), 0);
  assert.equal(c.enemies[0].hp, 2);
  assert.equal(c.active, true);
  c.attackCooldown = 0;
  c.strike(new T.Vector3(), Math.PI);
  assert.equal(c.enemies[1].hp, 2);
});
test("enemy windup can damage the player, while a timed dodge prevents damage", () => {
  const c = new Encounter(new T.Scene(), { cue: () => {} } as any);
  c.active = true;
  c.ready = true;
  const e = enemy(0, 1.5);
  c.enemies = [e];
  e.wind = 0.01;
  c.update(0.02, 1, new T.Vector3());
  assert.equal(c.health, 82);
  e.wind = 0.01;
  e.hit = false;
  c.roll();
  c.update(0.02, 2, new T.Vector3());
  assert.equal(c.health, 82);
  assert(c.dodge > 0);
});
test("herbalist keepsake survives repeat delivery and save validation", () => {
  let s = freshSave();
  s.experience = "quest";
  s = act(s, "healer-accept").save;
  s = act(s, "herbs").save;
  s = act(s, "deliver-herbs").save;
  s = act(s, "deliver-herbs").save;
  assert.equal(s.inventory.filter((i) => i === "moonfern-lantern").length, 1);
  assert.equal(s.sideQuest.delivered, true);
});
test("leaving combat during a dodge clears forced movement and combat cooldowns", () => {
  const c = new Encounter(new T.Scene(), { cue: () => {} } as any);
  c.ready = true;
  c.active = true;
  c.enemies = [enemy(0, 1.5)];
  c.roll();
  c.strike(new T.Vector3(), 0);
  assert(c.dodge > 0);
  c.stop();
  assert.equal(c.dodge, 0);
  assert.equal(c.attack, 0);
  assert.equal(c.dodgeCooldown, 0);
  assert.equal(c.attackCooldown, 0);
  assert.equal(c.active, false);
});
