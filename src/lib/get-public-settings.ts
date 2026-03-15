import { prisma } from "@/lib/prisma";

const PUBLIC_KEYS = [
  "site_name",
  "phone",
  "email",
  "address",
  "instagram",
  "whatsapp",
] as const;

export type PublicSettings = Record<(typeof PUBLIC_KEYS)[number], string>;

/**
 * Fetch public site settings directly from DB (for Server Components).
 * Returns a key→value map with empty-string defaults.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [...PUBLIC_KEYS] } },
  });

  const defaults: PublicSettings = {
    site_name: "Arvesta Menuiserie France",
    phone: "",
    email: "",
    address: "",
    instagram: "",
    whatsapp: "",
  };

  for (const row of rows) {
    if (row.value) {
      (defaults as Record<string, string>)[row.key] = row.value;
    }
  }

  return defaults;
}
