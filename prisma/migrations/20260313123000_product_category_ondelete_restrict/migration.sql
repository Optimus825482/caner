-- Make Product -> Category relation delete behavior explicit.
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_categoryId_fkey";

ALTER TABLE "products"
ADD CONSTRAINT "products_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
