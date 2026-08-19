import CommunityDrive from '../models/CommunityDrive.js';
import store from '../utils/dataStore.js';
import mongoose from 'mongoose';

/**
 * @desc    Get all community support drives
 * @route   GET /api/drives
 * @access  Public / Authenticated
 */
export const getCommunityDrives = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const drives = await CommunityDrive.find().populate('schoolNeed organizedBy');
        return res.status(200).json({ success: true, count: drives.length, data: drives });
      } catch (dbErr) {
        console.warn('DB error on getCommunityDrives:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      count: store.communityDrives.length,
      data: store.communityDrives,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single drive details with linked contributions
 * @route   GET /api/drives/:id
 * @access  Public / Authenticated
 */
export const getDriveById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const drive = store.communityDrives.find((d) => d._id.toString() === id.toString()) || store.communityDrives[0];
    const contributions = store.contributions.filter(
      (c) => c.drive?._id?.toString() === id.toString() || c.drive?.toString() === id.toString()
    );

    return res.status(200).json({
      success: true,
      data: {
        ...drive,
        contributions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new community support drive (Local Head / Admin)
 * @route   POST /api/drives
 * @access  Private (Village Head, Admin)
 */
export const createCommunityDrive = async (req, res, next) => {
  try {
    const { title, description, schoolNeedId, targetQuantity, unit, impactMessage } = req.body;

    if (!title || !schoolNeedId || !targetQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Drive title, linked school need, and target quantity are required',
      });
    }

    const need = store.schoolNeeds.find((n) => n._id.toString() === schoolNeedId.toString()) || store.schoolNeeds[0];

    const newDrive = {
      _id: `drive-${Date.now()}`,
      title,
      description: description || need?.description || '',
      schoolNeed: need,
      organizedBy: req.user._id,
      organizerName: req.user.name,
      village: req.user.village || 'Sundarpur Gram Panchayat',
      targetQuantity: Number(targetQuantity),
      fulfilledQuantity: need?.receivedQuantity || 0,
      pledgedQuantity: need?.receivedQuantity || 0,
      unit: unit || need?.unit || 'Units',
      impactMessage: impactMessage || 'Supporting our village school children.',
      status: 'Active',
      contributionsCount: 0,
      createdAt: new Date(),
    };

    if (need) {
      need.linkedDrive = newDrive._id;
      need.status = 'Drive Created';
    }

    store.communityDrives.unshift(newDrive);

    return res.status(201).json({
      success: true,
      message: 'Community support drive launched successfully!',
      data: newDrive,
    });
  } catch (error) {
    next(error);
  }
};
