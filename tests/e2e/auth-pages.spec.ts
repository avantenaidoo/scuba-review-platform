
import { test, expect } from "@playwright/test";

test.describe("Authentication pages", () => {
    test("login page loads and displays the login form", async ({ page }) => {
        await page.goto("/login");

        await expect(
            page.getByRole("heading", { name: "Welcome back" })
        ).toBeVisible();

        await expect(
            page.getByLabel("Email address")
        ).toBeVisible();

        await expect(
            page.getByLabel("Password", { exact: true })
        ).toBeVisible();

        await expect(
            page.getByRole("button", { name: "Sign in" })
        ).toBeVisible();
    });

    test("registration page loads and displays the registration form", async ({ page }) => {
        await page.goto("/register");

        await expect(
            page.getByRole("heading", { name: "Create your account" })
        ).toBeVisible();

        await expect(
            page.getByLabel("Full name")
        ).toBeVisible();

        await expect(
            page.getByLabel("Email address")
        ).toBeVisible();

        await expect(
            page.getByLabel("Password", { exact: true })
        ).toBeVisible();

        await expect(
            page.getByLabel("Confirm password")
        ).toBeVisible();

        await expect(
            page.getByRole("button", { name: "Create account" })
        ).toBeVisible();
    });

    test("unauthenticated users are redirected from the member dashboard to login", async ({ page }) => {
        await page.goto("/member");

        await expect(page).toHaveURL(/\/login$/);

        await expect(
            page.getByRole("heading", { name: "Welcome back" })
        ).toBeVisible();
    });
});
