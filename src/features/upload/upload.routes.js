import { Router } from "express";
import { uploadImages } from "./upload.controller.js";
import { upload } from "../../middlewares/uploadMiddleware.js";
import { Authenticate } from "../../middlewares/authMiddleware.js";

const router = Router();

// POST /api/v1/uploads — Upload generic images with multi-use context
// 'files' can be a field for multiple files (e.g. up to 10 images)
router.post("/", Authenticate, upload.array("files", 10), uploadImages);

export default router;
