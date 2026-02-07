import httpError from "../utils/httpError.js";
import httpResponse from "../utils/httpResponse.js";
import * as unitService from "../services/unitService.js";
import { validateUnitFields } from "../validations/unitValidation.js";

export const createUnit = async (req, res, next) => {
  try {
    validateUnitFields(req.body);

    const unit = await unitService.createUnit(req.body);

    httpResponse(req, res, 201, "Unit created successfully", unit);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

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

export const updateUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("Unit ID is required");
    }

    validateUnitFields(req.body);
    const unit = await unitService.updateUnitById(id, req.body);
    httpResponse(req, res, 200, "Unit updated successfully", unit);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

export const deleteUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("Unit ID is required");
    }
    const deletedUnit = await unitService.deleteUnitById(id);
    httpResponse(req, res, 200, "Unit deleted successfully", deletedUnit);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

export const getAllUnits = async (req, res, next) => {
  try {
    const units = await unitService.getAllUnits();
    if (!units) {
      throw new Error("Units hihik not found");
    }
    httpResponse(req, res, 200, "Units retrieved successfully", units);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};

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
    };
    const units = await unitService.searchUnitsByFilter(filters);
    httpResponse(req, res, 200, "Units retrieved successfully", units);
  } catch (error) {
    httpError(next, error, req, 500);
  }
};
