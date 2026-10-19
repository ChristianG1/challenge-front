import { NextResponse } from "next/server";
import { withAuth } from "@/server/http";
import { getAccountSummary } from "@/server/services/account.service";

export const GET = withAuth(async (_request, { userId }) =>
  NextResponse.json(await getAccountSummary(userId)),
);
