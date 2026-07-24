-- CreateTable
CREATE TABLE "DutyAssignment" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyAssignment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
