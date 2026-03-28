-- CreateTable
CREATE TABLE "service_items" (
    "id" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_item_translations" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "serviceItemId" TEXT NOT NULL,

    CONSTRAINT "service_item_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_items_published_order_idx" ON "service_items"("published", "order");

-- CreateIndex
CREATE UNIQUE INDEX "service_item_translations_serviceItemId_locale_key" ON "service_item_translations"("serviceItemId", "locale");

-- AddForeignKey
ALTER TABLE "service_item_translations" ADD CONSTRAINT "service_item_translations_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "service_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
