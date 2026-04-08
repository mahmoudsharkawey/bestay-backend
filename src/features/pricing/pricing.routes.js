import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import { pricingSuggestionSchema } from "./pricing.validation.js";
import * as pricingController from "./pricing.controller.js";

const router = Router();

// POST /api/v1/pricing/suggest — Get pricing suggestion for new/hypothetical unit
router.post(
  "/suggest",
  Authenticate,
  authorizeRoles("LANDLORD"),
  validate(pricingSuggestionSchema),
  pricingController.getPricingSuggestion,
);

// GET /api/v1/pricing/unit/:unitId — Get pricing suggestion for an existing unit
router.get(
  "/unit/:unitId",
  Authenticate,
  authorizeRoles("LANDLORD"),
  pricingController.getPricingForUnit,
);

export default router;
