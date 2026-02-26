-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Unit_averageRating_idx" ON "Unit"("averageRating");
