/*
  Warnings:

  - Changed the type of `genderType` on the `UserPreference` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "UserPreference" ALTER COLUMN "genderType" TYPE "GenderPreference" USING (
  CASE
    WHEN "genderType" ILIKE '%male%' AND "genderType" NOT ILIKE '%female%' THEN 'MALE_ONLY'::"GenderPreference"
    WHEN "genderType" ILIKE '%female%' THEN 'FEMALE_ONLY'::"GenderPreference"
    ELSE 'MALE_ONLY'::"GenderPreference"
  END
);
