import "server-only";
import type { Contact, Movement, TransferReceipt } from "@/domain/contracts";
import { toCents, type Cents } from "@/domain/money";

export interface UserRecord {
  id: string;
  name: string;
  handles: string[];
  balance: Cents;
  movements: Movement[];
  contacts: Contact[];
}

export interface MockDb {
  users: Map<string, UserRecord>;
  sessions: Map<string, string>;
  processedTransfers: Map<string, TransferReceipt>;
}

const daysAgo = (days: number, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};

const HISTORY_TEMPLATES: Array<Pick<Movement, "direction" | "counterparty" | "concept"> & { base: number }> = [
  { direction: "outgoing", counterparty: "OXXO", concept: "Compra en tienda", base: 8_500 },
  { direction: "outgoing", counterparty: "Uber", concept: "Viaje", base: 12_000 },
  { direction: "incoming", counterparty: "Carlos Ruiz", concept: "Pago de la renta compartida", base: 250_000 },
  { direction: "outgoing", counterparty: "Netflix", concept: "Suscripción", base: 21_900 },
  { direction: "outgoing", counterparty: "Mariana López", concept: "Regalo de cumpleaños", base: 60_000 },
  { direction: "outgoing", counterparty: "Telcel", concept: "Recarga", base: 20_000 },
  { direction: "incoming", counterparty: "Jorge Hernández", concept: "Mitad de la cena", base: 35_000 },
  { direction: "outgoing", counterparty: "Soriana", concept: "Supermercado", base: 145_000 },
];

function generateHistory(count = 45): Movement[] {
  let seed = 42;
  const random = () => (seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31;
  return Array.from({ length: count }, (_, i) => {
    const template = HISTORY_TEMPLATES[i % HISTORY_TEMPLATES.length];
    const amount = Math.round(template.base * (0.6 + random() * 0.8));
    return {
      id: `mov_h${String(i + 1).padStart(3, "0")}`,
      direction: template.direction,
      amount: toCents(amount),
      counterparty: template.counterparty,
      concept: template.concept,
      createdAt: daysAgo(10 + Math.floor(i * 2.4), 8 + Math.floor(random() * 13)),
    };
  });
}

export function createSeed(): MockDb {
  const demo: UserRecord = {
    id: "usr_demo",
    name: "Valeria Gómez",
    handles: ["demo@spin.mx", "5512345678"],
    balance: toCents(2_854_050),
    movements: [
      { id: "mov_1", direction: "incoming", amount: toCents(1_500_000), counterparty: "Nómina ACME", concept: "Depósito de nómina", createdAt: daysAgo(1, 9) },
      { id: "mov_2", direction: "outgoing", amount: toCents(45_000), counterparty: "Carlos Ruiz", concept: "Cena del viernes", createdAt: daysAgo(2, 21) },
      { id: "mov_3", direction: "outgoing", amount: toCents(129_900), counterparty: "CFE", concept: "Pago de luz", createdAt: daysAgo(4) },
      { id: "mov_4", direction: "incoming", amount: toCents(30_000), counterparty: "Mariana López", concept: "Regalo", createdAt: daysAgo(6, 18) },
      { id: "mov_5", direction: "outgoing", amount: toCents(71_050), counterparty: "OXXO", concept: "Compra en tienda", createdAt: daysAgo(9, 8) },
      ...generateHistory(),
    ],
    contacts: [
      { id: "ctc_1", name: "Carlos Ruiz", handle: "5587654321", favorite: true },
      { id: "ctc_2", name: "Mariana López", handle: "mariana@correo.mx", favorite: true },
      { id: "ctc_3", name: "Jorge Hernández", handle: "3312345678", favorite: true },
    ],
  };

  const newcomer: UserRecord = {
    id: "usr_new",
    name: "Diego Martínez",
    handles: ["nuevo@spin.mx"],
    balance: toCents(50_000),
    movements: [],
    contacts: [],
  };

  return {
    users: new Map([demo, newcomer].map((u) => [u.id, u])),
    sessions: new Map(),
    processedTransfers: new Map(),
  };
}

const globalForDb = globalThis as unknown as { __miniWalletDb?: MockDb };

export function getDb(): MockDb {
  globalForDb.__miniWalletDb ??= createSeed();
  return globalForDb.__miniWalletDb;
}

export function resetDb(): MockDb {
  globalForDb.__miniWalletDb = createSeed();
  return globalForDb.__miniWalletDb;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const simulateLatency = () => sleep(Number(process.env.MOCK_LATENCY_MS ?? 600));
