import { test, expect } from "@playwright/test";

test.describe("GHT Website — Section Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("page title is correct", async ({ page }) => {
    await expect(page).toHaveTitle("Great Himalaya Trail Nepal");
  });

  test("header nav has all 4 links", async ({ page }) => {
    const nav = page.locator("nav.site-nav");
    const links = nav.locator("a");
    await expect(links).toHaveCount(4);

    const expectedLinks = [
      "Journeys", "Plan", "Culture", "Shop",
    ];
    for (let i = 0; i < expectedLinks.length; i++) {
      await expect(links.nth(i)).toHaveText(expectedLinks[i]);
    }
  });

  test("hero section renders with stats", async ({ page }) => {
    const hero = page.locator("section.hero");
    await expect(hero).toBeVisible();
    await expect(hero.locator("h1")).toContainText("roofline of Nepal");
    await expect(hero.locator(".hero-stats li")).toHaveCount(3);
  });

  test("story section renders", async ({ page }) => {
    const story = page.locator("#story");
    await expect(story).toBeVisible();
    await expect(story.locator("h2")).toContainText("contrast");
  });

  test("regions section has 4 cards", async ({ page }) => {
    const regions = page.locator("#regions");
    await expect(regions).toBeVisible();
    await expect(regions.locator(".region-card")).toHaveCount(4);
  });

  test("journey viewer has 9 interactive nodes", async ({ page }) => {
    await page.goto("/journeys");
    await page.waitForLoadState("networkidle");
    const chunks = page.locator("#chunks");
    await expect(chunks).toBeVisible();
    await expect(chunks.locator(".journey-node")).toHaveCount(9);
  });

  test("clicking journey node updates detail panel", async ({ page }) => {
    await page.goto("/journeys");
    await page.waitForLoadState("networkidle");
    const node3 = page.locator(".journey-node").nth(2);
    await node3.click();
    const detailTitle = page.locator(".journey-detail-titles h2");
    await expect(detailTitle).toContainText("Everest");
  });

  test("experience section renders 3 items", async ({ page }) => {
    await page.goto("/plan");
    await page.waitForLoadState("networkidle");
    const exp = page.locator("#experience");
    await expect(exp).toBeVisible();
    await expect(exp.locator(".experience-item")).toHaveCount(3);
  });

  test("plan section has 3 cards", async ({ page }) => {
    await page.goto("/plan");
    await page.waitForLoadState("networkidle");
    const plan = page.locator("#plan");
    await expect(plan).toBeVisible();
    await expect(plan.locator(".plan-card")).toHaveCount(3);
  });
});

