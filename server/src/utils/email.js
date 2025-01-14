import dotenv from "dotenv";
import Nodemailer from "nodemailer";

dotenv.config();

// Configure Nodemailer transport with Gmail credentials
const transport = Nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .button {
          display: inline-block;
          padding: 10px 20px;
          color: #fff;
          background-color:rgb(36, 83, 193);
          text-decoration: none;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Email Verification</h1>
        <p>Hi ${Name},</p>
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationUrl}?token=${token}" class="button">Verify Email</a>
        <p>If you didn’t request this, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      html: htmlContent,
    });

    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Could not send verification email");
  }
};
