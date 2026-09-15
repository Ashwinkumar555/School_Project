import mongoose from 'mongoose';
import SupportRequest from '../models/SupportRequest.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import SupportRecord from '../models/SupportRecord.js';
import store from '../utils/dataStore.js';

// Helper: check if MongoDB is connected
const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * @desc    Get support requests filtered by caller role & permissions
 * @route   GET /api/support-requests
 * @access  Private (Parent, Village Head, Head Master, NGO)
 */
export const getSupportRequests = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    let filter = {};

    if (userRole === 'parent' || userRole === 'student_parent') {
      // Parents can ONLY view requests for their linked student or created by them
      let studentIds = [];
      if (isDbConnected()) {
        const students = await Student.find({
          $or: [
            { parentPhone: req.user.phone },
            { parentUser: userId },
            { _id: { $in: req.user.children || [] } },
          ],
        }).select('_id');
        studentIds = students.map((s) => s._id);
      } else {
        studentIds = store.students
          .filter(
            (s) =>
              s.parentPhone === req.user.phone ||
              String(s.parentUser?._id || s.parentUser) === String(userId)
          )
          .map((s) => s._id);
      }

      filter = {
        $or: [
          { requestedBy: userId },
          { student: { $in: studentIds } },
        ],
      };
    } else if (userRole === 'village_head') {
      // Village Local Head can view requests created by them OR for students in their village
      const rawVillage = req.user.village || 'Sundarpur';
      const cleanVillage = rawVillage.replace(/gram\s*panchayat/gi, '').trim();
      filter = {
        $or: [
          { requestedBy: userId },
          { requesterPhone: req.user.phone },
          { village: { $regex: new RegExp(cleanVillage || 'Sundarpur', 'i') } },
        ],
      };
    } else if (userRole === 'headmaster_admin' || userRole === 'admin') {
      // Head Master can view all institutional requests
      filter = {};
    } else if (userRole === 'ngo') {
      // NGO can view requests forwarded to them or generally forwarded to partners
      const orgName = req.user.organizationName || '';
      filter = {
        $or: [
          { targetNgo: userId },
          { 'ngoSupport.acceptedBy': userId },
          {
            status: {
              $in: ['Forwarded to NGO/Partner', 'Accepted', 'Ongoing', 'Completed'],
            },
            ...(orgName ? { targetNgoName: { $regex: new RegExp(orgName, 'i') } } : {}),
          },
          {
            status: 'Forwarded to NGO/Partner',
            targetNgo: { $exists: false },
          },
          {
            status: 'Forwarded to NGO/Partner',
            targetNgo: null,
          },
        ],
      };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Your role is not authorized to view support requests.',
      });
    }

    // Optional query parameter filtering
    if (req.query.status && req.query.status !== 'ALL') {
      filter.status = req.query.status;
    }
    if (req.query.category && req.query.category !== 'ALL') {
      filter.category = req.query.category;
    }
    if (req.query.priority && req.query.priority !== 'ALL') {
      filter.priority = req.query.priority;
    }

    let requests = [];
    if (isDbConnected()) {
      const studentFields = userRole === 'ngo'
        ? 'name rollNumber class section village'
        : 'name rollNumber class section parentName parentPhone village';

      const query = SupportRequest.find(filter)
        .populate('student', studentFields)
        .populate('requestedBy', 'name role organizationName village')
        .populate('targetNgo', 'name organizationName phone email')
        .sort({ createdAt: -1 });

      if (userRole === 'ngo') {
        query.select('-requesterPhone');
      }

      requests = await query;
    } else {
      // Fallback in-memory filter
      requests = store.supportRequests.filter((r) => {
        if (userRole === 'parent' || userRole === 'student_parent') {
          return String(r.requestedBy) === String(userId) || r.requesterPhone === req.user.phone;
        }
        if (userRole === 'village_head') {
          return (
            String(r.requestedBy) === String(userId) ||
            r.village?.toLowerCase() === (req.user.village || 'sundarpur').toLowerCase()
          );
        }
        if (userRole === 'ngo') {
          return (
            String(r.targetNgo) === String(userId) ||
            r.status === 'Forwarded to NGO/Partner' ||
            r.status === 'Accepted' ||
            r.status === 'Ongoing' ||
            r.status === 'Completed'
          );
        }
        return true;
      });
    }

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('getSupportRequests error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve support requests',
      error: error.message,
    });
  }
};

