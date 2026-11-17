
import { test, expect } from "@playwright/test";

test("unauthenticated visitors cannot access the admin dashboard", async ({
    page,
}) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login$/);
});
