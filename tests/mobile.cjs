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
    const p = await b.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
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
          world: "home",
          settings: { quality: "low", volume: 0 },
        }),
      ),
    );
    await p.goto(base + "?debug");
    await p
      .getByRole("button", { name: "Controls & comfort" })
      .click({ force: true });
    await p.keyboard.press("Escape");
    await p.waitForFunction(() => window.lastSaveDebug?.().mode === "title");
    console.log("PASS title settings + Escape returns to title");
    await p
      .getByRole("button", { name: "Continue your story" })
      .click({ force: true });
    await p.waitForFunction(() => window.lastSaveDebug?.().mode === "play");
    const cdp = await p.context().newCDPSession(p);
    const touch = (type, touchPoints) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints });
    const state = () => p.evaluate(() => window.lastSaveDebug());
    const center = async () => {
      const r = await p.locator("#joystick").boundingBox();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    };
    const stopped = async () => {
      await p.waitForFunction(() => {
        const d = window.lastSaveDebug?.();
        return (
          d &&
          d.stick.strength === 0 &&
          Math.hypot(d.velocity.x, d.velocity.z) < 0.15
        );
      });
      assert.equal(
        await p.locator("#stick").evaluate((e) => e.style.transform),
        "",
      );
    };
    let { x, y } = await center();
    const camera = { x: 300, y: 370, id: 2 };
    const before = await state();
    await touch("touchStart", [{ x, y, id: 1 }, camera]);
    const moving = { x: x + 15, y: y - 40, id: 1 };
    await touch("touchMove", [moving, { ...camera, x: 240, y: 400 }]);
    await p.waitForFunction(() => window.lastSaveDebug().stick.strength > 0.1);
    await p.waitForTimeout(900);
    const during = await state();
    assert(
      Math.hypot(
        during.position.x - before.position.x,
        during.position.z - before.position.z,
      ) > 0.1,
    );
    assert(Math.abs(during.yaw - before.yaw) > 0.05);
    await p.screenshot({ path: "test-results/mobile-controls.png" });
    // For partial touchEnd Chromium consumes the points being released.
    // Assert the native TouchEvent too, so the two-finger test cannot silently
    // release the opposite finger (CDP documentation differs by version).
    await p.evaluate(() => {
      window.lastTouchEnd = null;
      window.addEventListener("touchend", (e) => {
        window.lastTouchEnd = {
          active: [...e.touches].map((t) => t.identifier),
          changed: [...e.changedTouches].map((t) => t.identifier),
        };
      });
    });
    // Release ONLY the moving thumb; camera must continue working.
    await touch("touchEnd", [moving]);
    assert.deepEqual(await p.evaluate(() => window.lastTouchEnd), {
      active: [2],
      changed: [1],
    });
    await stopped();
    const yaw = (await state()).yaw;
    await touch("touchMove", [{ ...camera, x: 280, y: 400 }]);
    await p.waitForFunction(
      (yaw) => Math.abs(window.lastSaveDebug().yaw - yaw) > 0.05,
      yaw,
    );
    await touch("touchEnd", []);
    console.log(
      "PASS two-finger move/look; releasing joystick stops while camera remains usable",
    );
    // The opposite release order must preserve a stationary, held thumb.
    await touch("touchStart", [
      { x, y, id: 3 },
      { ...camera, id: 4 },
    ]);
    await touch("touchMove", [
      { ...moving, id: 3 },
      { ...camera, id: 4 },
    ]);
    await touch("touchEnd", [{ ...camera, id: 4 }]);
    await p.waitForTimeout(700);
    assert(
      (await state()).stick.strength > 0.1,
      "releasing camera must not cancel the other finger",
    );
    await touch("touchMove", [{ x: x + 190, y: y - 150, id: 3 }]);
    await touch("touchEnd", []);
    await stopped();
    console.log(
      "PASS camera release preserves held movement; drag outside joystick then lift stops",
    );
    await touch("touchStart", [{ ...moving, id: 5 }]);
    await touch("touchCancel", []);
    await stopped();
    await touch("touchStart", [{ ...moving, id: 6 }]);
    await p.getByRole("button", { name: "Pause game" }).click({ force: true });
    await p.getByRole("dialog").waitFor();
    assert.equal((await state()).stick.strength, 0);
    const bounds = await p.getByRole("dialog").boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= 391);
    await p.screenshot({ path: "test-results/mobile-menu.png" });
    await p
      .getByRole("button", { name: /Return to the world/ })
      .click({ force: true });
    await p.waitForFunction(() => window.lastSaveDebug().mode === "play");
    await touch("touchMove", [{ ...moving, id: 6, x: x + 25 }]);
    await stopped(); // old touch must never reactivate after closing the menu
    await touch("touchEnd", []);
    console.log(
      "PASS OS touch cancellation and pause while holding; old touch cannot resume movement",
    );
    await touch("touchStart", [{ ...moving, id: 7 }]);
    await p.setViewportSize({ width: 844, height: 390 });
    await stopped();
    await touch("touchEnd", []);
    await p.setViewportSize({ width: 390, height: 844 });
    ({ x, y } = await center());
    await touch("touchStart", [{ x, y: y - 40, id: 8 }]);
    assert((await state()).stick.strength > 0.1);
    await p.evaluate(() => window.dispatchEvent(new Event("blur")));
    await stopped();
    await touch("touchEnd", []);
    console.log(
      "PASS viewport rotation and injected focus interruption; fresh touch recovers",
    );
    await p.getByRole("button", { name: "Pause game" }).click({ force: true });
    await p
      .getByText("Investor Demo Mode", { exact: true })
      .click({ force: true });
    await p
      .getByRole("button", { name: "Hide HUD · press H to restore" })
      .click({ force: true });
    await p.getByRole("button", { name: "Show controls" }).tap();
    await p.locator("#joystick").waitFor({ state: "visible" });
    // Repeated rapid starts/releases must not strand an owner ID.
    for (let i = 10; i < 15; i++) {
      await touch("touchStart", [{ x, y: y - 40, id: i }]);
      assert((await state()).stick.strength > 0.1);
      await touch("touchEnd", []);
      assert.equal((await state()).stick.strength, 0);
    }
    await stopped();
    const jump = p.getByRole("button", { name: "Jump", exact: true });
    await jump.waitFor({ state: "visible" });
    const jumpBounds = await jump.boundingBox();
    assert(jumpBounds.x >= 0 && jumpBounds.x + jumpBounds.width <= 391);
    assert(jumpBounds.y >= 0 && jumpBounds.y + jumpBounds.height <= 845);
    await jump.tap();
    await p.waitForFunction(() => window.lastSaveDebug().velocity.y > 1, null, {
      polling: 50,
      timeout: 15000,
    });
    await p.waitForFunction(() => window.lastSaveDebug().grounded);
    await p.screenshot({ path: "test-results/mobile-controls-recovered.png" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS mobile HUD restore, repeated joystick re-entry, touch jump and clean runtime console",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
