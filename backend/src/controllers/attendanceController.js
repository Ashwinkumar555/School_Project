import store from '../utils/dataStore.js';
import Attendance from '../models/Attendance.js';
import mongoose from 'mongoose';
import { normalizePhone } from './authController.js';

/**
 * @desc    Record or update daily classroom attendance
 * @route   POST /api/attendance
 * @access  Private (Teacher, Admin)
 */
export const recordAttendance = async (req, res, next) => {
  try {
    const { classId, date, records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Attendance records array is required',
      });
    }

    const finalDate = date || new Date().toISOString().split('T')[0];
    const finalClassId = classId || store.classes[0]?._id;

    // Normalizing records
    const normalizedRecords = records.map((r) => ({
      student: r.student || r.studentId || r._id,
      status: r.status || 'Present',
      remarks: r.remarks || '',
    }));

    // Find if record for this date and class already exists
    const existingIndex = store.attendanceRecords.findIndex(
      (a) => a.date === finalDate && (a.class === finalClassId || !a.class)
    );

    if (existingIndex !== -1) {
      // Merge/update records for that date
      const existing = store.attendanceRecords[existingIndex];
      const mergedMap = new Map();
      existing.records.forEach((r) => mergedMap.set(r.student?.toString(), r));
      normalizedRecords.forEach((r) => mergedMap.set(r.student?.toString(), r));
      existing.records = Array.from(mergedMap.values());
      existing.updatedAt = new Date();
    } else {
      // Create new daily attendance entry
      store.attendanceRecords.unshift({
        _id: `att-${finalDate}`,
        date: finalDate,
        class: finalClassId,
        records: normalizedRecords,
        createdAt: new Date(),
      });
    }

    // Save to MongoDB if connected
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(finalClassId)) {
      try {
        await Attendance.findOneAndUpdate(
          { date: new Date(finalDate), class: finalClassId },
          {
            recordedBy: req.user?._id,
            records: normalizedRecords.map((r) => ({
              student: r.student,
              status: r.status,
              remarks: r.remarks,
            })),
          },
          { upsert: true, new: true }
        );
      } catch (dbErr) {
        console.warn('DB attendance persist warning:', dbErr.message);
      }
    }

    // Recalculate metrics individually for each updated student
    normalizedRecords.forEach((rec) => {
      const studentId = rec.student?.toString();
      const student = store.students.find(
        (s) => s._id?.toString() === studentId || s._id === studentId || s.id === studentId
      );

      if (student) {
        // Collect all attendance logs for this student
        const studentLogs = [];
        store.attendanceRecords.forEach((att) => {
          const match = att.records.find(
            (r) => r.student?.toString() === studentId || r.student === studentId
          );
          if (match) {
            studentLogs.push({ date: att.date, status: match.status });
          }
        });

        // Sort by date descending
        studentLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate rate
        const total = studentLogs.length;
        const present = studentLogs.filter((l) => l.status === 'Present' || l.status === 'Late').length;
        if (total > 0) {
          student.currentAttendanceRate = Math.round((present / total) * 100);
        }

        // Calculate streak of consecutive absences from recent logs
        let absenceStreak = 0;
        for (const log of studentLogs) {
          if (log.status === 'Absent') {
            absenceStreak++;
          } else {
            break;
          }
        }
        student.consecutiveAbsences = absenceStreak;

        // Rule-based attention indicator calculation
        if (student.currentAttendanceRate < 60 || student.consecutiveAbsences >= 7 || student.currentAcademicAverage < 40) {
          student.attentionLevel = 'HIGH_ATTENTION';
        } else if (student.currentAttendanceRate < 75 || student.consecutiveAbsences >= 3 || student.currentAcademicAverage < 50) {
          student.attentionLevel = 'MODERATE_ATTENTION';
        } else {
          student.attentionLevel = 'NORMAL';
        }
      }
    });

    const presentCount = normalizedRecords.filter((r) => r.status === 'Present' || r.status === 'Late').length;
    const totalCount = normalizedRecords.length;
    const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

    return res.status(200).json({
      success: true,
      message: `Daily attendance saved successfully (${attendancePercentage}% present for ${finalDate})`,
      data: {
        classId: finalClassId,
        date: finalDate,
        totalStudents: totalCount,
        presentStudents: presentCount,
        attendancePercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record or edit individual attendance for a single student on a specific date
 * @route   PUT /api/attendance/student/:studentId
 * @access  Private (Teacher, Admin)
 */
export const updateStudentAttendanceRecord = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { date, status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Attendance status (Present, Absent, Late, Excused) is required',
      });
    }

    const finalDate = date || new Date().toISOString().split('T')[0];
    const finalStatus = status === 'Absent' ? 'Absent' : status === 'Late' ? 'Late' : status === 'Excused' ? 'Excused' : 'Present';

    // Find student
    const student = store.students.find(
      (s) => s._id?.toString() === studentId || s._id === studentId || s.id === studentId
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Find or create daily attendance entry in store
    let dayEntry = store.attendanceRecords.find((a) => a.date === finalDate);
    if (!dayEntry) {
      dayEntry = {
        _id: `att-${finalDate}`,
        date: finalDate,
        class: student.class?._id || store.classes[0]?._id,
        records: [],
        createdAt: new Date(),
      };
      store.attendanceRecords.unshift(dayEntry);
    }

    const recIdx = dayEntry.records.findIndex(
      (r) => r.student?.toString() === studentId || r.student === studentId
    );

    if (recIdx !== -1) {
      dayEntry.records[recIdx].status = finalStatus;
      if (remarks !== undefined) dayEntry.records[recIdx].remarks = remarks;
    } else {
      dayEntry.records.push({
        student: studentId,
        status: finalStatus,
        remarks: remarks || '',
      });
    }

    // Recalculate metrics for this student
    const studentLogs = [];
    store.attendanceRecords.forEach((att) => {
      const match = att.records.find(
        (r) => r.student?.toString() === studentId || r.student === studentId
      );
      if (match) {
        studentLogs.push({ date: att.date, status: match.status });
      }
    });

    studentLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = studentLogs.length;
    const present = studentLogs.filter((l) => l.status === 'Present' || l.status === 'Late').length;
    student.currentAttendanceRate = total > 0 ? Math.round((present / total) * 100) : 100;

    let absenceStreak = 0;
    for (const log of studentLogs) {
      if (log.status === 'Absent') {
        absenceStreak++;
      } else {
        break;
      }
    }
    student.consecutiveAbsences = absenceStreak;

    // Rule-based attention indicator calculation
    if (student.currentAttendanceRate < 60 || student.consecutiveAbsences >= 7 || student.currentAcademicAverage < 40) {
      student.attentionLevel = 'HIGH_ATTENTION';
    } else if (student.currentAttendanceRate < 75 || student.consecutiveAbsences >= 3 || student.currentAcademicAverage < 50) {
      student.attentionLevel = 'MODERATE_ATTENTION';
    } else {
      student.attentionLevel = 'NORMAL';
    }

    return res.status(200).json({
      success: true,
      message: `Attendance marked as ${finalStatus} for ${student.name} on ${finalDate}`,
      data: {
        studentId,
        date: finalDate,
        status: finalStatus,
        attendanceRate: student.currentAttendanceRate,
        consecutiveAbsences: student.consecutiveAbsences,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance logs for a specific class on a date
 * @route   GET /api/attendance/class/:classId
 * @access  Private
 */
export const getClassAttendance = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    if (['villager', 'village_head', 'community_member', 'alumni', 'ngo', 'community_volunteer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Class attendance rosters are confidential to faculty.',
      });
    }

    const { classId } = req.params;
    const queryDate = req.query.date || new Date().toISOString().split('T')[0];

    const cls = store.classes.find(
      (c) => c._id === classId || c._id?.toString() === classId.toString() || c.name.toLowerCase() === classId.toLowerCase()
    ) || store.classes[0];

    const students = store.students.filter(
      (s) => s.class?._id?.toString() === cls._id.toString() || s.class?.name === cls.name
    );

    const dayRecord = store.attendanceRecords.find((a) => a.date === queryDate);

    return res.status(200).json({
      success: true,
      data: {
        class: cls,
        date: queryDate,
        students: students.map((s) => {
          const match = dayRecord?.records?.find(
            (r) => r.student?.toString() === s._id.toString() || r.student === s._id
          );
          return {
            studentId: s._id,
            name: s.name,
            rollNumber: s.rollNumber,
            status: match ? match.status : s.consecutiveAbsences > 0 ? 'Absent' : 'Present',
            attendanceRate: s.currentAttendanceRate,
          };
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance logs for a specific student
 * @route   GET /api/attendance/student/:studentId
 * @access  Private
 */
export const getStudentAttendance = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    if (['villager', 'village_head', 'community_member', 'alumni', 'ngo', 'community_volunteer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Student daily attendance records are confidential.',
      });
    }

    const { studentId } = req.params;
    let student = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(studentId)) {
      try {
        student = await Student.findById(studentId).lean();
      } catch (e) {
        console.warn('MongoDB student attendance lookup:', e.message);
      }
    }
    if (!student) {
      student = store.students.find(
        (s) => s._id?.toString() === studentId || s._id === studentId || s.id === studentId
      );
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Role-Based Isolation: Parent can ONLY view their linked child's attendance
    if (userRole === 'parent' || userRole === 'student_parent') {
      const userId = String(req.user._id || req.user.id);
      const userPhone = req.user.phone || '';
      const userNormPhone = normalizePhone(userPhone);
      const sNormPhone = normalizePhone(student.parentPhone);
      const userName = (req.user.name || '').toLowerCase().trim();
      const sParentName = (student.parentName || '').toLowerCase().trim();
      const userChildren = (req.user.children || []).map((c) => String(c?._id || c));
      const sParentUser = String(student.parentUser?._id || student.parentUser || '');

      const isLinked =
        (sParentUser && sParentUser === userId) ||
        (userNormPhone && sNormPhone && (userNormPhone === sNormPhone || student.parentPhone === userPhone)) ||
        (userName && sParentName && (sParentName === userName || sParentName.includes(userName) || userName.includes(sParentName))) ||
        userChildren.includes(String(student._id));

      if (!isLinked) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: You are not authorized to view another student's attendance.",
        });
      }
    }

    // Collect individual attendance logs strictly for this student
    const logs = [];
    store.attendanceRecords.forEach((att) => {
      const match = att.records.find(
        (r) => r.student?.toString() === studentId || r.student === studentId
      );
      if (match) {
        logs.push({
          date: att.date,
          status: match.status,
          remarks: match.remarks || '',
        });
      }
    });

    logs.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalClassesHeld = logs.length;
    const attendedClasses = logs.filter((l) => l.status === 'Present' || l.status === 'Late').length;
    const attendanceRate = totalClassesHeld > 0
      ? Math.round((attendedClasses / totalClassesHeld) * 100)
      : student.currentAttendanceRate || 100;

    return res.status(200).json({
      success: true,
      data: {
        student,
        attendanceRate,
        consecutiveAbsences: student.consecutiveAbsences || 0,
        totalClassesHeld,
        attendedClasses,
        logs, // Only this student's real recorded logs
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get today's school-wide attendance summary
 * @route   GET /api/attendance/summary/today
 * @access  Private (Admin, Teacher)
 */
export const getTodaySummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = store.attendanceRecords.find((a) => a.date === today);

    let totalEnrolled = store.students.length;
    let totalPresent = store.students.filter((s) => s.consecutiveAbsences === 0).length;

    if (todayRecord && todayRecord.records.length > 0) {
      totalPresent = todayRecord.records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
      totalEnrolled = todayRecord.records.length;
    }

    const overallPercentage = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 92.5;

    return res.status(200).json({
      success: true,
      data: {
        date: today,
        totalEnrolled,
        totalPresent,
        overallPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};
