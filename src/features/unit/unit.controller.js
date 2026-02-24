import httpError from "../../utils/httpError.js";
import httpResponse from "../../utils/httpResponse.js";
import prisma from "../../prisma/client.js";
import * as unitService from "./unit.service.js";
import {
  validateUnitFields,
  validateUpdateUnitFields,
} from "./unit.validation.js";

// Returns a unit by id
export const createUnit = async (req, res, next) => {
  try {
    // Default to the current user if not an ADMIN or if no ownerId is provided
    if (req.user.role !== "ADMIN" || !req.body.ownerId) {
      req.body.ownerId = req.user.id;
    }

    validateUnitFields(req.body);

    // Validate that the assigned owner is actually a LANDLORD
    const owner = await prisma.user.findUnique({
      where: { id: req.body.ownerId },
      select: { role: true },
    });

    if (!owner || owner.role !== "LANDLORD") {
      const error = new Error("The assigned owner must be a LANDLORD");
      error.statusCode = 403;
      throw error;
    }

    const unit = await unitService.createUnit(req.body);

    httpResponse(req, res, 201, "Unit created successfully", unit);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};
// Returns a unit by id
export const getUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("Unit ID is required");
    }
    const unit = await unitService.getUnitById(id);
    httpResponse(req, res, 200, "Unit retrieved successfully", unit);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};
// Returns a unit by id
export const updateUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("Unit ID is required");
    }

    validateUpdateUnitFields(req.body);
    const unit = await unitService.updateUnitById(id, req.body);
    httpResponse(req, res, 200, "Unit updated successfully", unit);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};
// Returns a unit by id
export const deleteUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("Unit ID is required");
    }
    const deletedUnit = await unitService.deleteUnitById(id, req.user.id);
    httpResponse(req, res, 200, "Unit deleted successfully", deletedUnit);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};
// Returns all units
export const getAllUnits = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const units = await unitService.getAllUnits(page, limit);
    if (!units) {
      throw new Error("Units not found");
    }
    httpResponse(req, res, 200, "Units retrieved successfully", units);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};
// GET /units/my — all units owned by the authenticated landlord
export const getMyUnits = async (req, res, next) => {
  try {
    const units = await unitService.getMyUnits(req.user.id);
    httpResponse(req, res, 200, "Units retrieved successfully", units);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};
// Returns units by filter
export const searchUnitsByFilter = async (req, res, next) => {
  try {
    const {
      city,
      university,
      minPrice,
      maxPrice,
      roomType,
      genderType,
      facilities,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filters = {
      city,
      university,
      minPrice,
      maxPrice,
      roomType,
      genderType,
      facilities,
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder,
    };
    const units = await unitService.searchUnitsByFilter(filters);
    httpResponse(req, res, 200, "Units retrieved successfully", units);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};
