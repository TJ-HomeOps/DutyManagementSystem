-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "DutyRuleType" AS ENUM ('FIXED', 'MANUAL', 'ROTATION');

-- CreateTable
CREATE TABLE "DutyRule" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "ruleType" "DutyRuleType" NOT NULL,
    "employeeId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DutyRule" ADD CONSTRAINT "DutyRule_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyRule" ADD CONSTRAINT "DutyRule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
