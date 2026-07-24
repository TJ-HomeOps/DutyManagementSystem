-- DropIndex
DROP INDEX "Holiday_date_key";

-- AlterTable
ALTER TABLE "Holiday" ADD COLUMN     "employeeId" TEXT;

-- CreateIndex
CREATE INDEX "Holiday_employeeId_idx" ON "Holiday"("employeeId");

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
