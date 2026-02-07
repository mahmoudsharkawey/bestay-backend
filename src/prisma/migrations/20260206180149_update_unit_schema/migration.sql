/*
  Warnings:

  - You are about to drop the column `available` on the `Unit` table. All the data in the column will be lost.
  - Added the required column `genderType` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomType` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'SHARED');

-- CreateEnum
CREATE TYPE "GenderPreference" AS ENUM ('MALE_ONLY', 'FEMALE_ONLY');

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "available",
ADD COLUMN     "facilities" TEXT[],
ADD COLUMN     "genderType" "GenderPreference" NOT NULL,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "roomType" "RoomType" NOT NULL,
ADD COLUMN     "university" TEXT,
ALTER COLUMN "distance" DROP NOT NULL;
