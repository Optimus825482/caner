import { getTranslations } from "next-intl/server";
import CollectionsClient from "./CollectionsClient";
import { getCategories } from "@/lib/get-categories";

export default async function Collections({ locale }: { locale: string }) {
  const [t, categories] = await Promise.all([
    getTranslations({ locale, namespace: "sf" }),
    getCategories(locale),
  ]);

  const data = categories.map((cat: (typeof categories)[number]) => ({
    id: cat.id,
    slug: cat.slug,
    image: cat.image,
    name: cat.translations[0]?.name || cat.slug,
    description: cat.translations[0]?.description || "",
  }));

  return (
    <CollectionsClient
      categories={data}
      locale={locale}
      tag={t("tag")}
      title={t("title")}
      desc={t("desc")}
      explore={t("explore")}
    />
  );
}
