import prisma from "../prisma/client.js";
import { calculateBookingPrice } from "../utils/calculateBookingPrice.js";
import {
  retrievePaymentIntentUtil,
  createPaymentIntentUtil,
  refundPaymentUtil,
} from "../utils/paymentIntent.js";
import { sendEmail } from "../utils/sendEmail.js";

export async function createBookingService(userId, unitId, visitDate) {
  // Check user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check unit exists and is available
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
  });

  if (!unit) {
    throw new Error("Unit not found");
  }

  if (!unit.isAvailable) {
    throw new Error("Unit is not available");
  }

  const price = calculateBookingPrice(unit.price);

  // Check if booking already exists for this user and unit
  const existingBooking = await prisma.booking.findFirst({
    where: {
      userId,
      unitId,
      status: {
        in: ["PENDING_PAYMENT", "PAID", "VISIT_SCHEDULED", "VISIT_RESCHEDULED"],
      },
    },
  });

  // Calculate expiration time (15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  let booking;

  if (existingBooking) {
    // Update existing booking - only allow if still pending payment
    if (existingBooking.status !== "PENDING_PAYMENT") {
      throw new Error(
        "Cannot update booking that is already paid or scheduled",
      );
    }

    booking = await prisma.booking.update({
      where: { id: existingBooking.id },
      data: {
        visitDate: visitDate ? new Date(visitDate) : null,
        expiresAt, // Reset expiration
        // Keep original price - don't recalculate
      },
    });
  } else {
    // First, mark unit as unavailable to prevent race conditions
    // This happens BEFORE creating the booking
    await prisma.unit.update({
      where: { id: unitId },
      data: { isAvailable: false },
    });

    try {
      // Create new booking
      booking = await prisma.booking.create({
        data: {
          userId,
          unitId,
          visitDate: visitDate ? new Date(visitDate) : null,
          expiresAt,
          ...price,
        },
      });
    } catch (error) {
      // If booking creation fails, restore unit availability
      await prisma.unit.update({
        where: { id: unitId },
        data: { isAvailable: true },
      });
      throw error;
    }
  }

  return booking;
}

export async function getAllBookingsService(userId) {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      unit: true,
    },
  });

  const bookingsWithUnit = bookings.map((booking) => {
    return {
      ...booking,
      unit: {
        ...booking.unit,
        images:
          typeof booking.unit.images === "string"
            ? booking.unit.images.split(",")
            : booking.unit.images || [],
      },
    };
  });

  return bookingsWithUnit;
}

export async function createPaymentIntentService(bookingId, userId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Security: Verify booking belongs to the user
  if (booking.userId !== userId) {
    throw new Error("Unauthorized: This booking does not belong to you");
  }

  // Check if booking has expired
  if (booking.expiresAt && new Date() > booking.expiresAt) {
    throw new Error("Booking has expired. Please create a new booking");
  }

  // Check booking status
  if (booking.status !== "PENDING_PAYMENT") {
    throw new Error(
      `Cannot create payment intent for booking with status: ${booking.status}`,
    );
  }

  const paymentIntent = await createPaymentIntentUtil(
    booking.totalAmount,
    bookingId,
  );

  return paymentIntent;
}

