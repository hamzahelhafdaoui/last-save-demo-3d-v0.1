import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshSave,
  validateSave,
  addEcho,
  grantSword,
  objective,
} from "../src/state/model";
import { act } from "../src/state/actions";
test("missing, corrupt, wrong-version and hostile saves recover safely", () => {
  for (const raw of [null, {}, "", { version: 99 }, []])
    assert.deepEqual(validateSave(raw), freshSave());
  const bad: any = freshSave();
  bad.appearance.name = "<bad>\u0000";
  bad.appearance.fur = "javascript:no";
  bad.settings.volume = Infinity;
  bad.positions = { home: { x: NaN, z: 7 } };
  bad.quest.echoes = ["forest", "forest", "fake"];
  bad.quest.flowers = [0, 0, 8];
  const r = validateSave(bad);
  assert.equal(r.appearance.name, "bad");
  assert.match(r.appearance.fur, /^#[a-f0-9]{6}$/);
  assert.equal(r.settings.volume, 0.55);
  assert.equal(r.positions.home, undefined);
  assert.deepEqual(r.quest.echoes, ["forest"]);
  assert.deepEqual(r.quest.flowers, [0]);
});
test("each adventure gate is real and rewards are unique", () => {
  let s = freshSave();
  assert.equal(act(s, "sword").save.quest.sword, false);
  assert.equal(act(s, "forest-echo").save.quest.echoes.length, 0);
  s = act(s, "accept").save;
  for (const n of [0, 1, 2, 2]) s = act(s, "flower-" + n).save;
  assert.equal(s.quest.flowers.length, 3);
  s = act(s, "forest-echo").save;
  s = act(s, "forest-echo").save;
  assert.equal(s.inventory.filter((i) => i === "forest-echo").length, 1);
  s = act(s, "mechanism").save;
  s = act(s, "step-2").save;
  assert.equal(s.quest.steps, 0);
  for (let n = 0; n < 3; n++) s = act(s, "step-" + n).save;
  s = act(s, "crossing-echo").save;
  s = act(s, "memory-1").save;
  assert.equal(s.quest.memory, 0);
  for (let n = 0; n < 3; n++) s = act(s, "memory-" + n).save;
  assert.equal(s.quest.echoes.length, 2);
  s = act(s, "granary-witnessed").save;
  assert.equal(s.quest.echoes.length, 3);
  s = act(s, "guardian-1").save;
  assert.equal(s.quest.guardian, 0);
  for (let n = 0; n < 3; n++) s = act(s, "guardian-" + n).save;
  for (let n = 0; n < 4; n++) s = act(s, "sword").save;
  assert.equal(s.inventory.filter((i) => i === "dawnwake").length, 1);
  assert.equal(s.equipment.sword, true);
});
test("identity, equipment and home decorations survive a real JSON round trip", () => {
  let s = freshSave();
  s.created = true;
  s.appearance.name = "Mira";
  s.appearance.primary = "#123456";
  s = addEcho(addEcho(addEcho(s, "forest"), "crossing"), "archive");
  s.quest.guardian = 3;
  s = grantSword(s);
  s.world = "city";
  s.positions.city = { x: 3, z: -5 };
  s = act(s, "oasis-accept").save;
  for (const n of [0, 1, 2]) s = act(s, "oasis-repair-" + n).save;
  s = act(s, "jacket").save;
  s.world = "home";
  s = act(s, "display").save;
  const restored = validateSave(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.appearance.name, "Mira");
  assert.equal(restored.appearance.primary, "#123456");
  assert.deepEqual(restored.positions.city, { x: 3, z: -5 });
  assert.equal(restored.home.sword, true);
  assert.equal(restored.equipment.sword, false);
  assert.equal(restored.equipment.jacket, true);
  assert.equal(restored.inventory.length, 6);
});
test("interrupted extraction saves retain the pre-claim checkpoint", () => {
  let s = freshSave();
  s.created = true;
  s.quest.accepted = true;
  s = addEcho(addEcho(addEcho(s, "forest"), "crossing"), "archive");
  s.quest.guardian = 3;
  const restored = validateSave(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.quest.sword, false);
  assert(!restored.inventory.includes("dawnwake"));
  assert.match(objective(restored).detail, /Take/);
  restored.world = "lumen";
  assert.match(objective(restored).detail, /claim/);
});
test("inconsistent older saves repair ownership and cannot equip missing items", () => {
  let s = freshSave();
  s.quest.sword = true;
  s.equipment.jacket = true;
  let r = validateSave(s);
  assert(r.inventory.includes("dawnwake"));
  assert.equal(r.quest.echoes.length, 3);
  assert.equal(r.equipment.jacket, false);
  s = freshSave();
  s.inventory = ["dawnwake", "dawnwake"];
  r = validateSave(s);
  assert.equal(r.quest.guardian, 3);
  assert.equal(r.inventory.filter((i) => i === "dawnwake").length, 1);
});

test("cinematic replay preserves a mounted sword and does not equip a physical duplicate", () => {
  let s = freshSave();
  s = addEcho(addEcho(addEcho(s, "forest"), "crossing"), "archive");
  s.quest.guardian = 3;
  s = grantSword(s);
  s = act(s, "display").save;
  const replay = act(s, "sword").save;
  assert.equal(replay, s);
  assert.equal(replay.home.sword, true);
  assert.equal(replay.equipment.sword, false);
  assert.equal(replay.inventory.filter((x) => x === "dawnwake").length, 1);
});
