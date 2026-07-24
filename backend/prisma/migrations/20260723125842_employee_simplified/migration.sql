/*
  Warnings:

  - You are about to drop the column `email` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Employee` table. All the data in the column will be lost.
  - Added the required column `department` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "email",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