/**
 * @desc    Get eligible students for creating support requests (Parent or Village Head)
 * @route   GET /api/support-requests/eligible-students
 * @access  Private (Parent, Village Head, Admin)
 */
export const getEligibleStudents = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    let students = [];

    if (userRole === 'parent' || userRole === 'student_parent') {
      const normPhone = normalizePhone(req.user.phone);
      const userName = (req.user.name || '').trim();
      const userNameLower = userName.toLowerCase();
      const userChildren = (req.user.children || []).map(String);

      if (isDbConnected()) {
        const conditions = [
          ...(req.user.phone ? [{ parentPhone: req.user.phone }] : []),
          ...(normPhone ? [{ parentPhone: { $regex: normPhone + '$', $options: 'i' } }] : []),
          ...(mongoose.Types.ObjectId.isValid(userId) ? [{ parentUser: userId }] : []),
          ...(userChildren.length ? [{ _id: { $in: userChildren.filter(id => mongoose.Types.ObjectId.isValid(id)) } }] : []),
          ...(userName ? [{ parentName: new RegExp('^' + userName + '$', 'i') }] : []),
        ];
        students = await Student.find(conditions.length ? { $or: conditions } : { _id: null }).populate('class', 'name grade section');
      } else {
        students = store.students.filter(
          (s) =>
            userChildren.includes(String(s._id)) ||
            (req.user.phone && s.parentPhone === req.user.phone) ||
            (normPhone && normalizePhone(s.parentPhone) === normPhone) ||
            (userNameLower && (s.parentName || '').toLowerCase().trim() === userNameLower) ||
            String(s.parentUser?._id || s.parentUser) === String(userId)
        );
      }
    } else if (userRole === 'village_head') {
      const village = req.user.village || 'Sundarpur';
      if (isDbConnected()) {
        students = await Student.find({
          village: { $regex: new RegExp(village, 'i') },
        }).populate('class', 'name grade section');
        // If none strictly found, return first batch of village students as fallback
        if (students.length === 0) {
          students = await Student.find().limit(10).populate('class', 'name grade section');
        }
      } else {
        students = store.students;
      }
    } else if (userRole === 'headmaster_admin' || userRole === 'admin') {
      if (isDbConnected()) {
        students = await Student.find().populate('class', 'name grade section');
      } else {
        students = store.students;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Your role is not authorized to select students for support requests.',
      });
    }

    // Sanitize output (name, roll, class, village, admissionNumber)
    const sanitized = students.map((s) => ({
      _id: s._id,
      name: s.name,
      rollNumber: s.rollNumber,
      admissionNumber: s.admissionNumber,
      class: s.class?.name || (typeof s.class === 'string' ? s.class : 'Class 8-A'),
      section: s.section || 'A',
      village: s.village || 'Sundarpur',
    }));

    return res.status(200).json({
      success: true,
      count: sanitized.length,
      data: sanitized,
    });
  } catch (error) {
    console.error('getEligibleStudents error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve eligible students',
      error: error.message,
    });
  }
};

/**
 * @desc    Get verified NGOs for forwarding
 * @route   GET /api/support-requests/ngos
 * @access  Private (Headmaster / Admin)
 */
