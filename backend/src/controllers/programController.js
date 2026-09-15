import mongoose from 'mongoose';
import Program, { PROGRAM_TYPES, PROGRAM_STATUSES } from '../models/Program.js';
import store from '../utils/dataStore.js';

// In-memory fallback initialization
store.programs = store.programs || [];

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * @desc    Get all published scholarships & educational programs
 * @route   GET /api/programs
 * @access  Private (All authenticated roles: NGO, Student, Parent, Teacher, Head Master)
 */
export const getPrograms = async (req, res) => {
  try {
    const { type, status, search, myOnly } = req.query;
    const filter = {};

    if (type && type !== 'ALL') {
      filter.type = type;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    } else if (!myOnly && req.user.role !== 'ngo' && req.user.role !== 'headmaster_admin' && req.user.role !== 'admin') {
      // Students / Parents only view Active or Upcoming programs by default
      filter.status = { $in: ['Active', 'Upcoming'] };
    }

    if (myOnly === 'true' || (req.user.role === 'ngo' && myOnly === 'true')) {
      filter.postedBy = req.user._id;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { benefits: { $regex: search, $options: 'i' } },
        { organizationName: { $regex: search, $options: 'i' } },
      ];
    }

    let programs = [];
    if (isDbConnected()) {
      programs = await Program.find(filter)
        .populate('postedBy', 'name organizationName role email phone')
        .sort({ createdAt: -1 });
    } else {
      programs = store.programs.filter((p) => {
        if (filter.type && p.type !== filter.type) return false;
        if (filter.status && p.status !== filter.status) return false;
        if (filter.postedBy && String(p.postedBy) !== String(req.user._id)) return false;
        if (search) {
          const s = search.toLowerCase();
          return (
            p.title?.toLowerCase().includes(s) ||
            p.description?.toLowerCase().includes(s) ||
            p.organizationName?.toLowerCase().includes(s)
          );
        }
        return true;
      });
    }

    return res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (error) {
    console.error('getPrograms error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve scholarships and programs',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single scholarship or program by ID
 * @route   GET /api/programs/:id
 * @access  Private
 */
export const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    let program = null;

    if (isDbConnected()) {
      program = await Program.findById(id).populate('postedBy', 'name organizationName role email phone');
    } else {
      program = store.programs.find((p) => String(p._id) === String(id));
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship or program not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: program,
    });
  } catch (error) {
    console.error('getProgramById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve program details',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new scholarship or educational program
 * @route   POST /api/programs
 * @access  Private (NGO / Partner, Head Master, Admin)
 */
export const createProgram = async (req, res) => {
  try {
    const {
      title,
      type = 'Scholarship',
      description,
      eligibility,
      deadline,
      benefits,
      contactInfo,
      targetGrades = 'Class 6 - 12',
      status = 'Active',
      village = 'Sundarpur & Surrounding Villages',
    } = req.body;

    if (!title || !description || !eligibility) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, and eligibility',
      });
    }

    if (type && !PROGRAM_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid program type. Allowed types: ${PROGRAM_TYPES.join(', ')}`,
      });
    }

    const orgName = req.user.organizationName || req.user.name || 'Partner Foundation';
    const formattedGrades = Array.isArray(targetGrades)
      ? targetGrades.join(', ')
      : targetGrades
      ? String(targetGrades).trim()
      : 'Class 6 - 12';
    const deadlineDate = deadline
      ? new Date(deadline)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days
    const contact = contactInfo
      ? String(contactInfo).trim()
      : req.user.email || req.user.phone || 'support@educonnect.org';
    const benefitsStr = benefits
      ? String(benefits).trim()
      : 'Educational assistance and mentorship';

    const newProgramData = {
      title: title.trim(),
      type,
      description: description.trim(),
      eligibility: eligibility.trim(),
      deadline: deadlineDate,
      benefits: benefitsStr,
      contactInfo: contact,
      targetGrades: formattedGrades,
      organizationName: orgName,
      postedBy: req.user._id,
      status: PROGRAM_STATUSES.includes(status) ? status : 'Active',
      applicantsCount: 0,
      village: village ? String(village).trim() : 'Sundarpur',
    };

    let created = null;
    if (isDbConnected()) {
      created = await Program.create(newProgramData);
    } else {
      created = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...newProgramData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.programs.unshift(created);
    }

    return res.status(201).json({
      success: true,
      message: `${type} published successfully!`,
      data: created,
    });
  } catch (error) {
    console.error('createProgram error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to publish scholarship or program',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a scholarship or program
 * @route   PUT /api/programs/:id
 * @access  Private (Creator NGO or Admin)
 */
export const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    let program = null;

    if (isDbConnected()) {
      program = await Program.findById(id);
    } else {
      program = store.programs.find((p) => String(p._id) === String(id));
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship or program not found',
      });
    }

    // Authorization: only creator or admin can modify
    const isOwner = String(program.postedBy?._id || program.postedBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'headmaster_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit programs created by your organization.',
      });
    }

    const {
      title,
      type,
      description,
      eligibility,
      deadline,
      benefits,
      contactInfo,
      targetGrades,
      status,
      village,
      applicantsCount,
    } = req.body;

    if (title) program.title = title.trim();
    if (type && PROGRAM_TYPES.includes(type)) program.type = type;
    if (description) program.description = description.trim();
    if (eligibility) program.eligibility = eligibility.trim();
    if (deadline) program.deadline = new Date(deadline);
    if (benefits) program.benefits = benefits.trim();
    if (contactInfo) program.contactInfo = contactInfo.trim();
    if (targetGrades) {
      program.targetGrades = Array.isArray(targetGrades)
        ? targetGrades.join(', ')
        : String(targetGrades).trim();
    }
    if (status && PROGRAM_STATUSES.includes(status)) program.status = status;
    if (village) program.village = village.trim();
    if (typeof applicantsCount === 'number') program.applicantsCount = applicantsCount;

    if (isDbConnected()) {
      await program.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Program updated successfully',
      data: program,
    });
  } catch (error) {
    console.error('updateProgram error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update program',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete or archive a program
 * @route   DELETE /api/programs/:id
 * @access  Private (Creator NGO or Admin)
 */
export const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    let program = null;

    if (isDbConnected()) {
      program = await Program.findById(id);
    } else {
      program = store.programs.find((p) => String(p._id) === String(id));
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found',
      });
    }

    const isOwner = String(program.postedBy?._id || program.postedBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'headmaster_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete programs published by your organization.',
      });
    }

    if (isDbConnected()) {
      await Program.findByIdAndDelete(id);
    } else {
      store.programs = store.programs.filter((p) => String(p._id) !== String(id));
    }

    return res.status(200).json({
      success: true,
      message: 'Program removed successfully',
    });
  } catch (error) {
    console.error('deleteProgram error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete program',
      error: error.message,
    });
  }
};
