import fs from "fs";
import { test, expect } from "@playwright/test";
import { MEMBER_AUTH_FILE, FIXTURES_FILE, type Fixtures } from "../env";

test.use({ storageState: MEMBER_AUTH_FILE });

let tripAId: string;

test.beforeAll(() => {
  ({ tripAId } = JSON.parse(fs.readFileSync(FIXTURES_FILE, "utf8")) as Fixtures);
});

test("a non-admin is redirected away from Settings > Modules", async ({ page }) => {
  await page.goto("/settings/modules");
  await expect(page).toHaveURL(/\/settings$/);
});

test("a non-admin can still see and act on shared trips (household-wide, not admin-gated by design)", async ({
  page,
}) => {
  await page.goto(`/travel/${tripAId}`);
  await expect(page.locator("body")).toContainText("E2E Trip A");
  await expect(page.locator("body")).toContainText("E2E Flight Segment");

  await page.goto(`/travel/${tripAId}/segments/new`);
  await page.locator('select[name="type"]').selectOption("ACTIVITY");
  await page.locator('input[name="title"]').fill("Member-added Activity");
  await page.locator('form:has(select[name="type"]) button[type="submit"]').click();
  await page.waitForURL(`**/travel/${tripAId}`);
  await expect(page.locator("body")).toContainText("Member-added Activity");
});

test("the document API route redirects to login with no session instead of leaking data", async ({
  context,
}) => {
  // src/proxy.ts's matcher covers all non-public paths (api/auth is the only
  // API exclusion), so an unauthenticated request never reaches this route's
  // own 401 check — it gets redirected to /login first. Either way the file
  // is never served without a session.
  await context.clearCookies();
  const response = await context.request.get("/api/travel/documents/anything", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toContain("/login");
});

test("the document API route 404s safely for an unknown id", async ({ context }) => {
  const response = await context.request.get("/api/travel/documents/does-not-exist");
  expect(response.status()).toBe(404);
});
