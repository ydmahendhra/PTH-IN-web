import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/admin/profile
router.get('/profile', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = await Admin.findOne({ adminId: req.user?.id }).select('-passwordHash');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
    return res.json({ success: true, admin });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/profile
router.put('/profile', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, contactNumber, designation, department, contactInfo } = req.body;
    const admin = await Admin.findOneAndUpdate(
      { adminId: req.user?.id },
      {
        $set: {
          name,
          email,
          contactNumber,
          designation,
          department,
          contactInfo,
        },
      },
      { new: true }
    ).select('-passwordHash');

    return res.json({ success: true, message: 'Admin profile updated successfully.', admin });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin - list all admins
router.get('/', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const admins = await Admin.find().select('-passwordHash').sort({ createdAt: 1 });
    return res.json({ success: true, admins });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/create - create an additional admin
router.post('/create', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, designation, department, contactNumber } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required admin fields.' });
    }

    const count = await Admin.countDocuments();
    const adminId = `ADM-${1001 + count}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = await Admin.create({
      adminId,
      name,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      designation: designation || 'Project Administrator',
      department: department || 'Operations',
      contactNumber: contactNumber || '',
      role: 'admin',
      accountStatus: 'active',
    });

    return res.status(201).json({
      success: true,
      message: `Admin ${newAdmin.name} (${adminId}) created successfully.`,
      admin: {
        adminId: newAdmin.adminId,
        name: newAdmin.name,
        username: newAdmin.username,
        email: newAdmin.email,
        designation: newAdmin.designation,
        department: newAdmin.department,
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'An admin with this username or email already exists.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/reset-password - securely update admin password
router.post('/reset-password', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields (current password, new password, and confirmation) are required.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters in length.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be identical to the current password.',
      });
    }

    const admin = await Admin.findOne({ adminId: req.user?.id });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password verification failed. Please check your current password.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    admin.passwordHash = passwordHash;
    await admin.save();

    return res.json({
      success: true,
      message: 'Password updated successfully. Your new credentials are now active.',
    });
  } catch (err: any) {
    console.error('Password reset error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during password update. Please try again.',
    });
  }
});

export default router;
