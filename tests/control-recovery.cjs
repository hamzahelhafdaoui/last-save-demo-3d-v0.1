const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const base = process.env.BASE_URL || "http://localhost:4181/";
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
  try {
    fs.mkdirSync("test-results", { recursive: true });
    const p = await b.newPage({ viewport: { width: 640, height: 400 } });
    p.setDefaultTimeout(90000);
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error" && !m.text().includes("favicon"))
        errors.push(m.text());
    });
    await p.goto(base);
    await p.evaluate(() =>
      localStorage.setItem(
        "last-save.aman.v1",
        JSON.stringify({
          version: 2,
          created: true,
          world: "lumen",
          experience: "quest",
          positions: { lumen: { x: -13, z: 13 } },
          sideQuest: { accepted: true, herbs: true },
          settings: { quality: "low", volume: 0 },
        }),
      ),
    );
    await p.goto(base + "?debug");
    await p
      .getByRole("button", { name: "Continue your story" })
      .click({ force: true });
    await p.getByText(/HOLLOW WARDENS · [123] REMAIN/).waitFor();
    // Pause in the SAME browser task as starting the dodge, before its short
    // timer can expire on slow software-rendered test hardware.
    await p.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("last-save-command", { detail: "dodge" }),
      );
      window.dispatchEvent(
        new CustomEvent("last-save-command", { detail: "pause" }),
      );
    });
    await p.getByLabel("Experience mode").selectOption("tour");
    await p
      .getByRole("button", { name: /Return to the world/ })
      .click({ force: true });
    await p.waitForFunction(() => {
      const d = window.lastSaveDebug?.();
      return d?.mode === "play" && Math.hypot(d.velocity.x, d.velocity.z) < 0.1;
    });
    const rest = await p.evaluate(() => window.lastSaveDebug());
    await p.waitForTimeout(1200);
    const after = await p.evaluate(() => window.lastSaveDebug());
    assert(
      Math.hypot(
        after.position.x - rest.position.x,
        after.position.z - rest.position.z,
      ) < 0.1,
      "mode change must not leave permanent roll movement",
    );
    await p
      .getByText(/HOLLOW WARDENS · [123] REMAIN/)
      .waitFor({ state: "hidden" });
    console.log(
      "PASS switching out of Living Quest mid-dodge ends combat and leaves the character stationary",
    );
    await p.keyboard.down("w");
    await p.waitForFunction(() => {
      const v = window.lastSaveDebug().velocity;
      return Math.hypot(v.x, v.z) > 0.5;
    });
    await p.keyboard.press("i");
    await p.waitForFunction(() => window.lastSaveDebug().mode === "inventory");
    await p.keyboard.up("w");
    await p.keyboard.press("Escape");
    await p.waitForFunction(() => window.lastSaveDebug().mode === "play");
    await p.waitForTimeout(600);
    const resumed = await p.evaluate(() => window.lastSaveDebug());
    assert(Math.hypot(resumed.velocity.x, resumed.velocity.z) < 0.1);
    await p.keyboard.down("w");
    await p.waitForFunction(
      () => Math.abs(window.lastSaveDebug().velocity.z) > 0.5,
    );
    await p.keyboard.up("w");
    await p.waitForFunction(
      () =>
        Math.hypot(
          window.lastSaveDebug().velocity.x,
          window.lastSaveDebug().velocity.z,
        ) < 0.1,
    );
    console.log(
      "PASS keyboard movement, inventory interruption, release while paused and fresh input",
    );
    await p.keyboard.press("Escape");
    await p.getByLabel("Graphics quality").selectOption("medium");
    await p.getByLabel("Graphics quality").selectOption("low");
    await p
      .getByRole("button", { name: /Return to the world/ })
      .click({ force: true });
    await p.waitForFunction(() => window.lastSaveDebug().mode === "play");
    assert.equal(
      (await p.evaluate(() => window.lastSaveDebug())).world,
      "lumen",
    );
    await p.screenshot({ path: "test-results/controls-desktop-recovered.png" });
    await p.reload();
    await p
      .getByRole("button", { name: "Continue your story" })
      .click({ force: true });
    await p.waitForFunction(() => window.lastSaveDebug().mode === "play");
    assert.equal(
      (await p.evaluate(() => window.lastSaveDebug())).world,
      "lumen",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS graphics changes retain world/runtime, reload retains save, clean console",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
