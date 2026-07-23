const { test, expect } = require("@playwright/test");

const INTRO_STATE = "cinematic-intro-pending";
const COMPLETE_STATE = "cinematic-intro-complete";
const STORAGE_KEY = "ian-cinematic-seen-v2";

test("plays the complete four-second focal sequence once per session", async ({ page }) => {
  await page.goto("/");

  const root = page.locator("html");
  const intro = page.locator("[data-cinematic-intro]");
  const identity = page.locator(".cinematic-intro__identity");

  await expect(root).toHaveClass(new RegExp(INTRO_STATE));
  await expect(intro).toBeVisible();
  await expect(page.locator(".cinematic-intro__aperture img")).toBeVisible();
  await expect(page.locator(".cinematic-intro__paths path")).toHaveCount(8);
  await expect(page.locator(".cinematic-intro__nodes circle")).toHaveCount(12);

  const backgroundAnimations = await intro.evaluate((element) => ({
    starfield: getComputedStyle(element, "::before").animationName,
    streak: getComputedStyle(element, "::after").animationName,
  }));
  expect(backgroundAnimations.starfield).toContain("cinematic-starfield");
  expect(backgroundAnimations.streak).toContain("cinematic-star-streak");

  await page.waitForTimeout(2_600);
  const identityOpacity = await identity.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).opacity)
  );
  expect(identityOpacity).toBeGreaterThan(0.5);

  await expect(root).toHaveClass(new RegExp(COMPLETE_STATE), { timeout: 5_000 });
  await expect(intro).toBeHidden();
  await expect(page.locator("[data-cinematic-replay]")).toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), STORAGE_KEY))
    .toBe("1");

  const runningIntroAnimations = await intro.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .filter((animation) => animation.playState === "running").length
  );
  expect(runningIntroAnimations).toBe(0);

  await page.reload();
  await expect(root).not.toHaveClass(new RegExp(INTRO_STATE));
  await expect(intro).toBeHidden();
});

test("supports skip, replay, Escape, and pointer dismissal", async ({ page }) => {
  await page.goto("/");

  const root = page.locator("html");
  const intro = page.locator("[data-cinematic-intro]");
  const replay = page.locator("[data-cinematic-replay]");

  await page.locator("[data-cinematic-skip]").click();
  await expect(root).toHaveClass(new RegExp(COMPLETE_STATE));
  await expect(intro).toHaveAttribute("aria-hidden", "true");

  await replay.click();
  await expect(root).toHaveClass(new RegExp(INTRO_STATE));
  await page.keyboard.press("Escape");
  await expect(root).toHaveClass(new RegExp(COMPLETE_STATE));

  await replay.click();
  await expect(root).toHaveClass(new RegExp(INTRO_STATE));
  await page.locator("#theme-toggle").focus();
  await expect(root).toHaveClass(new RegExp(COMPLETE_STATE));

  await replay.click();
  await expect(root).toHaveClass(new RegExp(INTRO_STATE));
  await intro.click({ position: { x: 24, y: 80 } });
  await expect(root).toHaveClass(new RegExp(COMPLETE_STATE));
});

test("bypasses decorative motion when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("html")).not.toHaveClass(new RegExp(INTRO_STATE));
  await expect(page.locator("[data-cinematic-intro]")).toBeHidden();
  await expect(page.locator("[data-cinematic-replay]")).toBeHidden();
  await expect(page.locator("#main")).toBeVisible();
});

test("keeps content available when JavaScript or the main bundle is unavailable", async ({
  browser,
  page,
}) => {
  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto("/");
  await expect(noScriptPage.locator("[data-cinematic-intro]")).toBeHidden();
  await expect(noScriptPage.locator("#main")).toBeVisible();
  await noScriptContext.close();

  await page.route("**/assets/js/main.min.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(new RegExp(INTRO_STATE));
  await page.waitForTimeout(4_300);
  await expect(page.locator("[data-cinematic-intro]")).toBeHidden();
  await expect(page.locator("#main")).toBeVisible();
});

test("adapts to dark theme and mobile viewports without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".cinematic-intro__portal")).toBeInViewport();
  await expect(page.locator("[data-cinematic-skip]")).toBeInViewport();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("does not include cinematic markup on internal pages", async ({ page }) => {
  await page.goto("/portfolio/");

  await expect(page.locator("body")).not.toHaveClass(/home--cinematic/);
  await expect(page.locator("[data-cinematic-intro]")).toHaveCount(0);
  await expect(page.locator("[data-cinematic-replay]")).toHaveCount(0);
  await expect(page.locator("#main")).toBeVisible();
});