test.describe("GHT Website — Plan Page Sections", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/plan");
    await page.waitForLoadState("networkidle");
  });

  test("logistics section renders 4 cards", async ({ page }) => {
    const logistics = page.locator("#logistics");
    await expect(logistics).toBeVisible();
    await expect(logistics.locator(".logistics-card")).toHaveCount(4);

    // Check each card has a title and list items
    const cards = logistics.locator(".logistics-card");
    for (let i = 0; i < 4; i++) {
      await expect(cards.nth(i).locator("h3")).toBeVisible();
      const items = cards.nth(i).locator("li");
      expect(await items.count()).toBeGreaterThan(0);
    }
  });

  test("logistics section has permits content", async ({ page }) => {
    const logistics = page.locator("#logistics");
    await expect(logistics).toContainText("TIMS");
    await expect(logistics).toContainText("Restricted area");
    await expect(logistics).toContainText("Season Windows");
    await expect(logistics).toContainText("Budget Planning");
    await expect(logistics).toContainText("Essential Gear");
  });

  test("safety section renders difficulty tiers", async ({ page }) => {
    const safety = page.locator("#safety");
    await expect(safety).toBeVisible();
    await expect(safety.locator(".safety-tier")).toHaveCount(4);

    // Check tier levels are present
    await expect(safety).toContainText("Easy");
    await expect(safety).toContainText("Moderate");
    await expect(safety).toContainText("Strenuous");
    await expect(safety).toContainText("Technical");
  });

  test("safety section has altitude protocol", async ({ page }) => {
    const safety = page.locator("#safety");
    await expect(safety.locator(".safety-altitude")).toBeVisible();
    await expect(safety).toContainText("Altitude Protocol");
    await expect(safety).toContainText("Diamox");
    await expect(safety).toContainText("HACE/HAPE");
  });

  test("safety section has emergency info", async ({ page }) => {
    const safety = page.locator("#safety");
    await expect(safety.locator(".safety-emergency")).toBeVisible();
    await expect(safety).toContainText("Helicopter rescue");
    await expect(safety).toContainText("Insurance");
    await expect(safety).toContainText("TAAN rescue");
  });

  test("culture section renders 8 people cards", async ({ page }) => {
    await page.goto("/culture");
    await page.waitForLoadState("networkidle");
    const culture = page.locator("#culture");
    await expect(culture).toBeVisible();
    await expect(culture.locator(".culture-people-card")).toHaveCount(8);
  });

  test("culture section has expected ethnic groups", async ({ page }) => {
    await page.goto("/culture");
    await page.waitForLoadState("networkidle");
    const culture = page.locator("#culture");
    const groups = ["Sherpa", "Rai & Limbu", "Tamang", "Gurung", "Thakali", "Dolpo-pa", "Magar", "Loba"];
    for (const group of groups) {
      await expect(culture).toContainText(group);
    }
  });

  test("culture section has festivals", async ({ page }) => {
    await page.goto("/culture");
    await page.waitForLoadState("networkidle");
    const culture = page.locator("#culture");
    await expect(culture.locator(".culture-festival-item")).toHaveCount(5);
    await expect(culture).toContainText("Dashain");
    await expect(culture).toContainText("Mani Rimdu");
    await expect(culture).toContainText("Tiji Festival");
  });

  test("culture section has etiquette guide", async ({ page }) => {
    await page.goto("/culture");
    await page.waitForLoadState("networkidle");
    const culture = page.locator("#culture");
    await expect(culture.locator(".culture-etiquette")).toBeVisible();
    await expect(culture).toContainText("clockwise");
    await expect(culture).toContainText("Remove shoes");
  });

  test("environment section renders 8 conservation areas", async ({ page }) => {
    await page.goto("/culture");
    await page.waitForLoadState("networkidle");
    const env = page.locator("#environment");
    await expect(env).toBeVisible();
    await expect(env.locator(".env-park-card")).toHaveCount(8);
  });

  test("environment section has expected parks", async ({ page }) => {
    await page.goto("/culture");
    await page.waitForLoadState("networkidle");
    const env = page.locator("#environment");
    const parks = [
      "Sagarmatha National Park",
      "Annapurna Conservation Area",
      "Langtang National Park",
      "Shey-Phoksundo National Park",
      "Rara National Park",
    ];
    for (const park of parks) {
      await expect(env).toContainText(park);
    }
  });

  test("environment section has wildlife cards", async ({ page }) => {
    await page.goto("/culture");
    await page.waitForLoadState("networkidle");
    const env = page.locator("#environment");
    await expect(env.locator(".env-wildlife-card")).toHaveCount(4);
    await expect(env).toContainText("Snow Leopard");
    await expect(env).toContainText("Red Panda");
  });

  test("environment section has Leave No Trace principles", async ({ page }) => {
    await page.goto("/culture");
    await page.waitForLoadState("networkidle");
    const env = page.locator("#environment");
    await expect(env.locator(".env-principles")).toBeVisible();
    await expect(env).toContainText("Pack out all waste");
  });

  test("environment section has climate impact statement", async ({ page }) => {
    await page.goto("/culture");
    await page.waitForLoadState("networkidle");
    const env = page.locator("#environment");
    await expect(env.locator(".env-climate")).toBeVisible();
    await expect(env).toContainText("glaciers");
    await expect(env).toContainText("Climate Impact");
  });

  test("booking section renders with CTA", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const booking = page.locator("#booking");
    await expect(booking).toBeVisible();
    await expect(booking).toContainText("Build GHT itineraries");
    await expect(booking.locator(".booking-point")).toHaveCount(3);

    // CTA button exists and has mailto link
    const cta = booking.locator("a.button-primary");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "mailto:info@greathimalayatrail.com");
    await expect(cta).toContainText("Partner With Us");
  });

  test("booking section has operator selling points", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const booking = page.locator("#booking");
    await expect(booking).toContainText("Permit Handling");
    await expect(booking).toContainText("Custom Itineraries");
    await expect(booking).toContainText("Local Operations");
  });

  test("footer renders with nav and brand", async ({ page }) => {
    const footer = page.locator("footer.site-footer");
    await expect(footer).toBeVisible();
    await expect(footer.locator(".footer-brand")).toContainText("Great Himalaya Trail");
    await expect(footer.locator(".footer-nav a")).toHaveCount(5);
    await expect(footer.locator(".footer-copy")).toContainText("1,700 km");
  });
});

