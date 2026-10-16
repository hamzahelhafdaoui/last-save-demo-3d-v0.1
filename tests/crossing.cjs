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
    const p = await b.newPage({ viewport: { width: 640, height: 400 } });
    p.setDefaultTimeout(90000);
    const base = process.env.BASE_URL || "http://localhost:4183/";
    await p.goto(base);
    await p.evaluate(() =>
      localStorage.setItem(
        "last-save.investor.v2",
        JSON.stringify({
          version: 2,
          created: true,
          experience: "tour",
          world: "lumen",
          positions: { lumen: { x: -24, z: -26 } },
          quest: { accepted: true, echoes: ["forest"] },
          settings: { quality: "low", volume: 0 },
        }),
      ),
    );
    await p.goto(base + "?debug");
    await p
      .getByRole("button", { name: "Continue your story" })
      .click({ force: true });
    await p.waitForFunction(
      () => window.lastSaveDebug?.().interaction === "mechanism",
    );
    await p.keyboard.press("e");
    await p.waitForFunction(() => window.lastSaveDebug?.().quest.mechanism);
    async function go(x, z) {
      for (let i = 0; i < 240; i++) {
        const d = await p.evaluate(() => window.lastSaveDebug()),
          dx = x - d.position.x,
          dz = z - d.position.z;
        if (Math.hypot(dx, dz) < 0.45) {
          for (const k of ["w", "a", "s", "d", "Shift"]) await p.keyboard.up(k);
          await p.waitForTimeout(600);
          return;
        }
        const f = -dx * Math.sin(d.yaw) - dz * Math.cos(d.yaw),
          r = dx * Math.cos(d.yaw) - dz * Math.sin(d.yaw),
          a = Math.atan2(r, f),
          want = new Set();
        if (Math.cos(a) > 0.4) want.add("w");
        if (Math.cos(a) < -0.4) want.add("s");
        if (Math.sin(a) > 0.4) want.add("d");
        if (Math.sin(a) < -0.4) want.add("a");
        for (const k of ["w", "a", "s", "d"])
          await p.keyboard[want.has(k) ? "down" : "up"](k);
        await p.waitForTimeout(180);
      }
      throw Error("crossing navigation failed");
    }
    await go(-26, -28);
    await go(-29, -31);
    await p.waitForFunction(() => window.lastSaveDebug?.().quest.steps === 1);
    await go(-33, -34);
    await p.waitForFunction(() => window.lastSaveDebug?.().quest.steps === 2);
    await go(-37, -37);
    await p.waitForFunction(() => window.lastSaveDebug?.().quest.steps === 3);
    await go(-40, -40);
    await p.waitForFunction(
      () => window.lastSaveDebug?.().interaction === "crossing-echo",
    );
    await p.keyboard.press("e");
    await p.waitForFunction(() =>
      window.lastSaveDebug?.().quest.echoes.includes("crossing"),
    );
    console.log(
      "PASS physical Story Tour crossing, all three rune stones and courage reward",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
