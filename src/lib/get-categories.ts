import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getCategories = cache(async (locale: string) => {
  return prisma.category.findMany({
    include: { translations: { where: { locale } } },
    orderBy: { order: "asc" },
  });
});

export const getAllCategories = cache(async () => {
  return prisma.category.findMany({
    include: { translations: true },
    orderBy: { order: "asc" },
  });
});
