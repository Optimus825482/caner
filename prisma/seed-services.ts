import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check if services already exist
  const existing = await prisma.serviceItem.count();
  if (existing > 0) {
    console.log(`⏭️  ${existing} service items already exist, skipping.`);
    return;
  }

  const serviceItems = [
    {
      icon: "Paintbrush",
      order: 1,
      translations: [
        {
          locale: "fr",
          title: "Conception sur mesure",
          summary:
            "Solutions de design et de dimensions sur mesure pour votre espace. Visualisez votre projet en 3D avant la production.",
          detail:
            "Solutions de design et de dimensions sur mesure pour votre espace. Visualisez votre projet en 3D avant la production.",
        },
        {
          locale: "en",
          title: "Custom Design",
          summary:
            "Tailored design and dimension solutions for your space. Visualise your project in 3D before production.",
          detail:
            "Tailored design and dimension solutions for your space. Visualise your project in 3D before production.",
        },
        {
          locale: "tr",
          title: "Özel Tasarım",
          summary:
            "Mekanınıza özel ölçü ve tasarım çözümleri. 3D modelleme ile projenizi hayata geçirmeden önce görselleştirin.",
          detail:
            "Mekanınıza özel ölçü ve tasarım çözümleri. 3D modelleme ile projenizi hayata geçirmeden önce görselleştirin.",
        },
      ],
    },
    {
      icon: "Layers",
      order: 2,
      translations: [
        {
          locale: "fr",
          title: "Sélection de matériaux",
          summary:
            "Options de bois premium, stratifiés et quincaillerie. Nous utilisons des matériaux de qualité aux normes européennes.",
          detail:
            "Options de bois premium, stratifiés et quincaillerie. Nous utilisons des matériaux de qualité aux normes européennes.",
        },
        {
          locale: "en",
          title: "Material Selection",
          summary:
            "Premium wood, laminates and hardware options. We use European-standard quality materials.",
          detail:
            "Premium wood, laminates and hardware options. We use European-standard quality materials.",
        },
        {
          locale: "tr",
          title: "Malzeme Seçimi",
          summary:
            "Premium ahşap, laminat ve donanım seçenekleri. Avrupa standartlarında kaliteli malzemeler kullanıyoruz.",
          detail:
            "Premium ahşap, laminat ve donanım seçenekleri. Avrupa standartlarında kaliteli malzemeler kullanıyoruz.",
        },
      ],
    },
    {
      icon: "Truck",
      order: 3,
      translations: [
        {
          locale: "fr",
          title: "Livraison européenne",
          summary:
            "Livraison sécurisée et assurée dans toute l'Europe, avec la France en priorité.",
          detail:
            "Livraison sécurisée et assurée dans toute l'Europe, avec la France en priorité.",
        },
        {
          locale: "en",
          title: "European Delivery",
          summary:
            "Secure and insured delivery across Europe, with France as priority.",
          detail:
            "Secure and insured delivery across Europe, with France as priority.",
        },
        {
          locale: "tr",
          title: "Avrupa Teslimatı",
          summary:
            "Fransa başta olmak üzere tüm Avrupa'ya güvenli ve sigortalı teslimat hizmeti sunuyoruz.",
          detail:
            "Fransa başta olmak üzere tüm Avrupa'ya güvenli ve sigortalı teslimat hizmeti sunuyoruz.",
        },
      ],
    },
    {
      icon: "Wrench",
      order: 4,
      translations: [
        {
          locale: "fr",
          title: "Installation professionnelle",
          summary:
            "Notre équipe d'experts assemble soigneusement vos meubles chez vous. Service clé en main.",
          detail:
            "Notre équipe d'experts assemble soigneusement vos meubles chez vous. Service clé en main.",
        },
        {
          locale: "en",
          title: "Professional Installation",
          summary:
            "Our expert team carefully assembles your furniture at your home. Turnkey service.",
          detail:
            "Our expert team carefully assembles your furniture at your home. Turnkey service.",
        },
        {
          locale: "tr",
          title: "Profesyonel Montaj",
          summary:
            "Uzman ekibimiz mobilyalarınızı evinizde titizlikle monte eder. Anahtar teslim hizmet.",
          detail:
            "Uzman ekibimiz mobilyalarınızı evinizde titizlikle monte eder. Anahtar teslim hizmet.",
        },
      ],
    },
    {
      icon: "ShieldCheck",
      order: 5,
      translations: [
        {
          locale: "fr",
          title: "Garantie",
          summary:
            "Tous nos produits sont couverts par une garantie de 2 ans. Nous garantissons notre qualité.",
          detail:
            "Tous nos produits sont couverts par une garantie de 2 ans. Nous garantissons notre qualité.",
        },
        {
          locale: "en",
          title: "Warranty",
          summary:
            "All our products are covered by a 2-year warranty. We stand behind our quality.",
          detail:
            "All our products are covered by a 2-year warranty. We stand behind our quality.",
        },
        {
          locale: "tr",
          title: "Garanti",
          summary:
            "Tüm ürünlerimiz 2 yıl garanti kapsamındadır. Kalitemizin arkasında duruyoruz.",
          detail:
            "Tüm ürünlerimiz 2 yıl garanti kapsamındadır. Kalitemizin arkasında duruyoruz.",
        },
      ],
    },
    {
      icon: "Headphones",
      order: 6,
      translations: [
        {
          locale: "fr",
          title: "Support après-vente",
          summary:
            "Nous restons à vos côtés après la livraison. Contactez-nous pour des conseils d'entretien et un support technique.",
          detail:
            "Nous restons à vos côtés après la livraison. Contactez-nous pour des conseils d'entretien et un support technique.",
        },
        {
          locale: "en",
          title: "After-Sales Support",
          summary:
            "We stay by your side after delivery. Contact us for maintenance advice and technical support.",
          detail:
            "We stay by your side after delivery. Contact us for maintenance advice and technical support.",
        },
        {
          locale: "tr",
          title: "Satış Sonrası Destek",
          summary:
            "Teslimat sonrası da yanınızdayız. Bakım önerileri ve teknik destek için bize ulaşın.",
          detail:
            "Teslimat sonrası da yanınızdayız. Bakım önerileri ve teknik destek için bize ulaşın.",
        },
      ],
    },
  ];

  for (const svc of serviceItems) {
    await prisma.serviceItem.create({
      data: {
        icon: svc.icon,
        order: svc.order,
        published: true,
        translations: { create: svc.translations },
      },
    });
  }
  console.log(`✅ ${serviceItems.length} service items seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
