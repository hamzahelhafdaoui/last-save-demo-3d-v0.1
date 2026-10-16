const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
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
    const p = await b.newPage({ viewport: { width: 800, height: 500 } });
    p.setDefaultTimeout(90000);
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    const base = process.env.BASE_URL || "http://localhost:4182/";
    await p.goto(base);
    await p.evaluate(() =>
      localStorage.setItem(
        "last-save.investor.v2",
        JSON.stringify({
          version: 2,
          created: true,
          world: "lumen",
          positions: { lumen: { x: 33, z: -35.8 } },
          quest: {
            accepted: true,
            echoes: ["forest", "crossing", "archive"],
            guardian: 3,
          },
          settings: { quality: "low", volume: 0 },
        }),
      ),
    );
    await p.goto(base + "?debug");
    await p
      .getByRole("button", { name: "Continue your story" })
      .click({ force: true });
    await p.waitForFunction(
      () => window.lastSaveDebug?.().interaction === "sword",
    );
    await p.keyboard.press("e");
    await p.waitForFunction(
      () => window.lastSaveDebug?.().mode === "cinematic",
    );
    fs.mkdirSync("test-results", { recursive: true });
    for (const t of [6, 12, 20, 24, 30]) {
      await p.waitForFunction(
        (t) => window.lastSaveDebug?.().cinematicTime >= t,
        t,
        { timeout: 180000 },
      );
      await p.screenshot({ path: `test-results/extraction-${t}.png` });
      console.log("SHOT", t);
    }
    await p.waitForFunction(() => window.lastSaveDebug?.().mode === "reveal", {
      timeout: 180000,
    });
    assert.equal(
      (await p.evaluate(() => window.lastSaveDebug())).inventory.filter(
        (x) => x === "dawnwake",
      ).length,
      1,
    );
    await p.screenshot({ path: "test-results/reveal.png" });
    assert.deepEqual(errors, []);
    console.log("PASS complete 36-second extraction and unique reward");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
