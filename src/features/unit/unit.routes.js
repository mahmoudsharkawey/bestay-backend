import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import {
  createUnit,
  deleteUnitById,
  getAllUnits,
  getUnitById,
  getMyUnits,
  searchUnitsByFilter,
  updateUnitById,
} from "./unit.controller.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";

const router = Router();

/**
 * @swagger
 * /units/all:
 *   get:
 *     summary: Retrieve all units (unpaginated, public)
 *     tags: [Units]
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
 *         description: Units retrieved successfully
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
 *                     units:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Unit'
 *                     total:
 *                       type: integer
 */
router.get("/all", getAllUnits);

/**
 * @swagger
 * /units:
 *   get:
 *     summary: Search and filter units (public)
 *     tags: [Units]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: university
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: roomType
 *         schema:
 *           type: string
 *           enum: [SINGLE, DOUBLE, SHARED]
 *       - in: query
 *         name: genderType
 *         schema:
 *           type: string
 *           enum: [MALE_ONLY, FEMALE_ONLY]
 *       - in: query
 *         name: facilities
 *         schema:
 *           type: string
 *         description: Comma-separated list of facilities
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Units retrieved successfully
 */
router.get("/", searchUnitsByFilter);

/**
 * @swagger
 * /units/my:
 *   get:
 *     summary: Get all units owned by the authenticated landlord
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Units retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — LANDLORD or ADMIN role required
 */
router.get(
  "/my",
  Authenticate,
  authorizeRoles("LANDLORD", "ADMIN"),
  getMyUnits,
);

/**
 * @swagger
 * /units/{id}:
 *   get:
 *     summary: Get a single unit by ID
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Unit retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Unit'
 *       404:
 *         description: Unit not found
 */
router.get("/:id", Authenticate, getUnitById);

/**
 * @swagger
 * /units:
 *   post:
 *     summary: Create a new rental unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, city, address, price, rooms, furnished, roomType, genderType]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *               university:
 *                 type: string
 *               price:
 *                 type: number
 *               rooms:
 *                 type: integer
 *               furnished:
 *                 type: boolean
 *               roomType:
 *                 type: string
 *                 enum: [SINGLE, DOUBLE, SHARED]
 *               genderType:
 *                 type: string
 *                 enum: [MALE_ONLY, FEMALE_ONLY]
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               ownerId:
 *                 type: string
 *                 description: Admin only — assign to a landlord
 *     responses:
 *       201:
 *         description: Unit created successfully
 *       403:
 *         description: Forbidden — LANDLORD or ADMIN role required
 *       409:
 *         description: Unit already exists at this address
 */
router.post("/", Authenticate, authorizeRoles("LANDLORD", "ADMIN"), createUnit);

/**
 * @swagger
 * /units/{id}:
 *   put:
 *     summary: Update a unit by ID
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *       404:
 *         description: Unit not found
 */
router.put(
  "/:id",
  Authenticate,
  authorizeRoles("LANDLORD", "ADMIN"),
  updateUnitById,
);

/**
 * @swagger
 * /units/{id}:
 *   delete:
 *     summary: Soft-delete a unit by ID
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Unit deleted successfully
 *       404:
 *         description: Unit not found
 *       409:
 *         description: Cannot delete unit with active bookings or visits
 */
router.delete(
  "/:id",
  Authenticate,
  authorizeRoles("LANDLORD", "ADMIN"),
  deleteUnitById,
);

export default router;
