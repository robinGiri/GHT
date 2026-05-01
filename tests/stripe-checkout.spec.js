import { test, expect } from "@playwright/test";

/**
 * Stripe Checkout E2E Tests
 * Tests the full payment flow: browse → cart → checkout → success/cancel
 * Uses STRIPE_MOCK=true backend mode (no real Stripe API calls)
 */

test.describe("Stripe Checkout — Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage cart before each test
    await page.goto("/shop");
    await page.evaluate(() => localStorage.removeItem("ght_cart"));
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("single digital map: add → fill form → pay → success page", async ({ page }) => {
    // 1. Navigate to a map detail page
    await page.locator('a[href="/shop/maps/NP101"]').click();
    await page.waitForURL("**/shop/maps/NP101");

    // 2. Click "Add to Cart"
    await page.locator('aside button:has-text("Add to Cart")').click();

    // 3. Cart drawer should open with the item
    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator(".cart-item")).toHaveCount(1);
    await expect(drawer.locator(".cart-item-name")).toContainText("Kanchenjunga");

    // 4. Verify subtotal shows $10.00
    await expect(drawer.locator(".cart-subtotal strong")).toHaveText("$10.00");

    // 5. Fill in customer details
    await page.fill("#cart-name", "Tenzing Norgay");
    await page.fill("#cart-email", "tenzing@everest.np");

    // 6. Click Pay button
    await page.locator('button[type="submit"]:has-text("Pay")').click();

    // 7. Should redirect to success page
    await page.waitForURL("**/checkout/success?session_id=cs_mock_*");
    await expect(page.locator("h1")).toHaveText("Payment successful!");

    // 8. Verify customer name displayed
    await expect(page.locator("main")).toContainText("Tenzing Norgay");

    // 9. Verify digital map download section
    await expect(page.locator("main")).toContainText("Your Digital Maps");

    // 11. Verify order reference shown
    await expect(page.locator("code")).toContainText("cs_mock_");

    // 12. Verify download button is present
    await expect(page.locator(".download-btn")).toBeVisible();

    // 13. Cart should be cleared (0 items in header)
    await expect(page.locator('button[aria-label*="cart"]')).toHaveAttribute("aria-label", /0 items/);
  });

  test("success page fetches order from backend API", async ({ page }) => {
    // Go through checkout
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();
    await page.fill("#cart-name", "API Test User");
    await page.fill("#cart-email", "api@test.com");

    // Click Pay and wait for success page
    await page.locator('button[type="submit"]:has-text("Pay")').click();
    await page.waitForURL("**/checkout/success**");

    // Extract session ID from URL
    const sessionId = new URL(page.url()).searchParams.get("session_id");
    expect(sessionId).toMatch(/^cs_mock_/);

    // Verify the success page loaded data from the backend API
    await expect(page.locator("main")).toContainText("API Test User");

    // Also verify via direct API call
    const res = await page.request.get(`/api/checkout/session/${sessionId}`);
    const sessionData = await res.json();

    expect(sessionData.customer_name).toBe("API Test User");
    expect(sessionData.customer_email).toBe("api@test.com");
    expect(sessionData.status).toBe("paid");
    expect(sessionData.total_amount).toBe(10.0);
    expect(sessionData.has_digital).toBe(true);
    expect(sessionData.has_physical).toBe(false);
  });
});

