import { prisma } from "@/lib/prisma";
import HeroClient from "./HeroClient";

export default async function Hero({ locale }: { locale: string }) {
  const slides = await prisma.heroSlide.findMany({
    where: { active: true },
    include: {
      translations: { where: { locale } },
    },
    orderBy: { order: "asc" },
  });

  const data = slides.map((s: (typeof slides)[number]) => ({
    id: s.id,
    image: s.image,
    badge: s.translations[0]?.badge || "",
    title: s.translations[0]?.title || "",
    subtitle: s.translations[0]?.subtitle || "",
  }));

  return <HeroClient slides={data} />;
}
