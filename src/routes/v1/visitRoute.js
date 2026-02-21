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
} from "../../controllers/visitController.js";

const router = Router();

////////////////////
// User routes
////////////////////

// User creates a visit request
router.post("/", Authenticate, validate(createVisitSchema), createVisit);
// User accepts a reschedule proposal from the owner
router.post("/:visitId/reschedule/accept", Authenticate, acceptReschedule);
// User rejects a reschedule proposal from the owner
router.post("/:visitId/reschedule/reject", Authenticate, rejectReschedule);

////////////////////
// Owner routes
///////////////////

// Owner approves a visit request
router.put("/:visitId/approve", Authenticate, approveVisit);
// Owner rejects a visit request
router.post("/:visitId/reject", Authenticate, rejectVisit);
// Owner proposes a new date for a visit
router.post("/:visitId/reschedule", Authenticate, proposeReschedule);

export default router;
