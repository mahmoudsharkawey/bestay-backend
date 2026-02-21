-- CreateIndex
CREATE INDEX "Visit_userId_idx" ON "Visit"("userId");

-- CreateIndex
CREATE INDEX "Visit_unitId_idx" ON "Visit"("unitId");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE INDEX "Visit_proposedDate_idx" ON "Visit"("proposedDate");

-- CreateIndex
CREATE INDEX "Visit_userId_unitId_status_idx" ON "Visit"("userId", "unitId", "status");
