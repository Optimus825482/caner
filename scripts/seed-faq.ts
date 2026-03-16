import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const faqData = [
  {
    order: 1,
    fr: {
      question: "Quel est le délai de livraison ?",
      answer:
        "Le délai de livraison varie entre 6 et 10 semaines selon la complexité du projet. Nos meubles sont fabriqués sur mesure dans nos ateliers d'Aksaray, puis expédiés directement à votre adresse en Europe. Nous vous tenons informé à chaque étape de la production.",
    },
    en: {
      question: "What is the delivery time?",
      answer:
        "Delivery time varies between 6 and 10 weeks depending on the complexity of the project. Our furniture is custom-made in our Aksaray workshops, then shipped directly to your address in Europe. We keep you informed at every stage of production.",
    },
    tr: {
      question: "Teslimat süresi ne kadar?",
      answer:
        "Teslimat süresi projenin karmaşıklığına göre 6 ile 10 hafta arasında değişir. Mobilyalarımız Aksaray'daki atölyelerimizde özel olarak üretilir, ardından doğrudan Avrupa'daki adresinize gönderilir. Üretimin her aşamasında sizi bilgilendiririz.",
    },
  },
  {
    order: 2,
    fr: {
      question: "Livrez-vous dans toute l'Europe ?",
      answer:
        "Oui, nous livrons principalement en France, Belgique, Allemagne et Pays-Bas. D'autres pays européens sont également desservis sur demande. Les frais de livraison sont inclus dans le devis personnalisé que nous vous fournissons.",
    },
    en: {
      question: "Do you deliver throughout Europe?",
      answer:
        "Yes, we primarily deliver to France, Belgium, Germany and the Netherlands. Other European countries are also served upon request. Delivery costs are included in the personalised quote we provide.",
    },
    tr: {
      question: "Tüm Avrupa'ya teslimat yapıyor musunuz?",
      answer:
        "Evet, başlıca Fransa, Belçika, Almanya ve Hollanda'ya teslimat yapıyoruz. Diğer Avrupa ülkelerine de talep üzerine hizmet verilmektedir. Teslimat ücretleri size sunduğumuz kişiselleştirilmiş teklife dahildir.",
    },
  },
  {
    order: 3,
    fr: {
      question: "Comment se déroule un projet sur mesure ?",
      answer:
        "Le processus commence par une consultation gratuite où nous discutons de vos besoins et de votre vision. Ensuite, nous réalisons les plans et les rendus 3D pour validation. Une fois approuvé, la fabrication démarre dans nos ateliers. Enfin, nous assurons la livraison et l'installation chez vous.",
    },
    en: {
      question: "How does a custom project work?",
      answer:
        "The process begins with a free consultation where we discuss your needs and vision. Then we create plans and 3D renders for approval. Once approved, manufacturing begins in our workshops. Finally, we handle delivery and installation at your home.",
    },
    tr: {
      question: "Özel tasarım proje süreci nasıl işler?",
      answer:
        "Süreç, ihtiyaçlarınızı ve vizyonunuzu tartıştığımız ücretsiz bir danışmanlıkla başlar. Ardından onay için planlar ve 3D görseller hazırlarız. Onaylandıktan sonra atölyelerimizde üretim başlar. Son olarak evinize teslimat ve montajı gerçekleştiririz.",
    },
  },
  {
    order: 4,
    fr: {
      question: "Quels matériaux utilisez-vous ?",
      answer:
        "Nous utilisons exclusivement des matériaux de haute qualité : bois massif, placages naturels, quincaillerie européenne premium et finitions laquées. Chaque matériau est sélectionné pour sa durabilité et son esthétique. Nous pouvons vous présenter des échantillons lors de la consultation.",
    },
    en: {
      question: "What materials do you use?",
      answer:
        "We exclusively use high-quality materials: solid wood, natural veneers, premium European hardware and lacquered finishes. Each material is selected for its durability and aesthetics. We can show you samples during the consultation.",
    },
    tr: {
      question: "Hangi malzemeleri kullanıyorsunuz?",
      answer:
        "Yalnızca yüksek kaliteli malzemeler kullanıyoruz: masif ahşap, doğal kaplamalar, premium Avrupa donanımı ve lake kaplamalar. Her malzeme dayanıklılığı ve estetiği için seçilir. Danışmanlık sırasında size numuneler gösterebiliriz.",
    },
  },
  {
    order: 5,
    fr: {
      question: "Offrez-vous une garantie ?",
      answer:
        "Oui, tous nos meubles sont couverts par une garantie de 5 ans sur la structure et la fabrication. Cette garantie couvre les défauts de matériaux et de main-d'œuvre dans des conditions normales d'utilisation.",
    },
    en: {
      question: "Do you offer a warranty?",
      answer:
        "Yes, all our furniture is covered by a 5-year warranty on structure and craftsmanship. This warranty covers material and workmanship defects under normal conditions of use.",
    },
    tr: {
      question: "Garanti sunuyor musunuz?",
      answer:
        "Evet, tüm mobilyalarımız yapı ve işçilik üzerinde 5 yıl garantilidir. Bu garanti, normal kullanım koşullarında malzeme ve işçilik kusurlarını kapsar.",
    },
  },
  {
    order: 6,
    fr: {
      question: "Quelles sont les modalités de paiement ?",
      answer:
        "Nous demandons un acompte de 40% à la commande, 30% au début de la fabrication et le solde de 30% à la livraison. Nous acceptons les virements bancaires. Un devis détaillé vous est fourni avant tout engagement.",
    },
    en: {
      question: "What are the payment terms?",
      answer:
        "We require a 40% deposit at order, 30% at the start of manufacturing and the remaining 30% upon delivery. We accept bank transfers. A detailed quote is provided before any commitment.",
    },
    tr: {
      question: "Ödeme koşulları nelerdir?",
      answer:
        "Siparişte %40, üretim başlangıcında %30 ve teslimatta kalan %30 ödeme talep ediyoruz. Banka havalesi kabul ediyoruz. Herhangi bir taahhütten önce detaylı bir teklif sunulur.",
    },
  },
  {
    order: 7,
    fr: {
      question: "Puis-je suivre l'avancement de mon projet ?",
      answer:
        "Absolument. Nous envoyons des photos et des mises à jour régulières pendant la fabrication. Vous avez un interlocuteur dédié qui vous accompagne du début à la fin du projet.",
    },
    en: {
      question: "Can I track my project's progress?",
      answer:
        "Absolutely. We send photos and regular updates during manufacturing. You have a dedicated contact person who accompanies you from start to finish.",
    },
    tr: {
      question: "Projemin ilerleyişini takip edebilir miyim?",
      answer:
        "Kesinlikle. Üretim süresince fotoğraflar ve düzenli güncellemeler gönderiyoruz. Baştan sona size eşlik eden özel bir iletişim kişiniz olur.",
    },
  },
  {
    order: 8,
    fr: {
      question: "Puis-je personnaliser entièrement mon meuble ?",
      answer:
        "C'est notre spécialité. Dimensions, matériaux, couleurs, finitions, quincaillerie — tout est personnalisable selon vos souhaits. Nous n'avons pas de catalogue standard : chaque pièce est unique et conçue spécifiquement pour votre espace.",
    },
    en: {
      question: "Can I fully customise my furniture?",
      answer:
        "That's our speciality. Dimensions, materials, colours, finishes, hardware — everything is customisable to your wishes. We don't have a standard catalogue: each piece is unique and designed specifically for your space.",
    },
    tr: {
      question: "Mobilyamı tamamen özelleştirebilir miyim?",
      answer:
        "Bu bizim uzmanlık alanımız. Boyutlar, malzemeler, renkler, kaplamalar, donanım — her şey isteklerinize göre özelleştirilebilir. Standart bir kataloğumuz yoktur: her parça benzersizdir ve özellikle sizin mekanınız için tasarlanır.",
    },
  },
  {
    order: 9,
    fr: {
      question: "Assurez-vous l'installation ?",
      answer:
        "Oui, nous proposons un service d'installation clé en main. Notre équipe professionnelle se déplace chez vous pour monter et installer vos meubles. L'installation est incluse dans nos prestations pour la France métropolitaine.",
    },
    en: {
      question: "Do you handle installation?",
      answer:
        "Yes, we offer a turnkey installation service. Our professional team comes to your home to assemble and install your furniture. Installation is included in our services for mainland France.",
    },
    tr: {
      question: "Montaj hizmeti sunuyor musunuz?",
      answer:
        "Evet, anahtar teslim montaj hizmeti sunuyoruz. Profesyonel ekibimiz evinize gelerek mobilyalarınızı monte eder ve kurar. Fransa anakarası için montaj hizmetlerimize dahildir.",
    },
  },
  {
    order: 10,
    fr: {
      question: "Comment obtenir un devis gratuit ?",
      answer:
        "Remplissez simplement notre formulaire de contact en décrivant votre projet. Vous pouvez également nous appeler ou nous envoyer un message WhatsApp. Nous vous répondons sous 24 heures avec une première estimation, puis nous affinons le devis après la consultation détaillée.",
    },
    en: {
      question: "How do I get a free quote?",
      answer:
        "Simply fill in our contact form describing your project. You can also call us or send a WhatsApp message. We respond within 24 hours with an initial estimate, then refine the quote after a detailed consultation.",
    },
    tr: {
      question: "Ücretsiz teklif nasıl alabilirim?",
      answer:
        "Projenizi açıklayan iletişim formumuzu doldurmanız yeterli. Bizi arayabilir veya WhatsApp mesajı da gönderebilirsiniz. 24 saat içinde ilk tahmini ile yanıt veririz, ardından detaylı danışmanlık sonrası teklifi netleştiririz.",
    },
  },
];

async function main() {
  console.log("Seeding FAQ items...");

  const existing = await (prisma as any).faqItem.count();
  if (existing > 0) {
    console.log(`Already ${existing} FAQ items in DB. Skipping seed.`);
    return;
  }

  for (const item of faqData) {
    await (prisma as any).faqItem.create({
      data: {
        order: item.order,
        published: true,
        translations: {
          create: [
            {
              locale: "fr",
              question: item.fr.question,
              answer: item.fr.answer,
            },
            {
              locale: "en",
              question: item.en.question,
              answer: item.en.answer,
            },
            {
              locale: "tr",
              question: item.tr.question,
              answer: item.tr.answer,
            },
          ],
        },
      },
    });
    console.log(
      `  ✓ FAQ #${item.order}: ${item.fr.question.substring(0, 40)}...`,
    );
  }

  console.log(`Done! ${faqData.length} FAQ items seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
