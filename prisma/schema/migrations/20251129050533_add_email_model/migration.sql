/*
  Warnings:

  - You are about to drop the column `name` on the `files` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "files" DROP COLUMN "name";

-- CreateTable
CREATE TABLE "emails" (
    "id" SERIAL NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "htmlBody" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "userId" INTEGER,
    "recipientId" INTEGER,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
