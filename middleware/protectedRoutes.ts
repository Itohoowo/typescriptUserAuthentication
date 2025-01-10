import express, { Request, Response } from 'express';
import authenticateToken from './authMiddleware';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import User from '../models/User';
import CompleteProfile from '../models/completeProfile';

const protectedRoutes = express.Router();

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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djep3wseh',
  api_key: process.env.CLOUDINARY_API_KEY || '658364262147331',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'njnQjNJSdGt1nsUAeOfnXIpraD0',
});

// Complete Profile Route
protectedRoutes.post(
  '/completeProfile',
  authenticateToken,
  upload.single('profileImage'),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId; // Adjust for middleware's req.user typing
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.', success: false });
      }

      // Check if profile already exists
      const existingProfile = await CompleteProfile.findOne({ user: userId });
      if (existingProfile) {
        return res.status(400).json({
          message: 'Profile already exists.',
          success: false,
          redirect: '/dashboard',
        });
      }

      // Ensure profile image is provided
      if (!req.file) {
        return res.status(400).json({ message: 'Profile image is required.', success: false });
      }

      // Upload profile image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'profile_images' });

      // Create and save profile
      const profile = new CompleteProfile({
        user: userId,
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        dob: req.body.dob,
        phoneNumber: req.body.phoneNumber,
        countryOfOrigin: req.body.countryOfOrigin,
        profileImage: result.secure_url,
      });
      await profile.save();

      // Update user profile completion status
      await User.findByIdAndUpdate(userId, { isComplete: true });

      res.status(200).json({
        message: 'Profile completed successfully.',
        success: true,
        redirect: '/dashboard',
      });
    } catch (error) {
      console.error('Error completing profile:', error);
      res.status(500).json({
        message: 'Server error while completing profile.',
        success: false,
      });
    }
  }
);

// Fetch Profile Route
protectedRoutes.get('/fetchProfile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.', success: false });
    }
    const profile = await CompleteProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.', success: false });
    }
    res.status(200).json({ message: 'Profile fetched successfully.', success: true, data: profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile.', success: false });
  }
});

// Edit Profile Route
protectedRoutes.post(
  '/editProfile',
  authenticateToken,
  upload.single('profileImage'),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.', success: false });
      }

      // Find and update the profile
      const profile = await CompleteProfile.findOne({ user: userId });
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found.', success: false });
      }

      profile.firstName = req.body.firstName || profile.firstName;
      profile.middleName = req.body.middleName || profile.middleName;
      profile.lastName = req.body.lastName || profile.lastName;
      profile.gender = req.body.gender || profile.gender;
      profile.dob = req.body.dob || profile.dob;
      profile.phoneNumber = req.body.phoneNumber || profile.phoneNumber;
      profile.countryOfOrigin = req.body.countryOfOrigin || profile.countryOfOrigin;

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'profile_images' });
        profile.profileImage = result.secure_url;
      }

      await profile.save();
      res.status(200).json({ message: 'Profile updated successfully.', success: true });
    } catch (error) {
      console.error('Error editing profile:', error);
      res.status(500).json({ message: 'Server error while editing profile.', success: false });
    }
  }
);

export default protectedRoutes;
