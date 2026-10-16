const { chromium } = require("playwright");
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
  const p = await b.newPage({ viewport: { width: 800, height: 500 } });
  p.on("pageerror", (e) => console.log("ERROR", e.message));
  p.on("console", (m) => {
    if (m.type() === "error") console.log("CONSOLE", m.text());
  });
  await p.addInitScript(() => {
    if (!localStorage.getItem("last-save.investor.v2"))
      localStorage.setItem(
        "last-save.investor.v2",
        JSON.stringify({ version: 2, settings: { quality: "low", volume: 0 } }),
      );
  });
  await p.goto(process.env.BASE_URL || "http://localhost:4180/?debug");
  await p
    .getByRole("button", { name: "Begin adventure" })
    .waitFor({ timeout: 90000 });
  await p.screenshot({ path: "test-results/title.png" });
  await p
    .getByRole("button", { name: "Begin adventure" })
    .click({ force: true });
  await p.getByRole("button", { name: "Skip opening" }).click({ force: true });
  await p.waitForTimeout(500);
  await p.screenshot({ path: "test-results/customize.png" });
  await p
    .getByRole("button", { name: "This is my story" })
    .click({ force: true });
  await p.waitForTimeout(1000);
  console.log(await p.evaluate(() => window.lastSaveDebug()));
  await p.screenshot({ path: "test-results/home.png" });
  await p.keyboard.down("w");
  await p.waitForTimeout(1000);
  await p.keyboard.up("w");
  console.log("moved", await p.evaluate(() => window.lastSaveDebug().position));
  await b.close();
})();
