import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Nodemailer from 'nodemailer';

dotenv.config();

// Configure Nodemailer transport with Gmail credentials
const transport = Nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

export const sendVerificationEmail = async (user, verificationUrl) => {
  const Name = typeof user.Name === 'string' ? user.Name : 'User';
  const email = user.email;



  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email address provided');
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Attach the token to the specific verification URL
  const fullVerificationUrl = `${verificationUrl}?token=${token}`;
  console.log('Name:', Name);
  console.log('Email:', user.email);
  console.log('Verification URL:', fullVerificationUrl);
  console.log('Token:', token);  
  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification',
      text: `Hi ${Name},\n\nPlease verify your email by clicking the following link:\n${fullVerificationUrl}`,
    });

    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Could not send verification email');
  }
};

