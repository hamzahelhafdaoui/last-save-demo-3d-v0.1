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
    const p = await b.newPage({ viewport: { width: 700, height: 450 } }),
      base = process.env.BASE_URL || "http://localhost:4184/";
    p.setDefaultTimeout(90000);
    await p.goto(base);
    await p.evaluate(() =>
      localStorage.setItem(
        "last-save.aman.v1",
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
    async function enter() {
      await p
        .getByRole("button", { name: "Continue your story" })
        .click({ force: true });
      await p.waitForFunction(
        () => window.lastSaveDebug?.().interaction === "sword",
      );
    }
    await enter();
    await p.keyboard.press("e");
    await p.waitForFunction(() => window.lastSaveDebug?.().cinematicTime > 2);
    await p.reload();
    await enter();
    let d = await p.evaluate(() => window.lastSaveDebug());
    assert.equal(d.quest.sword, false);
    assert(!d.inventory.includes("dawnwake"));
    await p.keyboard.press("e");
    await p
      .getByRole("button", { name: "Skip sequence" })
      .click({ force: true });
    await p
      .getByRole("button", { name: "Carry it into the next world" })
      .click({ force: true });
    await p.keyboard.press("Escape");
    await p
      .getByText("Investor Demo Mode", { exact: true })
      .click({ force: true });
    await p
      .getByRole("button", { name: "Replay Dawnwake" })
      .click({ force: true });
    await p
      .getByRole("button", { name: "Skip sequence" })
      .click({ force: true });
    await p
      .getByRole("button", { name: "Carry it into the next world" })
      .click({ force: true });
    d = await p.evaluate(() => window.lastSaveDebug());
    assert.equal(d.inventory.filter((x) => x === "dawnwake").length, 1);
    console.log(
      "PASS reload during extraction, safe pre-claim checkpoint and unique replay reward",
    );
    await p.keyboard.press("Escape");
    await p
      .getByText("Investor Demo Mode", { exact: true })
      .click({ force: true });
    await p
      .getByRole("button", { name: "Start a fresh demonstration" })
      .click({ force: true });
    await p
      .getByRole("button", { name: "Reset & begin" })
      .click({ force: true });
    await p
      .getByRole("button", { name: "Skip opening" })
      .click({ force: true });
    await p
      .getByRole("button", { name: "Moonfolk", exact: true })
      .click({ force: true });
    await p.getByRole("textbox", { name: "Character name" }).fill("Fresh Mira");
    await p
      .getByRole("button", { name: "This is my story" })
      .click({ force: true });
    await p.waitForFunction(() => window.lastSaveDebug?.().mode === "play");
    d = await p.evaluate(() => window.lastSaveDebug());
    assert.equal(d.inventory.length, 0);
    assert.equal(d.world, "home");
    assert.equal(d.appearance.name, "Fresh Mira");
    assert.equal(d.appearance.preset, "moon");
    console.log(
      "PASS fresh demo reset and editable persistent character customization",
    );
    await p.route("**/assets/traveler.glb", (r) => r.abort());
    await p.reload();
    await p.getByRole("alert").waitFor();
    assert(
      await p
        .getByText("The game could not start.", { exact: false })
        .isVisible(),
    );
    console.log(
      "PASS missing GLB shows recoverable error instead of a broken title/play state",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
