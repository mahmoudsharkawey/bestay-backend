import { Router } from "express";
import { uploadImages } from "./upload.controller.js";
import { upload } from "../../middlewares/uploadMiddleware.js";
import { Authenticate } from "../../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * /uploads:
 *   post:
 *     summary: Upload one or more images
 *     description: Images are stored on Cloudinary. The returned URLs can then be used in unit creation or profile updates.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 10 image files
 *               context:
 *                 type: string
 *                 description: "Cloudinary folder context (e.g. user_avatar, unit_images)"
 *                 default: general
 *     responses:
 *       201:
 *         description: Images uploaded successfully
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
 *                     urls:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *       401:
 *         description: Unauthorized
 */
router.post("/", Authenticate, upload.array("files", 10), uploadImages);

export default router;
