import { NextResponse } from "next/server";
import { createContactRequestSchema } from "@/domain/contracts";
import { apiError, parseJsonBody, withAuth } from "@/server/http";
import { createContact, listContacts } from "@/server/services/contacts.service";

export const GET = withAuth(async (_request, { userId }) =>
  NextResponse.json({ contacts: await listContacts(userId) }),
);

export const POST = withAuth(async (request, { userId }) => {
  const body = await parseJsonBody(request, createContactRequestSchema);
  if (!body.ok) return body.error;

  const result = await createContact(userId, body.value);
  if (!result.ok) return apiError("CONTACT_ALREADY_EXISTS", "Ya tienes un contacto con ese teléfono o email");

  return NextResponse.json({ contact: result.value }, { status: 201 });
});
