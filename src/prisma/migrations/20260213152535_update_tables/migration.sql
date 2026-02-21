/*
  Warnings:

  - The values [PENDING_PAYMENT,PAID,VISIT_SCHEDULED,VISIT_RESCHEDULED,CANCELLED_BY_USER,CANCELLED_BY_OWNER,COMPLETED,REFUNDED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cancelledAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `depositAmount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentIntentId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `refundAmount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `refundedAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `serviceFee` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `visitDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentIntentId` on the `Payment` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - A unique constraint covering the columns `[visitId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[visitId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `visitId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_REQUEST', 'BOOKING_APPROVED', 'BOOKING_RESCHEDULED', 'BOOKING_REJECTED', 'PAYMENT_CONFIRMED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PENDING_OWNER', 'APPROVED', 'REJECTED_BY_OWNER', 'RESCHEDULE_PROPOSED', 'REJECTED_BY_USER', 'CANCELLED_BY_USER', 'CONFIRMED');

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('CONFIRMED', 'BOOKED', 'CANCELLED');
ALTER TABLE "public"."Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- DropIndex
DROP INDEX "Booking_expiresAt_idx";

-- DropIndex
DROP INDEX "Booking_paidAt_idx";

-- DropIndex
DROP INDEX "Booking_status_idx";

-- DropIndex
DROP INDEX "Booking_unitId_idx";

-- DropIndex
DROP INDEX "Booking_userId_idx";

-- DropIndex
DROP INDEX "Payment_bookingId_key";

-- DropIndex
DROP INDEX "Payment_paymentIntentId_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "cancelledAt",
DROP COLUMN "depositAmount",
DROP COLUMN "expiresAt",
DROP COLUMN "paidAt",
DROP COLUMN "paymentIntentId",
DROP COLUMN "refundAmount",
DROP COLUMN "refundedAt",
DROP COLUMN "serviceFee",
DROP COLUMN "totalAmount",
DROP COLUMN "updatedAt",
DROP COLUMN "visitDate",
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "visitId" TEXT NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "bookingId",
DROP COLUMN "method",
DROP COLUMN "paymentIntentId",
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "stripeIntentId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "visitId" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "status" "VisitStatus" NOT NULL,
    "rescheduleCount" INTEGER NOT NULL DEFAULT 0,
    "paymentPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentId" TEXT,
    "bookingId" TEXT,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_visitId_key" ON "Booking"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_visitId_key" ON "Payment"("visitId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
