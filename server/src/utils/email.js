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

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      text: `Hi ${Name},\n\nPlease verify your email by clicking the following link:\n${verificationUrl}?token=${token}`
    });

    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Could not send verification email");
  }
};
