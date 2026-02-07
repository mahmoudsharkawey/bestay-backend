import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import {
  createUnit,
  deleteUnitById,
  getAllUnits,
  getUnitById,
  searchUnitsByFilter,
  updateUnitById,
} from "../../controllers/unitController.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";

const router = Router();

// GET /api/v1/units/all - Retrieve all units (public access)
router.get("/all", getAllUnits);

// GET /api/v1/units - Search units with filters (public access)
router.get("/", searchUnitsByFilter);

// GET /api/v1/units/:id - Get a specific unit by ID
router.get("/:id", Authenticate, getUnitById);

// POST /api/v1/units - Create a new unit
// Requires authentication and LANDLORD or ADMIN role
router.post("/", Authenticate, authorizeRoles("LANDLORD", "ADMIN"), createUnit);

// PUT /api/v1/units/:id - Update an existing unit by ID
// Requires authentication and LANDLORD or ADMIN role
router.put(
  "/:id",
  Authenticate,
  authorizeRoles("LANDLORD", "ADMIN"),
  updateUnitById,
);

// DELETE /api/v1/units/:id - Delete a unit by ID
// Requires authentication and LANDLORD or ADMIN role
router.delete(
  "/:id",
  Authenticate,
  authorizeRoles("LANDLORD", "ADMIN"),
  deleteUnitById,
);

export default router;
