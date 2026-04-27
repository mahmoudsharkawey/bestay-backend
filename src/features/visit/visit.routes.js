import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import {
  createVisitSchema,
  proposeRescheduleSchema,
} from "./visit.validation.js";
import {
  createVisit,
  approveVisit,
  rejectVisit,
  proposeReschedule,
  acceptReschedule,
  rejectReschedule,
  cancelVisit,
  confirmVisit,
  getMyVisits,
  getVisitById,
} from "./visit.controller.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";

const router = Router();

////////////////////
// User routes
////////////////////

/**
 * @swagger
 * /visits/{unitId}:
 *   post:
 *     summary: User requests a visit to a unit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proposedDate]
 *             properties:
 *               proposedDate:
 *                 type: string
 *                 format: date-time
 *                 description: Requested visit date (ISO 8601)
 *     responses:
 *       201:
 *         description: Visit created successfully
 *       403:
 *         description: USER role required
 */
router.post(
  "/:unitId",
  Authenticate,
  validate(createVisitSchema),
  authorizeRoles("USER"),
  createVisit,
);

/**
 * @swagger
 * /visits/my:
 *   get:
 *     summary: Get all visits for the authenticated caller
 *     description: USER sees their own visits. LANDLORD sees visits on their units.
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visits fetched successfully
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
 *                     $ref: '#/components/schemas/Visit'
 */
router.get("/my", Authenticate, getMyVisits);

/**
 * @swagger
 * /visits/{visitId}:
 *   get:
 *     summary: Get a single visit's details
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Visit fetched successfully
 *       404:
 *         description: Visit not found
 */
router.get("/:visitId", Authenticate, getVisitById);

/**
 * @swagger
 * /visits/{visitId}/cancel:
 *   post:
 *     summary: User cancels a visit before its proposed date
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Visit cancelled successfully
 *       403:
 *         description: USER role required
 */
router.post(
  "/:visitId/cancel",
  Authenticate,
  authorizeRoles("USER"),
  cancelVisit,
);

/**
 * @swagger
 * /visits/{visitId}/reschedule/accept:
 *   post:
 *     summary: User accepts the landlord's reschedule proposal
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reschedule accepted successfully
 */
router.post(
  "/:visitId/reschedule/accept",
  Authenticate,
  authorizeRoles("USER"),
  acceptReschedule,
);

/**
 * @swagger
 * /visits/{visitId}/reschedule/reject:
 *   post:
 *     summary: User rejects the landlord's reschedule proposal
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reschedule rejected successfully
 */
router.post(
  "/:visitId/reschedule/reject",
  Authenticate,
  authorizeRoles("USER"),
  rejectReschedule,
);

////////////////////
// Owner routes
///////////////////

/**
 * @swagger
 * /visits/{visitId}/approve:
 *   put:
 *     summary: Landlord approves a pending visit request
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Visit approved successfully
 *       403:
 *         description: LANDLORD role required
 */
router.put(
  "/:visitId/approve",
  Authenticate,
  authorizeRoles("LANDLORD"),
  approveVisit,
);

/**
 * @swagger
 * /visits/{visitId}/reject:
 *   post:
 *     summary: Landlord rejects a pending visit request
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Visit rejected successfully
 */
router.post(
  "/:visitId/reject",
  Authenticate,
  authorizeRoles("LANDLORD"),
  rejectVisit,
);

/**
 * @swagger
 * /visits/{visitId}/reschedule:
 *   post:
 *     summary: Landlord proposes a new date for the visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newDate]
 *             properties:
 *               newDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Reschedule proposed successfully
 */
router.post(
  "/:visitId/reschedule",
  Authenticate,
  validate(proposeRescheduleSchema),
  authorizeRoles("LANDLORD"),
  proposeReschedule,
);

/**
 * @swagger
 * /visits/{visitId}/confirm:
 *   post:
 *     summary: Landlord confirms the visit was physically completed
 *     description: The visit must be APPROVED and payment must be PAID before confirmation.
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Visit confirmed successfully
 */
router.post(
  "/:visitId/confirm",
  Authenticate,
  authorizeRoles("LANDLORD"),
  confirmVisit,
);

export default router;
