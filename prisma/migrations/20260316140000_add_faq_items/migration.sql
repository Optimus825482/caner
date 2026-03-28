-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_item_translations" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "faqItemId" TEXT NOT NULL,

    CONSTRAINT "faq_item_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_items_published_order_idx" ON "faq_items"("published", "order");

-- CreateIndex
CREATE UNIQUE INDEX "faq_item_translations_faqItemId_locale_key" ON "faq_item_translations"("faqItemId", "locale");

-- AddForeignKey
ALTER TABLE "faq_item_translations" ADD CONSTRAINT "faq_item_translations_faqItemId_fkey" FOREIGN KEY ("faqItemId") REFERENCES "faq_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
