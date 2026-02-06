/*
  Warnings:

  - You are about to drop the column `budgetMax` on the `UserPreference` table. All the data in the column will be lost.
  - You are about to drop the column `budgetMin` on the `UserPreference` table. All the data in the column will be lost.
  - Added the required column `genderType` to the `UserPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxBudget` to the `UserPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minBudget` to the `UserPreference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitType` to the `UserPreference` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('ROOM', 'APARTMENT', 'STUDIO');

-- AlterTable
ALTER TABLE "UserPreference" DROP COLUMN "budgetMax",
DROP COLUMN "budgetMin",
ADD COLUMN     "facilities" TEXT[],
ADD COLUMN     "genderType" TEXT NOT NULL,
ADD COLUMN     "maxBudget" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "minBudget" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "unitType" "UnitType" NOT NULL,
ADD COLUMN     "university" TEXT;
