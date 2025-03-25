import dotenv from "dotenv";
import Nodemailer from "nodemailer";

dotenv.config();

// Configure Nodemailer transport with Gmail credentials
const transport = Nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendVerificationEmail = async (user, verificationUrl) => {
  const Name = typeof user.Name === "string" ? user.Name : "User";
  const email = user.email;
  const token = user.verificationToken;

  if (!email || typeof email !== "string") {
    throw new Error("Invalid email address provided");
  }

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
  </head>
  <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="color: #2D467C;">Verify Your Email</h1>
      <p>Hi ${Name},</p>
      <p>Thank you for signing up. Please click the button below to verify your email address:</p>
      <a href="${verificationUrl}?token=${token}" 
         style="display: inline-block; margin: 20px 0; padding: 10px 20px; color: #fff; background-color: #2D467C; text-decoration: none; border-radius: 5px;">
         Verify Email
      </a>
      <p style="color: #666;">If you did not request this, please ignore this email.</p>
    </div>
  </body>
  </html>
`;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      html: htmlContent
    });

    
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Could not send verification email");
  }
};
