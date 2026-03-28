-- DropIndex
DROP INDEX IF EXISTS "sub_categories_slug_key";

-- CreateIndex (compound unique: categoryId + slug)
CREATE UNIQUE INDEX "sub_categories_categoryId_slug_key" ON "sub_categories"("categoryId", "slug");
