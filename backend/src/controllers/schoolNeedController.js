import SchoolNeed from '../models/SchoolNeed.js';
import store from '../utils/dataStore.js';
import mongoose from 'mongoose';

/**
 * @desc    Get all verified school needs
 * @route   GET /api/school-needs
 * @access  Public / Authenticated
 */
export const getSchoolNeeds = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const needs = await SchoolNeed.find()
          .populate('createdBy', 'name role')
          .populate('linkedDrive', 'title status fulfilledQuantity pledgedQuantity')
          .sort({ urgency: -1, createdAt: -1 });

        return res.status(200).json({
          success: true,
          count: needs.length,
          data: needs,
        });
      } catch (dbErr) {
        console.warn('DB error, using store for school needs:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      count: store.schoolNeeds.length,
      data: store.schoolNeeds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single school need details
 * @route   GET /api/school-needs/:id
 * @access  Public / Authenticated
 */
export const getSchoolNeedById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      try {
        const need = await SchoolNeed.findById(id).populate('createdBy linkedDrive');
        if (need) return res.status(200).json({ success: true, data: need });
      } catch (dbErr) {
        console.warn('DB error on getSchoolNeedById');
      }
    }

    const need = store.schoolNeeds.find((n) => n._id.toString() === id.toString()) || store.schoolNeeds[0];
    return res.status(200).json({
      success: true,
      data: need,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new verified school need (Admin only)
 * @route   POST /api/school-needs
 * @access  Private (Admin)
 */
export const createSchoolNeed = async (req, res, next) => {
  try {
    const { title, description, category, urgency, targetDepartment, requiredQuantity, unit, estimatedCost } = req.body;

    if (!title || !description || !requiredQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and required quantity are required',
      });
    }

    const qty = Number(requiredQuantity);
    const newNeed = {
      _id: `need-${Date.now()}`,
      title,
      description,
      category: category || 'IT & Computers',
      urgency: urgency || 'High',
      targetDepartment: targetDepartment || 'Computer Lab',
      requiredQuantity: qty,
      receivedQuantity: 0,
      remainingQuantity: qty,
      unit: unit || 'Units',
      estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
      status: 'Open',
      verifiedByAdmin: true,
      createdAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const created = await SchoolNeed.create(newNeed);
        store.schoolNeeds.unshift(created.toObject());
        return res.status(201).json({
          success: true,
          message: 'School need requisition created and published successfully',
          data: created,
        });
      } catch (dbErr) {
        console.warn('DB error on createSchoolNeed, saving to store:', dbErr.message);
      }
    }

    store.schoolNeeds.unshift(newNeed);

    return res.status(201).json({
      success: true,
      message: 'School need requisition created and published successfully',
      data: newNeed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update school need details or status
 * @route   PUT /api/school-needs/:id
 * @access  Private (Admin)
 */
export const updateSchoolNeed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const need = store.schoolNeeds.find((n) => n._id.toString() === id.toString());
    if (need) {
      Object.assign(need, req.body);
      need.remainingQuantity = Math.max(0, need.requiredQuantity - (need.receivedQuantity || 0));
      return res.status(200).json({ success: true, data: need });
    }

    return res.status(404).json({ success: false, message: 'School need not found' });
  } catch (error) {
    next(error);
  }
};
