// ─────────────────────────────────────────────────────────────────
//  Shared layout wrapper – wraps every email in a branded shell
// ─────────────────────────────────────────────────────────────────
const layout = (title, accentColor = "#4F46E5", body) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${accentColor} 0%,#7C3AED 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:30px;font-weight:700;letter-spacing:-0.5px;">BeStay</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:0.5px;text-transform:uppercase;">${title}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #E5E7EB;text-align:center;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.8;">
                This email was sent by <strong style="color:#6B7280;">BeStay</strong>.<br/>
                If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────
//  Shared helpers
// ─────────────────────────────────────────────────────────────────

/** Renders a highlighted info card (e.g. for codes, dates). */
const infoCard = (rows) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7FF;border:1px solid #E0E7FF;border-radius:8px;margin:20px 0;overflow:hidden;">
    <tbody>
      ${rows
        .map(
          ([label, value]) => `
      <tr>
        <td style="padding:12px 20px;border-bottom:1px solid #E0E7FF;color:#6B7280;font-size:13px;width:40%;">${label}</td>
        <td style="padding:12px 20px;border-bottom:1px solid #E0E7FF;color:#111827;font-size:14px;font-weight:600;">${value}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>
`;

const greeting = (name) =>
  `<p style="color:#111827;font-size:16px;margin:0 0 12px;">Hi <strong>${name}</strong>,</p>`;

const bodyText = (text) =>
  `<p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0 0 16px;">${text}</p>`;

const badge = (text, color = "#4F46E5") =>
  `<span style="display:inline-block;background:${color};color:#fff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">${text}</span>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />`;

// ─────────────────────────────────────────────────────────────────
//  1. Password Reset Code  (authService → forgotPassword)
// ─────────────────────────────────────────────────────────────────
export const ResetCodeHTML = (user, resetCode) =>
  layout(
    "Password Reset",
    "#4F46E5",
    `
    ${greeting(user.name)}
    ${bodyText("We received a request to reset your BeStay password. Use the one-time code below to continue. It <strong>expires in 15 minutes</strong>.")}

    <div style="text-align:center;margin:28px 0;">
      <p style="color:#6B7280;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Your Reset Code</p>
      <p style="font-size:40px;font-weight:800;color:#4F46E5;letter-spacing:8px;margin:0;">${resetCode}</p>
    </div>

    ${bodyText("If you did not request this, please ignore this email — your account is safe.")}
  `,
  );

// ─────────────────────────────────────────────────────────────────
//  2. New Visit Request  (visitService → createVisit → owner)
// ─────────────────────────────────────────────────────────────────
export const VisitRequestHTML = (user, unit, proposedDate) =>
  layout(
    "New Visit Request",
    "#4F46E5",
    `
    ${bodyText("You have a new visit request for one of your units.")}

    ${infoCard([
      ["Unit", unit.title],
      ["Requested by", user.name],
      ["Visitor email", user.email],
      [
        "Proposed date",
        new Date(proposedDate).toLocaleString("en-GB", {
          dateStyle: "full",
          timeStyle: "short",
        }),
      ],
    ])}

    ${bodyText("Please log in to your BeStay dashboard to approve or propose a new date.")}
  `,
  );

// ─────────────────────────────────────────────────────────────────
//  3. Visit Approved  (visitService → approveVisit → user)
// ─────────────────────────────────────────────────────────────────
export const VisitApprovedHTML = (user, unit) =>
  layout(
    "Visit Approved",
    "#059669",
    `
    ${greeting(user.name)}
    <div style="text-align:center;margin:0 0 24px;">${badge("✅ Visit Approved", "#059669")}</div>
    ${bodyText(`Great news! The owner has approved your visit request for <strong>${unit.title}</strong>.`)}
    ${bodyText("Your visit is now confirmed. Please make sure to complete the payment to secure your slot.")}
    ${divider()}
    ${infoCard([["Unit", unit.title]])}
  `,
  );

// ─────────────────────────────────────────────────────────────────
//  4. Visit Rejected  (visitService → rejectVisit → user)
// ─────────────────────────────────────────────────────────────────
export const VisitRejectedHTML = (user, unit) =>
  layout(
    "Visit Request Declined",
    "#DC2626",
    `
    ${greeting(user.name)}
    <div style="text-align:center;margin:0 0 24px;">${badge("❌ Visit Declined", "#DC2626")}</div>
    ${bodyText(`Unfortunately, the owner has declined your visit request for <strong>${unit.title}</strong>.`)}
    ${bodyText("You are welcome to search for other available units on BeStay.")}
  `,
  );

// ─────────────────────────────────────────────────────────────────
//  5. Reschedule Proposed  (visitService → proposeReschedule → user)
// ─────────────────────────────────────────────────────────────────
export const RescheduleProposedHTML = (user, unit, newDate) =>
  layout(
    "Visit Reschedule Proposed",
    "#D97706",
    `
    ${greeting(user.name)}
    <div style="text-align:center;margin:0 0 24px;">${badge("🗓️ New Date Proposed", "#D97706")}</div>
    ${bodyText(`The owner of <strong>${unit.title}</strong> has proposed a new date for your visit.`)}

    ${infoCard([
      ["Unit", unit.title],
      [
        "Proposed new date",
        new Date(newDate).toLocaleString("en-GB", {
          dateStyle: "full",
          timeStyle: "short",
        }),
      ],
    ])}

    ${bodyText("Please log in to your BeStay dashboard to <strong>accept</strong> or <strong>decline</strong> this proposal.")}
  `,
  );

// ─────────────────────────────────────────────────────────────────
//  6. Reschedule Accepted  (visitService → acceptReschedule → owner)
// ─────────────────────────────────────────────────────────────────
export const RescheduleAcceptedHTML = (user, unit) =>
  layout(
    "Reschedule Accepted",
    "#059669",
    `
    <div style="text-align:center;margin:0 0 24px;">${badge("✅ Reschedule Accepted", "#059669")}</div>
    ${bodyText(`<strong>${user.name}</strong> has accepted your reschedule proposal for <strong>${unit.title}</strong>.`)}
    ${bodyText("The visit is now confirmed for the new date.")}
  `,
  );

// ─────────────────────────────────────────────────────────────────
//  7. Reschedule Rejected  (visitService → rejectReschedule → owner)
// ─────────────────────────────────────────────────────────────────
export const RescheduleRejectedHTML = (user, unit) =>
  layout(
    "Reschedule Declined",
    "#DC2626",
    `
    <div style="text-align:center;margin:0 0 24px;">${badge("❌ Reschedule Declined", "#DC2626")}</div>
    ${bodyText(`<strong>${user.name}</strong> has declined your reschedule proposal for <strong>${unit.title}</strong>.`)}
    ${bodyText("The visit request has been closed. You may receive a new request from this visitor in the future.")}
  `,
  );

// ─────────────────────────────────────────────────────────────────
//  8. Visit Cancelled  (visitService → cancelVisit → owner)
// ─────────────────────────────────────────────────────────────────
export const VisitCancelledHTML = (user, unit) =>
  layout(
    "Visit Cancelled",
    "#6B7280",
    `
    <div style="text-align:center;margin:0 0 24px;">${badge("🚫 Visit Cancelled", "#6B7280")}</div>
    ${bodyText(`<strong>${user.name}</strong> has cancelled their visit request for <strong>${unit.title}</strong>.`)}
    ${bodyText("Your unit is now available for other visit requests.")}
  `,
  );

// ─────────────────────────────────────────────────────────────────
//  9. Visit Confirmed + Booking Created (visitService → confirmVisit → user)
// ─────────────────────────────────────────────────────────────────
export const VisitConfirmedHTML = (user, unit) =>
  layout(
    "Booking Confirmed 🎉",
    "#059669",
    `
    ${greeting(user.name)}
    <div style="text-align:center;margin:0 0 24px;">${badge("🎉 Booking Active", "#059669")}</div>
    ${bodyText(`Your visit to <strong>${unit.title}</strong> has been confirmed by the owner, and your booking is now <strong>active</strong>.`)}
    ${bodyText("Welcome to BeStay — we hope you enjoy your new home!")}
    ${divider()}
    ${infoCard([["Unit", unit.title]])}
  `,
  );

// ─────────────────────────────────────────────────────────────────
//  10. Payment Successful  (paymentService → handleStripeWebhook → user)
// ─────────────────────────────────────────────────────────────────
export const PaymentSuccessHTML = (user, visitId) =>
  layout(
    "Payment Successful",
    "#059669",
    `
    ${greeting(user.name)}
    <div style="text-align:center;margin:0 0 24px;">${badge("💳 Payment Received", "#059669")}</div>
    ${bodyText("Your payment has been processed successfully. Your booking is now secured.")}
    ${infoCard([["Visit reference", visitId]])}
    ${bodyText("Thank you for choosing BeStay!")}
  `,
  );

// ─────────────────────────────────────────────────────────────────
//  11. Payment Refunded  (paymentService → refundPayment → user)
// ─────────────────────────────────────────────────────────────────
export const PaymentRefundedHTML = (user, paymentId) =>
  layout(
    "Payment Refunded",
    "#6B7280",
    `
    ${greeting(user.name)}
    <div style="text-align:center;margin:0 0 24px;">${badge("↩️ Refund Processed", "#6B7280")}</div>
    ${bodyText("Your refund has been processed successfully. The amount will appear in your account within 5–10 business days, depending on your bank.")}
    ${infoCard([["Payment reference", paymentId]])}
    ${bodyText("If you have any questions, please contact our support team.")}
  `,
  );
