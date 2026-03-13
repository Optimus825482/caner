import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminSidebar from "@/components/admin/AdminSidebar";

const SUPPORTED_LOCALES = ["fr", "tr"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(v: string): v is SupportedLocale {
  return SUPPORTED_LOCALES.includes(v as SupportedLocale);
}

async function resolveAdminLocale(): Promise<SupportedLocale> {
  // 1. Cookie override
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("admin-locale")?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) return cookieLocale;

  // 2. Accept-Language header
  const headerStore = await headers();
  const acceptLang = headerStore.get("accept-language") ?? "";
  const preferred = acceptLang
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase());

  for (const lang of preferred) {
    const short = lang.slice(0, 2);
    if (isSupportedLocale(short)) return short;
  }

  // 3. Default
  return "tr";
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/");

  const locale = await resolveAdminLocale();
  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;

  return (
    <SessionProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <TooltipProvider>
          <div className="min-h-screen bg-(--arvesta-bg)">
            <AdminSidebar />
            <main className="p-4 pt-16 lg:ml-[260px] lg:p-8 lg:pt-8">
              {children}
            </main>
          </div>
        </TooltipProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
