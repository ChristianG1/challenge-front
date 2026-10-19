export type Identifier =
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_SEPARATORS = /[\s\-().]/g;

export function parseIdentifier(raw: string): Identifier | null {
  const input = raw.trim();
  if (input.length === 0) return null;

  if (input.includes("@")) {
    const email = input.toLowerCase();
    return EMAIL_PATTERN.test(email) ? { kind: "email", value: email } : null;
  }

  const digits = input.replace(PHONE_SEPARATORS, "").replace(/^\+?52(?=\d{10}$)/, "");
  return /^\d{10}$/.test(digits) ? { kind: "phone", value: digits } : null;
}

export function formatIdentifier(identifier: Identifier): string {
  if (identifier.kind === "email") return identifier.value;
  const v = identifier.value;
  return `${v.slice(0, 2)} ${v.slice(2, 6)} ${v.slice(6)}`;
}

export function formatHandle(handle: string): string {
  const parsed = parseIdentifier(handle);
  return parsed ? formatIdentifier(parsed) : handle;
}
