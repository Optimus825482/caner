"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Grid3X3,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products", icon: Package, label: "Ürünler" },
  { href: "/admin/categories", icon: Grid3X3, label: "Kategoriler" },
  { href: "/admin/hero", icon: ImageIcon, label: "Hero Slider" },
  { href: "/admin/submissions", icon: MessageSquare, label: "Talepler" },
  { href: "/admin/settings", icon: Settings, label: "Ayarlar" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-[var(--arvesta-bg-card)] border-r border-white/5 flex flex-col z-50">
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
          <span className="font-ui text-[0.65rem] text-[var(--arvesta-text-muted)]">
            Admin Panel
          </span>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-ui text-[0.85rem] font-medium transition-all ${
                active
                  ? "bg-[rgba(232,98,44,0.1)] text-[var(--arvesta-accent)] border border-[rgba(232,98,44,0.15)]"
                  : "text-[var(--arvesta-text-secondary)] hover:bg-white/3 hover:text-white"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-white/5" />

      {/* Logout */}
      <div className="p-3">
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full justify-start gap-3 text-[var(--arvesta-text-muted)] hover:text-red-400 hover:bg-red-500/5 font-ui text-[0.85rem]"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Çıkış Yap
        </Button>
      </div>
    </aside>
  );
}
