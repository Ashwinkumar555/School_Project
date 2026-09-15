import mongoose from 'mongoose';
import Communication, { COMMUNICATION_TYPES, COMMUNICATION_STATUSES } from '../models/Communication.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import store from '../utils/dataStore.js';
import { normalizePhone } from './authController.js';

store.communications = store.communications || [];

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Helper to verify whether a student is linked to the parent
 */
const verifyStudentBelongsToParent = async (studentId, user) => {
  let student = null;
  if (isDbConnected() && mongoose.Types.ObjectId.isValid(studentId)) {
    student = await Student.findById(studentId).populate('class');
  }
  if (!student) {
    student = store.students.find(
      (s) => String(s._id) === String(studentId) || String(s.id) === String(studentId)
    );
  }
  if (!student) return { linked: false, student: null };

  const userId = String(user._id || user.id || '');
  const userPhone = user.phone || '';
  const userNormPhone = normalizePhone(userPhone);
  const userName = (user.name || '').toLowerCase().trim();
  const sNormPhone = normalizePhone(student.parentPhone);
  const sParentName = (student.parentName || '').toLowerCase().trim();
  const sParentUser = String(student.parentUser?._id || student.parentUser || '');
  const userChildren = (user.children || []).map((c) => String(c?._id || c));

  const isParentMatch =
    (sParentUser && sParentUser === userId) ||
    (userNormPhone && sNormPhone && (userNormPhone === sNormPhone || student.parentPhone === userPhone)) ||
    (userName && sParentName && (sParentName === userName || sParentName.includes(userName) || userName.includes(sParentName))) ||
    userChildren.includes(String(student._id));

  return { linked: !!isParentMatch, student };
};

/**
 * @desc    Get communications list scoped by role
 * @route   GET /api/communications
 * @access  Private
 */
