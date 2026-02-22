import prisma from "../prisma/client.js";
import { VisitRequestHTML } from "../utils/HTMLforEmails.js";
import { sendEmail } from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

// Creates a new visit request for a unit
export const createVisit = async ({ userId, unitId, proposedDate }) => {
  // Parse and validate proposed date
  const proposedDateObj = new Date(proposedDate);
  const now = new Date();

  // Add 1 hour buffer to ensure date is meaningfully in the future
  const minimumDate = new Date(now.getTime() + 60 * 60 * 1000);

  if (proposedDateObj < minimumDate) {
    const error = new Error(
      "Proposed date must be at least 1 hour in the future",
    );
    error.statusCode = 400;
    throw error;
  }

  // Check if user has an active/pending visit for this unit
  const activeStatuses = [
    "PENDING_OWNER",
    "APPROVED",
    "RESCHEDULE_PROPOSED",
    "CONFIRMED",
  ];
  const existingActiveVisit = await prisma.visit.findFirst({
    where: {
      userId,
      unitId,
      status: { in: activeStatuses },
    },
  });

  if (existingActiveVisit) {
    const error = new Error(
      `You already have an active visit request for this unit (Status: ${existingActiveVisit.status})`,
    );
    error.statusCode = 409;
    throw error;
  }

  // Fetch unit with owner data in a single query
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!unit) {
    const error = new Error(`Unit with ID ${unitId} not found`);
    error.statusCode = 404;
    throw error;
  }

  if (!unit.isAvailable) {
    const error = new Error(`Unit "${unit.title}" is not available for visits`);
    error.statusCode = 400;
    throw error;
  }

  // Check for time slot conflicts (within 2 hours of proposed date)
  const twoHoursBefore = new Date(
    proposedDateObj.getTime() - 2 * 60 * 60 * 1000,
  );
  const twoHoursAfter = new Date(
    proposedDateObj.getTime() + 2 * 60 * 60 * 1000,
  );

  const conflictingVisit = await prisma.visit.findFirst({
    where: {
      unitId,
      status: { in: activeStatuses },
      proposedDate: {
        gte: twoHoursBefore,
        lte: twoHoursAfter,
      },
    },
  });

  if (conflictingVisit) {
    const error = new Error(
      `There is already a visit scheduled for this unit within 2 hours of your proposed time`,
    );
    error.statusCode = 409;
    throw error;
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    const error = new Error(`User with ID ${userId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Use transaction to ensure atomicity
  let visit;
  try {
    visit = await prisma.$transaction(async (tx) => {
      // Create visit
      const newVisit = await tx.visit.create({
        data: {
          userId,
          unitId,
          proposedDate: proposedDateObj,
          status: "PENDING_OWNER",
          rescheduleCount: 0, // Initialize to 0, will increment on reschedule
        },
      });

      // Create notification for owner
      await tx.notification.create({
        data: {
          userId: unit.owner.id,
          type: "VISIT_REQUEST",
          message: `You have a new visit request from ${user.name} for "${unit.title}"`,
        },
      });

      return newVisit;
    });
  } catch (error) {
    logger.error("Failed to create visit in transaction", {
      userId,
      unitId,
      error: error.message,
    });
    const err = new Error("Failed to create visit. Please try again");
    err.statusCode = 500;
    throw err;
  }

  // Send email asynchronously (non-blocking)
  // Email failure should not prevent visit creation
  const emailPromise = sendEmail(
    unit.owner.email,
    "New Visit Request",
    `You have a new visit request from ${user.name} for unit "${unit.title}"`,
    VisitRequestHTML(user, unit, proposedDateObj),
  ).catch((emailError) => {
    logger.error("Failed to send visit request email", {
      visitId: visit.id,
      ownerEmail: unit.owner.email,
      error: emailError.message,
    });
    // Don't throw - email failure shouldn't fail the visit creation
  });

  // Don't await email - let it send in background
  // But log if it fails
  emailPromise.then((result) => {
    if (result) {
      logger.info("Visit request email sent successfully", {
        visitId: visit.id,
        ownerEmail: unit.owner.email,
      });
    }
  });

  return visit;
};

// Approves a visit request by owner
export const approveVisit = async (visitId, ownerId) => {
  // 1. Fetch visit with unit data to verify ownership
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      unit: {
        select: { ownerId: true, title: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 2. Check if visit exists
  if (!visit) {
    const error = new Error(`Visit with ID ${visitId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify ownership
  if (visit.unit.ownerId !== ownerId) {
    const error = new Error("You are not authorized to approve this visit");
    error.statusCode = 403;
    throw error;
  }

  // 4. Check if visit is in correct status
  if (visit.status !== "PENDING_OWNER") {
    const error = new Error(
      `Cannot approve visit with status ${visit.status}. Only pending visits can be approved`,
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Update visit and create notification in transaction
  let updatedVisit;
  try {
    updatedVisit = await prisma.$transaction(async (tx) => {
      // Update visit status
      const approved = await tx.visit.update({
        where: { id: visitId },
        data: { status: "APPROVED" },
      });

      // Notify user
      await tx.notification.create({
        data: {
          userId: visit.user.id,
          type: "VISIT_APPROVED",
          message: `Your visit request for "${visit.unit.title}" has been approved`,
        },
      });

      return approved;
    });
  } catch (error) {
    logger.error("Failed to approve visit in transaction", {
      visitId,
      ownerId,
      error: error.message,
    });
    const err = new Error("Failed to approve visit. Please try again");
    err.statusCode = 500;
    throw err;
  }

  // 6. Send email to user (non-blocking)
  sendEmail(
    visit.user.email,
    "Visit Request Approved",
    `Your visit request for "${visit.unit.title}" has been approved`,
    // يمكنك إنشاء HTML template للإيميل
    `<p>Good news! Your visit request has been approved.</p>`,
  ).catch((emailError) => {
    logger.error("Failed to send visit approval email", {
      visitId,
      userEmail: visit.user.email,
      error: emailError.message,
    });
  });

  return updatedVisit;
};
// Rejects a visit request by owner
export const rejectVisit = async (visitId, ownerId) => {
  // 1. Fetch visit with unit data to verify ownership
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      unit: {
        select: { ownerId: true, title: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 2. Check if visit exists
  if (!visit) {
    const error = new Error(`Visit with ID ${visitId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify ownership
  if (visit.unit.ownerId !== ownerId) {
    const error = new Error("You are not authorized to reject this visit");
    error.statusCode = 403;
    throw error;
  }

  // 4. Check if visit is in a rejectable status
  if (visit.status !== "PENDING_OWNER") {
    const error = new Error(
      `Cannot reject visit with status ${visit.status}. Only pending visits can be rejected`,
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Update visit and create notification in transaction
  let updatedVisit;
  try {
    updatedVisit = await prisma.$transaction(async (tx) => {
      // Update visit status
      const rejected = await tx.visit.update({
        where: { id: visitId },
        data: { status: "REJECTED_BY_OWNER" },
      });

      // Notify user
      await tx.notification.create({
        data: {
          userId: visit.user.id,
          type: "VISIT_REJECTED",
          message: `Your visit request for "${visit.unit.title}" has been rejected by the owner`,
        },
      });

      return rejected;
    });
  } catch (error) {
    logger.error("Failed to reject visit in transaction", {
      visitId,
      ownerId,
      error: error.message,
    });
    const err = new Error("Failed to reject visit. Please try again");
    err.statusCode = 500;
    throw err;
  }

  // 6. Send email to user (non-blocking)
  sendEmail(
    visit.user.email,
    "Visit Request Rejected",
    `Your visit request for "${visit.unit.title}" has been rejected by the owner`,
    `<p>Unfortunately, your visit request for "${visit.unit.title}" has been rejected by the owner.</p>`,
  ).catch((emailError) => {
    logger.error("Failed to send visit rejection email", {
      visitId,
      userEmail: visit.user.email,
      error: emailError.message,
    });
  });

  return updatedVisit;
};

// Owner proposes a new date for a visit (reschedule)
export const proposeReschedule = async (visitId, ownerId, newDate) => {
  // 1. Parse and validate the new proposed date
  const newDateObj = new Date(newDate);
  const minimumDate = new Date(Date.now() + 60 * 60 * 1000); // at least 1 hour ahead

  if (isNaN(newDateObj.getTime())) {
    const error = new Error("Invalid date format");
    error.statusCode = 400;
    throw error;
  }

  if (newDateObj < minimumDate) {
    const error = new Error(
      "Proposed reschedule date must be at least 1 hour in the future",
    );
    error.statusCode = 400;
    throw error;
  }

  // 2. Fetch visit with unit and visitor data
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      unit: {
        select: { ownerId: true, title: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 3. Check if visit exists
  if (!visit) {
    const error = new Error(`Visit with ID ${visitId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 4. Verify ownership
  if (visit.unit.ownerId !== ownerId) {
    const error = new Error("You are not authorized to reschedule this visit");
    error.statusCode = 403;
    throw error;
  }

  // 5. Only PENDING_OWNER visits can be rescheduled by owner
  if (visit.status !== "PENDING_OWNER") {
    const error = new Error(
      `Cannot reschedule a visit with status ${visit.status}. Only pending visits can be rescheduled`,
    );
    error.statusCode = 400;
    throw error;
  }

  // 5b. Enforce reschedule limit: max 2 reschedules allowed
  if (visit.rescheduleCount >= 2) {
    const error = new Error(
      "Reschedule limit reached. This visit has already been rescheduled 2 times",
    );
    error.statusCode = 400;
    throw error;
  }

  // 6. Update visit and create notification in transaction
  let updatedVisit;
  try {
    updatedVisit = await prisma.$transaction(async (tx) => {
      const rescheduled = await tx.visit.update({
        where: { id: visitId },
        data: {
          status: "RESCHEDULE_PROPOSED",
          pendingDate: newDateObj, // stored temporarily; proposedDate unchanged
          rescheduleCount: { increment: 1 },
        },
      });

      // Notify visitor
      await tx.notification.create({
        data: {
          userId: visit.user.id,
          type: "VISIT_RESCHEDULED",
          message: `The owner has proposed a new date for your visit to "${visit.unit.title}"`,
        },
      });

      return rescheduled;
    });
  } catch (error) {
    logger.error("Failed to propose reschedule in transaction", {
      visitId,
      ownerId,
      error: error.message,
    });
    error.statusCode = error.statusCode || 500;
    throw error;
  }

  // 7. Send email to visitor (non-blocking)
  sendEmail(
    visit.user.email,
    "Visit Reschedule Proposed",
    `The owner has proposed a new date for your visit to "${visit.unit.title}"`,
    `<p>The owner has proposed a new visit date for "<strong>${visit.unit.title}</strong>": <strong>${newDateObj.toUTCString()}</strong>. Please log in to confirm or decline.</p>`,
  ).catch((emailError) => {
    logger.error("Failed to send visit reschedule email", {
      visitId,
      userEmail: visit.user.email,
      error: emailError.message,
    });
  });

  return updatedVisit;
};

// User accepts a reschedule proposal from the owner
export const acceptReschedule = async (visitId, userId) => {
  // 1. Fetch visit with unit and user data
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      unit: {
        select: {
          ownerId: true,
          title: true,
          owner: { select: { email: true } },
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 2. Check if visit exists
  if (!visit) {
    const error = new Error(`Visit with ID ${visitId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify the requesting user owns this visit
  if (visit.user.id !== userId) {
    const error = new Error("You are not authorized to accept this reschedule");
    error.statusCode = 403;
    throw error;
  }

  // 4. Only visits with RESCHEDULE_PROPOSED status can be accepted
  if (visit.status !== "RESCHEDULE_PROPOSED") {
    const error = new Error(
      `Cannot accept reschedule for a visit with status ${visit.status}. Only visits with a pending reschedule proposal can be accepted`,
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Move pendingDate → proposedDate and set status to APPROVED
  if (!visit.pendingDate) {
    const error = new Error("No pending reschedule date found for this visit");
    error.statusCode = 400;
    throw error;
  }

  let updatedVisit;
  try {
    updatedVisit = await prisma.$transaction(async (tx) => {
      const accepted = await tx.visit.update({
        where: { id: visitId },
        data: {
          status: "APPROVED",
          proposedDate: visit.pendingDate, // apply the owner's proposed date now
          pendingDate: null, // clear the temporary field
        },
      });

      // Notify owner
      await tx.notification.create({
        data: {
          userId: visit.unit.ownerId,
          type: "VISIT_APPROVED",
          message: `${visit.user.name} has accepted your reschedule proposal for "${visit.unit.title}"`,
        },
      });

      return accepted;
    });
  } catch (error) {
    logger.error("Failed to accept reschedule in transaction", {
      visitId,
      userId,
      error: error.message,
    });
    const err = new Error("Failed to accept reschedule. Please try again");
    err.statusCode = 500;
    throw err;
  }

  // 6. Send email to owner (non-blocking)
  sendEmail(
    visit.unit.owner.email,
    "Reschedule Accepted",
    `${visit.user.name} has accepted the reschedule for "${visit.unit.title}"`,
    `<p><strong>${visit.user.name}</strong> has accepted your proposed reschedule for "<strong>${visit.unit.title}</strong>". The visit is now approved for the proposed date.</p>`,
  ).catch((emailError) => {
    logger.error("Failed to send reschedule acceptance email", {
      visitId,
      ownerEmail: visit.unit.owner.email,
      error: emailError.message,
    });
  });

  return updatedVisit;
};

// User rejects a reschedule proposal from the owner
export const rejectReschedule = async (visitId, userId) => {
  // 1. Fetch visit with unit and owner data
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      unit: {
        select: {
          ownerId: true,
          title: true,
          owner: { select: { email: true } },
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 2. Check if visit exists
  if (!visit) {
    const error = new Error(`Visit with ID ${visitId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify the requesting user owns this visit
  if (visit.user.id !== userId) {
    const error = new Error("You are not authorized to reject this reschedule");
    error.statusCode = 403;
    throw error;
  }

  // 4. Only visits with RESCHEDULE_PROPOSED status can be rejected
  if (visit.status !== "RESCHEDULE_PROPOSED") {
    const error = new Error(
      `Cannot reject reschedule for a visit with status ${visit.status}. Only visits with a pending reschedule proposal can be rejected`,
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Update status to REJECTED_BY_USER in transaction + notify owner
  let updatedVisit;
  try {
    updatedVisit = await prisma.$transaction(async (tx) => {
      const rejected = await tx.visit.update({
        where: { id: visitId },
        data: { status: "REJECTED_BY_USER" },
      });

      // Notify owner
      await tx.notification.create({
        data: {
          userId: visit.unit.ownerId,
          type: "VISIT_REJECTED",
          message: `${visit.user.name} has rejected your reschedule proposal for "${visit.unit.title}"`,
        },
      });

      return rejected;
    });
  } catch (error) {
    logger.error("Failed to reject reschedule in transaction", {
      visitId,
      userId,
      error: error.message,
    });
    const err = new Error("Failed to reject reschedule. Please try again");
    err.statusCode = 500;
    throw err;
  }

  // 6. Send email to owner (non-blocking)
  sendEmail(
    visit.unit.owner.email,
    "Reschedule Rejected",
    `${visit.user.name} has rejected your reschedule proposal for "${visit.unit.title}"`,
    `<p><strong>${visit.user.name}</strong> has rejected your proposed reschedule for "<strong>${visit.unit.title}</strong>". The visit is now closed.</p>`,
  ).catch((emailError) => {
    logger.error("Failed to send reschedule rejection email", {
      visitId,
      ownerEmail: visit.unit.owner.email,
      error: emailError.message,
    });
  });

  return updatedVisit;
};
// User cancels a visit before the proposed date
export const cancelVisit = async (visitId, userId) => {
  // 1. Fetch visit with unit and owner data
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      unit: {
        select: {
          ownerId: true,
          title: true,
          owner: { select: { email: true } },
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 2. Check if visit exists
  if (!visit) {
    const error = new Error(`Visit with ID ${visitId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify the requesting user owns this visit
  if (visit.user.id !== userId) {
    const error = new Error("You are not authorized to cancel this visit");
    error.statusCode = 403;
    throw error;
  }

  // 4. Only cancellable statuses are allowed
  const cancellableStatuses = [
    "PENDING_OWNER",
    "APPROVED",
    "RESCHEDULE_PROPOSED",
  ];
  if (!cancellableStatuses.includes(visit.status)) {
    const error = new Error(
      `Cannot cancel a visit with status ${visit.status}`,
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Must cancel before the proposed date
  const now = new Date();
  if (now >= visit.proposedDate) {
    const error = new Error(
      "Cannot cancel a visit after its proposed date and time has passed",
    );
    error.statusCode = 400;
    throw error;
  }

  // 6. Update visit status and notify owner in a transaction
  let updatedVisit;
  try {
    updatedVisit = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.visit.update({
        where: { id: visitId },
        data: { status: "CANCELLED_BY_USER" },
      });

      // Notify owner
      await tx.notification.create({
        data: {
          userId: visit.unit.ownerId,
          type: "VISIT_CANCELLED",
          message: `${visit.user.name} has cancelled their visit request for "${visit.unit.title}"`,
        },
      });

      return cancelled;
    });
  } catch (error) {
    logger.error("Failed to cancel visit in transaction", {
      visitId,
      userId,
      error: error.message,
    });
    const err = new Error("Failed to cancel visit. Please try again");
    err.statusCode = 500;
    throw err;
  }

  // 7. Send email to owner (non-blocking)
  sendEmail(
    visit.unit.owner.email,
    "Visit Cancelled",
    `${visit.user.name} has cancelled their visit request for "${visit.unit.title}"`,
    `<p><strong>${visit.user.name}</strong> has cancelled their visit request for "<strong>${visit.unit.title}</strong>".</p>`,
  ).catch((emailError) => {
    logger.error("Failed to send visit cancellation email", {
      visitId,
      ownerEmail: visit.unit.owner.email,
      error: emailError.message,
    });
  });

  return updatedVisit;
};

// Owner confirms a visit was completed (after proposed date + payment verified)
export const confirmVisit = async (visitId, ownerId) => {
  // 1. Fetch visit with unit, visitor, and payment data
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      unit: {
        select: { ownerId: true, title: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
      payment: true,
    },
  });

  // 2. Check if visit exists
  if (!visit) {
    const error = new Error(`Visit with ID ${visitId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify ownership
  if (visit.unit.ownerId !== ownerId) {
    const error = new Error("You are not authorized to confirm this visit");
    error.statusCode = 403;
    throw error;
  }

  // 4. Only APPROVED visits can be confirmed
  if (visit.status !== "APPROVED") {
    const error = new Error(
      `Cannot confirm a visit with status ${visit.status}. Only APPROVED visits can be confirmed`,
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. The proposed date must have already passed
  const now = new Date();
  if (now < visit.proposedDate) {
    const error = new Error(
      "Cannot confirm a visit before its proposed date and time",
    );
    error.statusCode = 400;
    throw error;
  }

  // 6. The payment must be in PAID status
  const payment = visit.payment;
  if (!payment || payment.status !== "PAID") {
    const error = new Error(
      "Cannot confirm visit: payment has not been completed",
    );
    error.statusCode = 400;
    throw error;
  }

  // 7. Update visit status and notify visitor in a transaction
  let updatedVisit;
  try {
    updatedVisit = await prisma.$transaction(async (tx) => {
      const confirmed = await tx.visit.update({
        where: { id: visitId },
        data: { status: "CONFIRMED" },
      });

      // Notify the visitor
      await tx.notification.create({
        data: {
          userId: visit.user.id,
          type: "VISIT_CONFIRMED",
          message: `Your visit to "${visit.unit.title}" has been confirmed by the owner`,
        },
      });

      return confirmed;
    });
  } catch (error) {
    logger.error("Failed to confirm visit in transaction", {
      visitId,
      ownerId,
      error: error.message,
    });
    const err = new Error("Failed to confirm visit. Please try again");
    err.statusCode = 500;
    throw err;
  }

  // 8. Send email to visitor (non-blocking)
  sendEmail(
    visit.user.email,
    "Visit Confirmed",
    `Your visit to "${visit.unit.title}" has been confirmed`,
    `<p>Great news! The owner has confirmed that your visit to "<strong>${visit.unit.title}</strong>" was completed successfully.</p>`,
  ).catch((emailError) => {
    logger.error("Failed to send visit confirmation email", {
      visitId,
      userEmail: visit.user.email,
      error: emailError.message,
    });
  });

  return updatedVisit;
};
