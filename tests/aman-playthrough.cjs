// Real controls and explicit checkpoints; no shipped mutation shortcuts.
const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const base = process.env.BASE_URL || "http://localhost:4184/";
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    proxy: base.startsWith("https:")
      ? { server: process.env.HTTPS_PROXY }
      : undefined,
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  let p;
  const errors = [];
  try {
    fs.mkdirSync("test-results", { recursive: true });
    const debug = () => p.evaluate(() => window.lastSaveDebug());
    const readSave = () =>
      p.evaluate(() => JSON.parse(localStorage.getItem("last-save.aman.v1")));
    async function click(name) {
      await p
        .getByRole("button", { name, exact: false })
        .click({ force: true });
    }
    async function boot(save, begin = true) {
      if (p) await p.close();
      p = await b.newPage({ viewport: { width: 720, height: 450 } });
      p.setDefaultTimeout(90000);
      p.on("pageerror", (e) => {
        errors.push(e.message);
        console.log("ERROR", e.message);
      });
      p.on("console", (m) => {
        if (m.type() === "error") {
          errors.push(m.text());
          console.log("ERROR", m.text());
        }
      });
      await p.addInitScript(
        (save) => {
          if (!sessionStorage.getItem("aman-qa-seeded")) {
            localStorage.setItem("last-save.aman.v1", JSON.stringify(save));
            localStorage.setItem(
              "last-save.investor.v2",
              "MAIN SAVE MUST STAY UNCHANGED",
            );
            sessionStorage.setItem("aman-qa-seeded", "yes");
          }
        },
        { ...save, settings: { quality: "low", volume: 0 } },
      );
      await p.goto(base + "?debug");
      if (begin) {
        await click("Continue your story");
        await p.waitForFunction(() => window.lastSaveDebug?.().mode === "play");
      }
    }
    async function rest() {
      for (const k of ["w", "a", "s", "d", "Shift"]) await p.keyboard.up(k);
      await p.waitForTimeout(550);
    }
    async function go(x, z, tol = 0.8) {
      let stuck = 0,
        prev;
      for (let i = 0; i < 350; i++) {
        const d = await debug();
        assert.equal(d.mode, "play");
        const dx = x - d.position.x,
          dz = z - d.position.z,
          dist = Math.hypot(dx, dz);
        if (dist < tol) {
          await rest();
          return;
        }
        const f = -dx * Math.sin(d.yaw) - dz * Math.cos(d.yaw),
          r = dx * Math.cos(d.yaw) - dz * Math.sin(d.yaw),
          a = Math.atan2(r, f),
          want = new Set(dist > 5 ? ["Shift"] : []);
        if (Math.cos(a) > 0.4) want.add("w");
        if (Math.cos(a) < -0.4) want.add("s");
        if (Math.sin(a) > 0.4) want.add("d");
        if (Math.sin(a) < -0.4) want.add("a");
        for (const k of ["w", "a", "s", "d", "Shift"])
          await p.keyboard[want.has(k) ? "down" : "up"](k);
        await p.waitForTimeout(dist < 2 ? 90 : 180);
        if (
          prev &&
          Math.hypot(prev.x - d.position.x, prev.z - d.position.z) < 0.025
        )
          stuck++;
        else stuck = 0;
        prev = d.position;
        if (stuck > 24)
          throw Error(
            "Blocked navigation " +
              JSON.stringify({
                at: d.position,
                to: [x, z],
                interaction: d.interaction,
              }),
          );
      }
      throw Error("Navigation budget " + [x, z]);
    }
    async function interact(id) {
      await p.waitForFunction(
        (id) => window.lastSaveDebug?.().interaction === id,
        id,
        { timeout: 15000 },
      );
      await p.keyboard.press("e");
      await p.waitForTimeout(400);
    }
    let s = { version: 2, created: false, appearance: { name: "Aman QA" } };
    await boot(s, false);
    await p.getByRole("button", { name: "Begin the journey" }).waitFor();
    await p.screenshot({ path: "test-results/aman-title.png" });
    await click("Begin the journey");
    await click("Skip opening");
    await p.getByRole("dialog", { name: "Create your character" }).waitFor();
    await p.getByLabel("Character name", { exact: true }).fill("Aman QA");
    await p.screenshot({ path: "test-results/aman-customizer.png" });
    await click("This is my story");
    await p.waitForFunction(() => window.lastSaveDebug().mode === "play");
    await p.screenshot({ path: "test-results/aman-courtyard-play.png" });
    await go(-2, 1);
    await go(-2, -5);
    await go(-3.8, -6.5);
    await interact("portal-lumen");
    await click("Skip sequence");
    await p.waitForFunction(
      () =>
        window.lastSaveDebug().world === "lumen" &&
        window.lastSaveDebug().mode === "play",
    );
    await go(4, 5);
    await go(4, -10);
    assert((await debug()).position.y > 3);
    await p.screenshot({ path: "test-results/aman-bridge.png" });
    await go(4, -25.5);
    await interact("edda");
    await p.getByText("The spring is blocked.", { exact: false }).waitFor();
    await click("I’ll help the community");
    assert((await debug()).quest.accepted);
    console.log(
      "PASS fresh intro/customization, actual home portal, bridge and Itto",
    );
    s = await readSave();
    s.positions.lumen = { x: -24, z: 13 };
    await boot(s);
    for (const [i, x, z] of [
      [0, -24, 13],
      [1, -29, 8.2],
      [2, -20, 6.2],
    ]) {
      await go(x, z, 1);
      await interact("flower-" + i);
    }
    await go(-25, 8, 1);
    await interact("forest-echo");
    assert((await debug()).quest.echoes.includes("forest"));
    assert.equal((await debug()).waterRestored, true);
    await p.screenshot({ path: "test-results/aman-spring-restored.png" });
    console.log(
      "PASS three intake gates, flowing spring and unique community record",
    );
    s = await readSave();
    s.positions.lumen = { x: -24, z: -26 };
    await boot(s);
    await interact("mechanism");
    await go(-25, -26, 0.4);
    await go(-27, -29, 0.4);
    for (const [i, x, z] of [
      [1, -29, -31],
      [2, -33, -34],
      [3, -37, -37],
    ]) {
      await go(x, z, 0.45);
      await p.waitForFunction(
        (i) => window.lastSaveDebug().quest.steps === i,
        i,
      );
    }
    await go(-40, -40, 0.7);
    await interact("crossing-echo");
    assert((await debug()).quest.echoes.includes("crossing"));
    console.log("PASS physical caravan passage and all three marked decks");
    s = await readSave();
    s.positions.lumen = { x: 12, z: -44 };
    await boot(s);
    for (const [i, x, z] of [
      [0, 13, -45],
      [1, 17, -45],
      [2, 15, -49],
    ]) {
      await go(x, z, 0.7);
      await interact("memory-" + i);
    }
    await go(15, -48, 0.35);
    await interact("granary");
    await p.getByRole("dialog", { name: "Conversation with Hammou" }).waitFor();
    await p.screenshot({ path: "test-results/aman-granary-choice.png" });
    await click("Seal it; use the shared reserve");
    await p.waitForFunction(
      () => window.lastSaveDebug().granaryDecision === "sealed",
    );
    assert((await debug()).quest.echoes.includes("archive"));
    await p.keyboard.press("j");
    await p
      .getByText("Disputed cells sealed; the communal reserve opened.", {
        exact: false,
      })
      .waitFor();
    await click("Close panel");
    console.log(
      "PASS delivery evidence, alternate granary agreement and remembered journal entry",
    );
    s = await readSave();
    s.positions.lumen = { x: 33, z: -29 };
    await boot(s);
    await go(33, -34, 0.5);
    for (const [i, x, z] of [
      [0, 28, -35],
      [1, 33, -32],
      [2, 38, -35],
    ]) {
      await go(x, z, 0.7);
      await interact("guardian-" + i);
    }
    await go(33, -35.5, 0.7);
    await interact("sword");
    await p.waitForFunction(() => window.lastSaveDebug().mode === "cinematic");
    await p.waitForFunction(() => window.lastSaveDebug().cinematicTime > 11);
    await p.screenshot({ path: "test-results/aman-dawnblade-pull.png" });
    await p.waitForFunction(
      () => window.lastSaveDebug().mode === "reveal",
      null,
      { timeout: 75000 },
    );
    await p.screenshot({ path: "test-results/aman-dawnblade-reveal.png" });
    await click("Carry it into the next world");
    assert.equal((await debug()).equipment.sword, true);
    console.log(
      "PASS storykeeper, full physical extraction timeline and sword equipment",
    );
    s = await readSave();
    s.positions.lumen = { x: 8, z: -23 };
    await boot(s);
    await interact("portal-city");
    await p.waitForFunction(
      () =>
        window.lastSaveDebug().world === "city" &&
        window.lastSaveDebug().mode === "play",
    );
    assert.equal((await debug()).appearance.name, "Aman QA");
    assert.equal((await debug()).equipment.sword, true);
    await p.screenshot({ path: "test-results/aman-oasis-arrival.png" });
    await go(-5, -6);
    await interact("sable");
    await click("I’ll help restore the channels");
    for (const [i, x, z] of [
      [0, 10, -13.8],
      [1, 12, 1.2],
      [2, 1, -4.8],
    ]) {
      await go(x, z, 0.8);
      await interact("oasis-repair-" + i);
      assert((await debug()).oasis.repairs.includes(i));
    }
    await p.waitForFunction(
      () => window.lastSaveDebug().waterRestored === true,
    );
    await p.screenshot({ path: "test-results/aman-oasis-water.png" });
    await go(-5, -6);
    await interact("sable");
    await click("Accept the woven mantle");
    await p.waitForFunction(() =>
      window.lastSaveDebug().inventory.includes("oasis-clasp"),
    );
    assert((await debug()).equipment.jacket);
    assert((await debug()).equipment.sword);
    assert.equal((await debug()).appearance.name, "Aman QA");
    await p.screenshot({ path: "test-results/aman-mantle-and-blade.png" });
    console.log(
      "PASS Atlas-to-oasis portal, water repairs, unique mantle/clasp and retained identity",
    );
    await go(0, 11);
    await interact("portal-home");
    await p.waitForFunction(
      () =>
        window.lastSaveDebug().world === "home" &&
        window.lastSaveDebug().mode === "play",
    );
    await go(-2, 1);
    await go(-7, 0);
    await go(-7, -2);
    await interact("display");
    await click("Return to the room");
    await p.waitForFunction(() => window.lastSaveDebug().mode === "play");
    s = await readSave();
    assert(s.home.sword);
    assert(s.inventory.includes("oasis-clasp"));
    assert(s.equipment.jacket);
    await p.screenshot({ path: "test-results/aman-home-keepsakes.png" });
    await p.reload();
    await click("Continue your story");
    await p.waitForFunction(() => window.lastSaveDebug().mode === "play");
    const saved = await readSave();
    assert.equal(saved.granaryDecision, "sealed");
    assert(saved.oasis.restored);
    assert(saved.home.sword);
    assert(saved.equipment.jacket);
    assert.equal(
      await p.evaluate(() => localStorage.getItem("last-save.investor.v2")),
      "MAIN SAVE MUST STAY UNCHANGED",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS return home, display/ending, reload persistence and main-save isolation; clean console",
    );
  } catch (e) {
    if (p) {
      console.log(
        "FAIL STATE",
        await p
          .evaluate(() => ({
            d: window.lastSaveDebug?.(),
            text: document.body.innerText.slice(-1600),
          }))
          .catch(() => null),
      );
      await p
        .screenshot({ path: "test-results/aman-failure.png" })
        .catch(() => {});
    }
    throw e;
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
