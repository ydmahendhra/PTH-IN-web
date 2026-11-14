import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import { Intern } from '../models/Intern.js';
import { Notification } from '../models/Notification.js';
import { requireAdmin, authenticate } from '../middleware/auth.js';
import { getGridFSBucket } from '../db/connection.js';
import { broadcastNotification } from '../socket.js';

const router = Router();

const getInternQuery = (id: string) => {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ internId: id }, { _id: id }] }
    : { internId: id };
};

// Multer in-memory storage for streaming into GridFS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and WebP images are supported.'));
    }
  },
});

// GET /api/interns - list all interns
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { search, department, status } = req.query;
    const filter: any = {};

    if (department && department !== 'All') {
      filter.department = department;
    }
    if (status && status !== 'All') {
      filter.accountStatus = status.toString().toLowerCase();
    }
    if (search) {
      const q = search.toString();
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { internId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { collegeName: { $regex: q, $options: 'i' } },
      ];
    }

    const interns = await Intern.find(filter).select('-passwordHash').sort({ internId: 1 });
    return res.json({ success: true, count: interns.length, interns });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/interns/:id - get single intern
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const intern = await Intern.findOne(getInternQuery(req.params.id)).select('-passwordHash');

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }
    return res.json({ success: true, intern });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/interns - create intern (Admin only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      username,
      password,
      phoneNumber,
      address,
      dob,
      gender,
      collegeName,
      department,
      degree,
      yearOfStudy,
      graduationYear,
      skills,
      interests,
      technicalSkills,
      areaOfInterest,
      customSkills,
      customInterests,
      designation,
      internshipStartDate,
      internshipEndDate,
      profileImage,
    } = req.body;

    if (!fullName || !email || !collegeName || !department || !degree || !internshipStartDate || !internshipEndDate) {
      return res.status(400).json({ success: false, message: 'Missing required intern registration fields.' });
    }

    // Auto-generate internId: INT-YYYY-XX
    const currentYear = new Date().getFullYear();
    const count = await Intern.countDocuments();
    const padded = (count + 1).toString().padStart(2, '0');
    const internId = `INT-${currentYear}-${padded}`;

    const cleanUsername = (username || fullName.toLowerCase().replace(/\s+/g, '.')).trim().toLowerCase();
    const cleanPassword = password || 'intern123';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanPassword, salt);

    const skillsArray = Array.isArray(technicalSkills) && technicalSkills.length > 0
      ? technicalSkills
      : Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      : [];

    const interestsArray = Array.isArray(areaOfInterest) && areaOfInterest.length > 0
      ? areaOfInterest
      : Array.isArray(interests)
      ? interests
      : typeof interests === 'string'
      ? interests.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      : [];

    const newIntern = await Intern.create({
      internId,
      fullName: fullName.trim(),
      username: cleanUsername,
      email: email.trim().toLowerCase(),
      passwordHash,
      phoneNumber: phoneNumber || '',
      address: address || '',
      dob: dob || '',
      gender: gender || 'Prefer not to say',
      collegeName: collegeName.trim(),
      department: department.trim(),
      degree: degree.trim(),
      yearOfStudy: yearOfStudy || 'Junior Year',
      graduationYear: graduationYear || '2026',
      skills: skillsArray,
      interests: interestsArray,
      technicalSkills: skillsArray,
      areaOfInterest: interestsArray,
      customSkills: Array.isArray(customSkills) ? customSkills : [],
      customInterests: Array.isArray(customInterests) ? customInterests : [],
      designation: designation || 'Software Development Intern',
      internshipStartDate,
      internshipEndDate,
      profileImage: profileImage || '',
      accountStatus: 'active',
      createdBy: req.user?.id || 'PTS-CEO-001',
    });

    // Create Notification
    const notif = await Notification.create({
      notificationId: `notif-${Date.now()}`,
      recipientId: req.user?.id || 'PTS-CEO-001',
      recipientRole: 'admin',
      notificationTitle: 'New Intern Account Created – Phoenix Tech Solutions',
      notificationMessage: `Intern account generated for ${newIntern.fullName} (${internId}). Role: ${newIntern.designation}.`,
      notificationType: 'intern_registered',
      isRead: false,
    });
    broadcastNotification(notif);

    return res.status(201).json({
      success: true,
      message: `Intern ${newIntern.fullName} (${internId}) created successfully.`,
      intern: {
        internId: newIntern.internId,
        fullName: newIntern.fullName,
        username: newIntern.username,
        email: newIntern.email,
        collegeName: newIntern.collegeName,
        department: newIntern.department,
        designation: newIntern.designation,
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'An intern with this username or email already exists.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/interns/:id/profile-image - Upload profile image to MongoDB GridFS
router.post('/:id/profile-image', authenticate, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const intern = await Intern.findOne(getInternQuery(req.params.id));

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    // Authorization: Admin or own profile
    if (req.user?.role !== 'admin' && req.user?.id !== intern.internId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this profile image.' });
    }

    const bucket = getGridFSBucket();
    const filename = `avatar_${intern.internId}_${Date.now()}_${req.file.originalname}`;
    
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        contentType: req.file.mimetype,
        internId: intern.internId,
        originalFileName: req.file.originalname,
        uploadedAt: new Date(),
      },
    });

    const readable = new Readable();
    readable.push(req.file.buffer);
    readable.push(null);

    readable.pipe(uploadStream);

    uploadStream.on('error', (error) => {
      return res.status(500).json({ success: false, message: error.message });
    });

    uploadStream.on('finish', async () => {
      const fileUrl = `/api/files/${uploadStream.id}`;
      intern.profileImage = fileUrl;
      await intern.save();

      return res.json({
        success: true,
        message: 'Profile image uploaded to MongoDB GridFS successfully.',
        fileId: uploadStream.id,
        imageUrl: fileUrl,
      });
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/interns/:id - Update Intern details
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const intern = await Intern.findOne(getInternQuery(req.params.id));

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    const isAdmin = req.user?.role === 'admin';

    // If intern, can only edit specific contact fields
    if (!isAdmin) {
      if (req.user?.id !== intern.internId) {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }
      const { phoneNumber, address, interests, profileImage } = req.body;
      if (phoneNumber !== undefined) intern.phoneNumber = phoneNumber;
      if (address !== undefined) intern.address = address;
      if (interests !== undefined) intern.interests = interests;
      if (profileImage !== undefined) intern.profileImage = profileImage;
      await intern.save();
      return res.json({ success: true, message: 'Contact profile updated.', intern });
    }

    // Admin can update all fields
    const updates = { ...req.body };
    delete updates.passwordHash;
    delete updates.internId; // preserve immutable ID

    const updated = await Intern.findOneAndUpdate(
      { internId: intern.internId },
      { $set: updates },
      { new: true }
    ).select('-passwordHash');

    return res.json({ success: true, message: 'Intern profile updated by administrator.', intern: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/interns/:id/reset-password - Reset password (Admin only)
router.put('/:id/reset-password', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword.trim(), salt);

    const intern = await Intern.findOneAndUpdate(
      getInternQuery(req.params.id),
      { $set: { passwordHash } },
      { new: true }
    );

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    return res.json({ success: true, message: `Password reset successfully for ${intern.fullName}.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/interns/:id - Toggle active/deactive or delete
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const intern = await Intern.findOne(getInternQuery(req.params.id));

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    // Toggle status or delete based on query param
    const permanent = req.query.permanent === 'true';

    if (permanent) {
      await Intern.deleteOne({ _id: intern._id });
      return res.json({ success: true, message: `Intern ${intern.fullName} permanently deleted.` });
    } else {
      intern.accountStatus = intern.accountStatus === 'active' ? 'inactive' : 'active';
      await intern.save();
      return res.json({
        success: true,
        message: `Intern account status changed to ${intern.accountStatus}.`,
        accountStatus: intern.accountStatus,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
