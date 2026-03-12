import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminSidebar from "@/components/admin/AdminSidebar";
import trMessages from "@/i18n/messages/tr.json";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <SessionProvider>
      <NextIntlClientProvider locale="tr" messages={trMessages}>
        <TooltipProvider>
          <div className="min-h-screen bg-[var(--arvesta-bg)]">
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
