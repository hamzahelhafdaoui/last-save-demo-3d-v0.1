import { test } from "node:test";
import assert from "node:assert/strict";
import { Extraction, EXTRACTION_DURATION } from "../src/game/cinematics";
test("Dawnwake has authored approach, physical resistance, extraction and sunrise phases", () => {
  const c = new Extraction();
  try {
    assert.equal(c.sample(0).lift, 0);
    assert(c.sample(7).grip > 0.8);
    const resist = { ...c.sample(12) };
    assert(resist.strain > 0.7);
    assert(resist.lift < 0.3);
    const pull = { ...c.sample(21) };
    assert(pull.lift > 1);
    assert(pull.sunrise === 0);
    const free = { ...c.sample(25) };
    assert(free.raise > 0.8);
    assert(free.beam > 0.8);
    assert(c.sample(EXTRACTION_DURATION).sunrise > 0.99);
  } finally {
    c.dispose();
  }
});
