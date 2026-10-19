import "server-only";
import { createContactRequestSchema, type Contact } from "@/domain/contracts";
import { err, ok, type Result } from "@/domain/result";
import type { z } from "zod";
import { getDb, simulateLatency } from "../mock-db";

type NewContact = z.output<typeof createContactRequestSchema>;

export async function listContacts(userId: string): Promise<Contact[]> {
  await simulateLatency();
  return getDb().users.get(userId)?.contacts ?? [];
}

export async function createContact(
  userId: string,
  input: NewContact,
): Promise<Result<Contact, "CONTACT_ALREADY_EXISTS">> {
  await simulateLatency();
  const user = getDb().users.get(userId);
  if (!user) throw new Error(`User ${userId} not found`);

  if (user.contacts.some((c) => c.handle === input.handle)) return err("CONTACT_ALREADY_EXISTS");

  const contact: Contact = { id: `ctc_${crypto.randomUUID()}`, ...input };
  user.contacts.push(contact);
  return ok(contact);
}
