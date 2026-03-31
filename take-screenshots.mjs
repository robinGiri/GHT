import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });

  // Force all reveal elements visible (bypass IntersectionObserver for screenshots)
  await page.evaluate(() => {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.classList.add("is-visible");
    });
  });
  await page.waitForTimeout(500);

  // Hero section
  await page.screenshot({ path: "screenshots/02-hero.png" });

  // Scroll to each new section and screenshot
  const sections = [
    { id: "story", file: "03-story" },
    { id: "regions", file: "04-regions" },
    { id: "chunks", file: "05-journeys" },
    { id: "experience", file: "06-experience" },
    { id: "plan", file: "07-plan" },
    { id: "logistics", file: "08-logistics" },
    { id: "safety", file: "09-safety" },
    { id: "culture", file: "10-culture" },
    { id: "environment", file: "11-environment" },
    { id: "booking", file: "12-booking" },
  ];

  for (const s of sections) {
    await page.locator(`#${s.id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `screenshots/${s.file}.png` });
  }

  // Footer
  await page.locator("footer.site-footer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/13-footer.png" });

  // Mobile view
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "screenshots/14-mobile-hero.png" });

  await page.evaluate(() => document.querySelector("#logistics").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/15-mobile-logistics.png" });

  await page.evaluate(() => document.querySelector("#safety").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/15b-mobile-safety.png" });

  await page.evaluate(() => document.querySelector("#culture").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/15c-mobile-culture.png" });

  await page.evaluate(() => document.querySelector("#booking").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/16-mobile-booking.png" });

  await browser.close();
  console.log("All screenshots saved to ./screenshots/");
})();
