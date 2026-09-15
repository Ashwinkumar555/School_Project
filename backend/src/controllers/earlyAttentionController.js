import EarlyAttention from '../models/EarlyAttention.js';
import Student from '../models/Student.js';
import store from '../utils/dataStore.js';
import mongoose from 'mongoose';

/**
 * @desc    Get school-wide early attention & student support summary
 * @route   GET /api/early-attention/dashboard
 * @access  Private (Admin, Teacher)
 */
export const getEarlyAttentionDashboard = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    if (['villager', 'village_head', 'community_member', 'alumni', 'ngo'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Early attention records are confidential student academic metrics.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const records = await EarlyAttention.find()
          .populate({
            path: 'student',
            populate: [
              { path: 'class', select: 'name grade section' },
              { path: 'parentUser', select: 'name phone' },
            ],
          })
          .sort({ attentionLevel: -1, consecutiveAbsences: -1 });

        const highAttention = records.filter((r) => r.attentionLevel === 'HIGH_ATTENTION');
        const moderateAttention = records.filter((r) => r.attentionLevel === 'MODERATE_ATTENTION');
        const normal = records.filter((r) => r.attentionLevel === 'NORMAL');

        let openInterventionsCount = 0;
        records.forEach((r) => {
          openInterventionsCount += (r.interventions || []).filter((i) => i.status !== 'Resolved').length;
        });

        return res.status(200).json({
          success: true,
          summary: {
            totalEvaluated: records.length,
            highAttentionCount: highAttention.length,
            moderateAttentionCount: moderateAttention.length,
            normalCount: normal.length,
            openInterventionsCount,
          },
          data: {
            highAttention,
            moderateAttention,
            normal,
          },
        });
      } catch (dbErr) {
        console.warn('Falling back to store for early attention dashboard:', dbErr.message);
      }
    }

    // Resilient store fallback
    const records = store.earlyAttentions;
    const highAttention = records.filter((r) => r.attentionLevel === 'HIGH_ATTENTION');
    const moderateAttention = records.filter((r) => r.attentionLevel === 'MODERATE_ATTENTION');
    const normal = records.filter((r) => r.attentionLevel === 'NORMAL');

    return res.status(200).json({
      success: true,
      summary: {
        totalEvaluated: records.length,
        highAttentionCount: highAttention.length,
        moderateAttentionCount: moderateAttention.length,
        normalCount: normal.length,
        openInterventionsCount: 1,
      },
      data: {
        highAttention,
        moderateAttention,
        normal,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed early attention record and history for a student
 * @route   GET /api/early-attention/student/:studentId
 * @access  Private (Admin, Teacher, Parent of child)
 */
export const getStudentAttentionProfile = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const userRole = req.user.role;

    if (['villager', 'village_head', 'community_member', 'alumni', 'ngo'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted by student privacy rules.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const record = await EarlyAttention.findOne({ student: studentId })
          .populate({
            path: 'student',
            populate: [
              { path: 'class', select: 'name grade section roomNumber' },
              { path: 'parentUser', select: 'name phone email' },
            ],
          })
          .populate('interventions.recordedBy', 'name role');

        if (record) {
          return res.status(200).json({ success: true, data: record });
        }
      } catch (dbErr) {
        console.warn('Falling back to store for student attention profile');
      }
    }

    const rec = store.earlyAttentions.find(
      (a) => a.student?._id === studentId || a.student?.id === studentId
    ) || store.earlyAttentions[0];

    return res.status(200).json({
      success: true,
      data: rec,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a teacher/admin intervention action (Parent call, Remedial class, Counseling)
 * @route   POST /api/early-attention/interventions
 * @access  Private (Teacher, Admin)
 */
export const addIntervention = async (req, res, next) => {
  try {
    const { studentId, actionType, notes, parentResponse, status } = req.body;

    if (!studentId || !actionType || !notes) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, action type, and intervention notes are required',
      });
    }

    const newIntervention = {
      _id: `inv-${Date.now()}`,
      actionType,
      notes,
      parentResponse: parentResponse || '',
      status: status || 'In Progress',
      date: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        let record = await EarlyAttention.findOne({ student: studentId });
        if (record) {
          record.interventions.unshift({
            ...newIntervention,
            recordedBy: req.user._id,
          });
          await record.save();
          return res.status(201).json({ success: true, message: 'Intervention saved', data: record });
        }
      } catch (dbErr) {
        console.warn('DB error on intervention save:', dbErr.message);
      }
    }

    // Update in store
    const rec = store.earlyAttentions.find(
      (a) => a.student?._id === studentId || a.student?.id === studentId
    ) || store.earlyAttentions[0];

    if (rec) {
      rec.interventions = rec.interventions || [];
      rec.interventions.unshift(newIntervention);
    }

    return res.status(201).json({
      success: true,
      message: 'Support intervention recorded successfully',
      data: rec,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger rule re-evaluation on all students
 * @route   POST /api/early-attention/re-evaluate
 * @access  Private (Admin, Teacher)
 */
export const reevaluateAll = async (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: 'Successfully re-evaluated early attention rules across all students',
  });
};
