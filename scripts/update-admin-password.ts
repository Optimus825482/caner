/**
 * Admin panel password update script.
 *
 * Usage examples:
 *   npx tsx scripts/update-admin-password.ts --username admin --password "YeniSifre123!"
 *   npx tsx scripts/update-admin-password.ts --username admin
 *
 * If --password is not provided, script asks it securely from stdin.
 */

import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type Args = {
  username: string;
  password?: string;
  help: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    username: "admin",
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    if (arg === "--username" || arg === "-u") {
      args.username = (argv[i + 1] ?? "").trim();
      i++;
      continue;
    }

    if (arg === "--password" || arg === "-p") {
      args.password = argv[i + 1] ?? "";
      i++;
      continue;
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Update admin password

Options:
  -u, --username <username>   Admin username (default: admin)
  -p, --password <password>   New plain password (optional)
  -h, --help                  Show help

Examples:
  npm run admin:password -- --username admin --password "YeniSifre123!"
  npm run admin:password -- --username admin

Prerequisite:
  DATABASE_URL must exist in .env or .env.local
`);
}

async function askPassword(): Promise<string> {
  const rl = createInterface({ input, output });

  try {
    const password = (await rl.question("Yeni şifre: ")).trim();
    return password;
  } finally {
    rl.close();
  }
}

async function main() {
  // Ensure .env/.env.local are loaded for standalone script execution.
  // If DATABASE_URL is defined as an empty shell variable, @next/env won't overwrite it.
  if (process.env.DATABASE_URL === "") {
    delete process.env.DATABASE_URL;
  }
  loadEnvConfig(process.cwd());

  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "DATABASE_URL boş veya tanımsız. Önce .env/.env.local içine DATABASE_URL ekleyin.",
    );
  }

  if (!args.username) {
    throw new Error("Kullanıcı adı boş olamaz.");
  }

  const newPassword = (args.password ?? (await askPassword())).trim();

  if (!newPassword) {
    throw new Error("Şifre boş olamaz.");
  }

  if (newPassword.length < 8) {
    throw new Error("Şifre en az 8 karakter olmalı.");
  }

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.adminUser.findUnique({
      where: { username: args.username },
      select: { id: true, username: true },
    });

    if (!existing) {
      throw new Error(`Admin kullanıcı bulunamadı: ${args.username}`);
    }

    const passwordHash = await hash(newPassword, 12);

    await prisma.adminUser.update({
      where: { id: existing.id },
      data: { password: passwordHash },
    });

    console.log(`✅ Şifre güncellendi: ${existing.username}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("❌ Hata:", error instanceof Error ? error.message : error);
  process.exit(1);
});
