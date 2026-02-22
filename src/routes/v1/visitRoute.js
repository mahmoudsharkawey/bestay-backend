import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import { createVisitSchema } from "../../validations/visitValidation.js";
import {
  createVisit,
  approveVisit,
  rejectVisit,
  proposeReschedule,
  acceptReschedule,
  rejectReschedule,
  cancelVisit,
  confirmVisit,
} from "../../controllers/visitController.js";
import { authorizeRoles } from "../../middlewares/roleMiddleware.js";

const router = Router();

////////////////////
// User routes
////////////////////

// User creates a visit request
router.post(
  "/",
  Authenticate,
  validate(createVisitSchema),
  authorizeRoles("USER"),
  createVisit,
);
// User cancels a visit (only before its proposed date)
router.post(
  "/:visitId/cancel",
  Authenticate,
  authorizeRoles("USER"),
  cancelVisit,
);
// User accepts a reschedule proposal from the owner
router.post(
  "/:visitId/reschedule/accept",
  Authenticate,
  authorizeRoles("USER"),
  acceptReschedule,
);
// User rejects a reschedule proposal from the owner
router.post(
  "/:visitId/reschedule/reject",
  Authenticate,
  authorizeRoles("USER"),
  rejectReschedule,
);

////////////////////
// Owner routes
///////////////////

// Owner approves a visit request
router.put(
  "/:visitId/approve",
  Authenticate,
  authorizeRoles("LANDLORD"),
  approveVisit,
);
// Owner rejects a visit request
router.post(
  "/:visitId/reject",
  Authenticate,
  authorizeRoles("LANDLORD"),
  rejectVisit,
);
// Owner proposes a new date for a visit
router.post(
  "/:visitId/reschedule",
  Authenticate,
  authorizeRoles("LANDLORD"),
  proposeReschedule,
);
// Owner confirms visit was completed (after proposed date, payment must be PAID)
router.post(
  "/:visitId/confirm",
  Authenticate,
  authorizeRoles("LANDLORD"),
  confirmVisit,
);

export default router;
