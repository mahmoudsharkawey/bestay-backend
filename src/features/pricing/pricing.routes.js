import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import { pricingSuggestionSchema } from "./pricing.validation.js";
import * as pricingController from "./pricing.controller.js";

const router = Router();

/**
 * @swagger
 * /pricing/suggest:
 *   post:
 *     summary: Get pricing suggestion for a new/hypothetical unit
 *     tags: [AI Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [city, roomType, genderType, rooms, furnished]
 *             properties:
 *               city:
 *                 type: string
 *               roomType:
 *                 type: string
 *                 enum: [SINGLE, DOUBLE, SHARED]
 *               genderType:
 *                 type: string
 *                 enum: [MALE_ONLY, FEMALE_ONLY]
 *               rooms:
 *                 type: integer
 *               furnished:
 *                 type: boolean
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Pricing suggestion generated
 *       403:
 *         description: LANDLORD role required
 */
router.post(
  "/suggest",
  Authenticate,
  authorizeRoles("LANDLORD"),
  validate(pricingSuggestionSchema),
  pricingController.getPricingSuggestion,
);

/**
 * @swagger
 * /pricing/unit/{unitId}:
 *   get:
 *     summary: Get pricing suggestion for an existing unit
 *     tags: [AI Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pricing analysis generated
 *       403:
 *         description: LANDLORD role required
 *       404:
 *         description: Unit not found
 */
router.get(
  "/unit/:unitId",
  Authenticate,
  authorizeRoles("LANDLORD"),
  pricingController.getPricingForUnit,
);

export default router;
