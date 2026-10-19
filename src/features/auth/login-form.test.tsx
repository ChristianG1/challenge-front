import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }),
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
  });

  it("keeps the button disabled while the field is empty", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<LoginForm />);

    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Email o teléfono"), "{Enter}");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("disables the button and shows the error after leaving an invalid field", async () => {
    render(<LoginForm />);
    const input = screen.getByLabelText("Email o teléfono");

    await userEvent.type(input, "12345");
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await userEvent.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("teléfono de 10 dígitos");
  });

  it("does not show the error while typing, even after leaving the field empty first", async () => {
    render(<LoginForm />);
    const input = screen.getByLabelText("Email o teléfono");

    await userEvent.click(input);
    await userEvent.tab();
    await userEvent.type(input, "123");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await userEvent.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("teléfono de 10 dígitos");

    await userEvent.type(input, "4");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("enables the button once the input is valid", async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email o teléfono"), "55 1234 5678");
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled();
  });

  it("navigates to home after a successful login", async () => {
    mockFetch(200, { user: { id: "usr_demo", name: "Valeria" } });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Email o teléfono"), "demo@spin.mx");
    await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/home"));
  });

  it("shows the server error message", async () => {
    mockFetch(503, { error: { code: "SERVICE_UNAVAILABLE", message: "No pudimos iniciar sesión" } });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Email o teléfono"), "error@spin.mx");
    await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos iniciar sesión");
    expect(replace).not.toHaveBeenCalled();
  });
});
