import httpResponse from "../../utils/httpResponse.js";
import httpError from "../../utils/httpError.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

// POST /uploads — Upload one or multiple images
export const uploadImages = async (req, res, next) => {
  try {
    const { context } = req.body; // e.g., "user_avatar", "unit_images"
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return httpError(next, new Error("No files uploaded"), req, 400);
    }

    const folderContext = context || "general";

    // Upload all files concurrently
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file.buffer, folderContext),
    );

    const urls = await Promise.all(uploadPromises);

    httpResponse(req, res, 201, "files uploaded successfully", { urls });
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
};
