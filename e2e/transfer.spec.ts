import { expect, test } from "@playwright/test";
import { chooseScenario, login, startTransfer } from "./helpers";

test.describe("New transfer", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("blocks invalid amounts and a missing recipient", async ({ page }) => {
    await page.getByRole("link", { name: "Enviar dinero", exact: true }).click();
    const amount = page.getByLabel("¿Cuánto quieres enviar?");
    const next = page.getByRole("button", { name: "Continuar" });

    await amount.fill("0");
    await next.click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("El monto debe ser mayor a $0.00");

    await amount.fill("99999999");
    await next.click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Saldo insuficiente");

    await amount.fill("10");
    await next.click();
    await next.click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Selecciona o agrega un destinatario");
  });

  test("sends money and shows the receipt @mobile", async ({ page }) => {
    const before = await page.getByTestId("balance").textContent();
    await startTransfer(page, "100.50");
    await chooseScenario(page, "success");
    await page.getByRole("button", { name: "Confirmar envío" }).click();

    const receipt = page.getByTestId("receipt");
    await expect(receipt.getByText("¡Transferencia enviada!")).toBeVisible();
    await expect(receipt).toContainText("$100.50");
    await expect(receipt).toContainText("Mariana López");

    await page.getByRole("link", { name: "Volver al inicio" }).click();
    await expect(page.getByTestId("balance")).not.toHaveText(before ?? "");
    await expect(page.getByTestId("movement-list").getByRole("listitem").first()).toContainText("Mariana López");

    await page.getByRole("link", { name: "Enviar dinero", exact: true }).click();
    await expect(page.getByLabel("¿Cuánto quieres enviar?")).toHaveValue("");
  });

  test("adds a new contact and sends money to it", async ({ page }) => {
    await page.getByRole("link", { name: "Enviar dinero", exact: true }).click();
    await page.getByLabel("¿Cuánto quieres enviar?").fill("20");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByRole("button", { name: "Agregar nuevo contacto" }).click();
    await expect(page.getByRole("button", { name: "Continuar", exact: true })).toHaveCount(0);

    const name = `Lucía ${Date.now()}`;
    await page.getByLabel("Nombre").fill(name);
    await page.getByLabel("Teléfono o email").fill(`lucia${Date.now()}@correo.mx`);
    await page.getByRole("button", { name: "Guardar y continuar" }).click();

    await expect(page.getByTestId("transfer-summary")).toContainText(name);
  });

  test("network error: retry is safe and succeeds", async ({ page }) => {
    await startTransfer(page, "15");
    await chooseScenario(page, "network_error");
    await page.getByRole("button", { name: "Confirmar envío" }).click();
    await expect(page.getByRole("heading", { name: "Error de conexión" })).toBeVisible();

    await chooseScenario(page, "success");
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByText("¡Transferencia enviada!")).toBeVisible();
  });

  test("insufficient funds from the server lets the user change the amount", async ({ page }) => {
    await startTransfer(page, "15");
    await chooseScenario(page, "insufficient_funds");
    await page.getByRole("button", { name: "Confirmar envío" }).click();
    await expect(page.getByRole("heading", { name: "Fondos insuficientes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reintentar" })).toHaveCount(0);

    await page.getByRole("button", { name: "Cambiar monto" }).click();
    await expect(page.getByLabel("¿Cuánto quieres enviar?")).toHaveValue("15");
  });

  test("unknown error shows a generic fallback", async ({ page }) => {
    await startTransfer(page, "15");
    await chooseScenario(page, "unknown_error");
    await page.getByRole("button", { name: "Confirmar envío" }).click();
    await expect(page.getByRole("heading", { name: "Algo salió mal" })).toBeVisible();
  });

  test("timeout: shows a slow indicator, then a timeout state", async ({ page }) => {
    test.setTimeout(30_000);
    await startTransfer(page, "15");
    await chooseScenario(page, "timeout");
    await page.getByRole("button", { name: "Confirmar envío" }).click();

    await expect(page.getByText("Esto está tardando más de lo normal")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("La operación tardó demasiado")).toBeVisible({ timeout: 12_000 });
    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
  });
});
