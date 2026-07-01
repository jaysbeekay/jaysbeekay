import fs from "fs";
import { test, expect, type Page } from "@playwright/test";
import { ADMIN_AUTH_FILE, FIXTURES_FILE, type Fixtures } from "../env";

test.use({ storageState: ADMIN_AUTH_FILE });

let tripUrl: string;

test.beforeAll(() => {
  const { tripAId } = JSON.parse(fs.readFileSync(FIXTURES_FILE, "utf8")) as Fixtures;
  tripUrl = `/travel/${tripAId}`;
});

async function upload(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  await page.goto(tripUrl);
  await page.locator('input[type="file"][name="file"]').first().setInputFiles(file);
  const submit = page.locator('form:has(input[name="file"]) button[type="submit"]').first();
  await submit.click();
  // networkidle can settle before a large upload's round trip finishes;
  // the submit button's disabled/"Saving…" state directly tracks the
  // action's pending status, so wait on that instead.
  await expect(submit).toBeEnabled({ timeout: 30_000 });
  return page.locator("body").innerText();
}

test("0-byte file is rejected", async ({ page }) => {
  const body = await upload(page, {
    name: "empty.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(0),
  });
  expect(body).not.toContain("Document uploaded");
});

test("disallowed mimetype (.exe) is rejected", async ({ page }) => {
  const body = await upload(page, {
    name: "malware.exe",
    mimeType: "application/x-msdownload",
    buffer: Buffer.from("MZ fake exe"),
  });
  expect(body).toContain("Unsupported file type");
});

test("disallowed mimetype (.sh) is rejected", async ({ page }) => {
  const body = await upload(page, {
    name: "script.sh",
    mimeType: "text/x-shellscript",
    buffer: Buffer.from("#!/bin/sh\necho hi\n"),
  });
  expect(body).toContain("Unsupported file type");
});

test("a file under the 15MB limit uploads successfully", async ({ page }) => {
  const body = await upload(page, {
    name: "two-mb.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(2 * 1024 * 1024, "A"),
  });
  expect(body).toContain("Document uploaded");
});

test("a file over the 15MB limit is cleanly rejected, not crashed", async ({ page }) => {
  const body = await upload(page, {
    name: "oversized.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(16 * 1024 * 1024, "A"),
  });
  expect(body).toContain("too large");
  expect(body).not.toContain("Application error");
});

test("path-traversal-shaped filename is stored safely", async ({ page }) => {
  // Browsers strip path separators from File.name, and the server stores
  // documents under a generated UUID regardless of the original filename
  // anyway, so this should behave like any normal upload.
  const body = await upload(page, {
    name: "../../../etc/passwd.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("traversal content"),
  });
  expect(body).toContain("Document uploaded");
});

test("served documents use Content-Disposition: attachment (no stored-XSS execution)", async ({
  page,
  context,
}) => {
  let dialogFired = false;
  page.on("dialog", async (d) => {
    dialogFired = true;
    await d.dismiss();
  });

  await page.goto(tripUrl);
  await page.locator('input[type="file"][name="file"]').first().setInputFiles({
    name: "evil.png",
    mimeType: "image/png",
    buffer: Buffer.from("<script>alert(1)</script>"),
  });
  await page.locator('form:has(input[name="file"]) button[type="submit"]').first().click();
  await page.waitForLoadState("networkidle");

  const href = await page
    .locator('a[href^="/api/travel/documents/"]', { hasText: "evil.png" })
    .first()
    .getAttribute("href");
  expect(href).toBeTruthy();

  const response = await context.request.get(href!);
  expect(response.headers()["content-disposition"]).toContain("attachment");
  expect(dialogFired).toBe(false);
});
