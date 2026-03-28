import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PUBLIC_KEYS = [
  "site_name",
  "phone",
  "email",
  "address",
  "instagram",
  "whatsapp",
  "site_logo",
] as const;

export async function GET() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [...PUBLIC_KEYS] } },
  });

  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }

  return NextResponse.json(result);
}
