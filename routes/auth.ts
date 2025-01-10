import jwt from 'jsonwebtoken';
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import User from '../models/User';
import OTP from '../models/otp';


const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Temporary storage location
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

// Configure Nodemailer
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'itohoowookoro@gmail.com',
    pass: process.env.GMAIL_PASS || 'cfuuranefaxnygqn'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djep3wseh',
  api_key: process.env.CLOUDINARY_API_KEY || '658364262147331',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'njnQjNJSdGt1nsUAeOfnXIpraD0'
});

// Signup Route
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: Username, Email, and Password.',
    });
  }

  try {
    // Check if the email is already registered
    let existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: 'This email is already registered. Please use a different email.',
        success: false,
      });
    }

    // Create a new user
    const newUser = new User({
      email,
      password,
    });

    // Save new user
    await newUser.save();

    // Generate and save OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // OTP expires in 10 minutes

    const otpRecord = new OTP({
      email,
      expiresAt,
      confirmationToken: otp,
    });
    await otpRecord.save();

    // Send confirmation email
    const message = {
      to: email,
      from: 'itohoowookoro@gmail.com',
      subject: 'Email Verification OTP',
      html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; padding: 20px;">
          <h2>Gifting Platform Account Confirmation</h2>
          <p>Your OTP is: <b>${otp}</b></p>
          <p>Expires in 10 minutes.</p>
      </div>`,
    };

    transporter.sendMail(message, (error, info) => {
      if (error) {
        console.log('Email error:', error);
      } else {
        console.log('Sent OTP Email:', info.response);
      }
    });

    res.status(200).json({
      message: 'Registration successful! Check your email to confirm your account.',
      success: true,
      data: newUser.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'An error occurred during registration.',
      success: false,
    });
  }
});

// Resend OTP Route
router.post('/resend-otp', async (req: Request, res: Response) => {
  const { email } = req.body;

  // Validate input
  if (!email) {
    throw new Error("Email is required");
  }

  try {
    // Check if the user exists and is not confirmed
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'No account found with this email.', success: false });
    }

    if (user.isConfirmed) {
      return res.status(400).json({ message: 'This email is already confirmed.', success: false });
    }

    // Generate a new OTP and expiration time
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // OTP expires in 10 minutes

    // Update or create a new OTP record
    await OTP.updateOne({ email }, { confirmationToken: otp, expiresAt }, { upsert: true });

    // Send the OTP email
    const firstName = user.firstName ? user.firstName : 'Valued Customer';
    const message = {
      to: email,
      from: 'itohoowookoro@gmail.com',
      subject: 'Resend OTP for Email Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2>Email Confirmation</h2>
          <p>Dear ${firstName}</p>
          <p>Your new One-Time Password (OTP) for email confirmation is: <b>${otp}</b>.</p>
          <p>Please note that this OTP expires in 10 minutes.</p>
          <p>If you did not request this OTP, please disregard this email.</p>
          <p>For security reasons, do not share your OTP with anyone.</p>
          <p>Thank you,</p>
          <p><b>Gifting Platform Team</b></p>
        </div>
      `
    };

    transporter.sendMail(message, (error, info) => {
      if (error) {
        console.log('Email error:', error);
        return res.status(500).json({ message: 'Failed to send OTP email.', success: false });
      }
      console.log('OTP Email is Resent:', info.response);
    });

    res.json({ message: 'A new OTP has been sent to your email.', success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while resending OTP.', success: false });
  }
});

// OTP Verification Route
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { otp, email } = req.body;

    // Validate input
    if (!otp || !email) {
      throw new Error("OTP and Email are required");
    }

    // Find OTP record for the user
    const otpRecord = await OTP.findOne({ email, confirmationToken: otp });

    // Check if OTP exists and is valid
    if (!otpRecord || otpRecord.expiresAt.getTime() < Date.now()) {
      throw new Error("Invalid or expired OTP!");
    }

    // Confirm user's email in User model and remove OTP
    await User.updateOne({ email }, { $set: { isConfirmed: true } });
    await OTP.deleteOne({ email });

    res.status(200).send({
      message: "User email has been successfully confirmed",
      success: true,
      data: email
    });
  } catch (error) {
    res.status(400).send({
      message: (error as any).message,
      success: false
    });
  }
});

