import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "./logger.js";

const transporter = nodemailer.createTransport({
  // host: env.EMAIL_HOST,
  // port: env.EMAIL_PORT,
  // secure: env.EMAIL_SECURE,
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: `"BeStay" ${env.EMAIL_FROM}`,
    to,
    subject,
    text,
    html,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    // logger.info(`Email sent to ${to} with subject "${subject}"`);

    return info;
  } catch (error) {
    logger.error("Error sending email: ", error);
    throw error;
  }
};
