/*
  Warnings:

  - You are about to drop the column `date` on the `Holiday` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Holiday` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Holiday` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Holiday_date_idx";

-- AlterTable
ALTER TABLE "Holiday" DROP COLUMN "date",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Holiday_startDate_idx" ON "Holiday"("startDate");

-- CreateIndex
CREATE INDEX "Holiday_endDate_idx" ON "Holiday"("endDate");
