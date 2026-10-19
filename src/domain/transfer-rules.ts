import { formatMoney, type Cents } from "./money";
import { err, ok, type Result } from "./result";

export type TransferRuleViolation =
  | { code: "AMOUNT_REQUIRED" }
  | { code: "AMOUNT_NOT_POSITIVE" }
  | { code: "INSUFFICIENT_FUNDS"; available: Cents }
  | { code: "RECIPIENT_REQUIRED" };

export type TransferRuleCode = TransferRuleViolation["code"];

export interface TransferCandidate {
  amount: Cents | null;
  recipientId: string | null;
}

export interface ValidTransfer {
  amount: Cents;
  recipientId: string;
}

export function validateAmount(amount: Cents | null, balance: Cents): TransferRuleViolation[] {
  if (amount === null) return [{ code: "AMOUNT_REQUIRED" }];
  if (amount <= 0) return [{ code: "AMOUNT_NOT_POSITIVE" }];
  if (amount > balance) return [{ code: "INSUFFICIENT_FUNDS", available: balance }];
  return [];
}

export function validateRecipient(recipientId: string | null): TransferRuleViolation[] {
  return recipientId && recipientId.trim().length > 0 ? [] : [{ code: "RECIPIENT_REQUIRED" }];
}

export function validateTransfer(
  candidate: TransferCandidate,
  balance: Cents,
): Result<ValidTransfer, TransferRuleViolation[]> {
  const violations = [
    ...validateAmount(candidate.amount, balance),
    ...validateRecipient(candidate.recipientId),
  ];
  if (violations.length > 0 || candidate.amount === null || candidate.recipientId === null) {
    return err(violations);
  }
  return ok({ amount: candidate.amount, recipientId: candidate.recipientId });
}

export function describeViolation(violation: TransferRuleViolation): string {
  switch (violation.code) {
    case "AMOUNT_REQUIRED":
      return "Ingresa un monto válido";
    case "AMOUNT_NOT_POSITIVE":
      return "El monto debe ser mayor a $0.00";
    case "INSUFFICIENT_FUNDS":
      return `Saldo insuficiente. Tienes ${formatMoney(violation.available)} disponibles`;
    case "RECIPIENT_REQUIRED":
      return "Selecciona o agrega un destinatario";
  }
}