export const getNgoList = async (req, res) => {
  try {
    let ngos = [];
    if (isDbConnected()) {
      ngos = await User.find({ role: 'ngo' }).select(
        '_id name organizationName email phone designation village district'
      );
    } else {
      ngos = store.users.filter((u) => u.role === 'ngo');
    }

    return res.status(200).json({
      success: true,
      count: ngos.length,
      data: ngos,
    });
  } catch (error) {
    console.error('getNgoList error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve NGO directory',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single support request by ID
 * @route   GET /api/support-requests/:id
 * @access  Private
 */
export const getSupportRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    let request = null;

    if (isDbConnected()) {
      request = await SupportRequest.findById(id)
        .populate('student', 'name rollNumber class section parentName parentPhone village')
        .populate('requestedBy', 'name phone role organizationName village')
        .populate('targetNgo', 'name organizationName phone email');
    } else {
      request = store.supportRequests.find((r) => String(r._id) === String(id));
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found',
      });
    }

    // Role-based visibility check
    const userRole = req.user.role;
    const userId = String(req.user._id);

    if (userRole === 'parent' || userRole === 'student_parent') {
      const isOwner = String(request.requestedBy?._id || request.requestedBy) === userId;
      const isChild = request.requesterPhone === req.user.phone;
      if (!isOwner && !isChild) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view support requests for your linked children.',
        });
      }
    } else if (userRole === 'village_head') {
      const isOwner = String(request.requestedBy?._id || request.requestedBy) === userId || request.requesterPhone === req.user.phone;
      const rawV = req.user.village || 'Sundarpur';
      const cleanV = rawV.toLowerCase().replace(/gram\s*panchayat/gi, '').trim();
      const sameVillage = (request.village || '').toLowerCase().includes(cleanV);
      if (!isOwner && !sameVillage) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view requests for students in your village.',
        });
      }
    } else if (userRole === 'ngo') {
      const isTarget =
        String(request.targetNgo?._id || request.targetNgo) === userId ||
        request.status === 'Forwarded to NGO/Partner' ||
        request.status === 'Accepted' ||
        request.status === 'Completed';
      if (!isTarget) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This support request was not forwarded to your organization.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('getSupportRequestById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve support request details',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new support request
 * @route   POST /api/support-requests
 * @access  Private (Parent, Village Head, Admin)
 */
export const createSupportRequest = async (req, res) => {
  try {
    const {
      studentId,
      category,
      title,
      description,
      priority = 'Medium',
      estimatedAmount = 0,
      supportRequired = '',
    } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a student for the support request',
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid support category',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed description of the support needed',
      });
    }

    // Validate studentId is a valid MongoDB ObjectId
    if (isDbConnected() && !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format. Must be a valid MongoDB ObjectId.',
      });
    }

    // Lookup student in DB or fallback store
    let student = null;
    if (isDbConnected()) {
      student = await Student.findById(studentId).populate('class', 'name grade section');
    } else {
      student = store.students.find((s) => String(s._id) === String(studentId));
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Selected student not found in database. Please choose an active student.',
      });
    }

    const userRole = req.user.role;
    let userId = req.user._id;

    // Resolve userId to MongoDB ObjectId if needed
    if (isDbConnected() && !mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const mongoUser = await User.findOne({
          $or: [
            ...(req.user.phone ? [{ phone: req.user.phone }] : []),
            ...(req.user.pNo ? [{ pNo: req.user.pNo }] : []),
          ],
        });
        if (mongoUser) {
          userId = mongoUser._id;
        }
      } catch (uErr) {
        console.warn('Could not resolve mongo user ID for support request:', uErr.message);
      }
    }

    // Permission validations
    if (userRole === 'parent' || userRole === 'student_parent') {
      const isPhoneMatch = student.parentPhone === req.user.phone;
      const isUserMatch = String(student.parentUser?._id || student.parentUser) === String(userId);
      const isChildrenList = (req.user.children || []).some(
        (c) => String(c) === String(student._id)
      );

      if (!isPhoneMatch && !isUserMatch && !isChildrenList) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only create support requests for your linked children.',
        });
      }
    } else if (userRole === 'village_head') {
      const userVillage = (req.user.village || 'Sundarpur').trim();
      const studentVillage = (student.village || '').trim();

      // Normalize village names to avoid false rejection due to prefixes/suffixes
      const cleanVillage = (str) =>
        str
          .toLowerCase()
          .replace(/gram\s*panchayat|ward\s*\d+|village|center|west|east|north|south/gi, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();

      const normUser = cleanVillage(userVillage);
      const normStudent = cleanVillage(studentVillage);

      const isMatch =
        !studentVillage ||
        !userVillage ||
        studentVillage.toLowerCase().includes(userVillage.toLowerCase()) ||
        userVillage.toLowerCase().includes(studentVillage.toLowerCase()) ||
        (normUser && normStudent && (normUser.includes(normStudent) || normStudent.includes(normUser)));

      if (!isMatch) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You can only create support requests for students residing in ${req.user.village || 'your village'}. Selected student belongs to '${student.village || 'another village'}'.`,
        });
      }
    } else if (userRole !== 'headmaster_admin' && userRole !== 'admin' && userRole !== 'villager') {
      return res.status(403).json({
        success: false,
        message: 'Your role is not authorized to create support requests.',
      });
    }

    const finalTitle =
      title && title.trim()
        ? title.trim().slice(0, 150)
        : `${category} support for ${student.name}`;

    const requesterName =
      (req.user.name && req.user.name.trim()) ||
      (userRole === 'village_head' ? 'Village Local Head' : (userRole === 'parent' ? 'Parent / Guardian' : 'EduConnect Requester'));
    const requesterPhone = (req.user.phone && req.user.phone.trim()) || req.user.pNo || '';

    const newRequestData = {
      student: student._id,
      studentName: student.name,
      studentRoll: student.rollNumber || '',
      studentClass: student.class?.name || (typeof student.class === 'string' ? student.class : 'Class 8-A'),
      village: student.village || req.user.village || 'Sundarpur',
      schoolName: student.schoolName || 'Govt Higher Secondary School',
      requestedBy: userId,
      requesterRole: userRole,
      requesterName,
      requesterPhone,
      category,
      title: finalTitle,
      description: description.trim(),
      priority: ['Low', 'Medium', 'High', 'Urgent'].includes(priority) ? priority : 'Medium',
      estimatedAmount: Math.max(0, Number(estimatedAmount) || 0),
      supportRequired: (supportRequired || '').trim(),
      status: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          changedBy: userId,
          changerName: requesterName,
          changerRole: userRole,
          note: `Support request submitted by ${requesterName} (${userRole === 'village_head' ? 'Village Local Head' : 'Parent / Guardian'})`,
          timestamp: new Date(),
        },
      ],
    };

    let created = null;
    if (isDbConnected()) {
      created = await SupportRequest.create(newRequestData);
    } else {
      created = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...newRequestData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.supportRequests.unshift(created);
    }

    return res.status(201).json({
      success: true,
      message: 'Support request created successfully',
      data: created,
    });
  } catch (error) {
    console.error('createSupportRequest error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create support request',
      error: error.message,
    });
  }
};

/**
 * @desc    Review & verify support request (Head Master / Admin)
 * @route   PUT /api/support-requests/:id/review
 * @access  Private (Headmaster / Admin)
 */
export const reviewSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewNotes = '', targetNgoId = null, targetNgoName = '' } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Review action is required (Approve, Reject, Request Information, Forward to NGO/Partner)',
      });
    }

    let request = null;
    if (isDbConnected()) {
      request = await SupportRequest.findById(id);
    } else {
      request = store.supportRequests.find((r) => String(r._id) === String(id));
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found',
      });
    }

    let newStatus = request.status;
    let historyNote = reviewNotes;

    if (action === 'Approve') {
      newStatus = 'Approved';
      request.headMasterReview = {
        reviewedBy: req.user._id,
        reviewerName: req.user.name,
        decision: 'Approved',
        reviewNotes,
        reviewedAt: new Date(),
      };
      historyNote = reviewNotes || 'Request verified and approved by Head Master.';
    } else if (action === 'Reject') {
      newStatus = 'Rejected';
      request.headMasterReview = {
        reviewedBy: req.user._id,
        reviewerName: req.user.name,
        decision: 'Rejected',
        reviewNotes,
        reviewedAt: new Date(),
      };
      historyNote = reviewNotes || 'Request rejected by Head Master.';
    } else if (action === 'Request Information' || action === 'Under Review') {
      newStatus = 'Under Review';
      request.headMasterReview = {
        reviewedBy: req.user._id,
        reviewerName: req.user.name,
        decision: 'Request Information',
        reviewNotes,
        reviewedAt: new Date(),
      };
      historyNote = reviewNotes || 'Head Master requested additional information.';
    } else if (action === 'Forward to NGO/Partner' || action === 'Forward') {
      newStatus = 'Forwarded to NGO/Partner';

      let ngoName = targetNgoName;
      if (targetNgoId && !ngoName && isDbConnected()) {
        const ngoUser = await User.findById(targetNgoId);
        if (ngoUser) {
          ngoName = ngoUser.organizationName || ngoUser.name;
        }
      }

      request.headMasterReview = {
        reviewedBy: req.user._id,
        reviewerName: req.user.name,
        decision: 'Forwarded',
        reviewNotes,
        reviewedAt: new Date(),
      };
      request.targetNgo = targetNgoId || null;
      request.targetNgoName = ngoName || 'Partner NGOs';
      request.forwardedAt = new Date();

      historyNote = `Forwarded to ${ngoName || 'NGO/Partner'} by Head Master. ${reviewNotes ? `Note: ${reviewNotes}` : ''}`;
    } else {
      return res.status(400).json({
        success: false,
        message: `Invalid review action '${action}'`,
      });
    }

    request.status = newStatus;
    request.statusHistory.push({
      status: newStatus,
      changedBy: req.user._id,
      changerName: req.user.name,
      changerRole: req.user.role,
      note: historyNote,
      timestamp: new Date(),
    });

    if (isDbConnected()) {
      await request.save();
    }

    return res.status(200).json({
      success: true,
      message: `Support request updated to ${newStatus}`,
      data: request,
    });
  } catch (error) {
    console.error('reviewSupportRequest error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to review support request',
      error: error.message,
    });
  }
};

/**
 * @desc    Provide support / respond to forwarded request (NGO / Partner)
 * @route   PUT /api/support-requests/:id/respond
 * @access  Private (NGO / Partner)
 */
export const respondToSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      action, // 'Accept', 'Ongoing', 'Reject', 'Completed'
      supportType = 'In-Kind Educational Supplies',
      supportDetails = '',
      completionNotes = '',
      rejectionReason = '',
    } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required (Accept, Ongoing, Reject, Completed)',
      });
    }

    let request = null;
    if (isDbConnected()) {
      request = await SupportRequest.findById(id);
    } else {
      request = store.supportRequests.find((r) => String(r._id) === String(id));
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found',
      });
    }

    const partnerName = req.user.organizationName || req.user.name;
    let newStatus = request.status;
    let historyNote = '';

    if (action === 'Accept' || action === 'Accepted') {
      newStatus = 'Accepted';
      request.ngoSupport = {
        ...(request.ngoSupport || {}),
        acceptedBy: req.user._id,
        ngoName: partnerName,
        supportType,
        supportDetails: supportDetails || 'Committed to fulfill requested educational materials.',
        fulfillmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expected within 7 days
      };
      historyNote = `Request accepted by ${partnerName}. Pledged: ${supportType} - ${supportDetails || 'Educational support'}`;
    } else if (action === 'Ongoing' || action === 'In Progress') {
      newStatus = 'Ongoing';
      request.ngoSupport = {
        ...(request.ngoSupport || {}),
        acceptedBy: req.user._id,
        ngoName: partnerName,
        supportType: supportType || request.ngoSupport?.supportType || 'In-Kind Educational Supplies',
        supportDetails: supportDetails || request.ngoSupport?.supportDetails || 'Support in progress / items being arranged',
      };
      historyNote = `Support marked as Ongoing by ${partnerName}. Details: ${supportDetails || 'Fulfillment in progress'}`;
    } else if (action === 'Reject' || action === 'Rejected') {
      newStatus = 'Rejected';
      request.ngoSupport = {
        ...(request.ngoSupport || {}),
        acceptedBy: req.user._id,
        ngoName: partnerName,
        rejectionReason: rejectionReason || 'Unable to fulfill this request at this time.',
      };
      historyNote = `Request declined by ${partnerName}. Reason: ${rejectionReason || 'Capacity constraints'}`;
    } else if (action === 'Completed') {
      newStatus = 'Completed';
      request.ngoSupport = {
        ...(request.ngoSupport || {}),
        acceptedBy: req.user._id,
        ngoName: partnerName,
        supportType: supportType || request.ngoSupport?.supportType || 'Direct Educational Support',
        supportDetails: supportDetails || request.ngoSupport?.supportDetails || 'Educational items handed over',
        fulfillmentDate: new Date(),
        completionNotes: completionNotes || 'Support successfully provided and handed over to student.',
      };
      historyNote = `Support marked as Completed by ${partnerName}. ${completionNotes || 'Items handed over successfully.'}`;

      // Automatically sync/upsert into SupportRecord for unified Support Management tracking
      if (isDbConnected()) {
        try {
          const mapCategoryToType = (cat) => {
            if (!cat) return 'Educational materials';
            if (cat.includes('Books')) return 'Books';
            if (cat.includes('Uniform')) return 'Uniforms';
            if (cat.includes('Bag')) return 'School bags';
            if (cat.includes('Laptop') || cat.includes('Tablet') || cat.includes('Digital')) return 'Laptops/Tablets';
            if (cat.includes('Scholarship') || cat.includes('Financial')) return 'Scholarships';
            return 'Educational materials';
          };

          await SupportRecord.findOneAndUpdate(
            { linkedSupportRequest: request._id },
            {
              ngo: req.user._id,
              organizationName: partnerName,
              recipientType: 'Student',
              beneficiaryName: request.studentName,
              studentId: request.student,
              schoolName: request.schoolName || 'Govt Higher Secondary School',
              village: request.village || 'Sundarpur',
              supportType: mapCategoryToType(request.category),
              itemDetails: `${request.title}: ${supportDetails || request.supportRequired || 'Educational support delivered'}`,
              quantity: 1,
              amount: request.estimatedAmount || 0,
              dateProvided: new Date(),
              status: 'Completed',
              notes: completionNotes || 'Fulfilled via EduConnect Support Request system',
              linkedSupportRequest: request._id,
            },
            { upsert: true, new: true }
          );
        } catch (recErr) {
          console.warn('Auto SupportRecord sync notice:', recErr.message);
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Invalid action '${action}' for NGO partner. Allowed actions: Accept, Ongoing, Reject, Completed.`,
      });
    }

    request.status = newStatus;
    request.statusHistory.push({
      status: newStatus,
      changedBy: req.user._id,
      changerName: partnerName,
      changerRole: 'ngo',
      note: historyNote,
      timestamp: new Date(),
    });

    if (isDbConnected()) {
      await request.save();
    }

    return res.status(200).json({
      success: true,
      message: `Support request updated to ${newStatus}`,
      data: request,
    });
  } catch (error) {
    console.error('respondToSupportRequest error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update support request',
      error: error.message,
    });
  }
};
