import { expect, type Page } from "@playwright/test";

export async function login(page: Page, identifier = "demo@spin.mx") {
  await page.goto("/login");
  await page.getByLabel("Email o teléfono").fill(identifier);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/home$/);
}

export async function startTransfer(page: Page, amount: string, recipient = "Mariana López") {
  await page.getByRole("link", { name: "Enviar dinero", exact: true }).click();
  await page.getByLabel("¿Cuánto quieres enviar?").fill(amount);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("label").filter({ hasText: recipient }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByTestId("transfer-summary")).toBeVisible();
}

export async function chooseScenario(page: Page, scenario: string) {
  await page.getByLabel("Escenario simulado").selectOption(scenario);
}
