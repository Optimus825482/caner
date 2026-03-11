/*
  Warnings:

  - You are about to drop the column `email` on the `admin_users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `admin_users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `admin_users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "admin_users_email_key";

-- AlterTable
ALTER TABLE "admin_users" DROP COLUMN "email",
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");