// Login Route with OTP for unconfirmed users
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password are required", success: false });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (!user.isConfirmed) {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60000); // OTP expires in 10 minutes

      // Save OTP and expiration to the OTP model
      await OTP.updateOne({ email }, { confirmationToken: otp, expiresAt }, { upsert: true });

      // Send the OTP email
      const message = {
        to: email,
        from: 'itohoowookoro@gmail.com',
        subject: 'OTP for Email Confirmation',
        html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2>Email Confirmation</h2>
        <p>Dear ${user.firstName ? user.firstName : "Valued Customer"},</p>
        <p>Your One-Time Password (OTP) for email confirmation is: <b>${otp}</b>.</p>
        <p>Please note that this OTP expires in 10 minutes.</p>
        <p>If you did not request this OTP, please disregard this email.</p>
        <p>For security reasons, do not share your OTP with anyone.</p>
        <p>Thank you,</p>
        <p><b>Gifting Platform Team</b></p>
      </div>
    `,
      };

      transporter.sendMail(message, (error, info) => {
        if (error) {
          console.log('Email error:', error);
        } else {
          console.log('Resent OTP Email:', info.response);
        }
      });

      // Return response with redirect to OTP page
      return res.status(200).json({
        message: "Email not confirmed. OTP sent to your email.",
        success: false,
        redirect: "/otp",
        data: { email: user.email },
      });
    }

    // Verify password for confirmed users
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password", success: false });
    }

    // Log current server time
    console.log("Current server date and time:", new Date());

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const redirectUrl = user.isComplete ? "/dashboard" : "/completeProfile";

    res.status(200).json({
      message: user.isComplete ? "Logged in successfully. Redirecting to dashboard." : "Profile is incomplete. Redirecting to complete profile.",
      success: true,
      token,
      redirect: redirectUrl,
      data: { email: user.email, userId: user._id },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      message: 'Login error.',
      success: false,
    });
  }
});

// Forgot Password Route
router.post('/forgot', async (req: Request, res: Response) => {
  const { email } = req.body;

  // Validate input
  if (!email) {
    return res.status(400).send({ message: "Email is required", success: false });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "No account found with this email.", success: false });
    }

    const token = crypto.randomBytes(20).toString('hex');
    await OTP.updateOne({ email }, {
      resetPasswordToken: token,
      resetPasswordExpires: Date.now() + 3600000
    }, { upsert: true });

    const message = {
      to: email,
      from: 'itohoowookoro@gmail.com',
      subject: 'Password Reset',
      html: `
  <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; padding: 20px;">
    <h2>Password Reset Request</h2>
    <p>Dear ${user.firstName ? user.firstName : "Valued Customer"},</p>
    <p>We received a request to reset your password. To securely update your password, click <b><a href="http://localhost:3000/resetPassword?token=${token}&email=${email}">this link</a></b>.</p>
    <p>This link is valid for a limited time. If you did not initiate this request, please disregard this email.</p>
    <p>Thank you</p>
    <p><b>Gifting Platform Team</p>
  </div>
`
    };

    transporter.sendMail(message, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Sent Email', info.response);
      }
    });

    res.status(200).send({ message: 'Password Reset Email Sent.', success: true });

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Internal Server Error', success: false });
  }
});

// Endpoint to handle password reset
router.post('/reset-password', [
  body('email').isEmail().withMessage('Invalid email address.'),
  body('token').notEmpty().withMessage('Token is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 mixed characters.'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, token, password } = req.body;

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, resetPasswordToken: token });
    if (!otpRecord || otpRecord.expiresAt.getTime() < Date.now()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Update the user's password
    user.password = password;
    await user.save();

    // Delete OTP record for the specific user and token
    await OTP.deleteOne({ email, resetPasswordToken: token });

    res.status(200).json({ success: true, message: 'Password reset successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// Route to handle image upload
router.post('/upload-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded',
        success: false,
      });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'uploaded_images',
    });

    // Return response with image URL
    res.status(200).json({
      message: 'Image uploaded successfully',
      success: true,
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      message: 'Server error during image upload',
      success: false,
    });
  }
});

// New route to return "F. C. Barcelona"
router.get('/ity', (req: Request, res: Response) => {
  res.status(200).json({
    message: "F. C. Barcelona",
    success: true
  });
});

export default router;