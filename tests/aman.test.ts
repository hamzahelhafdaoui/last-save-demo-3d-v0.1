import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshSave,
  validateSave,
  SAVE_KEY,
  objective,
  loadSave,
} from "../src/state/model";
import { act } from "../src/state/actions";
test("the alternate game never reads the main game's local save namespace", () => {
  assert.notEqual(SAVE_KEY, "last-save.investor.v2");
  const read: string[] = [];
  Object.assign(globalThis, {
    localStorage: {
      getItem: (key: string) => {
        read.push(key);
        return null;
      },
    },
  });
  assert.deepEqual(loadSave(), freshSave());
  assert.deepEqual(read, ["last-save.aman.v1"]);
});
test("oasis help requires consent, actual repairs and a unique physical outfit/keepsake reward", () => {
  let s = freshSave();
  s.created = true;
  s.world = "city";
  assert.equal(act(s, "jacket").save.inventory.length, 0);
  assert.equal(act(s, "oasis-repair-0").save.oasis.repairs.length, 0);
  s = act(s, "oasis-accept").save;
  for (const n of [0, 1, 1]) s = act(s, "oasis-repair-" + n).save;
  assert.equal(s.oasis.restored, false);
  assert.equal(s.oasis.repairs.length, 2);
  assert.equal(act(s, "jacket").save.inventory.length, 0);
  assert.match(objective(s).detail, /distribution gate/);
  s = act(s, "oasis-repair-2").save;
  assert.equal(s.oasis.restored, true);
  s = act(s, "jacket").save;
  s = act(s, "jacket").save;
  assert.equal(s.inventory.filter((i) => i === "oasis-clasp").length, 1);
  assert.equal(s.inventory.filter((i) => i === "velvet-jacket").length, 1);
  assert.equal(s.equipment.jacket, true);
  const restored = validateSave(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.oasis, s.oasis);
  assert.equal(restored.equipment.jacket, true);
});
test("granary evidence gates a real agreement; either solution is remembered without duplicate rewards", () => {
  for (const decision of ["witnessed", "sealed"] as const) {
    let s = freshSave();
    assert.equal(act(s, "granary-" + decision).save.quest.echoes.length, 0);
    s.quest.echoes = ["forest", "crossing"];
    s.quest.memory = 3;
    s = act(s, "granary-" + decision).save;
    assert.equal(s.granaryDecision, decision);
    assert(s.quest.echoes.includes("archive"));
    const again = act(
      s,
      "granary-" + (decision === "sealed" ? "witnessed" : "sealed"),
    ).save;
    assert.equal(again.granaryDecision, decision);
    assert.equal(again.inventory.filter((i) => i === "archive-echo").length, 1);
    assert.equal(
      validateSave(JSON.parse(JSON.stringify(s))).granaryDecision,
      decision,
    );
  }
});
test("corrupt oasis progress cannot pretend the community water system is restored", () => {
  const s = freshSave();
  s.oasis = { accepted: true, repairs: [0, 0, 9], restored: true };
  const r = validateSave(s);
  assert.equal(r.oasis.restored, false);
  assert.deepEqual(r.oasis.repairs, [0]);
});
test("guidance advances past completed water work and follows the active region", () => {
  let s = freshSave();
  s.created = true;
  s.world = "lumen";
  s = act(s, "accept").save;
  assert.deepEqual(objective(s).target, [-24, 12]);
  s = act(s, "flower-0").save;
  assert.deepEqual(objective(s).target, [-29, 7]);
  for (const n of [1, 2]) s = act(s, "flower-" + n).save;
  assert.deepEqual(objective(s).target, [-25, 8]);
  s = act(s, "forest-echo").save;
  assert.match(objective(s).title, /caravan/);
  s.world = "city";
  assert.equal(objective(s).world, "city");
  assert.match(objective(s).detail, /channel keeper/);
  s = act(s, "oasis-accept").save;
  assert.deepEqual(objective(s).target, [10, -15]);
});
