import { prisma } from "@/lib/prisma";
import { requireAdminPageSession } from "@/lib/auth";
import AdminSubmissionsClient from "@/components/admin/AdminSubmissionsClient";

export default async function AdminSubmissionsPage() {
  await requireAdminPageSession();

  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  const initialSubmissions = submissions.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    email: s.email,
    phone: s.phone,
    projectType: s.projectType,
    description: s.description,
    locale: s.locale,
    isRead: s.isRead,
    createdAt: s.createdAt.toISOString(),
  }));

  return <AdminSubmissionsClient initialSubmissions={initialSubmissions} />;
}
