import Customer from "../../../models/Customer/customerModels/customerModel.js";
import PromotionalEmail from "../../../models/Admin/adminModels/promotionEmail.js";
import PromotionalNotification from "../../../models/Admin/adminModels/promotionNotification.js";
import Nodemailer from "nodemailer";
import dotenv from "dotenv";
import { notificationService } from "../../../service/sendPushNotification.js";
import { uploadFileToS3 } from "../../../utils/s3Uploader.js";

dotenv.config();

// Configure Nodemailer transport pool
const transport = Nodemailer.createTransport({
  service: "gmail",
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendPromotionalEmail = async (req, res) => {
  try {
    const { content } = req.body;
    const images = req.files;

    if (!content || !images || images.length === 0) {
      return res.status(400).json({
        message: "Promotional content and image are required."
      });
    }

    const imageUrl = await uploadFileToS3(images[0]);
    const customers = await Customer.find({}, "email Name");

    const generateEmailTemplate = (name, content, imageUrl) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Promotion</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05); text-align: center;">
          
          <!-- Logo -->
          <img src="https://firebasestorage.googleapis.com/v0/b/awad-5c2a8.appspot.com/o/email%20logo%20munjz.jpeg?alt=media&token=f7b1e7fb-4278-4a13-8b61-d3766a59ffe6"
              alt="Munjz Logo"
              style="width: 100%; max-width: 180px; display: block; margin: 0 auto 20px;" />

          <!-- Greeting and Content -->
          <h2 style="color: #2D467C;">Hi ${name || "Customer"},</h2>
          <p style="font-size: 16px; color: #333; line-height: 1.5;">${content}</p>

          <!-- Promotional Image -->
          <img src="${imageUrl || "https://via.placeholder.com/600x300"}"
              alt="Promotion Image"
              style="width: 100%; max-width: 500px; border-radius: 10px; margin-top: 20px;"
              onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png';" />

          <!-- Divider -->
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

        <!-- Footer Sections -->
<table width="100%" style="margin-top: 10px;">
  <tr>
    <!-- Download App -->
    <td align="left" style="padding: 10px; vertical-align: top;">
      <div style="text-align: left;">
        <div style="font-size: 14px; font-weight: bold;">Download our app</div>
        <div style="margin-top: 8px;">
          <img src="https://www.freepnglogos.com/uploads/google-play-png-logo/google-severs-music-studio-png-logo-21.png"
              alt="Google Play" style="height: 36px; margin-right: 15px;" />
          <img src="https://cdn-icons-png.flaticon.com/128/179/179309.png"
              alt="App Store" style="height: 36px;" />
        </div>
      </div>
    </td>

    <!-- Spacer Column -->
    <td></td>

    <!-- Follow Us -->
    <td align="right" style="padding: 10px; vertical-align: top;">
      <div style="text-align: right;">
        <div style="font-size: 14px; font-weight: bold;">Follow us</div>
        <div style="margin-top: 8px;">
          <a href="https://facebook.com" target="_blank" style="margin-right: 15px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/cd/Facebook_logo_%28square%29.png"
                alt="Facebook" style="height: 30px;" />
          </a>
          <a href="https://instagram.com" target="_blank">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
                alt="Instagram" style="height: 30px;" />
          </a>
        </div>
      </div>
    </td>
  </tr>
</table>


          <!-- Copyright -->
          <p style="font-size: 12px; color: #aaa; margin-top: 30px;">
            © ${new Date().getFullYear()} Munjz App. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    // Batch sending with error handling
    const BATCH_SIZE = 100;
    const failedEmails = [];
    let successCount = 0;

    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
      const batch = customers.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (customer) => {
          try {
            const message = {
              from: `Munjz App <${process.env.EMAIL_USER}>`,
              to: customer.email,
              subject: "Legal Support with Munjz",
              html: generateEmailTemplate(customer?.Name || "Customer", content, imageUrl),

              attachments: imageUrl ? [
                {
                  filename: "promo-image.jpg",
                  path: imageUrl
                }
              ] : []
            };

            await transport.sendMail(message);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${customer.email}:`, error);
            failedEmails.push(customer.email);
          }
        })
      );


      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save campaign record
    await PromotionalEmail.create({
      content,
      imageUrl,
      sentCount: successCount,
      failedCount: failedEmails.length,
      failedEmails: failedEmails
    });

    res.status(200).json({
      message: "Promotional emails sent successfully.",
      summary: `Emails sent: ${successCount}, Failed: ${failedEmails.length}`,
      failedEmails: failedEmails.slice(0, 50)
    });
  } catch (error) {
    console.error("Promotional email error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing promotional emails",
      error: error.message
    });
  }
};

export const sendPromotionalNotification = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ message: "Title and message content are required." });
    }

    // Real-time FCM
    await notificationService.sendToAllCustomers(title, message, {
      type: "PROMOTIONAL_NOTIFICATION"
    });

    // Save notification history
    await PromotionalNotification.create({
      title,
      message
    });

    res
      .status(200)
      .json({ message: "Promotional notification sent successfully" });
  } catch (error) {
    console.error("Error sending notification:", error);
    res
      .status(500)
      .json({ message: "Failed to send promotional notification" });
  }
};
