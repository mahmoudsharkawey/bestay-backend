import httpError from "../../utils/httpError.js";
import httpResponse from "../../utils/httpResponse.js";
import * as Visits from "./visit.service.js";

// Creates a new visit request for a unit
export const createVisit = async (req, res, next) => {
  try {
    const { userId, unitId, proposedDate } = req.body;
    const visit = await Visits.createVisit({ userId, unitId, proposedDate });
    return httpResponse(req, res, 201, "Visit created successfully", visit);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};
// Approves a visit request by owner
export const approveVisit = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const visit = await Visits.approveVisit(visitId, req.user.id);
    return httpResponse(req, res, 200, "Visit approved successfully", visit);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};
// Rejects a visit request by owner
export const rejectVisit = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const visit = await Visits.rejectVisit(visitId, req.user.id);
    return httpResponse(req, res, 200, "Visit rejected successfully", visit);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};
// Owner proposes a new date for a visit (reschedule)
export const proposeReschedule = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const { newDate } = req.body;
    const visit = await Visits.proposeReschedule(visitId, req.user.id, newDate);
    return httpResponse(
      req,
      res,
      200,
      "Reschedule proposed successfully",
      visit,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};
// User accepts a reschedule proposal from the owner
export const acceptReschedule = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const visit = await Visits.acceptReschedule(visitId, req.user.id);
    return httpResponse(
      req,
      res,
      200,
      "Reschedule accepted successfully",
      visit,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};
// User rejects a reschedule proposal from the owner
export const rejectReschedule = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const visit = await Visits.rejectReschedule(visitId, req.user.id);
    return httpResponse(
      req,
      res,
      200,
      "Reschedule rejected successfully",
      visit,
    );
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};
// User cancels a visit before its proposed date
export const cancelVisit = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const visit = await Visits.cancelVisit(visitId, req.user.id);
    return httpResponse(req, res, 200, "Visit cancelled successfully", visit);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};
// Owner confirms a visit was completed after the proposed date
export const confirmVisit = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const visit = await Visits.confirmVisit(visitId, req.user.id);
    return httpResponse(req, res, 200, "Visit confirmed successfully", visit);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};

// GET /visits/my — all visits for the authenticated user or landlord
export const getMyVisits = async (req, res, next) => {
  try {
    const visits = await Visits.getMyVisits(req.user.id, req.user.role);
    return httpResponse(req, res, 200, "Visits fetched successfully", visits);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};

// GET /visits/:visitId — single visit detail (user or landlord)
export const getVisitById = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const visit = await Visits.getVisitById(
      visitId,
      req.user.id,
      req.user.role,
    );
    return httpResponse(req, res, 200, "Visit fetched successfully", visit);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return httpError(next, error, req, statusCode);
  }
};
