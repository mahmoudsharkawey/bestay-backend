export const ResetCodeHTML = (user, resetCode) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">BeStay</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px;">Hi <strong>${user.name}</strong>,</p>
        <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Use the code below to complete the process:</p>
        <div style="background-color: #f0f0f0; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your Reset Code:</p>
          <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 2px;">${resetCode}</p>
        </div>
        <p style="color: #999; font-size: 14px; margin: 20px 0;">⏱️ This code will expire in <strong>15 minutes</strong></p>
        <p style="color: #666; line-height: 1.6;">If you didn't request a password reset, please ignore this email or contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">Best regards,<br><strong>BeStay Team</strong></p>
      </div>
    </div>
  `;
};

export const VisitRequestHTML = (user, unit, proposedDate) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">BeStay</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Visit Request</p>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #666; line-height: 1.6;">We received a request to visit your unit <strong>${unit.title}</strong></p>
        <p style="color: #666; line-height: 1.6;">If you didn't request a visit, please ignore this email or contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; line-height: 1.6;">Visit details:</p>
        <p style="color: #666; line-height: 1.6;">Unit: <strong>${unit.title}</strong></p>
        <p style="color: #666; line-height: 1.6;">Requested by: <strong>${user.name}</strong></p>
        <p style="color: #666; line-height: 1.6;">Requested at: <strong>${proposedDate}</strong></p>
        <p style="color: #999; font-size: 12px; margin: 0;">Best regards,<br><strong>BeStay Booking Team</strong></p>
      </div>
    </div>
  `;
};
