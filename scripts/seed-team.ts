import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function placeholderPhoto(name: string): string {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&size=256&background=c8a86e&color=050d1d&bold=true&format=png`;
}

const teamMembers = [
  {
    photo: placeholderPhoto("Caner Doğan"),
    email: null,
    phone: null,
    order: 1,
    published: true,
    translations: [
      { locale: "fr", fullName: "Caner Doğan", title: "Fondateur" },
      { locale: "en", fullName: "Caner Doğan", title: "Founder" },
      { locale: "tr", fullName: "Caner Doğan", title: "Kurucu" },
    ],
  },
  {
    photo: placeholderPhoto("Erman Doğan"),
    email: null,
    phone: null,
    order: 2,
    published: true,
    translations: [
      { locale: "fr", fullName: "Erman Doğan", title: "Co-fondateur" },
      { locale: "en", fullName: "Erman Doğan", title: "Co-Founder" },
      { locale: "tr", fullName: "Erman Doğan", title: "Yardımcı Kurucu" },
    ],
  },
  {
    photo: placeholderPhoto("Mustafa Akyol"),
    email: null,
    phone: null,
    order: 3,
    published: true,
    translations: [
      { locale: "fr", fullName: "Mustafa Akyol", title: "Maître artisan" },
      { locale: "en", fullName: "Mustafa Akyol", title: "Master Craftsman" },
      { locale: "tr", fullName: "Mustafa Akyol", title: "Usta" },
    ],
  },
  {
    photo: placeholderPhoto("Serap Demirci"),
    email: null,
    phone: null,
    order: 4,
    published: true,
    translations: [
      { locale: "fr", fullName: "Serap Demirci", title: "Maître artisan" },
      { locale: "en", fullName: "Serap Demirci", title: "Master Craftsman" },
      { locale: "tr", fullName: "Serap Demirci", title: "Usta" },
    ],
  },
  {
    photo: placeholderPhoto("Abdülaziz Demirel"),
    email: null,
    phone: null,
    order: 5,
    published: true,
    translations: [
      { locale: "fr", fullName: "Abdülaziz Demirel", title: "Maître artisan" },
      {
        locale: "en",
        fullName: "Abdülaziz Demirel",
        title: "Master Craftsman",
      },
      { locale: "tr", fullName: "Abdülaziz Demirel", title: "Usta" },
    ],
  },
];

async function main() {
  await (prisma as any).teamMemberTranslation.deleteMany();
  await (prisma as any).teamMember.deleteMany();
  console.log("Cleared existing team members.");

  for (const member of teamMembers) {
    const { translations, ...data } = member;
    await (prisma as any).teamMember.create({
      data: { ...data, translations: { create: translations } },
    });
    console.log(`  ✓ ${translations[2].fullName} — ${translations[2].title}`);
  }
  console.log(`Done — ${teamMembers.length} team members created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
