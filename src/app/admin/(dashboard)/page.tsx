import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import frMessages from "@/i18n/messages/fr.json";
import { redirect } from "next/navigation";
import {
  Package,
  Grid3X3,
  MessageSquare,
  Image as ImageIcon,
  TrendingUp,
} from "lucide-react";

const t = frMessages.adminDashboard;

export default async function AdminDashboard() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  const [productCount, categoryCount, submissionCount, unreadCount, heroCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.contactSubmission.count(),
      prisma.contactSubmission.count({ where: { isRead: false } }),
      prisma.heroSlide.count({ where: { active: true } }),
    ]);

  const recentSubmissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = [
    {
      label: t.stats.products,
      value: productCount,
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: t.stats.categories,
      value: categoryCount,
      icon: Grid3X3,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: t.stats.submissions,
      value: submissionCount,
      icon: MessageSquare,
      color: "text-green-400",
      bg: "bg-green-500/10",
      badge: unreadCount > 0 ? `${unreadCount} ${t.stats.newBadge}` : null,
    },
    {
      label: t.stats.heroSlides,
      value: heroCount,
      icon: ImageIcon,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-white mb-1">
          {t.title}
        </h1>
        <p className="text-(--arvesta-text-muted) font-ui text-sm">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-white/5 bg-(--arvesta-bg-card) hover:border-white/10 transition-all"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-ui text-sm font-medium text-(--arvesta-text-secondary)">
                {stat.label}
              </CardTitle>
              <div
                className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`w-[18px] h-[18px] ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-white font-ui">
                  {stat.value}
                </span>
                {stat.badge && (
                  <Badge
                    variant="secondary"
                    className="bg-red-500/10 text-red-400 border-red-500/20 font-ui text-xs"
                  >
                    {stat.badge}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/5 bg-(--arvesta-bg-card)">
        <CardHeader>
          <CardTitle className="font-ui text-lg text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-(--arvesta-accent)" />
            {t.recentSubmissionsTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <p className="text-(--arvesta-text-muted) text-sm py-4 text-center">
              {t.noSubmissions}
            </p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((sub: (typeof recentSubmissions)[number]) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-(--arvesta-bg-elevated) border border-white/3 hover:border-white/8 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[rgba(232,98,44,0.1)] flex items-center justify-center text-(--arvesta-accent) font-ui text-sm font-bold">
                      {sub.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white block">
                        {sub.fullName}
                      </span>
                      <span className="text-xs text-(--arvesta-text-muted)">
                        {sub.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="border-white/10 text-(--arvesta-text-secondary) font-ui text-xs"
                    >
                      {sub.projectType}
                    </Badge>
                    {!sub.isRead && (
                      <div className="w-2 h-2 rounded-full bg-(--arvesta-accent)" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
