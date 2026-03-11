import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminSidebar from "@/components/admin/AdminSidebar";

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
      <TooltipProvider>
        <div className="min-h-screen bg-[var(--arvesta-bg)]">
          <AdminSidebar />
          <main className="ml-[260px] p-8">{children}</main>
        </div>
      </TooltipProvider>
    </SessionProvider>
  );
}
