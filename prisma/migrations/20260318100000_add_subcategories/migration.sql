-- CreateTable
CREATE TABLE "sub_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_category_translations" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subCategoryId" TEXT NOT NULL,

    CONSTRAINT "sub_category_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_slug_key" ON "sub_categories"("slug");
CREATE INDEX "sub_categories_categoryId_idx" ON "sub_categories"("categoryId");
CREATE UNIQUE INDEX "sub_category_translations_subCategoryId_locale_key" ON "sub_category_translations"("subCategoryId", "locale");

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sub_category_translations" ADD CONSTRAINT "sub_category_translations_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data: create a subcategory for each category, copy translations, reassign products
-- Step 1: Create subcategories from existing categories (using same id pattern)
INSERT INTO "sub_categories" ("id", "slug", "order", "image", "categoryId", "createdAt", "updatedAt")
SELECT
    'sub_' || "id",
    "slug" || '-general',
    "order",
    NULL,
    "id",
    "createdAt",
    "updatedAt"
FROM "categories";

-- Step 2: Copy category translations to subcategory translations
INSERT INTO "sub_category_translations" ("id", "locale", "name", "description", "subCategoryId")
SELECT
    'sub_' || "id",
    "locale",
    "name",
    "description",
    'sub_' || "categoryId"
FROM "category_translations";

-- Step 3: Add subCategoryId column to products
ALTER TABLE "products" ADD COLUMN "subCategoryId" TEXT;

-- Step 4: Populate subCategoryId from existing categoryId
UPDATE "products" SET "subCategoryId" = 'sub_' || "categoryId";

-- Step 5: Make subCategoryId NOT NULL
ALTER TABLE "products" ALTER COLUMN "subCategoryId" SET NOT NULL;

-- Step 6: Drop old categoryId foreign key and column
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";
DROP INDEX IF EXISTS "products_categoryId_idx";
ALTER TABLE "products" DROP COLUMN "categoryId";

-- Step 7: Create index and foreign key for subCategoryId
CREATE INDEX "products_subCategoryId_idx" ON "products"("subCategoryId");
ALTER TABLE "products" ADD CONSTRAINT "products_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Remove products relation from categories (already done by dropping column)
