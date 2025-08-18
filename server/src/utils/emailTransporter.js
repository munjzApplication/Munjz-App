import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

console.log("Connecting to:", process.env.EMAIL_HOST, process.env.EMAIL_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

try {
  await transporter.verify();
  console.log("SMTP connection successful ✅");
} catch (err) {
  console.error("SMTP connection failed ❌", err);
}
export default transporter;
