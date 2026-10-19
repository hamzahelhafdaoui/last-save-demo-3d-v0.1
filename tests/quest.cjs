const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  try {
    const p = await b.newPage({ viewport: { width: 640, height: 400 } }),
      base = process.env.BASE_URL || "http://localhost:4181/";
    p.setDefaultTimeout(90000);
    async function boot(save) {
      await p.goto(base);
      await p.evaluate(
        (s) => localStorage.setItem("last-save.aman.v1", JSON.stringify(s)),
        save,
      );
      await p.goto(base + "?debug");
      await p
        .getByRole("button", { name: "Continue your story" })
        .click({ force: true });
      await p.waitForFunction(() => window.lastSaveDebug?.().mode === "play");
    }
    let s = {
      version: 2,
      created: true,
      experience: "quest",
      world: "lumen",
      positions: { lumen: { x: 10, z: -28 } },
      settings: { quality: "low", volume: 0 },
    };
    await boot(s);
    await p.waitForFunction(
      () => window.lastSaveDebug?.().interaction === "healer",
    );
    await p.keyboard.press("e");
    await p
      .getByRole("button", { name: "I’ll bring it back" })
      .click({ force: true });
    await p.waitForFunction(() => window.lastSaveDebug?.().mode === "play");
    s = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("last-save.aman.v1")),
    );
    assert(s.sideQuest.accepted);
    s.positions.lumen = { x: -16, z: 19 };
    await boot(s);
    await p.waitForFunction(
      () => window.lastSaveDebug?.().interaction === "herbs",
    );
    await p.keyboard.press("e");
    await p.waitForFunction(
      () =>
        window.lastSaveDebug?.().quest &&
        JSON.parse(localStorage.getItem("last-save.aman.v1")).sideQuest
          .ambush,
    );
    await p.keyboard.press("f");
    await p.keyboard.press("q");
    await p.getByText(/HOLLOW WARDENS · [123] REMAIN/).waitFor();
    await p.screenshot({ path: "test-results/quest-encounter.png" });
    console.log(
      "PASS healer acceptance, herb pickup, live three-enemy ambush and combat input",
    );
    await p.waitForFunction(
      () => {
        const d = window.lastSaveDebug?.();
        return d && d.position.z > 22;
      },
      null,
      { timeout: 180000 },
    );
    s = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("last-save.aman.v1")),
    );
    assert(s.sideQuest.herbs);
    console.log("PASS encounter loss returns to the trail and retains herbs");
    s.positions.lumen = { x: 10, z: -28 };
    await boot(s);
    await p.waitForFunction(
      () => window.lastSaveDebug?.().interaction === "healer",
    );
    await p.keyboard.press("e");
    await p
      .getByRole("button", { name: "Deliver moonfern" })
      .click({ force: true });
    await p.waitForFunction(() =>
      window.lastSaveDebug?.().inventory.includes("moonfern-lantern"),
    );
    assert.equal(
      (await p.evaluate(() => window.lastSaveDebug())).inventory.filter(
        (x) => x === "moonfern-lantern",
      ).length,
      1,
    );
    console.log("PASS delivery grants a unique home keepsake");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
