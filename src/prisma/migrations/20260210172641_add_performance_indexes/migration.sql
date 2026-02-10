-- CreateIndex
CREATE INDEX "Booking_expiresAt_idx" ON "Booking"("expiresAt");

-- CreateIndex
CREATE INDEX "Booking_paidAt_idx" ON "Booking"("paidAt");

-- CreateIndex
CREATE INDEX "Unit_city_idx" ON "Unit"("city");

-- CreateIndex
CREATE INDEX "Unit_isAvailable_idx" ON "Unit"("isAvailable");

-- CreateIndex
CREATE INDEX "Unit_ownerId_idx" ON "Unit"("ownerId");

-- CreateIndex
CREATE INDEX "Unit_price_idx" ON "Unit"("price");

-- CreateIndex
CREATE INDEX "Unit_roomType_idx" ON "Unit"("roomType");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
