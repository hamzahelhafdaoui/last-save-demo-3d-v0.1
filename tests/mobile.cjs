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
    const p = await b.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    const base = process.env.BASE_URL || "http://localhost:4181/";
    p.setDefaultTimeout(90000);
    await p.goto(base);
    await p.evaluate(() =>
      localStorage.setItem(
        "last-save.investor.v2",
        JSON.stringify({
          version: 2,
          created: true,
          world: "home",
          settings: { quality: "low", volume: 0 },
        }),
      ),
    );
    await p.goto(base + "?debug");
    await p
      .getByRole("button", { name: "Continue your story" })
      .click({ force: true });
    await p.waitForFunction(() => window.lastSaveDebug?.().mode === "play");
    const cdp = await p.context().newCDPSession(p),
      r = await p.locator("#joystick").boundingBox(),
      x = r.x + r.width / 2,
      y = r.y + r.height / 2,
      before = await p.evaluate(() => window.lastSaveDebug());
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x, y, id: 1 },
        { x: 300, y: 370, id: 2 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x + 15, y: y - 40, id: 1 },
        { x: 240, y: 400, id: 2 },
      ],
    });
    await p.waitForTimeout(1600);
    const during = await p.evaluate(() => window.lastSaveDebug());
    assert(
      Math.hypot(
        during.position.x - before.position.x,
        during.position.z - before.position.z,
      ) > 0.1,
    );
    assert(Math.abs(during.yaw - before.yaw) > 0.05);
    assert(during.stick.strength > 0.1);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await p.waitForFunction(
      () => {
        const v = window.lastSaveDebug?.().velocity;
        return v && Math.hypot(v.x, v.z) < 0.2;
      },
      null,
      { timeout: 20000 },
    );
    const stopped = await p.evaluate(() => window.lastSaveDebug());
    assert.equal(stopped.stick.strength, 0);
    assert(Math.hypot(stopped.velocity.x, stopped.velocity.z) < 0.2);
    await p.screenshot({ path: "test-results/mobile-controls.png" });
    await p.getByRole("button", { name: "Pause game" }).click({ force: true });
    await p.getByRole("dialog").waitFor();
    const bounds = await p.getByRole("dialog").boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= 391);
    await p.screenshot({ path: "test-results/mobile-menu.png" });
    console.log(
      "PASS independent real touch joystick/camera, release and mobile menu bounds",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
