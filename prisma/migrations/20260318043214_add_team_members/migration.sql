-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "photo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member_translations" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,

    CONSTRAINT "team_member_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_members_published_order_idx" ON "team_members"("published", "order");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_translations_teamMemberId_locale_key" ON "team_member_translations"("teamMemberId", "locale");

-- AddForeignKey
ALTER TABLE "team_member_translations" ADD CONSTRAINT "team_member_translations_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
