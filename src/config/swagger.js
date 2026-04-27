import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BeStay API",
      version: "1.0.0",
      description:
        "RESTful API for BeStay — a student housing platform with AI-powered recommendations and pricing analysis.",
      contact: {
        name: "BeStay Team",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "Enter your JWT token directly (no Bearer prefix)",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            statusCode: { type: "integer", example: 400 },
            message: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            role: {
              type: "string",
              enum: ["USER", "LANDLORD", "ADMIN"],
            },
            picture: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Unit: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            city: { type: "string" },
            address: { type: "string" },
            rooms: { type: "integer" },
            furnished: { type: "boolean" },
            university: { type: "string", nullable: true },
            distance: { type: "number", nullable: true },
            roomType: {
              type: "string",
              enum: ["SINGLE", "DOUBLE", "SHARED"],
            },
            genderType: {
              type: "string",
              enum: ["MALE_ONLY", "FEMALE_ONLY"],
            },
            facilities: {
              type: "array",
              items: { type: "string" },
            },
            images: {
              type: "array",
              items: { type: "string" },
            },
            ownerId: { type: "string", format: "uuid" },
            averageRating: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Visit: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            unitId: { type: "string", format: "uuid" },
            proposedDate: { type: "string", format: "date-time" },
            status: {
              type: "string",
              enum: [
                "PENDING_OWNER",
                "APPROVED",
                "REJECTED_BY_OWNER",
                "RESCHEDULE_PROPOSED",
                "REJECTED_BY_USER",
                "CANCELLED_BY_USER",
                "CANCELLED_BY_OWNER",
                "REFUNDED",
                "CONFIRMED",
              ],
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            unitId: { type: "string", format: "uuid" },
            visitId: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: ["CONFIRMED", "BOOKED", "CANCELLED"],
            },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            visitId: { type: "string", format: "uuid" },
            amount: { type: "integer", description: "Amount in smallest currency unit (piastres/cents)" },
            status: {
              type: "string",
              enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED", "PENDING_REFUND"],
            },
            stripeIntentId: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            comment: { type: "string", nullable: true },
            userId: { type: "string", format: "uuid" },
            unitId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Favorite: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            unitId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            type: { type: "string" },
            message: { type: "string" },
            isRead: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        UserPreference: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            unitType: {
              type: "string",
              enum: ["ROOM", "APARTMENT", "STUDIO"],
            },
            minBudget: { type: "number" },
            maxBudget: { type: "number" },
            city: { type: "string" },
            university: { type: "string", nullable: true },
            maxDistance: { type: "number", nullable: true },
            rooms: { type: "integer" },
            furnished: { type: "boolean" },
            genderType: {
              type: "string",
              enum: ["MALE_ONLY", "FEMALE_ONLY"],
            },
            facilities: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User profile management" },
      { name: "Units", description: "Rental unit operations" },
      { name: "Bookings", description: "Booking management" },
      { name: "Visits", description: "Visit scheduling & lifecycle" },
      { name: "Payments", description: "Payment processing (Stripe)" },
      { name: "Reviews", description: "Unit reviews & ratings" },
      { name: "Favorites", description: "User favorites" },
      { name: "Notifications", description: "User notifications" },
      { name: "Uploads", description: "File uploads (Cloudinary)" },
      { name: "User Preferences", description: "User preference management" },
      { name: "AI Recommendations", description: "AI-powered unit recommendations" },
      { name: "AI Pricing", description: "AI-powered pricing analysis" },
    ],
  },
  apis: ["./src/features/**/*.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