test.describe("GHT Website — Navigation", () => {
  test("nav links navigate to correct pages", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const navLinks = [
      { link: "Journeys", path: "/journeys" },
      { link: "Plan", path: "/plan" },
      { link: "Culture", path: "/culture" },
      { link: "Shop", path: "/shop" },
    ];

    for (const { link, path } of navLinks) {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const toggle = page.locator("button.nav-toggle");
      if (await toggle.isVisible()) {
        const navHidden = await page.locator("nav.site-nav").isHidden();
        if (navHidden) await toggle.click();
      }
      await page.locator(`nav.site-nav a:text("${link}")`).click();
      await expect(page).toHaveURL(new RegExp(path));
    }
  });
});

test.describe("GHT Website — Responsive Layout", () => {
  test("mobile viewport renders homepage sections", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    for (const id of ["story", "regions", "belt", "explore", "booking"]) {
      const section = page.locator(`#${id}`);
      await expect(section).toBeAttached();
    }

    // Footer should be attached
    await expect(page.locator("footer.site-footer")).toBeAttached();
  });

  test("tablet viewport renders homepage sections", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    for (const id of ["story", "regions", "belt", "explore", "booking"]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });
});

test.describe("GHT Website — Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("skip link is present and focusable", async ({ page }) => {
    const skipLink = page.locator("a.skip-link");
    await expect(skipLink).toBeAttached();
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  test("journey nodes have aria-pressed attribute", async ({ page }) => {
    await page.goto("/journeys");
    await page.waitForLoadState("networkidle");
    const nodes = page.locator(".journey-node");
    const count = await nodes.count();
    for (let i = 0; i < count; i++) {
      const pressed = await nodes.nth(i).getAttribute("aria-pressed");
      expect(pressed === "true" || pressed === "false").toBeTruthy();
    }
    // First node should be active (pressed) by default
    await expect(nodes.first()).toHaveAttribute("aria-pressed", "true");
  });

  test("clicking a journey node updates aria-pressed", async ({ page }) => {
    await page.goto("/journeys");
    await page.waitForLoadState("networkidle");
    const nodes = page.locator(".journey-node");
    await nodes.nth(2).click();
    await expect(nodes.nth(2)).toHaveAttribute("aria-pressed", "true");
    await expect(nodes.first()).toHaveAttribute("aria-pressed", "false");
  });

  test("primary nav has aria-label", async ({ page }) => {
    await expect(page.locator("nav[aria-label='Primary navigation']")).toBeAttached();
  });

  test("hero stats list has aria-label", async ({ page }) => {
    await expect(page.locator("ul[aria-label='Trail stats']")).toBeVisible();
  });
});

test.describe("GHT Website — Mobile Nav", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("hamburger toggle button is visible on mobile", async ({ page }) => {
    await expect(page.locator("button.nav-toggle")).toBeVisible();
  });

  test("nav is hidden by default on mobile", async ({ page }) => {
    await expect(page.locator("nav.site-nav")).toBeHidden();
  });

  test("clicking toggle opens nav", async ({ page }) => {
    await page.locator("button.nav-toggle").click();
    await expect(page.locator("nav.site-nav")).toBeVisible();
  });

  test("clicking a nav link closes the nav", async ({ page }) => {
    await page.locator("button.nav-toggle").click();
    await expect(page.locator("nav.site-nav")).toBeVisible();
    await page.locator("nav.site-nav a").first().click();
    await expect(page.locator("nav.site-nav")).toBeHidden();
  });

  test("toggle button aria-expanded reflects open state", async ({ page }) => {
    const toggle = page.locator("button.nav-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
