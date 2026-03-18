import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const servicesData = [
  {
    order: 1,
    icon: "design_services",
    fr: {
      title: "Conception Sur Mesure",
      summary:
        "Solutions de design et dimensions adaptées à votre espace. Visualisez votre projet en 3D avant la réalisation.",
      detail: "",
    },
    en: {
      title: "Custom Design",
      summary:
        "Tailored design and dimension solutions for your space. Visualise your project in 3D before production.",
      detail: "",
    },
    tr: {
      title: "Özel Tasarım",
      summary:
        "Mekanınıza özel ölçü ve tasarım çözümleri. 3D modelleme ile projenizi hayata geçirmeden önce görselleştirin.",
      detail: "",
    },
  },
  {
    order: 2,
    icon: "palette",
    fr: {
      title: "Sélection des Matériaux",
      summary:
        "Bois premium, stratifiés et quincaillerie de qualité. Nous utilisons des matériaux aux normes européennes.",
      detail: "",
    },
    en: {
      title: "Material Selection",
      summary:
        "Premium wood, laminates and hardware options. We use European-standard quality materials.",
      detail: "",
    },
    tr: {
      title: "Malzeme Seçimi",
      summary:
        "Premium ahşap, laminat ve donanım seçenekleri. Avrupa standartlarında kaliteli malzemeler kullanıyoruz.",
      detail: "",
    },
  },
  {
    order: 3,
    icon: "local_shipping",
    fr: {
      title: "Livraison Européenne",
      summary:
        "Livraison sécurisée et assurée dans toute l'Europe, avec la France en priorité.",
      detail: "",
    },
    en: {
      title: "European Delivery",
      summary:
        "Secure and insured delivery across Europe, with France as priority.",
      detail: "",
    },
    tr: {
      title: "Avrupa Teslimatı",
      summary:
        "Fransa başta olmak üzere tüm Avrupa'ya güvenli ve sigortalı teslimat hizmeti sunuyoruz.",
      detail: "",
    },
  },
  {
    order: 4,
    icon: "construction",
    fr: {
      title: "Installation Professionnelle",
      summary:
        "Notre équipe d'experts monte vos meubles chez vous avec soin. Service clé en main.",
      detail: "",
    },
    en: {
      title: "Professional Installation",
      summary:
        "Our expert team carefully assembles your furniture at your home. Turnkey service.",
      detail: "",
    },
    tr: {
      title: "Profesyonel Montaj",
      summary:
        "Uzman ekibimiz mobilyalarınızı evinizde titizlikle monte eder. Anahtar teslim hizmet.",
      detail: "",
    },
  },
  {
    order: 5,
    icon: "verified",
    fr: {
      title: "Garantie",
      summary:
        "Tous nos produits sont couverts par une garantie de 2 ans. Nous assumons notre qualité.",
      detail: "",
    },
    en: {
      title: "Warranty",
      summary:
        "All our products are covered by a 2-year warranty. We stand behind our quality.",
      detail: "",
    },
    tr: {
      title: "Garanti",
      summary:
        "Tüm ürünlerimiz 2 yıl garanti kapsamındadır. Kalitemizin arkasında duruyoruz.",
      detail: "",
    },
  },
  {
    order: 6,
    icon: "support_agent",
    fr: {
      title: "Service Après-Vente",
      summary:
        "Nous restons à vos côtés après la livraison. Contactez-nous pour des conseils d'entretien et un support technique.",
      detail: "",
    },
    en: {
      title: "After-Sales Support",
      summary:
        "We stay by your side after delivery. Contact us for maintenance advice and technical support.",
      detail: "",
    },
    tr: {
      title: "Satış Sonrası Destek",
      summary:
        "Teslimat sonrası da yanınızdayız. Bakım önerileri ve teknik destek için bize ulaşın.",
      detail: "",
    },
  },
];

async function main() {
  console.log("Seeding service items...");

  const existing = await (prisma as any).serviceItem.count();
  if (existing > 0) {
    console.log(`Already ${existing} service items in DB. Skipping seed.`);
    return;
  }

  for (const item of servicesData) {
    await (prisma as any).serviceItem.create({
      data: {
        icon: item.icon || null,
        order: item.order,
        published: true,
        translations: {
          create: [
            {
              locale: "fr",
              title: item.fr.title,
              summary: item.fr.summary,
              detail: item.fr.detail,
            },
            {
              locale: "en",
              title: item.en.title,
              summary: item.en.summary,
              detail: item.en.detail,
            },
            {
              locale: "tr",
              title: item.tr.title,
              summary: item.tr.summary,
              detail: item.tr.detail,
            },
          ],
        },
      },
    });
    console.log(`  ✓ Service #${item.order}: ${item.fr.title}`);
  }

  console.log(`Done! ${servicesData.length} service items seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