test.describe("Stripe Checkout — Cart Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shop");
    await page.evaluate(() => localStorage.removeItem("ght_cart"));
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("multiple items: add 2 different maps, checkout both", async ({ page }) => {
    // Add first map from detail page sidebar
    await page.locator('a[href="/shop/maps/NP101"]').click();
    await page.waitForURL("**/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    // Close drawer, navigate to second map
    await page.locator('button[aria-label="Close cart"]').click();
    await page.goto("/shop/maps/NP102");
    await page.waitForLoadState("networkidle");
    await page.locator('aside button:has-text("Add to Cart")').click();

    // Verify 2 items in cart
    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer.locator(".cart-item")).toHaveCount(2);

    // Verify subtotal is $20.00 (2 × $10.00)
    await expect(drawer.locator(".cart-subtotal strong")).toHaveText("$20.00");

    // Checkout
    await page.fill("#cart-name", "Multi Item User");
    await page.fill("#cart-email", "multi@test.com");
    await page.locator('button[type="submit"]:has-text("Pay")').click();
    await page.waitForURL("**/checkout/success**");

    await expect(page.locator("h1")).toHaveText("Payment successful!");
    await expect(page.locator("main")).toContainText("Multi Item User");
  });

  test("quantity increase updates subtotal", async ({ page }) => {
    // Add a map
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer).toBeVisible();

    // Increase quantity
    await drawer.locator('button[aria-label="Increase quantity"]').click();
    await expect(drawer.locator(".cart-qty span")).toHaveText("2");

    // Subtotal should update to $20.00
    await expect(drawer.locator(".cart-subtotal strong")).toHaveText("$20.00");

    // Checkout with qty=2
    await page.fill("#cart-name", "Qty Test");
    await page.fill("#cart-email", "qty@test.com");

    const [checkoutResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/checkout/session") && r.request().method() === "POST"),
      page.locator('button[type="submit"]:has-text("Pay")').click(),
    ]);

    const body = JSON.parse(checkoutResponse.request().postData());
    expect(body.line_items[0].quantity).toBe(2);
    expect(body.line_items[0].price).toBe(10);
  });

  test("decrease quantity to 1 then remove item", async ({ page }) => {
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer).toBeVisible();

    // Increase to 2
    await drawer.locator('button[aria-label="Increase quantity"]').click();
    await expect(drawer.locator(".cart-qty span")).toHaveText("2");

    // Decrease back to 1
    await drawer.locator('button[aria-label="Decrease quantity"]').click();
    await expect(drawer.locator(".cart-qty span")).toHaveText("1");

    // Remove item entirely
    await drawer.locator('button[aria-label*="Remove"]').click();

    // Cart should be empty
    await expect(drawer.locator(".cart-empty-title")).toHaveText("Your cart is empty");
  });

  test("adding same item twice increases quantity", async ({ page }) => {
    await page.goto("/shop/maps/NP101");

    // Add to cart once
    await page.locator('aside button:has-text("Add to Cart")').click();
    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer.locator(".cart-qty span")).toHaveText("1");

    // Close drawer
    await page.locator('button[aria-label="Close cart"]').click();

    // Add same item again
    await page.locator('aside button:has-text("Add to Cart")').click();
    await expect(drawer.locator(".cart-qty span")).toHaveText("2");
    await expect(drawer.locator(".cart-subtotal strong")).toHaveText("$20.00");
  });
});

test.describe("Stripe Checkout — Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shop");
    await page.evaluate(() => localStorage.removeItem("ght_cart"));
    await page.reload();
  });

  test("Pay button shows error when name is empty", async ({ page }) => {
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    // Only fill email, leave name empty
    await page.fill("#cart-email", "test@example.com");
    await page.locator('button[type="submit"]:has-text("Pay")').click();

    // Should show validation error
    const error = page.locator('[role="alert"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText("name");
  });

  test("Pay button shows error when email is empty", async ({ page }) => {
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    // Only fill name, leave email empty
    await page.fill("#cart-name", "Test User");
    await page.locator('button[type="submit"]:has-text("Pay")').click();

    // Should show validation error
    const error = page.locator('[role="alert"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText("name and email");
  });

  test("Pay button shows error for invalid email", async ({ page }) => {
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    await page.fill("#cart-name", "Test User");
    await page.fill("#cart-email", "not-an-email");
    await page.locator('button[type="submit"]:has-text("Pay")').click();

    // Should show email validation error
    const error = page.locator('[role="alert"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText("valid email");
  });

  test("empty cart shows empty state", async ({ page }) => {
    // Open cart via header icon
    await page.locator('button[aria-label*="cart"]').click();

    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator(".cart-empty-title")).toHaveText("Your cart is empty");

    // No Pay button should exist
    await expect(drawer.locator('button[type="submit"]')).toHaveCount(0);
  });
});

test.describe("Stripe Checkout — Cancel Page", () => {
  test("cancel page renders correctly", async ({ page }) => {
    await page.goto("/checkout/cancel");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toHaveText("Payment cancelled");
    await expect(page.locator("main")).toContainText("No charge was made");

    // Verify return links
    await expect(page.locator('a:has-text("Return to Shop")')).toBeVisible();
    await expect(page.locator('a:has-text("Back to Home")')).toBeVisible();
  });

  test("cancel page: Return to Shop link works", async ({ page }) => {
    await page.goto("/checkout/cancel");
    await page.locator('a:has-text("Return to Shop")').click();
    await page.waitForURL("**/shop");
    await expect(page.locator("h1")).toContainText("Maps, Guides & More");
  });
});

