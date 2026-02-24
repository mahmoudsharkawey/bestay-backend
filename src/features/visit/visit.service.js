import prisma from "../../prisma/client.js";
import {
  VisitRequestHTML,
  VisitApprovedHTML,
  VisitRejectedHTML,
  RescheduleProposedHTML,
  RescheduleAcceptedHTML,
  RescheduleRejectedHTML,
  VisitCancelledHTML,
  VisitConfirmedHTML,
} from "../../utils/HTMLforEmails.js";
import { sendEmail } from "../../utils/sendEmail.js";
import logger from "../../utils/logger.js";
import { validateFutureDate } from "../../utils/dateValidation.js";
import { createNotification } from "../notification/notification.service.js";

// Creates a new visit request for a unit
export const createVisit = async ({ userId, unitId, proposedDate }) => {
  // Parse and validate proposed date
  const proposedDateObj = validateFutureDate(proposedDate, 1);

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

  if (unit.deletedAt || unit.status !== "ACTIVE") {
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
      await createNotification(
        unit.owner.id,
        "VISIT_REQUEST",
        `You have a new visit request from ${user.name} for "${unit.title}"`,
        tx,
      );

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
      await createNotification(
        visit.user.id,
        "VISIT_APPROVED",
        `Your visit request for "${visit.unit.title}" has been approved`,
        tx,
      );

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
    "Visit Request Approved ✅",
    `Your visit request for "${visit.unit.title}" has been approved`,
    VisitApprovedHTML(visit.user, visit.unit),
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
      await createNotification(
        visit.user.id,
        "VISIT_REJECTED",
        `Your visit request for "${visit.unit.title}" has been rejected by the owner`,
        tx,
      );

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
    "Visit Request Declined",
    `Your visit request for "${visit.unit.title}" has been declined by the owner`,
    VisitRejectedHTML(visit.user, visit.unit),
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
  const newDateObj = validateFutureDate(newDate, 1);

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
      await createNotification(
        visit.user.id,
        "VISIT_RESCHEDULED",
        `The owner has proposed a new date for your visit to "${visit.unit.title}"`,
        tx,
      );

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
    "New Date Proposed for Your Visit 🗓️",
    `The owner has proposed a new date for your visit to "${visit.unit.title}"`,
    RescheduleProposedHTML(visit.user, visit.unit, newDateObj),
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
      await createNotification(
        visit.unit.ownerId,
        "VISIT_APPROVED",
        `${visit.user.name} has accepted your reschedule proposal for "${visit.unit.title}"`,
        tx,
      );

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
    "Reschedule Accepted ✅",
    `${visit.user.name} has accepted the reschedule for "${visit.unit.title}"`,
    RescheduleAcceptedHTML(visit.user, visit.unit),
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
      await createNotification(
        visit.unit.ownerId,
        "VISIT_REJECTED",
        `${visit.user.name} has rejected your reschedule proposal for "${visit.unit.title}"`,
        tx,
      );

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
    "Reschedule Declined",
    `${visit.user.name} has declined your reschedule proposal for "${visit.unit.title}"`,
    RescheduleRejectedHTML(visit.user, visit.unit),
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
      await createNotification(
        visit.unit.ownerId,
        "VISIT_CANCELLED",
        `${visit.user.name} has cancelled their visit request for "${visit.unit.title}"`,
        tx,
      );

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
    VisitCancelledHTML(visit.user, visit.unit),
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
        select: { id: true, ownerId: true, title: true },
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

  // 7. Update visit status, auto-create Booking, and notify visitor in a transaction
  let updatedVisit;
  try {
    updatedVisit = await prisma.$transaction(async (tx) => {
      // Confirm the visit
      const confirmed = await tx.visit.update({
        where: { id: visitId },
        data: { status: "CONFIRMED" },
      });

      // Auto-create the Booking record (no manual user action needed)
      const newBooking = await tx.booking.create({
        data: {
          userId: visit.user.id,
          unitId: visit.unit.id,
          visitId: visit.id,
          status: "BOOKED",
        },
      });

      // Notify the visitor: visit confirmed + booking created
      await tx.notification.create({
        data: {
          userId: visit.user.id,
          type: "VISIT_CONFIRMED",
          message: `Your visit to "${visit.unit.title}" has been confirmed and your booking is now active`,
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
    "Your Booking is Confirmed 🎉",
    `Your visit to "${visit.unit.title}" has been confirmed and your booking is now active`,
    VisitConfirmedHTML(visit.user, visit.unit),
  ).catch((emailError) => {
    logger.error("Failed to send visit confirmation email", {
      visitId,
      userEmail: visit.user.email,
      error: emailError.message,
    });
  });

  return updatedVisit;
};

// ─── READ: Get all visits for the authenticated user or landlord ───
export const getMyVisits = async (userId, role) => {
  const where =
    role === "LANDLORD"
      ? { unit: { ownerId: userId } } // owner sees visits on their units
      : { userId }; // user sees their own visit requests

  const visits = await prisma.visit.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      unit: { select: { id: true, title: true, city: true, images: true } },
      user: { select: { id: true, name: true, email: true } },
      payment: { select: { id: true, status: true, amount: true } },
      booking: { select: { id: true, status: true } },
    },
  });

  return visits;
};

// ─── READ: Get a single visit by ID ───
export const getVisitById = async (visitId, userId, role) => {
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      unit: {
        select: {
          id: true,
          title: true,
          city: true,
          images: true,
          ownerId: true,
        },
      },
      user: { select: { id: true, name: true, email: true } },
      payment: true,
      booking: true,
    },
  });

  if (!visit) {
    const error = new Error(`Visit with ID ${visitId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // USER sees only their own visits; LANDLORD sees only visits on their units
  const isOwner = visit.unit.ownerId === userId;
  const isVisitor = visit.user.id === userId;

  if (!isOwner && !isVisitor) {
    const error = new Error("You are not authorized to view this visit");
    error.statusCode = 403;
    throw error;
  }

  return visit;
};
