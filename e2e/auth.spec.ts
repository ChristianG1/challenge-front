import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Login", () => {
  test("only enables the button for a valid identifier", async ({ page }) => {
    await page.goto("/login");
    const button = page.getByRole("button", { name: "Iniciar sesión" });
    const input = page.getByLabel("Email o teléfono");
    await expect(button).toBeDisabled();

    await input.fill("12345");
    await input.blur();
    await expect(button).toBeDisabled();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("teléfono de 10 dígitos");

    await input.fill("demo@spin.mx");
    await expect(button).toBeEnabled();
  });

  test("shows a simulated server error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email o teléfono").fill("error@spin.mx");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("No pudimos iniciar sesión");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("redirects to login when there is no session", async ({ page }) => {
    await page.goto("/transfer");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logs in with a phone number, persists the session and logs out @mobile", async ({ page }) => {
    await login(page, "55 1234 5678");
    await expect(page.getByTestId("balance")).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/home$/);

    await page.getByRole("button", { name: "Menú de cuenta" }).click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeDisabled();
    await expect(page.getByLabel("Email o teléfono")).toHaveValue("");
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login$/);
  });
});
