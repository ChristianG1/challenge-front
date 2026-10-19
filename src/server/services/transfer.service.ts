import "server-only";
import type {
  ApiErrorCode,
  TransferReceipt,
  TransferScenario,
} from "@/domain/contracts";
import { subtractCents, type Cents } from "@/domain/money";
import { err, ok, type Result } from "@/domain/result";
import { describeViolation, validateTransfer } from "@/domain/transfer-rules";
import { getDb, simulateLatency, sleep } from "../mock-db";

export interface ExecuteTransferInput {
  userId: string;
  amount: Cents;
  recipientId: string;
  idempotencyKey: string;
  scenario: TransferScenario;
}

export interface TransferError {
  code: Extract<
    ApiErrorCode,
    | "AMOUNT_REQUIRED"
    | "AMOUNT_NOT_POSITIVE"
    | "INSUFFICIENT_FUNDS"
    | "RECIPIENT_REQUIRED"
    | "RECIPIENT_NOT_FOUND"
    | "SERVICE_UNAVAILABLE"
    | "GATEWAY_TIMEOUT"
    | "INTERNAL_ERROR"
  >;
  message: string;
}

export function pickRandomScenario(random: () => number = Math.random): TransferScenario {
  const weighted: TransferScenario[] = [
    "success",
    "success",
    "success",
    "network_error",
    "insufficient_funds",
    "timeout",
    "unknown_error",
  ];
  return weighted[Math.floor(random() * weighted.length)];
}

const timeoutSimulationMs = () => Number(process.env.MOCK_TIMEOUT_MS ?? 15_000);

export async function executeTransfer(
  input: ExecuteTransferInput,
): Promise<Result<TransferReceipt & { replayed: boolean }, TransferError>> {
  const db = getDb();
  const idempotencyId = `${input.userId}:${input.idempotencyKey}`;

  const previous = db.processedTransfers.get(idempotencyId);
  if (previous) return ok({ ...previous, replayed: true });

  await simulateLatency();

  const user = db.users.get(input.userId);
  if (!user) throw new Error(`User ${input.userId} not found`);

  const recipient = user.contacts.find((c) => c.id === input.recipientId);

  const validation = validateTransfer(
    { amount: input.amount, recipientId: recipient ? recipient.id : input.recipientId },
    user.balance,
  );
  if (!validation.ok) {
    const [first] = validation.error;
    return err({ code: first.code, message: describeViolation(first) });
  }
  if (!recipient) {
    return err({ code: "RECIPIENT_NOT_FOUND", message: "El destinatario no existe" });
  }

  switch (input.scenario) {
    case "network_error":
      return err({ code: "SERVICE_UNAVAILABLE", message: "No pudimos comunicarnos con el banco" });
    case "insufficient_funds":
      return err({ code: "INSUFFICIENT_FUNDS", message: "Tu banco rechazó el cargo por fondos insuficientes" });
    case "timeout":
      await sleep(timeoutSimulationMs());
      return err({ code: "GATEWAY_TIMEOUT", message: "El banco tardó demasiado en responder" });
    case "unknown_error":
      return err({ code: "INTERNAL_ERROR", message: "Ocurrió un error inesperado" });
    case "success":
      break;
    default:
      input.scenario satisfies never;
  }

  user.balance = subtractCents(user.balance, validation.value.amount);
  const createdAt = new Date().toISOString();
  const id = `trx_${crypto.randomUUID()}`;

  user.movements.unshift({
    id,
    direction: "outgoing",
    amount: validation.value.amount,
    counterparty: recipient.name,
    concept: "Transferencia enviada",
    createdAt,
  });

  const receipt: TransferReceipt = {
    id,
    reference: id.slice(-10).toUpperCase(),
    amount: validation.value.amount,
    recipient: { name: recipient.name, handle: recipient.handle },
    balanceAfter: user.balance,
    createdAt,
  };
  db.processedTransfers.set(idempotencyId, receipt);

  return ok({ ...receipt, replayed: false });
}
