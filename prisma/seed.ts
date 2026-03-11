import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seed policy:
 * - Admin password must be provided via SEED_ADMIN_PASSWORD (never hardcoded)
 * - In production, use a unique strong password from your secret manager
 * - Rotate the seeded credential immediately after first bootstrap/login
 */
function getRequiredSeedAdminPassword() {
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      "Missing required env var: SEED_ADMIN_PASSWORD. Refusing to seed default admin credentials."
    );
  }

  if (process.env.NODE_ENV === "production" && password.length < 12) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be at least 12 characters in production."
    );
  }

  return password;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin User ──
  const seedAdminPassword = getRequiredSeedAdminPassword();
  const passwordHash = await hash(seedAdminPassword, 12);
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: passwordHash,
      name: "Admin",
      role: "admin",
    },
  });
  console.log("✅ Admin user created");

  // ── Categories ──
  const categories = [
    {
      slug: "cuisines",
      order: 1,
      image: "/uploads/products/kitchen-1.jpg",
      translations: [
        {
          locale: "fr",
          name: "Cuisines & Vanités",
          description:
            "Des cuisines sur mesure alliant fonctionnalité et esthétique, conçues pour sublimer vos espaces de vie.",
        },
        {
          locale: "en",
          name: "Kitchens & Vanities",
          description:
            "Custom kitchens combining functionality and aesthetics, designed to enhance your living spaces.",
        },
        {
          locale: "tr",
          name: "Mutfaklar & Banyo Dolapları",
          description:
            "İşlevsellik ve estetiği birleştiren, yaşam alanlarınızı yüceltmek için tasarlanmış özel mutfaklar.",
        },
      ],
    },
    {
      slug: "salles-de-bains",
      order: 2,
      image: "/uploads/products/bathroom-1.jpg",
      translations: [
        {
          locale: "fr",
          name: "Salles de Bains",
          description:
            "Portes intérieures et panneaux décoratifs avec des textures uniques et des finitions artisanales.",
        },
        {
          locale: "en",
          name: "Bathrooms",
          description:
            "Interior doors and decorative panels with unique textures and artisanal finishes.",
        },
        {
          locale: "tr",
          name: "Banyolar",
          description:
            "Benzersiz dokular ve zanaatkar finisajlar ile iç mekan kapıları ve dekoratif paneller.",
        },
      ],
    },
    {
      slug: "dressings",
      order: 3,
      image: "/uploads/products/wardrobe-4.jpg",
      translations: [
        {
          locale: "fr",
          name: "Dressings",
          description:
            "Solutions de rangement sur mesure qui maximisent l'espace tout en apportant une touche d'élégance.",
        },
        {
          locale: "en",
          name: "Wardrobes",
          description:
            "Custom storage solutions that maximize space while adding a touch of elegance.",
        },
        {
          locale: "tr",
          name: "Gardıroplar",
          description:
            "Alanı maksimize ederken zarafet katan özel depolama çözümleri.",
        },
      ],
    },
    {
      slug: "espaces-de-vie",
      order: 4,
      image: "/uploads/products/kids-room-1.jpg",
      translations: [
        {
          locale: "fr",
          name: "Espaces de Vie",
          description:
            "Chambres d'enfants, espaces de vie, meubles TV — chaque projet est unique et personnalisé.",
        },
        {
          locale: "en",
          name: "Living Spaces",
          description:
            "Children's rooms, living spaces, TV units — each project is unique and personalized.",
        },
        {
          locale: "tr",
          name: "Yaşam Alanları",
          description:
            "Çocuk odaları, yaşam alanları, TV üniteleri — her proje benzersiz ve kişiselleştirilmiş.",
        },
      ],
    },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { order: cat.order, image: cat.image },
      create: {
        slug: cat.slug,
        order: cat.order,
        image: cat.image,
        translations: { create: cat.translations },
      },
    });
    categoryMap[cat.slug] = created.id;
  }
  console.log("✅ Categories created");

  // ── Products ──
  const products = [
    {
      slug: "collection-classique",
      categorySlug: "cuisines",
      featured: true,
      order: 1,
      image: "/uploads/products/kitchen-1.jpg",
      fr: {
        title: "Collection Classique",
        description: "Élégance intemporelle en blanc pur",
      },
      en: {
        title: "Classic Collection",
        description: "Timeless elegance in pure white",
      },
      tr: {
        title: "Klasik Koleksiyon",
        description: "Saf beyazda zamansız zarafet",
      },
    },
    {
      slug: "design-moderne",
      categorySlug: "cuisines",
      featured: false,
      order: 2,
      image: "/uploads/products/kitchen-2.jpg",
      fr: {
        title: "Design Moderne",
        description: "Lignes épurées, finitions premium",
      },
      en: {
        title: "Modern Design",
        description: "Clean lines, premium finishes",
      },
      tr: {
        title: "Modern Tasarım",
        description: "Sade çizgiler, premium detaylar",
      },
    },
    {
      slug: "vitrine-contemporaine",
      categorySlug: "cuisines",
      featured: false,
      order: 3,
      image: "/uploads/products/kitchen-3.jpg",
      fr: {
        title: "Vitrine Contemporaine",
        description: "Transparence et modernité",
      },
      en: {
        title: "Contemporary Vitrine",
        description: "Transparency and modernity",
      },
      tr: { title: "Çağdaş Vitrin", description: "Şeffaflık ve modernlik" },
    },
    {
      slug: "cuisine-en-l",
      categorySlug: "cuisines",
      featured: false,
      order: 4,
      image: "/uploads/products/kitchen-4.jpg",
      fr: {
        title: "Cuisine en L",
        description: "Optimisation maximale de l'espace",
      },
      en: {
        title: "L-Shaped Kitchen",
        description: "Maximum space optimization",
      },
      tr: { title: "L Tipi Mutfak", description: "Maksimum alan kullanımı" },
    },
    {
      slug: "minimaliste-chic",
      categorySlug: "cuisines",
      featured: false,
      order: 5,
      image: "/uploads/products/kitchen-5.jpg",
      fr: { title: "Minimaliste Chic", description: "Simplicité raffinée" },
      en: { title: "Minimalist Chic", description: "Refined simplicity" },
      tr: { title: "Minimalist Şık", description: "Rafine sadelik" },
    },
    {
      slug: "grand-format",
      categorySlug: "cuisines",
      featured: false,
      order: 6,
      image: "/uploads/products/kitchen-6.jpg",
      fr: { title: "Grand Format", description: "Pour les espaces généreux" },
      en: { title: "Grand Format", description: "For generous spaces" },
      tr: { title: "Büyük Format", description: "Geniş mekanlar için" },
    },
    {
      slug: "vanite-suspendue",
      categorySlug: "salles-de-bains",
      featured: true,
      order: 1,
      image: "/uploads/products/bathroom-1.jpg",
      fr: {
        title: "Vanité Suspendue",
        description: "Design minimaliste et fonctionnel",
      },
      en: {
        title: "Floating Vanity",
        description: "Minimalist and functional design",
      },
      tr: {
        title: "Asma Lavabo",
        description: "Minimalist ve fonksiyonel tasarım",
      },
    },
    {
      slug: "chambre-enfant",
      categorySlug: "dressings",
      featured: false,
      order: 1,
      image: "/uploads/products/wardrobe-1.jpg",
      fr: {
        title: "Chambre d'Enfant",
        description: "Rangement élégant pour les petits",
      },
      en: {
        title: "Children's Room",
        description: "Elegant storage for the little ones",
      },
      tr: { title: "Çocuk Odası", description: "Küçükler için zarif depolama" },
    },
    {
      slug: "placard-lamelle",
      categorySlug: "dressings",
      featured: false,
      order: 2,
      image: "/uploads/products/wardrobe-2.jpg",
      fr: {
        title: "Placard Lamellé",
        description: "Texture et sophistication",
      },
      en: {
        title: "Slatted Closet",
        description: "Texture and sophistication",
      },
      tr: { title: "Lamel Dolap", description: "Doku ve sofistike tasarım" },
    },
    {
      slug: "chevron-elegant",
      categorySlug: "dressings",
      featured: false,
      order: 3,
      image: "/uploads/products/wardrobe-3.jpg",
      fr: {
        title: "Chevron Élégant",
        description: "Motifs géométriques raffinés",
      },
      en: {
        title: "Elegant Chevron",
        description: "Refined geometric patterns",
      },
      tr: { title: "Zarif Chevron", description: "Rafine geometrik desenler" },
    },
    {
      slug: "armoire-majestueuse",
      categorySlug: "dressings",
      featured: true,
      order: 4,
      image: "/uploads/products/wardrobe-4.jpg",
      fr: {
        title: "Armoire Majestueuse",
        description: "Capacité maximale, esthétique pure",
      },
      en: {
        title: "Majestic Wardrobe",
        description: "Maximum capacity, pure aesthetics",
      },
      tr: {
        title: "Görkemli Gardırop",
        description: "Maksimum kapasite, saf estetik",
      },
    },
    {
      slug: "meuble-tv-retro",
      categorySlug: "espaces-de-vie",
      featured: true,
      order: 1,
      image: "/uploads/products/tv-unit-1.jpg",
      fr: {
        title: "Meuble TV Rétro",
        description: "Style mid-century moderne",
      },
      en: { title: "Retro TV Unit", description: "Mid-century modern style" },
      tr: { title: "Retro TV Ünitesi", description: "Mid-century modern stil" },
    },
    {
      slug: "monde-enchante",
      categorySlug: "espaces-de-vie",
      featured: false,
      order: 2,
      image: "/uploads/products/kids-room-1.jpg",
      fr: {
        title: "Monde Enchanté",
        description: "Un univers magique pour les petits",
      },
      en: {
        title: "Enchanted World",
        description: "A magical universe for the little ones",
      },
      tr: {
        title: "Büyülü Dünya",
        description: "Küçükler için sihirli bir evren",
      },
    },
    {
      slug: "vestiaire-entree",
      categorySlug: "espaces-de-vie",
      featured: false,
      order: 3,
      image: "/uploads/products/entryway-1.jpg",
      fr: {
        title: "Vestiaire d'Entrée",
        description: "Première impression inoubliable",
      },
      en: {
        title: "Entry Hall Stand",
        description: "An unforgettable first impression",
      },
      tr: { title: "Giriş Vestiyer", description: "Unutulmaz bir ilk izlenim" },
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        featured: p.featured,
        order: p.order,
        categoryId: categoryMap[p.categorySlug],
        images: {
          create: [{ url: p.image, alt: p.fr.title, order: 0 }],
        },
        translations: {
          create: [
            { locale: "fr", title: p.fr.title, description: p.fr.description },
            { locale: "en", title: p.en.title, description: p.en.description },
            { locale: "tr", title: p.tr.title, description: p.tr.description },
          ],
        },
      },
    });
  }
  console.log("✅ Products created");

  // ── Hero Slides ──
  const heroSlides = [
    {
      image: "/uploads/products/kitchen-1.jpg",
      order: 1,
      translations: [
        {
          locale: "fr",
          badge: "DESIGN D'INTÉRIEUR PREMIUM",
          title: "Concevons Ensemble Votre Rêve",
          subtitle:
            "Mobilier minimaliste de luxe & design d'intérieur. Fabriqué en Turquie, conçu pour le monde.",
        },
        {
          locale: "en",
          badge: "PREMIUM INTERIOR DESIGN",
          title: "Let's Design Together Your Dream",
          subtitle:
            "Minimalist luxury furniture & interior design. Crafted in Turkey, designed for the world.",
        },
        {
          locale: "tr",
          badge: "PREMIUM İÇ MİMARİ TASARIM",
          title: "Birlikte Tasarlayalım Hayalinizi",
          subtitle:
            "Minimalist lüks mobilya & iç mimari tasarım. Türkiye'de üretildi, dünya için tasarlandı.",
        },
      ],
    },
    {
      image: "/uploads/products/kitchen-4.jpg",
      order: 2,
      translations: [
        {
          locale: "fr",
          badge: "FABRICATION SUR MESURE",
          title: "L'Excellence Artisanale",
          subtitle:
            "Chaque pièce est conçue et fabriquée avec précision pour votre intérieur.",
        },
        {
          locale: "en",
          badge: "CUSTOM MANUFACTURING",
          title: "Artisanal Excellence",
          subtitle:
            "Every piece is designed and manufactured with precision for your interior.",
        },
        {
          locale: "tr",
          badge: "ÖZEL ÜRETİM",
          title: "Zanaatkar Mükemmellik",
          subtitle:
            "Her parça, iç mekanınız için hassasiyetle tasarlanıp üretilir.",
        },
      ],
    },
    {
      image: "/uploads/products/wardrobe-1.jpg",
      order: 3,
      translations: [
        {
          locale: "fr",
          badge: "QUALITÉ CERTIFIÉE",
          title: "De l'Atelier à Votre Maison",
          subtitle:
            "De notre atelier d'Aksaray jusqu'à votre intérieur en Europe. Qualité assurée.",
        },
        {
          locale: "en",
          badge: "CERTIFIED QUALITY",
          title: "From Workshop to Your Home",
          subtitle:
            "From our Aksaray workshop to your European interior. Quality guaranteed.",
        },
        {
          locale: "tr",
          badge: "SERTİFİKALI KALİTE",
          title: "Atölyeden Evinize",
          subtitle:
            "Aksaray atölyemizden Avrupa'daki evinize. Kalite garantili.",
        },
      ],
    },
  ];

  for (const slide of heroSlides) {
    await prisma.heroSlide.create({
      data: {
        image: slide.image,
        order: slide.order,
        active: true,
        translations: { create: slide.translations },
      },
    });
  }
  console.log("✅ Hero slides created");

  // ── Site Settings ──
  const settings = [
    { key: "site_name", value: "Arvesta Menuiserie France" },
    { key: "logo", value: "/uploads/products/logo.png" },
    { key: "phone", value: "+33 (0) 1 43 67 88" },
    { key: "email", value: "contact@arvesta-france.com" },
    { key: "address", value: "75001 Paris, France" },
    { key: "instagram", value: "https://instagram.com/arvesta" },
    { key: "whatsapp", value: "https://wa.me/33143678800" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("✅ Site settings created");
  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
