/* Real browser controls, no mutation hooks. Fixtures are explicit localStorage checkpoints.
   BASE_URL may point at a production deployment. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const BASE = process.env.BASE_URL || "http://localhost:4180/";
function fresh() {
  return {
    version: 2,
    created: true,
    world: "home",
    appearance: { name: "Mira", primary: "#276f83" },
    settings: { quality: "low", volume: 0 },
  };
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
    ...(BASE.startsWith("https:")
      ? { proxy: { server: process.env.HTTPS_PROXY } }
      : {}),
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 720, height: 450 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.setDefaultTimeout(60000);
    fs.mkdirSync("test-results", { recursive: true });
    const debug = () => page.evaluate(() => window.lastSaveDebug());
    async function click(name) {
      await page
        .getByRole("button", { name, exact: false })
        .click({ force: true });
    }
    async function boot(save) {
      await page.goto(BASE);
      await page.evaluate(
        (s) => localStorage.setItem("last-save.aman.v1", JSON.stringify(s)),
        save,
      );
      await page.goto(BASE + (BASE.includes("?") ? "&" : "?") + "debug");
      await page.getByRole("button", { name: "Continue your story" }).waitFor();
      await click("Continue your story");
      await page.waitForFunction(
        () => window.lastSaveDebug?.().mode === "play",
        { timeout: 90000 },
      );
    }
    async function go(x, z, tolerance = 1.1) {
      let last = Date.now(),
        stuck = 0,
        prev = null;
      for (let i = 0; i < 300; i++) {
        const d = await debug();
        assert.equal(d.mode, "play");
        const dx = x - d.position.x,
          dz = z - d.position.z,
          dist = Math.hypot(dx, dz);
        if (dist < tolerance) {
          for (const k of ["w", "a", "s", "d", "Shift"])
            await page.keyboard.up(k);
          await page.waitForTimeout(650);
          return;
        }
        const yaw = d.yaw,
          forward = dx * -Math.sin(yaw) + dz * -Math.cos(yaw),
          right = dx * Math.cos(yaw) - dz * Math.sin(yaw);
        const angle = Math.atan2(right, forward),
          want = new Set(["Shift"]);
        if (Math.cos(angle) > 0.38) want.add("w");
        if (Math.cos(angle) < -0.38) want.add("s");
        if (Math.sin(angle) > 0.38) want.add("d");
        if (Math.sin(angle) < -0.38) want.add("a");
        for (const k of ["w", "a", "s", "d", "Shift"])
          await page.keyboard[want.has(k) ? "down" : "up"](k);
        await page.waitForTimeout(220);
        if (
          prev &&
          Math.hypot(prev.x - d.position.x, prev.z - d.position.z) < 0.04
        )
          stuck++;
        else stuck = 0;
        prev = d.position;
        if (stuck > 14)
          throw Error(
            "Movement stuck at " +
              JSON.stringify(d.position) +
              " toward " +
              x +
              "," +
              z,
          );
        if (Date.now() - last > 90000)
          throw Error("Navigation timeout toward " + x + "," + z);
      }
      throw Error("Navigation failed");
    }
    async function interact(id) {
      await page.waitForFunction(
        (id) => window.lastSaveDebug?.().interaction === id,
        id,
        { timeout: 15000 },
      );
      await page.keyboard.press("e");
      await page.waitForTimeout(650);
    }
    // Walk in the home, enter a real portal, walk across the river bridge and meet Edda.
    await boot(fresh());
    await go(-5, -6);
    await interact("portal-lumen");
    await page.getByRole("button", { name: "Skip sequence" }).waitFor();
    await click("Skip sequence");
    await page.waitForFunction(
      () =>
        window.lastSaveDebug?.().world === "lumen" &&
        window.lastSaveDebug().mode === "play",
    );
    await page.screenshot({ path: "test-results/lumen.png" });
    await go(0, 5);
    await go(-0.5, -26);
    await go(4, -25.5);
    await interact("edda");
    await page
      .getByText("Our bell forgot its song.", { exact: false })
      .waitFor();
    await click("I’ll find the echoes");
    assert.equal((await debug()).quest.accepted, true);
    console.log("PASS actual home portal, bridge crossing and Edda");
    // A saved checkpoint isolates forest interactions from the long return journey.
    let save = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("last-save.aman.v1")),
    );
    save.world = "lumen";
    save.positions.lumen = { x: -24, z: 13 };
    await boot(save);
    for (const [i, x, z] of [
      [0, -24, 12],
      [1, -29, 7],
      [2, -20, 5],
    ]) {
      await go(x, z, 1.4);
      await interact("flower-" + i);
    }
    await go(-25, 8, 1.4);
    await interact("forest-echo");
    await page.waitForFunction(() =>
      window.lastSaveDebug?.().quest.echoes.includes("forest"),
    );
    assert.deepEqual((await debug()).quest.echoes, ["forest"]);
    console.log("PASS moonflowers and physical echo reward");
    save = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("last-save.aman.v1")),
    );
    save.world = "lumen";
    save.positions.lumen = { x: -24, z: -26 };
    save.quest.mechanism = true;
    save.quest.steps = 3;
    save.quest.echoes = ["forest", "crossing"];
    save.inventory = ["forest-echo", "crossing-echo"];
    await boot(save);
    await go(12, -44);
    await go(12, -46.5);
    await interact("memory-0");
    await go(15, -46.5);
    await interact("memory-1");
    await go(18, -46.5);
    await interact("memory-2");
    await page.waitForFunction(
      () => window.lastSaveDebug?.().quest.echoes.length === 3,
    );
    assert.equal((await debug()).quest.echoes.length, 3);
    console.log("PASS archive reconstruction");
    save = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("last-save.aman.v1")),
    );
    save.positions.lumen = { x: 33, z: -24 };
    await boot(save);
    await go(33, -32);
    for (const [i, x, z] of [
      [0, 30, -33.5],
      [1, 33, -32],
      [2, 36, -33.5],
    ]) {
      await go(x, z, 1.2);
      await interact("guardian-" + i);
    }
    await go(33, -35.8);
    await interact("sword");
    await page.waitForFunction(
      () => window.lastSaveDebug?.().mode === "cinematic",
    );
    await page.waitForTimeout(1800);
    await page.screenshot({ path: "test-results/sword-start.png" });
    await click("Skip sequence");
    await page
      .getByText("LEGENDARY WEAPON ACQUIRED", { exact: true })
      .waitFor();
    await click("Carry it into the next world");
    assert.equal((await debug()).equipment.sword, true);
    console.log(
      "PASS guardian, extraction entry, skip safety, reward and equipment",
    );
    await go(33, -31);
    await go(33, -24);
    await go(8, -23);
    await interact("portal-city");
    await page.waitForFunction(
      () =>
        window.lastSaveDebug?.().world === "city" &&
        window.lastSaveDebug().mode === "play",
    );
    assert.equal((await debug()).equipment.sword, true);
    assert.equal((await debug()).appearance.name, "Mira");
    await page.screenshot({ path: "test-results/city.png" });
    await go(-5, -5.8);
    await interact("sable");
    await page
      .getByText("Okay, where did you get THAT?", { exact: true })
      .waitFor();
    await click("Wear the Velvet jacket");
    assert.equal((await debug()).equipment.jacket, true);
    console.log("PASS city identity, sword and jacket");
    await go(0, 12);
    await interact("portal-home");
    await page.waitForFunction(
      () =>
        window.lastSaveDebug?.().world === "home" &&
        window.lastSaveDebug().mode === "play",
    );
    await go(-7, -3);
    await interact("display");
    await page.waitForFunction(
      () => window.lastSaveDebug?.().mode === "ending",
    );
    await click("Return to the room");
    await page.keyboard.press("i");
    await page.getByText("Dawnwake", { exact: true }).first().waitFor();
    await click("Close panel");
    await page.reload();
    await click("Continue your story");
    await page.waitForFunction(() => window.lastSaveDebug?.().mode === "play");
    const end = await debug();
    assert.equal(end.world, "home");
    assert.equal(end.equipment.jacket, true);
    assert.equal(end.inventory.filter((i) => i === "dawnwake").length, 1);
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("last-save.aman.v1")),
    );
    assert.equal(stored.home.sword, true);
    await page.screenshot({ path: "test-results/home-complete.png" });
    assert.deepEqual(errors, []);
    console.log("PASS home display, ending, reload and clean console");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
