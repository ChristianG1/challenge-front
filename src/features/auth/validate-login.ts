import { parseIdentifier } from "@/domain/identifier";

export function validateLoginIdentifier(raw: string): string | null {
  if (raw.trim().length === 0) return "Ingresa tu email o número de teléfono";
  if (!parseIdentifier(raw)) return "Ingresa un email válido o un teléfono de 10 dígitos";
  return null;
}