export const getCommunications = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    const userPhone = req.user.phone;

    let filter = {};

    if (userRole === 'parent' || userRole === 'student_parent') {
      const userNormPhone = normalizePhone(userPhone);
      filter = {
        $or: [
          { parent: userId },
          ...(userPhone ? [{ parentPhone: userPhone }] : []),
          ...(userNormPhone ? [{ parentPhone: { $regex: userNormPhone + '$', $options: 'i' } }] : []),
        ],
      };
    } else if (userRole === 'teacher') {
      filter = {
        $or: [
          { teacher: userId },
          { teacher: null },
          { status: { $in: ['Pending', 'Replied', 'Meeting Scheduled'] } },
        ],
      };
    } else if (userRole !== 'headmaster_admin' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have permission to view teacher communications.',
      });
    }

    let communications = [];
    if (isDbConnected()) {
      communications = await Communication.find(filter)
        .sort({ createdAt: -1 })
        .populate('parent', 'name phone email')
        .populate('teacher', 'name phone email');
    } else {
      communications = store.communications.filter((c) => {
        if (userRole === 'parent' || userRole === 'student_parent') {
          return String(c.parent) === String(userId) || (userPhone && c.parentPhone === userPhone);
        }
        return true;
      });
    }

    return res.status(200).json({
      success: true,
      count: communications.length,
      data: communications,
    });
  } catch (error) {
    console.error('getCommunications error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve communications',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new teacher communication / query / meeting request
 * @route   POST /api/communications
 * @access  Private (Parent, Guardian, Admin)
 */
export const createCommunication = async (req, res) => {
  try {
    const {
      studentId,
      childId,
      linkedStudentId,
      type = 'Academic Query',
      subject,
      message,
      requestedMeetingDate,
      preferredTime = '',
      teacherId,
    } = req.body;

    const targetStudentId = studentId || childId || linkedStudentId;

    if (!targetStudentId || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: studentId, subject, and message',
      });
    }

    if (type && !COMMUNICATION_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid communication type. Allowed types: ${COMMUNICATION_TYPES.join(', ')}`,
      });
    }

    // Role-based parent verification: Parent must be linked to student
    if (req.user.role === 'parent' || req.user.role === 'student_parent') {
      const { linked, student } = await verifyStudentBelongsToParent(targetStudentId, req.user);
      if (!linked || !student) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You can only communicate regarding your linked child.',
        });
      }

      const parentName = req.user.name || student.parentName || 'Parent / Guardian';
      const parentPhone = req.user.phone || student.parentPhone || '';

      // Teacher lookup if teacherId provided
      let teacherName = 'Class Teacher';
      if (teacherId) {
        if (isDbConnected() && mongoose.Types.ObjectId.isValid(teacherId)) {
          const tUser = await User.findById(teacherId);
          if (tUser) teacherName = tUser.name;
        }
        if (teacherName === 'Class Teacher') {
          const tInStore = store.users?.find((u) => String(u._id) === String(teacherId) || String(u.id) === String(teacherId)) ||
                          store.teachers?.find((t) => String(t._id) === String(teacherId) || String(t.id) === String(teacherId));
          if (tInStore) teacherName = tInStore.name;
        }
      }

      const newCommData = {
        student: student._id,
        studentName: student.name,
        studentRoll: student.rollNumber || '',
        studentClass: student.class?.name || (typeof student.class === 'string' ? student.class : 'Class 8-A'),
        parent: req.user._id,
        parentName,
        parentPhone,
        teacher: teacherId || null,
        teacherName,
        type,
        subject: subject.trim(),
        message: message.trim(),
        requestedMeetingDate: requestedMeetingDate ? new Date(requestedMeetingDate) : null,
        preferredTime: preferredTime.trim(),
        status: 'Pending',
        reply: '',
      };

      let created = null;
      if (isDbConnected()) {
        created = await Communication.create(newCommData);
      } else {
        created = {
          _id: new mongoose.Types.ObjectId().toString(),
          ...newCommData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.communications.unshift(created);
      }

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully to teacher!',
        data: created,
      });
    } else if (req.user.role === 'headmaster_admin' || req.user.role === 'admin') {
      // Admin/Headmaster sending on behalf
      let student = null;
      if (isDbConnected() && mongoose.Types.ObjectId.isValid(studentId)) {
        student = await Student.findById(studentId);
      }
      if (!student) {
        student = store.students.find((s) => String(s._id) === String(studentId));
      }

      const newCommData = {
        student: student ? student._id : studentId,
        studentName: student?.name || 'Student',
        studentRoll: student?.rollNumber || '',
        studentClass: student?.class?.name || 'Class 8-A',
        parent: req.user._id,
        parentName: req.user.name,
        parentPhone: req.user.phone || '',
        teacher: teacherId || null,
        teacherName: 'Class Teacher',
        type,
        subject: subject.trim(),
        message: message.trim(),
        requestedMeetingDate: requestedMeetingDate ? new Date(requestedMeetingDate) : null,
        preferredTime: preferredTime.trim(),
        status: 'Pending',
        reply: '',
      };

      let created = null;
      if (isDbConnected()) {
        created = await Communication.create(newCommData);
      } else {
        created = {
          _id: new mongoose.Types.ObjectId().toString(),
          ...newCommData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.communications.unshift(created);
      }

      return res.status(201).json({
        success: true,
        message: 'Message created successfully',
        data: created,
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only parents and guardians can initiate teacher communications.',
      });
    }
  } catch (error) {
    console.error('createCommunication error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message',
      error: error.message,
    });
  }
};

/**
 * @desc    Reply to a parent message or schedule a meeting
 * @route   PUT /api/communications/:id/reply
 * @access  Private (Teacher, Head Master, Admin)
 */
export const replyCommunication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply, meetingDate, meetingTime, meetingLocation, meetingNotes, status } = req.body;

    if (!reply && !meetingDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a reply message or meeting details',
      });
    }

    let comm = null;
    if (isDbConnected()) {
      comm = await Communication.findById(id);
    } else {
      comm = store.communications.find((c) => String(c._id) === String(id));
    }

    if (!comm) {
      return res.status(404).json({
        success: false,
        message: 'Communication record not found',
      });
    }

    comm.reply = reply ? reply.trim() : (comm.reply || 'Meeting scheduled by teacher.');
    comm.repliedBy = req.user._id;
    comm.repliedByName = req.user.name;
    comm.repliedAt = new Date();

    if (meetingDate) {
      comm.status = 'Meeting Scheduled';
      comm.meetingDetails = {
        date: new Date(meetingDate),
        time: meetingTime || '10:30 AM',
        location: meetingLocation || 'School Staff Room',
        notes: meetingNotes || '',
      };
    } else if (status && COMMUNICATION_STATUSES.includes(status)) {
      comm.status = status;
    } else {
      comm.status = 'Replied';
    }

    if (isDbConnected()) {
      await comm.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Reply and update sent to parent successfully',
      data: comm,
    });
  } catch (error) {
    console.error('replyCommunication error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update communication',
      error: error.message,
    });
  }
};
