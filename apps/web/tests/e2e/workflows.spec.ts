import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("upload, answer with citation, and persist after reload", async ({
  page,
}) => {
  const filename = `refund-${Date.now()}.md`;
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Let’s get to work." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Knowledge base", exact: true })
    .click();
  await page
    .getByLabel("Upload document", { exact: true })
    .setInputFiles({
      name: filename,
      mimeType: "text/markdown",
      buffer: Buffer.from(
        "# Unique refund policy\nThe refund period is 37 days for blue widgets.",
      ),
    });
  await expect(
    page.getByRole("button", { name: filename, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("What is the refund period for blue widgets?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.assistant").last()).toContainText(
    "37 days",
  );
  await page
    .locator(".citation-list button")
    .filter({ hasText: filename })
    .click();
  await expect(page.getByRole("dialog")).toContainText("37 days");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".message.assistant").last()).toContainText(
    "37 days",
  );
});

test("upload CSV and compute exact values", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await page
    .getByLabel("Upload dataset", { exact: true })
    .setInputFiles({
      name: "e2e-sales.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("month,revenue\nJuly,100\nAugust,80\nAugust,40\n"),
    });
  await expect(page.getByText("e2e-sales.csv is ready.")).toBeVisible();
  await page
    .getByRole("button", { name: "Revenue by month", exact: true })
    .click();
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "120", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("SQL query", { exact: true })
    .fill("SELECT * FROM read_csv('/etc/passwd')");
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("approval and rejection are real, visible transitions", async ({
  page,
}) => {
  const title = `Create a task review-${Date.now()}`;
  await page.goto("/");
  await page.getByRole("textbox", { name: "Message", exact: true }).fill(title);
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByRole("button", { name: "Review action" }).last().click();
  const card = page.locator(".approval-card").filter({ hasText: title });
  await card.getByRole("button", { name: "Approve action" }).click();
  await expect(card.getByText("approved", { exact: true })).toBeVisible();
  await expect(
    page.locator(".task-item").filter({ hasText: title }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  const rejected = `Create a task reject-${Date.now()}`;
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill(rejected);
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByRole("button", { name: "Review action" }).last().click();
  const rejectCard = page
    .locator(".approval-card")
    .filter({ hasText: rejected });
  await rejectCard.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(rejectCard.getByText("rejected", { exact: true })).toBeVisible();
  await expect(
    page.locator(".task-item").filter({ hasText: rejected }),
  ).toHaveCount(0);
});

test("voice is explicit when a local model is unavailable", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Voice assistant", exact: true })
    .click();
  await expect(page.getByLabel("Review transcript")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start recording" }),
  ).toBeVisible();
  await page.getByLabel("Review transcript").fill("What is our refund policy?");
  await page.getByRole("button", { name: "Send transcript" }).click();
  await expect(page.locator(".message.assistant")).toBeVisible();
});

test("responsive layout and accessible workspace", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("textbox", { name: "Message", exact: true }),
  ).toBeVisible();
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("textbox", { name: "Message", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("offline browser workflow only contacts the local origin", async ({
  page,
}) => {
  const unexpected: string[] = [];
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (["127.0.0.1", "localhost"].includes(u.hostname))
      return route.continue();
    unexpected.push(u.origin);
    return route.abort();
  });
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("hello");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".message.assistant")).toContainText("Hello");
  expect(unexpected).toEqual([]);
});