test.describe("Stripe Checkout — Backend API", () => {
  test("POST /api/checkout/session with empty cart returns 400", async ({ request }) => {
    const res = await request.post("/api/checkout/session", {
      data: {
        line_items: [],
        customer_name: "Test",
        customer_email: "t@t.com",
        has_physical: false,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("empty");
  });

  test("POST /api/checkout/session with negative price returns 400", async ({ request }) => {
    const res = await request.post("/api/checkout/session", {
      data: {
        line_items: [{ product_id: "NP101", name: "Test", price: -5, quantity: 1, type: "digital_map" }],
        customer_name: "Test",
        customer_email: "t@t.com",
        has_physical: false,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("Invalid price");
  });

  test("POST /api/checkout/session creates mock session with valid data", async ({ request }) => {
    const res = await request.post("/api/checkout/session", {
      data: {
        line_items: [
          { product_id: "NP101", name: "Map 1", price: 10, quantity: 1, type: "digital_map" },
          { product_id: "NP102", name: "Map 2", price: 10, quantity: 2, type: "digital_map" },
        ],
        customer_name: "API Tester",
        customer_email: "api@test.com",
        has_physical: false,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.url).toContain("/checkout/success?session_id=cs_mock_");
  });

  test("GET /api/checkout/session/:id returns order details", async ({ request }) => {
    // First create a session
    const createRes = await request.post("/api/checkout/session", {
      data: {
        line_items: [{ product_id: "NP101", name: "Map Test", price: 10, quantity: 1, type: "digital_map" }],
        customer_name: "Session Fetch Test",
        customer_email: "fetch@test.com",
        has_physical: false,
      },
    });
    const { url } = await createRes.json();
    const sessionId = new URL(url).searchParams.get("session_id");

    // Fetch the session
    const getRes = await request.get(`/api/checkout/session/${sessionId}`);
    expect(getRes.status()).toBe(200);
    const order = await getRes.json();

    expect(order.customer_name).toBe("Session Fetch Test");
    expect(order.customer_email).toBe("fetch@test.com");
    expect(order.status).toBe("paid");
    expect(order.total_amount).toBe(10);
    expect(order.has_digital).toBe(true);
    expect(order.has_physical).toBe(false);
  });

  test("GET /api/checkout/session/:id returns 404 for unknown session", async ({ request }) => {
    const res = await request.get("/api/checkout/session/cs_fake_nonexistent");
    expect(res.status()).toBe(404);
  });

  test("POST /api/checkout/session with physical item sets has_physical", async ({ request }) => {
    const res = await request.post("/api/checkout/session", {
      data: {
        line_items: [{ product_id: "BOOK-001", name: "Nepal Trekking and the Great Himalaya Trail", price: 33.45, quantity: 1, type: "physical_book" }],
        customer_name: "Physical Test",
        customer_email: "phys@test.com",
        has_physical: true,
      },
    });
    expect(res.status()).toBe(200);
    const { url } = await res.json();
    const sessionId = new URL(url).searchParams.get("session_id");

    const getRes = await request.get(`/api/checkout/session/${sessionId}`);
    const order = await getRes.json();
    expect(order.has_physical).toBe(true);
    expect(order.has_digital).toBe(false);
  });
});

test.describe("Stripe Checkout — Cart Persistence", () => {
  test("cart persists across page navigation", async ({ page }) => {
    await page.goto("/shop");
    await page.evaluate(() => localStorage.removeItem("ght_cart"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Add item to cart from detail page sidebar
    await page.locator('a[href="/shop/maps/NP101"]').click();
    await page.waitForURL("**/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();
    await page.locator('button[aria-label="Close cart"]').click();

    // Wait for localStorage to be updated by React effect
    await page.waitForFunction(() => {
      const data = localStorage.getItem("ght_cart");
      return data && JSON.parse(data).length > 0;
    });

    // Navigate via React Router link (not page.goto) to preserve SPA state
    await page.locator('a[href="/"]').first().click();
    await page.waitForURL("**/");
    await page.waitForLoadState("networkidle");

    // Cart badge should still show 1
    await expect(page.locator('button[aria-label*="cart"]')).toHaveAttribute("aria-label", /1 item/);

    // Open cart and verify item is there
    await page.locator('button[aria-label*="cart"]').click();
    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer.locator(".cart-item-name")).toContainText("Kanchenjunga");
  });

  test("cart persists across page reload", async ({ page }) => {
    await page.goto("/shop");
    await page.evaluate(() => localStorage.removeItem("ght_cart"));
    await page.reload();

    // Add item from detail page sidebar
    await page.locator('a[href="/shop/maps/NP101"]').click();
    await page.waitForURL("**/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();
    await page.locator('button[aria-label="Close cart"]').click();

    // Wait for localStorage to be updated by React effect
    await page.waitForFunction(() => {
      const data = localStorage.getItem("ght_cart");
      return data && JSON.parse(data).length > 0;
    });

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Cart should still have the item
    await expect(page.locator('button[aria-label*="cart"]')).toHaveAttribute("aria-label", /1 item/);
  });

  test("cart clears after successful checkout", async ({ page }) => {
    await page.goto("/shop");
    await page.evaluate(() => localStorage.removeItem("ght_cart"));
    await page.reload();

    // Add item and checkout from detail page sidebar
    await page.locator('a[href="/shop/maps/NP101"]').click();
    await page.waitForURL("**/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();
    await page.fill("#cart-name", "Clear Test");
    await page.fill("#cart-email", "clear@test.com");
    await page.locator('button[type="submit"]:has-text("Pay")').click();
    await page.waitForURL("**/checkout/success**");

    // Navigate to shop
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // Cart should be empty
    await expect(page.locator('button[aria-label*="cart"]')).toHaveAttribute("aria-label", /0 items/);

    // localStorage should be empty
    const cartData = await page.evaluate(() => localStorage.getItem("ght_cart"));
    expect(JSON.parse(cartData)).toEqual([]);
  });
});

test.describe("Stripe Checkout — UI Elements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shop");
    await page.evaluate(() => localStorage.removeItem("ght_cart"));
    await page.reload();
  });

  test("cart drawer has prayer-flag stripe", async ({ page }) => {
    await page.locator('a[href="/shop/maps/NP101"]').click();
    await page.waitForURL("**/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    const header = page.locator(".cart-drawer-header");
    await expect(header).toBeVisible();

    // Verify the prayer-flag stripe exists via CSS ::after pseudo-element
    const hasStripe = await page.evaluate(() => {
      const el = document.querySelector(".cart-drawer-header");
      if (!el) return false;
      const style = window.getComputedStyle(el, "::after");
      return style.content !== "none" && style.height !== "0px";
    });
    expect(hasStripe).toBe(true);
  });

  test("Pay button shows correct amount", async ({ page }) => {
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    const payBtn = page.locator('button[type="submit"]');
    await expect(payBtn).toHaveText("Pay $10.00 securely");

    // Increase quantity
    await page.locator('button[aria-label="Increase quantity"]').click();
    await expect(payBtn).toHaveText("Pay $20.00 securely");
  });

  test("cart shows digital PDF badge for maps", async ({ page }) => {
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    const badge = page.locator(".cart-item-badge--digital");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("Digital PDF");
  });

  test("cart close button works", async ({ page }) => {
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer).toBeVisible();

    await page.locator('button[aria-label="Close cart"]').click();
    await expect(drawer).toBeHidden();
  });

  test("cart closes on Escape key", async ({ page }) => {
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("cart closes on backdrop click", async ({ page }) => {
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();

    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer).toBeVisible();

    await page.locator(".cart-backdrop").click();
    await expect(drawer).toBeHidden();
  });

  test("success page has breadcrumb navigation", async ({ page }) => {
    // Go through checkout quickly
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();
    await page.fill("#cart-name", "Breadcrumb Test");
    await page.fill("#cart-email", "bc@test.com");
    await page.locator('button[type="submit"]:has-text("Pay")').click();
    await page.waitForURL("**/checkout/success**");

    // Check breadcrumb
    const breadcrumb = page.locator("nav[aria-label='Breadcrumb']");
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText("Shop");
    await expect(breadcrumb).toContainText("Order Confirmation");
  });
});

test.describe("PDF Download Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shop");
    await page.evaluate(() => localStorage.removeItem("ght_cart"));
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("success page shows download button for purchased digital map", async ({ page }) => {
    // Buy a single map
    await page.goto("/shop/maps/NP103");
    await page.locator('aside button:has-text("Add to Cart")').click();
    await page.fill("#cart-name", "Download Tester");
    await page.fill("#cart-email", "dl@test.com");
    await page.locator('button[type="submit"]:has-text("Pay")').click();
    await page.waitForURL("**/checkout/success**");

    // Should see download section
    await expect(page.locator(".downloads-box")).toBeVisible();
    await expect(page.locator(".downloads-box h2")).toContainText("Your Digital Maps");
    await expect(page.locator(".downloads-subtitle")).toContainText("24 hours");

    // Should have a download card with the map name
    const card = page.locator(".download-card");
    await expect(card).toBeVisible();
    await expect(card.locator("h3")).toContainText("Everest");

    // Should have a download button with correct link
    const btn = card.locator(".download-btn");
    await expect(btn).toBeVisible();
    await expect(btn).toContainText("Download PDF Map");
    const href = await btn.getAttribute("href");
    expect(href).toContain("/api/download/");
    expect(href).toContain("NP103");
    expect(href).toContain("token=");
    expect(href).toContain("expires=");
  });

  test("download link returns valid PDF", async ({ page, request }) => {
    // Buy a map
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();
    await page.fill("#cart-name", "PDF Verify");
    await page.fill("#cart-email", "pdf@test.com");
    await page.locator('button[type="submit"]:has-text("Pay")').click();
    await page.waitForURL("**/checkout/success**");

    // Get the download URL
    const href = await page.locator(".download-btn").getAttribute("href");
    expect(href).toBeTruthy();

    // Fetch the PDF via API
    const res = await request.get(href);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");

    // Verify it's a real PDF (starts with %PDF)
    const body = await res.body();
    expect(body.length).toBeGreaterThan(1000);
    expect(body.slice(0, 5).toString()).toBe("%PDF-");
  });

  test("multiple maps purchase shows multiple download cards", async ({ page }) => {
    // Add two maps
    await page.goto("/shop/maps/NP101");
    await page.locator('aside button:has-text("Add to Cart")').click();
    await page.locator('button[aria-label="Close cart"]').click();

    // Navigate back via browser
    await page.goto("/shop/maps/NP105");
    await page.waitForLoadState("networkidle");
    await page.locator('aside button:has-text("Add to Cart")').click();

    await page.fill("#cart-name", "Multi Download");
    await page.fill("#cart-email", "multi@dl.com");
    await page.locator('button[type="submit"]:has-text("Pay")').click();
    await page.waitForURL("**/checkout/success**");

    // Should have 2 download cards
    await expect(page.locator(".download-card")).toHaveCount(2);
    await expect(page.locator(".download-btn")).toHaveCount(2);
  });

  test("download endpoint rejects invalid token", async ({ request }) => {
    const res = await request.get("/api/download/999/NP101?expires=9999999999&token=badtoken");
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.detail).toContain("Invalid download token");
  });

  test("download endpoint rejects expired token", async ({ request }) => {
    const res = await request.get("/api/download/1/NP101?expires=1000000000&token=badtoken");
    expect(res.status()).toBe(403);
  });

  test("session API returns items with download URLs", async ({ request }) => {
    // Create a checkout session
    const createRes = await request.post("/api/checkout/session", {
      data: {
        line_items: [{ product_id: "NP103", name: "Everest Map", price: 10, quantity: 1, type: "digital_map" }],
        customer_name: "API DL Test",
        customer_email: "apidl@test.com",
        has_physical: false,
      },
    });
    const { url } = await createRes.json();
    const sessionId = new URL(url).searchParams.get("session_id");

    // Fetch session details
    const getRes = await request.get(`/api/checkout/session/${sessionId}`);
    const data = await getRes.json();

    expect(data.items).toHaveLength(1);
    expect(data.items[0].product_id).toBe("NP103");
    expect(data.items[0].download_url).toContain("/api/download/");
    expect(data.items[0].download_url).toContain("token=");
  });
});
