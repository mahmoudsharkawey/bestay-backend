import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock cloudinary utility
const mockUploadToCloudinary = vi.fn();
vi.mock("../../../utils/cloudinary.js", () => ({
  uploadToCloudinary: (...args) => mockUploadToCloudinary(...args),
}));

// Import controller after mocks
import { uploadImages } from "../upload.controller.js";

beforeEach(() => vi.clearAllMocks());

// Helper to create mock req/res/next
const createMocks = (overrides = {}) => {
  const req = {
    body: { context: "unit_images" },
    files: [],
    file: null,
    ...overrides,
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
};

describe("uploadImages controller", () => {
  it("uploads multiple files and returns URLs", async () => {
    mockUploadToCloudinary
      .mockResolvedValueOnce("https://cdn.example.com/img1.jpg")
      .mockResolvedValueOnce("https://cdn.example.com/img2.jpg");

    const { req, res, next } = createMocks({
      files: [
        { buffer: Buffer.from("img1"), originalname: "img1.jpg" },
        { buffer: Buffer.from("img2"), originalname: "img2.jpg" },
      ],
    });

    await uploadImages(req, res, next);

    expect(mockUploadToCloudinary).toHaveBeenCalledTimes(2);
    expect(mockUploadToCloudinary).toHaveBeenCalledWith(
      expect.any(Buffer),
      "unit_images",
    );
    // httpResponse was called — verify next was not called with an error
    expect(next).not.toHaveBeenCalled();
  });

  it("uses 'general' as default context when not provided", async () => {
    mockUploadToCloudinary.mockResolvedValue("https://cdn.example.com/img.jpg");

    const { req, res, next } = createMocks({
      body: {}, // no context
      files: [{ buffer: Buffer.from("img"), originalname: "img.jpg" }],
    });

    await uploadImages(req, res, next);

    expect(mockUploadToCloudinary).toHaveBeenCalledWith(
      expect.any(Buffer),
      "general",
    );
  });

  it("calls next with error when no files uploaded", async () => {
    const { req, res, next } = createMocks({
      files: [],
      file: null,
    });

    await uploadImages(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][1] || next.mock.calls[0][0];
    expect(error).toBeDefined();
  });

  it("handles single file via req.file", async () => {
    mockUploadToCloudinary.mockResolvedValue("https://cdn.example.com/img.jpg");

    const { req, res, next } = createMocks({
      files: null,
      file: { buffer: Buffer.from("single"), originalname: "solo.jpg" },
    });

    await uploadImages(req, res, next);

    expect(mockUploadToCloudinary).toHaveBeenCalledTimes(1);
  });

  it("calls next with error when cloudinary fails", async () => {
    mockUploadToCloudinary.mockRejectedValue(new Error("Cloudinary down"));

    const { req, res, next } = createMocks({
      files: [{ buffer: Buffer.from("img"), originalname: "img.jpg" }],
    });

    await uploadImages(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
