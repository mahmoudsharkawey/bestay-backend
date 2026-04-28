import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import { createPaymentIntentSchema } from "./payment.validation.js";
import {
  createPaymentIntent,
  refundPayment,
  getMyPayments,
  getAllPayments,
} from "./payment.controller.js";

const router = Router();

////////////////////
// User routes
////////////////////

/**
 * @swagger
 * /payments/intent:
 *   post:
 *     summary: Create a Stripe PaymentIntent for an approved visit
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [visitId]
 *             properties:
 *               visitId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: PaymentIntent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientSecret:
 *                       type: string
 *                     paymentIntentId:
 *                       type: string
 *                     amount:
 *                       type: integer
 *       403:
 *         description: USER role required
 */
router.post(
  "/intent",
  Authenticate,
  authorizeRoles("USER"),
  validate(createPaymentIntentSchema),
  createPaymentIntent,
);

/**
 * @swagger
 * /payments/my:
 *   get:
 *     summary: Get the authenticated user's payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 */
router.get("/my", Authenticate, authorizeRoles("USER"), getMyPayments);

////////////////////
// Admin routes
////////////////////

/**
 * @swagger
 * /payments/{id}/refund:
 *   post:
 *     summary: Issue a full refund for a PAID payment via Stripe
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment record ID
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *       403:
 *         description: ADMIN role required
 *       404:
 *         description: Payment not found
 */
router.post(
  "/:id/refund",
  Authenticate,
  authorizeRoles("ADMIN"),
  refundPayment,
);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments (admin view, paginated)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       403:
 *         description: ADMIN role required
 */
router.get("/", Authenticate, authorizeRoles("ADMIN"), getAllPayments);

export default router;
