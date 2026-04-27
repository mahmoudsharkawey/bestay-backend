import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { getAllBookings } from "./booking.controller.js";

const router = Router();

/**
 * @swagger
 * /bookings/my:
 *   get:
 *     summary: Get all bookings for the authenticated caller
 *     description: USER sees their own bookings. LANDLORD sees bookings on their units.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
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
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 */
router.get("/my", Authenticate, getAllBookings);

export default router;
