-- CreateTable
CREATE TABLE "digital_catalogs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_catalog_translations" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,

    CONSTRAINT "digital_catalog_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_catalog_pages" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "catalogId" TEXT NOT NULL,

    CONSTRAINT "digital_catalog_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "digital_catalogs_slug_key" ON "digital_catalogs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "digital_catalog_translations_catalogId_locale_key" ON "digital_catalog_translations"("catalogId", "locale");

-- CreateIndex
CREATE INDEX "digital_catalog_pages_catalogId_idx" ON "digital_catalog_pages"("catalogId");

-- AddForeignKey
ALTER TABLE "digital_catalog_translations" ADD CONSTRAINT "digital_catalog_translations_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "digital_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_catalog_pages" ADD CONSTRAINT "digital_catalog_pages_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "digital_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
