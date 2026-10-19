"use client";

import { useLayoutEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useLogin } from "./use-login";
import { validateLoginIdentifier } from "./validate-login";

export function LoginForm() {
  const { status, login, reset } = useLogin();
  const [identifier, setIdentifier] = useState("");
  const [showError, setShowError] = useState(false);

  useLayoutEffect(() => {
    return () => {
      reset();
      setIdentifier("");
      setShowError(false);
    };
  }, [reset]);

  const validationError = validateLoginIdentifier(identifier);
  const fieldError = showError ? validationError : null;
  const submitting = status.state === "submitting";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validationError || submitting) {
      setShowError(identifier.trim() !== "");
      return;
    }
    void login(identifier);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <TextField
        label="Email o teléfono"
        name="identifier"
        autoComplete="username"
        placeholder="tu@email.com o 55 1234 5678"
        autoFocus
        value={identifier}
        error={fieldError}
        hint="Usa tu email o un teléfono de 10 dígitos"
        disabled={submitting}
        onChange={(e) => {
          setIdentifier(e.target.value);
          setShowError(false);
          if (status.state === "error") reset();
        }}
        onBlur={() => setShowError(identifier.trim() !== "")}
      />

      {status.state === "error" && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.message}
        </p>
      )}

      <Button type="submit" fullWidth loading={submitting} disabled={validationError !== null}>
        {submitting ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
