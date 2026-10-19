"use client";

import { Button } from "@/components/ui/button";
import { formatHandle } from "@/domain/identifier";
import { describeViolation } from "@/domain/transfer-rules";
import { cn } from "@/lib/cn";
import type { TransferFlow } from "../use-transfer-flow";
import { NewContactForm } from "./new-contact-form";

export function RecipientStep({ flow }: { flow: TransferFlow }) {
  if (flow.state.status !== "editing") return null;

  const selectedId = flow.state.draft.recipient?.id;
  const error = flow.showErrors && flow.violations[0] ? describeViolation(flow.violations[0]) : null;
  const hasContacts = flow.contacts.length > 0;
  const adding = flow.addingContact || !hasContacts;

  if (adding) {
    return (
      <NewContactForm
        backLabel={hasContacts ? "Contactos" : "Monto"}
        onBack={hasContacts ? () => flow.setAddingContact(false) : flow.back}
        onCreated={flow.contactCreated}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink-700">¿A quién le envías?</legend>

        {flow.contacts.map((contact) => {
          const selected = contact.id === selectedId;
          return (
            <label
              key={contact.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl p-3 ring-1 transition-colors",
                selected ? "bg-ink-50 ring-2 ring-ink-900" : "bg-white ring-ink-100 hover:bg-ink-50",
              )}
            >
              <input
                type="radio"
                name="recipient"
                value={contact.id}
                checked={selected}
                onChange={() => flow.selectRecipient(contact)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full font-semibold transition-colors",
                  selected ? "bg-lime-300 text-ink-900" : "bg-ink-100 text-ink-600",
                )}
                aria-hidden="true"
              >
                {contact.name[0]}
              </span>
              <span className="flex-1">
                <span className="block font-medium">{contact.name}</span>
                <span className="block text-sm text-ink-500">{formatHandle(contact.handle)}</span>
              </span>
              {selected ? (
                <span className="flex size-6 items-center justify-center rounded-full bg-ink-900 text-xs text-white" aria-hidden="true">✓</span>
              ) : (
                contact.favorite && <span className="text-ink-400" aria-label="Favorito">★</span>
              )}
            </label>
          );
        })}
      </fieldset>

      <button
        type="button"
        onClick={() => flow.setAddingContact(true)}
        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-ink-200 p-3 text-left transition-colors hover:bg-ink-50"
      >
        <span className="flex size-10 items-center justify-center rounded-full border border-dashed border-ink-400 text-lg text-ink-600" aria-hidden="true">
          +
        </span>
        <span className="font-medium">Agregar nuevo contacto</span>
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={flow.back} className="flex-1">
          Atrás
        </Button>
        <Button onClick={flow.next} className="flex-1">
          Continuar
        </Button>
      </div>
    </div>
  );
}
