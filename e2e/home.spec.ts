import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Home", () => {
  test("shows balance and recent movements", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Hola, Valeria")).toBeVisible();
    await expect(page.getByTestId("movement-list").getByRole("listitem").first()).toBeVisible();
  });

  test("hides the balance and remembers the preference", async ({ page }) => {
    await login(page);
    const balance = page.getByTestId("balance");
    await expect(balance).toContainText("$");

    await page.getByRole("button", { name: "Ocultar saldo" }).click();
    await expect(balance).toContainText("Saldo oculto");
    await page.reload();
    await expect(page.getByTestId("balance")).toContainText("Saldo oculto");

    await page.getByRole("button", { name: "Mostrar saldo" }).click();
    await expect(page.getByTestId("balance")).not.toContainText("Saldo oculto");
  });

  test("navigation tabs and the account menu work @mobile", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("link", { name: "Inicio" }).first()).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: "Menú de cuenta" }).click();
    await expect(page.getByRole("menu")).toContainText("Valeria Gómez");
    await page.getByRole("menuitem", { name: "Ocultar saldo" }).click();
    await expect(page.getByTestId("balance")).toContainText("Saldo oculto");
    await expect(page.getByRole("menu")).toHaveCount(0);

    await page.getByRole("button", { name: "Menú de cuenta" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await page.getByRole("button", { name: "Mostrar saldo" }).click();

    await page.getByRole("link", { name: "Enviar", exact: true }).click();
    await expect(page).toHaveURL(/\/transfer$/);
    await expect(page.getByRole("link", { name: "Enviar", exact: true })).toHaveAttribute("aria-current", "page");
  });

  test("filters movements by direction", async ({ page }) => {
    await login(page);
    const list = page.getByTestId("movement-list");
    await page.getByRole("button", { name: "Entradas" }).click();
    await expect(page.getByRole("button", { name: "Entradas" })).toHaveAttribute("aria-pressed", "true");
    await expect(list.getByText("Recibido:").first()).toBeVisible();
    await expect(list.getByText("Enviado:")).toHaveCount(0);

    await page.getByRole("button", { name: "Salidas" }).click();
    await expect(list.getByText("Recibido:")).toHaveCount(0);
  });

  test("paginates movements with a cursor until the end", async ({ page }) => {
    await login(page);
    const rows = page.getByTestId("movement-list").getByRole("listitem");
    const loadMore = page.getByRole("button", { name: "Ver más movimientos" });

    await expect(rows).toHaveCount(10);
    await loadMore.click();
    await expect(rows).toHaveCount(20);

    const end = page.getByText("Ya viste todos tus movimientos");
    for (let pages = 2; pages < 20 && !(await end.isVisible()); pages++) {
      const before = await rows.count();
      await loadMore.click();
      await expect(async () => {
        expect((await rows.count()) > before || (await end.isVisible())).toBe(true);
      }).toPass();
    }
    await expect(end).toBeVisible();
    await expect(loadMore).toHaveCount(0);
  });

  test("quick send from a favorite preselects the recipient", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Enviar dinero a Mariana López" }).click();
    await expect(page).toHaveURL(/\/transfer\?to=/);
    await expect(page.getByRole("main").getByText("Mariana López")).toBeVisible();

    await page.getByLabel("¿Cuánto quieres enviar?").fill("10");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.locator("label").filter({ hasText: "Mariana López" }).getByRole("radio")).toBeChecked();
  });

  test("'Nuevo contacto' opens the contact form, then asks for the amount", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Nuevo contacto" }).click();
    await expect(page.getByRole("heading", { name: "Nuevo contacto" })).toBeVisible();

    const name = `Sofía ${Date.now()}`;
    await page.getByLabel("Nombre").fill(name);
    await page.getByLabel("Teléfono o email").fill(`sofia${Date.now()}@correo.mx`);
    await page.getByRole("button", { name: "Guardar y continuar" }).click();

    await expect(page.getByLabel("¿Cuánto quieres enviar?")).toBeVisible();
    await expect(page.getByRole("main").getByText(name)).toBeVisible();
  });

  test("shows the empty state for an account without movements", async ({ page }) => {
    await login(page, "nuevo@spin.mx");
    await expect(page.getByText("Aún no tienes movimientos")).toBeVisible();
  });

  test("shows the error state and recovers on retry", async ({ page }) => {
    await login(page);
    await page.goto("/home?simulate=error");
    await expect(page.getByText("No pudimos cargar tu información")).toBeVisible();

    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByTestId("movement-list")).toBeVisible();
  });
});
