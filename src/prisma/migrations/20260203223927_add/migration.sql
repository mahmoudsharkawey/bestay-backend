-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetCode" TEXT,
ADD COLUMN     "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetVerified" BOOLEAN NOT NULL DEFAULT false;
