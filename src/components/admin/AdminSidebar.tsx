"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  Grid3X3,
  Layers,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  FileText,
  HelpCircle,
  Wrench,
  ChevronDown,
  BookOpen,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AdminLocaleSwitcher from "@/components/admin/AdminLocaleSwitcher";

const menuKeys = [
  { href: "/admin", icon: LayoutDashboard, key: "dashboard" },
  { href: "/admin/hero", icon: ImageIcon, key: "heroSlider" },
  { href: "/admin/blog", icon: FileText, key: "blog" },
  { href: "/admin/services", icon: Wrench, key: "services" },
  { href: "/admin/about", icon: Building2, key: "about" },
  { href: "/admin/faq", icon: HelpCircle, key: "faq" },
  { href: "/admin/submissions", icon: MessageSquare, key: "submissions" },
  { href: "/admin/settings", icon: Settings, key: "settings" },
] as const;

const catalogChildren = [
  { href: "/admin/categories", icon: Grid3X3, key: "categories" },
  { href: "/admin/subcategories", icon: Layers, key: "subCategories" },
  { href: "/admin/products", icon: Package, key: "products" },
  { href: "/admin/catalog", icon: BookOpen, key: "digitalCatalog" },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("adminSidebar");

  const isCatalogPath = catalogChildren.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
  );
  const [catalogOpen, setCatalogOpen] = useState(isCatalogPath);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <Image
          src="/uploads/products/logo.png"
          alt="Arvesta"
          width={36}
          height={36}
          className="object-contain"
        />
        <div>
          <span className="font-ui text-sm font-bold text-white block leading-tight">
            Arvesta
          </span>
          <span className="font-ui text-[0.65rem] text-(--arvesta-text-muted)">
            Admin Panel
          </span>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuKeys.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          // Insert catalog group after dashboard
          if (item.key === "dashboard") {
            return (
              <div key="dashboard-and-catalog">
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-ui text-[0.85rem] font-medium transition-all ${
                    active
                      ? "bg-[rgba(232,98,44,0.1)] text-(--arvesta-accent) border border-[rgba(232,98,44,0.15)]"
                      : "text-(--arvesta-text-secondary) hover:bg-white/3 hover:text-white"
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {t(item.key)}
                </Link>

                {/* Catalog group */}
                <button
                  type="button"
                  onClick={() => setCatalogOpen((prev) => !prev)}
                  className={`mt-1 flex w-full items-center gap-3 px-3 py-2.5 rounded-lg font-ui text-[0.85rem] font-medium transition-all ${
                    isCatalogPath
                      ? "bg-[rgba(232,98,44,0.1)] text-(--arvesta-accent) border border-[rgba(232,98,44,0.15)]"
                      : "text-(--arvesta-text-secondary) hover:bg-white/3 hover:text-white"
                  }`}
                >
                  <Grid3X3 className="w-[18px] h-[18px]" />
                  <span className="flex-1 text-left">{t("categories")}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${catalogOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {catalogOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/5 pl-3">
                    {catalogChildren.map((child) => {
                      const childActive =
                        pathname === child.href ||
                        pathname.startsWith(child.href + "/");
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg font-ui text-[0.8rem] font-medium transition-all ${
                            childActive
                              ? "bg-[rgba(232,98,44,0.08)] text-(--arvesta-accent)"
                              : "text-(--arvesta-text-muted) hover:bg-white/3 hover:text-white"
                          }`}
                        >
                          <child.icon className="w-4 h-4" />
                          {t(child.key)}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-ui text-[0.85rem] font-medium transition-all ${
                active
                  ? "bg-[rgba(232,98,44,0.1)] text-(--arvesta-accent) border border-[rgba(232,98,44,0.15)]"
                  : "text-(--arvesta-text-secondary) hover:bg-white/3 hover:text-white"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-white/5" />

      {/* Language Switcher */}
      <AdminLocaleSwitcher />

      <Separator className="bg-white/5" />

      {/* Logout */}
      <div className="p-3">
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full justify-start gap-3 text-(--arvesta-text-muted) hover:text-red-400 hover:bg-red-500/5 font-ui text-[0.85rem]"
        >
          <LogOut className="w-[18px] h-[18px]" />
          {t("logout")}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-(--arvesta-bg-card) text-(--arvesta-text-secondary) shadow-lg hover:text-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-998 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[260px] bg-(--arvesta-bg-card) border-r border-white/5 flex flex-col z-999 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
