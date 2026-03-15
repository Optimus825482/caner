import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public settings endpoint — no auth required.
 * Returns only non-sensitive site settings (contact info, social links).
 */

const PUBLIC_KEYS = new Set([
  "site_name",
  "phone",
  "email",
  "address",
  "instagram",
  "whatsapp",
]);

export async function GET() {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: [...PUBLIC_KEYS] } },
  });

  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }

  return NextResponse.json(map, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
