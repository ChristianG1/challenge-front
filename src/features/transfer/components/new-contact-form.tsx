"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { contactSchema, type Contact } from "@/domain/contracts";
import { parseIdentifier } from "@/domain/identifier";
import { apiRequest } from "@/lib/http/api-client";

const createContactResponseSchema = z.object({ contact: contactSchema });

interface NewContactFormProps {
  onCreated: (contact: Contact) => void;
  onBack: () => void;
  backLabel: string;
}

export function NewContactForm({ onCreated, onBack, backLabel }: NewContactFormProps) {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const nameError = name.trim().length < 2 ? "Ingresa el nombre del contacto" : null;
  const handleError = parseIdentifier(handle) ? null : "Ingresa un email o un teléfono de 10 dígitos";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (nameError || handleError || saving) return;

    setSaving(true);
    setServerError(null);
    const result = await apiRequest("/api/contacts", createContactResponseSchema, {
      method: "POST",
      body: { name, handle, favorite: true },
    });
    setSaving(false);

    if (result.ok) onCreated(result.value.contact);
    else setServerError(result.error.kind === "http" ? result.error.message : "No pudimos guardar el contacto. Intenta de nuevo");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5" aria-labelledby="new-contact-title">
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onBack}
          className="w-fit cursor-pointer text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          ← {backLabel}
        </button>
        <h2 id="new-contact-title" className="text-lg font-semibold">
          Nuevo contacto
        </h2>
        <p className="text-sm text-ink-500">Lo guardaremos en tus favoritos para la próxima vez.</p>
      </div>

      <TextField
        label="Nombre"
        name="contact-name"
        autoComplete="off"
        autoFocus
        placeholder="Ana Torres"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={submitted ? nameError : null}
      />
      <TextField
        label="Teléfono o email"
        name="contact-handle"
        autoComplete="off"
        placeholder="55 1234 5678"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        error={submitted ? handleError : null}
      />

      {serverError && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <Button type="submit" loading={saving} fullWidth>
        {saving ? "Guardando…" : "Guardar y continuar"}
      </Button>
    </form>
  );
}
