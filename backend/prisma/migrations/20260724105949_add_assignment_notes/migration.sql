-- AlterTable
ALTER TABLE "DutyAssignment" ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE INDEX "DutyAssignment_teamId_idx" ON "DutyAssignment"("teamId");

-- CreateIndex
CREATE INDEX "DutyAssignment_employeeId_idx" ON "DutyAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "DutyAssignment_start_idx" ON "DutyAssignment"("start");

-- CreateIndex
CREATE INDEX "DutyAssignment_end_idx" ON "DutyAssignment"("end");

-- CreateIndex
CREATE INDEX "DutyRule_teamId_idx" ON "DutyRule"("teamId");

-- CreateIndex
CREATE INDEX "DutyRule_weekday_idx" ON "DutyRule"("weekday");