export async function confirmPaymentService(paymentIntentId, userId) {
  // Retrieve payment intent to verify it was successfully paid
  const paymentIntent = await retrievePaymentIntentUtil(paymentIntentId);

  // Verify payment was successful
  if (paymentIntent.status !== "succeeded") {
    throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
  }

  // Get booking ID from payment intent metadata
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    throw new Error("Booking ID not found in payment intent metadata");
  }

  // Security: Verify booking belongs to the user
  const bookingCheck = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!bookingCheck) {
    throw new Error("Booking not found");
  }

  if (bookingCheck.userId !== userId) {
    throw new Error("Unauthorized: This booking does not belong to you");
  }

  // Update booking status to PAID with timestamp
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentIntentId: paymentIntent.id,
    },
    include: {
      unit: {
        include: { owner: true },
      },
      user: true,
    },
  });

  // Note: Unit availability is already set to false during booking creation
  // No need to update it again here

  // Create or update payment record (upsert to handle duplicate attempts)
  const payment = await prisma.payment.upsert({
    where: { bookingId: bookingId },
    update: {
      paymentIntentId: paymentIntent.id,
      status: "PAID",
      amount: paymentIntent.amount / 100, // Convert piastres back to EGP
      method: paymentIntent.payment_method,
    },
    create: {
      bookingId: bookingId,
      paymentIntentId: paymentIntent.id,
      status: "PAID",
      amount: paymentIntent.amount / 100, // Convert piastres back to EGP
      method: paymentIntent.payment_method,
    },
  });

  // Get user info for email
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Send confirmation email
  const amountInEGP = paymentIntent.amount / 100;
  const html = `
    <h1>🎉 Booking Confirmed!</h1>
    <h3>Your booking has been confirmed successfully</h3>
    <hr>
    <p><strong>Booking ID:</strong> ${bookingId}</p>
    <p><strong>Payment ID:</strong> ${paymentIntent.id}</p>
    <p><strong>Amount Paid:</strong> ${amountInEGP} EGP</p>
    <p><strong>Status:</strong> ${paymentIntent.status.toUpperCase()}</p>
    <p><strong>Unit:</strong> ${booking.unit.name}</p>
    <p><strong>Owner:</strong> ${booking.unit.owner.name}</p>
    <p><strong>Owner Email:</strong> ${booking.unit.owner.email}</p>
    <p><strong>Owner Phone:</strong> ${booking.unit.owner.phone}</p>
    <p><strong>Visit Date:</strong> ${booking.visitDate}</p>
    <p><strong>User:</strong> ${booking.user.name}</p>
    <p><strong>User Email:</strong> ${booking.user.email}</p>
    <p><strong>User Phone:</strong> ${booking.user.phone}</p>
    <hr>
    <p>Thank you for choosing BeStay!</p>
  `;

  const htmlForOwner = `
    <h1>🎉 New Booking!</h1>
    <h3>A new booking has been made for your unit</h3>
    <hr>
    <p><strong>Booking ID:</strong> ${bookingId}</p>
    <p><strong>Payment ID:</strong> ${paymentIntent.id}</p>
    <p><strong>Amount Paid:</strong> ${amountInEGP} EGP</p>
    <p><strong>Status:</strong> ${paymentIntent.status.toUpperCase()}</p>
    <p><strong>Unit:</strong> ${booking.unit.name}</p>
    <p><strong>Owner:</strong> ${booking.unit.owner.name}</p>
    <p><strong>Owner Email:</strong> ${booking.unit.owner.email}</p>
    <p><strong>Owner Phone:</strong> ${booking.unit.owner.phone}</p>
    <p><strong>Visit Date:</strong> ${booking.visitDate}</p>
    <p><strong>User:</strong> ${booking.user.name}</p>
    <p><strong>User Email:</strong> ${booking.user.email}</p>
    <p><strong>User Phone:</strong> ${booking.user.phone}</p>
    <hr>
    <p>Thank you for choosing BeStay!</p>
  `;

  try {
    // send notification to user
    await sendEmail(
      user.email,
      "Booking Confirmed - BeStay",
      "Your booking has been confirmed successfully",
      html,
    );
    // send notification to owner
    const owner = await prisma.user.findUnique({
      where: { id: booking.unit.ownerId },
    });
    await sendEmail(
      owner.email,
      "New Booking - BeStay",
      "A new booking has been made for your unit",
      htmlForOwner,
    );
  } catch (emailError) {
    console.error("Failed to send confirmation email:", emailError);
    // Don't fail the whole operation if email fails
  }

  return {
    payment,
    booking,
    paymentIntent: {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: amountInEGP,
    },
  };
}

