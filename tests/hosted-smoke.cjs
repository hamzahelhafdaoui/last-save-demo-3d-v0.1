const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const base = process.env.BASE_URL || "https://last-save-demo-3d.vercel.app/";
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
    const p = await b.newPage({ viewport: { width: 800, height: 500 } }),
      errors = [];
    p.setDefaultTimeout(90000);
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error" && !m.text().includes("favicon"))
        errors.push(m.text());
    });
    const response = await p.goto(base);
    assert.equal(response.status(), 200);
    await p.evaluate(() =>
      localStorage.setItem(
        "last-save.aman.v1",
        JSON.stringify({
          version: 2,
          created: true,
          world: "city",
          appearance: { name: "Hosted Mira", primary: "#416f86" },
          positions: { city: { x: 0, z: 11.5 } },
          inventory: ["dawnwake", "velvet-jacket"],
          equipment: { sword: true, jacket: true },
          settings: { quality: "low", volume: 0 },
        }),
      ),
    );
    await p.goto(base + "?debug");
    await p
      .getByRole("button", { name: "Continue your story" })
      .click({ force: true });
    await p.waitForFunction(
      () =>
        window.lastSaveDebug?.().world === "city" &&
        window.lastSaveDebug().mode === "play",
    );
    await p.waitForTimeout(1500);
    const d = await p.evaluate(() => window.lastSaveDebug());
    assert.equal(d.equipment.sword, true);
    assert.equal(d.equipment.jacket, true);
    assert.equal(d.appearance.name, "Hosted Mira");
    await p.screenshot({ path: "test-results/production-city.png" });
    await p.keyboard.press("i");
    await p.getByRole("button", { name: "Stow Dawnwake" }).waitFor();
    await p.screenshot({ path: "test-results/production-inventory.png" });
    await p.getByRole("button", { name: "Close panel" }).click({ force: true });
    await p.keyboard.press("e");
    await p.waitForFunction(
      () =>
        window.lastSaveDebug?.().world === "home" &&
        window.lastSaveDebug().mode === "play",
    );
    await p.screenshot({ path: "test-results/production-home.png" });
    await p.reload();
    await p
      .getByRole("button", { name: "Continue your story" })
      .click({ force: true });
    await p.waitForFunction(() => window.lastSaveDebug?.().mode === "play");
    assert.equal(
      (await p.evaluate(() => window.lastSaveDebug())).world,
      "home",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS public production game, loaded GLB/worlds, physical sword/jacket state, inventory, home portal and reload; clean console",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
