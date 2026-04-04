import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceSameOrigin } from "@/lib/request-guards";

const schema = z.object({
  locale: z.enum(["fr", "tr"]),
});

export async function POST(req: NextRequest) {
  const originDenied = enforceSameOrigin(req);
  if (originDenied) return originDenied;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin-locale", parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