export async function cancelBookingService(bookingId, userId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      unit: {
        include: { owner: true },
      },
      user: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Security: Verify booking belongs to the user
  if (booking.userId !== userId) {
    throw new Error("Unauthorized: This booking does not belong to you");
  }

  if (booking.status === "REFUNDED") {
    throw new Error("Booking is already refunded");
  }
  if (
    booking.status === "CANCELLED_BY_USER" ||
    booking.status === "CANCELLED_BY_OWNER"
  ) {
    throw new Error("Booking is already cancelled");
  }

  let refund = null;
  if (booking.paymentIntentId) {
    // refund the payment
    refund = await refundPaymentUtil(booking.paymentIntentId);
  }

  // Check if the user is the owner
  const isUser = booking.userId === userId;
  const status = isUser ? "CANCELLED_BY_USER" : "CANCELLED_BY_OWNER";

  // Update booking status to CANCELLED_BY_USER
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: status,
      cancelledAt: new Date(),
      refundAmount: refund ? refund.amount / 100 : null,
      refundedAt: refund ? new Date() : null,
    },
  });

  // Restore unit availability
  await prisma.unit.update({
    where: { id: booking.unitId },
    data: { isAvailable: true },
  });

  // Payment status update (only if payment exists)
  if (booking.paymentIntentId) {
    await prisma.payment.update({
      where: { bookingId: bookingId },
      data: {
        status: "REFUNDED",
      },
    });
  }

  const html = `
    <h1>🎉 Booking Cancelled!</h1>
    <h3>Your booking has been cancelled successfully</h3>
    <hr>
    <p><strong>Booking ID:</strong> ${bookingId}</p>
    <p><strong>Payment ID:</strong> ${booking.paymentIntentId}</p>
    <p><strong>Amount Refunded:</strong> ${refund ? refund.amount / 100 : 0} EGP</p>
    <p><strong>Status:</strong> ${updatedBooking.status}</p>
    <p><strong>Unit:</strong> ${booking.unit.name}</p>
    <p><strong>Owner:</strong> ${booking.unit.owner.name}</p>
    <p><strong>Owner Email:</strong> ${booking.unit.owner.email}</p>
    <p><strong>Owner Phone:</strong> ${booking.unit.owner.phone}</p>
    <p><strong>Visit Date:</strong> ${booking.visitDate}</p>
    <p><strong>User:</strong> ${booking.user.name}</p>
    <p><strong>User Email:</strong> ${booking.user.email}</p>
    <p><strong>User Phone:</strong> ${booking.user.phone}</p>
    <hr>
    <p>Thank you for choosing BeStay!</p>
  `;

  const htmlForOwner = `
    <h1>🎉 Booking Cancelled!</h1>
    <h3>A booking has been cancelled for your unit</h3>
    <hr>
    <p><strong>Booking ID:</strong> ${bookingId}</p>
    <p><strong>Payment ID:</strong> ${booking.paymentIntentId}</p>
    <p><strong>Amount Refunded:</strong> ${refund ? refund.amount / 100 : 0} EGP</p>
    <p><strong>Status:</strong> ${updatedBooking.status}</p>
    <p><strong>Unit:</strong> ${booking.unit.name}</p>
    <p><strong>Owner:</strong> ${booking.unit.owner.name}</p>
    <p><strong>Owner Email:</strong> ${booking.unit.owner.email}</p>
    <p><strong>Owner Phone:</strong> ${booking.unit.owner.phone}</p>
    <p><strong>Visit Date:</strong> ${booking.visitDate}</p>
    <p><strong>User:</strong> ${booking.user.name}</p>
    <p><strong>User Email:</strong> ${booking.user.email}</p>
    <p><strong>User Phone:</strong> ${booking.user.phone}</p>
    <hr>
    <p>Thank you for choosing BeStay!</p>
  `;

  console.log(user.email);
  console.log(owner.email);

  
  // send notification to user
  await sendEmail(
    user.email,
    "Booking Cancelled - BeStay",
    "Your booking has been cancelled successfully",
    html,
  );
  // send notification to owner
  const owner = await prisma.user.findUnique({
    where: { id: booking.unit.ownerId },
  });
  await sendEmail(
    owner.email,
    "Booking Cancelled - BeStay",
    "A booking has been cancelled for your unit",
    htmlForOwner,
  );

  return { updatedBooking, refund };
}
