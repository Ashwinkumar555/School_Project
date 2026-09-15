import store from '../utils/dataStore.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Class from '../models/Class.js';
import mongoose from 'mongoose';
import { normalizePhone } from './authController.js';

/**
 * Helper to compute academic totals, average, and attention status
 */
const computeAcademicMetrics = (subjectMarks, attendanceRate, consecutiveAbsences = 0) => {
  let totalObtained = 0;
  let totalMax = 0;
  const processedMarks = (subjectMarks || []).map((m) => {
    const obtained = Number(m.marksObtained) || 0;
    const max = Number(m.maxMarks) || 100;
    totalObtained += obtained;
    totalMax += max;
    const pct = max > 0 ? (obtained / max) * 100 : 0;
    let grade = 'F';
    if (pct >= 90) grade = 'A+';
    else if (pct >= 75) grade = 'A';
    else if (pct >= 60) grade = 'B';
    else if (pct >= 50) grade = 'C';
    else if (pct >= 35) grade = 'D';

    return {
      subject: (m.subject || 'General Subject').trim(),
      marksObtained: obtained,
      maxMarks: max,
      grade,
    };
  });

  const currentAcademicAverage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  let overallGrade = 'F';
  if (currentAcademicAverage >= 90) overallGrade = 'A+';
  else if (currentAcademicAverage >= 75) overallGrade = 'A';
  else if (currentAcademicAverage >= 60) overallGrade = 'B';
  else if (currentAcademicAverage >= 50) overallGrade = 'C';
  else if (currentAcademicAverage >= 35) overallGrade = 'D';

  let attentionLevel = 'NORMAL';
  const att = Number(attendanceRate) || 85;
  if (att < 60 || consecutiveAbsences >= 7 || currentAcademicAverage < 40) {
    attentionLevel = 'HIGH_ATTENTION';
  } else if (att < 75 || consecutiveAbsences >= 3 || currentAcademicAverage < 50) {
    attentionLevel = 'MODERATE_ATTENTION';
  }

  return {
    processedMarks,
    currentAcademicAverage,
    overallGrade,
    attentionLevel,
  };
};

/**
 * Helper to keep parent-student bidirectional references in sync
 */
export const syncParentChildLink = async (user, matchedStudents) => {
  if (!user || !matchedStudents || matchedStudents.length === 0) return;
  const userId = String(user._id || user.id);
  const matchedStudentIds = matchedStudents.map((s) => s._id);

  // 1. Update in-memory store
  const storeUser = store.users.find(
    (u) => String(u._id) === userId || (user.phone && u.phone === user.phone)
  );
  if (storeUser) {
    storeUser.children = Array.from(
      new Set([...(storeUser.children || []).map(String), ...matchedStudentIds.map(String)])
    );
  }

  matchedStudents.forEach((ms) => {
    const storeStudent = store.students.find((s) => String(s._id) === String(ms._id));
    if (storeStudent) {
      storeStudent.parentUser = userId;
    }
  });

  // 2. Update MongoDB if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const validStudentObjectIds = matchedStudentIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );

      if (mongoose.Types.ObjectId.isValid(userId)) {
        if (validStudentObjectIds.length > 0) {
          await User.findByIdAndUpdate(userId, {
            $addToSet: { children: { $each: validStudentObjectIds } },
          });
          await Student.updateMany(
            { _id: { $in: validStudentObjectIds } },
            { $set: { parentUser: userId } }
          );
        }
      } else {
        const dbUser = await User.findOne({
          $or: [
            ...(user.phone ? [{ phone: user.phone }] : []),
            ...(user.pNo ? [{ pNo: user.pNo }] : []),
          ],
        });
        if (dbUser && validStudentObjectIds.length > 0) {
          await User.findByIdAndUpdate(dbUser._id, {
            $addToSet: { children: { $each: validStudentObjectIds } },
          });
          await Student.updateMany(
            { _id: { $in: validStudentObjectIds } },
            { $set: { parentUser: dbUser._id } }
          );
        }
      }
    } catch (e) {
      console.warn('Auto-sync parent child link DB note:', e.message);
    }
  }
};

/**
 * @desc    Get students list scoped strictly by role & privacy
 * @route   GET /api/students
 * @access  Private
 */
export const getStudents = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    // Strict Privacy Protection: Block Village Community from individual student records
    if (['villager', 'village_head', 'community_member', 'alumni', 'ngo', 'community_volunteer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Student academic rosters and family details are confidential.',
      });
    }

    let studentsList = [];

    // Query MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        let dbStudents = await Student.find().populate('class').lean();
        if (dbStudents && dbStudents.length > 0) {
          // Sort by roll number naturally
          dbStudents.sort((a, b) => {
            const rA = parseInt(a.rollNumber, 10) || 0;
            const rB = parseInt(b.rollNumber, 10) || 0;
            return rA - rB;
          });

          // Fetch academic records to populate subjectMarks if student document doesn't have them yet
          const studentIds = dbStudents.map((s) => s._id);
          const acadRecords = await AcademicRecord.find({ student: { $in: studentIds } }).lean();

          const acadMap = new Map();
          acadRecords.forEach((ar) => {
            if (!acadMap.has(ar.student?.toString())) {
              acadMap.set(ar.student?.toString(), ar.marks);
            }
          });

          studentsList = dbStudents.map((s) => {
            let marks = s.subjectMarks && s.subjectMarks.length > 0 ? s.subjectMarks : acadMap.get(s._id.toString()) || [];
            return {
              ...s,
              subjectMarks: marks,
            };
          });

          // Also synchronize store.students for parity
          store.students = [...studentsList];
        }
      } catch (dbErr) {
        console.warn('MongoDB student fetch note:', dbErr.message);
      }
    }

    // Fallback to store.students if MongoDB is not populated
    if (studentsList.length === 0) {
      studentsList = store.students.map((s) => {
        let marks = s.subjectMarks;
        if (!marks || marks.length === 0) {
          const sId = s._id?.toString();
          const ar = store.academicRecords.find((r) => (r.student?.toString() === sId || r.student === sId));
          marks = ar ? ar.marks : [];
        }
        return {
          ...s,
          subjectMarks: marks,
        };
      });
    }

    let result = [...studentsList];

    // Parents see only their own children
    if (userRole === 'parent' || userRole === 'student_parent') {
      const userPhone = req.user.phone || '';
      const userNormPhone = normalizePhone(userPhone);
      const userName = (req.user.name || '').toLowerCase().trim();
      const userChildren = (req.user.children || []).map((c) => String(c?._id || c));
      const userIdStr = userId.toString();

      result = result.filter((s) => {
        const sParentUser = String(s.parentUser?._id || s.parentUser || '');
        const sNormPhone = normalizePhone(s.parentPhone);
        const sParentName = (s.parentName || '').toLowerCase().trim();
        const sId = String(s._id);

        return (
          (sParentUser && sParentUser === userIdStr) ||
          (userNormPhone && sNormPhone && (userNormPhone === sNormPhone || s.parentPhone === userPhone)) ||
          (userName && sParentName && (sParentName === userName || sParentName.includes(userName) || userName.includes(sParentName))) ||
          userChildren.includes(sId)
        );
      });

      if (result.length > 0) {
        await syncParentChildLink(req.user, result);
      }
    }

    // Students see only their own record
    if (userRole === 'student') {
      const userPhone = req.user.phone;
      const userName = req.user.name?.toLowerCase();
      result = result.filter(
        (s) =>
          s.userAccount?.toString() === userId.toString() ||
          s.userAccount?._id?.toString() === userId.toString() ||
          (userPhone && s.phone === userPhone) ||
          (userName && s.name?.toLowerCase() === userName)
      );
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single student details
 * @route   GET /api/students/:id
 * @access  Private
 */
export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    if (['villager', 'village_head', 'community_member', 'alumni', 'ngo', 'community_volunteer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Student records are confidential.',
      });
    }

    let student = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        student = await Student.findById(id).populate('class').lean();
        if (student) {
          if (!student.subjectMarks || student.subjectMarks.length === 0) {
            const ar = await AcademicRecord.findOne({ student: id }).lean();
            if (ar) student.subjectMarks = ar.marks;
          }
        }
      } catch (e) {
        console.warn('MongoDB student lookup note:', e.message);
      }
    }

    if (!student) {
      student = store.students.find((s) => s._id?.toString() === id.toString());
      if (student && (!student.subjectMarks || student.subjectMarks.length === 0)) {
        const ar = store.academicRecords.find((r) => r.student?.toString() === id.toString() || r.student === id);
        if (ar) student.subjectMarks = ar.marks;
      }
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Role-Based Isolation: Parent can ONLY view their linked child
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
          message: "Access Denied: You are not authorized to view another student's records.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Enroll new student with attendance and subject marks
 * @route   POST /api/students
 * @access  Private (Teacher, Admin)
 */
export const createStudent = async (req, res, next) => {
  try {
    const {
      name,
      rollNumber,
      admissionNumber,
      attendance,
      currentAttendanceRate,
      subjectMarks,
      gender,
      parentName,
      parentPhone,
      classId,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student full name is required',
      });
    }

    if (!rollNumber || !rollNumber.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Roll number is required',
      });
    }

    const trimmedName = name.trim();
    const trimmedRoll = rollNumber.toString().trim();
    const finalAttendance = Number(currentAttendanceRate !== undefined ? currentAttendanceRate : attendance) || 85;

    // Calculate academic totals, averages, and support flags
    const { processedMarks, currentAcademicAverage, overallGrade, attentionLevel } = computeAcademicMetrics(
      subjectMarks || [],
      finalAttendance
    );

    // Auto-generate admission number if missing
    let finalAdmissionNo = admissionNumber?.trim();
    if (!finalAdmissionNo) {
      const year = new Date().getFullYear();
      finalAdmissionNo = `SCH-${year}-${trimmedRoll.padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
    }

    let studentDoc = null;
    let assignedClassId = classId;

    if (mongoose.connection.readyState === 1) {
      try {
        if (!assignedClassId || !mongoose.Types.ObjectId.isValid(assignedClassId)) {
          const defaultClass = (await Class.findOne({ name: 'Class 8-A' })) || (await Class.findOne({}));
          assignedClassId = defaultClass?._id;
        }

        studentDoc = await Student.create({
          admissionNumber: finalAdmissionNo,
          rollNumber: trimmedRoll,
          name: trimmedName,
          gender: gender || 'Male',
          class: assignedClassId,
          parentName: parentName?.trim() || 'Guardian',
          parentPhone: parentPhone?.trim() || '',
          village: 'Sundarpur',
          currentAttendanceRate: finalAttendance,
          currentAcademicAverage,
          consecutiveAbsences: 0,
          attentionLevel,
          subjectMarks: processedMarks,
          isActive: true,
        });

        // Persist corresponding AcademicRecord in MongoDB if marks are present
        if (processedMarks.length > 0 && assignedClassId) {
          await AcademicRecord.findOneAndUpdate(
            { student: studentDoc._id, term: 'Quarterly Exam', academicYear: '2025-2026' },
            {
              student: studentDoc._id,
              class: assignedClassId,
              term: 'Quarterly Exam',
              academicYear: '2025-2026',
              marks: processedMarks,
              percentage: currentAcademicAverage,
              overallGrade,
              teacherRemarks: 'Academic scores entered by classroom teacher.',
              recordedBy: req.user?._id,
            },
            { upsert: true, new: true }
          );
        }
      } catch (dbErr) {
        console.warn('MongoDB student create error/note:', dbErr.message);
      }
    }

    // In-memory dataStore sync for offline resilience
    const newStudent = {
      _id: studentDoc ? studentDoc._id.toString() : `std-${Date.now()}`,
      admissionNumber: finalAdmissionNo,
      rollNumber: trimmedRoll,
      name: trimmedName,
      gender: gender || 'Male',
      class: store.classes[0] || { name: 'Class 8-A', grade: '8', section: 'A' },
      parentName: parentName?.trim() || 'Guardian',
      parentPhone: parentPhone?.trim() || '',
      village: 'Sundarpur',
      bloodGroup: 'O+',
      currentAttendanceRate: finalAttendance,
      currentAcademicAverage,
      consecutiveAbsences: 0,
      attentionLevel,
      subjectMarks: processedMarks,
      welfareBeneficiary: true,
      entitlements: [{ schemeName: 'Free Uniform Set', status: 'Disbursed' }],
      isActive: true,
      createdAt: new Date(),
    };

    store.students.push(newStudent);

    if (processedMarks.length > 0) {
      store.academicRecords.unshift({
        _id: `acad-${Date.now()}`,
        student: newStudent._id,
        term: 'Quarterly Exam',
        academicYear: '2025-2026',
        marks: processedMarks,
        percentage: currentAcademicAverage,
        overallGrade,
        teacherRemarks: 'Academic scores entered by classroom teacher.',
        createdAt: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Student enrolled and academic details saved successfully',
      data: studentDoc ? { ...studentDoc.toObject(), subjectMarks: processedMarks } : newStudent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student profile, attendance, and subject marks
 * @route   PUT /api/students/:id
 * @access  Private (Admin, Teacher)
 */
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      rollNumber,
      attendance,
      currentAttendanceRate,
      subjectMarks,
      gender,
      parentName,
      parentPhone,
    } = req.body;

    let updatedStudent = null;

    // Persist to MongoDB if connected
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const studentDoc = await Student.findById(id);
        if (studentDoc) {
          if (name) studentDoc.name = name.trim();
          if (rollNumber) studentDoc.rollNumber = rollNumber.toString().trim();
          if (gender) studentDoc.gender = gender;
          if (parentName !== undefined) studentDoc.parentName = parentName.trim();
          if (parentPhone !== undefined) studentDoc.parentPhone = parentPhone.trim();
          if (req.body.classId && mongoose.Types.ObjectId.isValid(req.body.classId)) {
            studentDoc.class = req.body.classId;
          }

          if (currentAttendanceRate !== undefined || attendance !== undefined) {
            studentDoc.currentAttendanceRate = Number(currentAttendanceRate !== undefined ? currentAttendanceRate : attendance);
          }

          if (subjectMarks && Array.isArray(subjectMarks)) {
            const { processedMarks, currentAcademicAverage, overallGrade, attentionLevel } = computeAcademicMetrics(
              subjectMarks,
              studentDoc.currentAttendanceRate,
              studentDoc.consecutiveAbsences
            );
            studentDoc.subjectMarks = processedMarks;
            studentDoc.currentAcademicAverage = currentAcademicAverage;
            studentDoc.attentionLevel = attentionLevel;

            // Upsert / update AcademicRecord in MongoDB
            await AcademicRecord.findOneAndUpdate(
              { student: studentDoc._id, term: 'Quarterly Exam', academicYear: '2025-2026' },
              {
                student: studentDoc._id,
                class: studentDoc.class,
                term: 'Quarterly Exam',
                academicYear: '2025-2026',
                marks: processedMarks,
                percentage: currentAcademicAverage,
                overallGrade,
                teacherRemarks: 'Academic scores updated by classroom teacher.',
                recordedBy: req.user?._id,
              },
              { upsert: true, new: true }
            );
          }

          await studentDoc.save();
          updatedStudent = studentDoc.toObject();
        }
      } catch (dbErr) {
        console.warn('MongoDB student update error/note:', dbErr.message);
      }
    }

    // In-memory dataStore sync
    const storeStudent = store.students.find((s) => s._id?.toString() === id.toString());
    if (storeStudent) {
      if (name) storeStudent.name = name.trim();
      if (rollNumber) storeStudent.rollNumber = rollNumber.toString().trim();
      if (gender) storeStudent.gender = gender;
      if (parentName !== undefined) storeStudent.parentName = parentName.trim();
      if (parentPhone !== undefined) storeStudent.parentPhone = parentPhone.trim();
      if (req.body.classId) {
        const clsMatch = store.classes.find((c) => c._id?.toString() === req.body.classId.toString() || c.name === req.body.classId);
        if (clsMatch) storeStudent.class = clsMatch;
      }

      if (currentAttendanceRate !== undefined || attendance !== undefined) {
        storeStudent.currentAttendanceRate = Number(currentAttendanceRate !== undefined ? currentAttendanceRate : attendance);
      }

      if (subjectMarks && Array.isArray(subjectMarks)) {
        const { processedMarks, currentAcademicAverage, overallGrade, attentionLevel } = computeAcademicMetrics(
          subjectMarks,
          storeStudent.currentAttendanceRate,
          storeStudent.consecutiveAbsences || 0
        );
        storeStudent.subjectMarks = processedMarks;
        storeStudent.currentAcademicAverage = currentAcademicAverage;
        storeStudent.attentionLevel = attentionLevel;

        const rec = store.academicRecords.find((r) => r.student?.toString() === id.toString() || r.student === id);
        if (rec) {
          rec.marks = processedMarks;
          rec.percentage = currentAcademicAverage;
          rec.overallGrade = overallGrade;
        }
      }

      if (!updatedStudent) updatedStudent = storeStudent;
    }

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Student details and marks updated successfully',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete student record and associated academic data
 * @route   DELETE /api/students/:id
 * @access  Private (Teacher, Admin)
 */
export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete from MongoDB
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await Student.findByIdAndDelete(id);
        await AcademicRecord.deleteMany({ student: id });
      } catch (dbErr) {
        console.warn('MongoDB student delete note:', dbErr.message);
      }
    }

    // Delete from in-memory store
    store.students = store.students.filter((s) => s._id?.toString() !== id.toString());
    store.academicRecords = store.academicRecords.filter(
      (r) => r.student?.toString() !== id.toString() && r.student?._id?.toString() !== id.toString()
    );

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get government welfare schemes catalog
 * @route   GET /api/students/welfare/schemes
 * @access  Private
 */
export const getWelfareSchemes = async (req, res, next) => {
  return res.status(200).json({
    success: true,
    data: [
      { id: '1', name: 'Free Uniform Set (2 Pairs)', department: 'State Dept of School Education', beneficiariesCount: store.students.length },
      { id: '2', name: 'Textbook & Notebook Grant', department: 'Sarva Shiksha Abhiyan', beneficiariesCount: store.students.length },
      { id: '3', name: 'Mid-Day Meal Nutritional Scheme', department: 'State Social Welfare Dept', beneficiariesCount: store.students.length },
      { id: '4', name: 'Free Bicycle Scheme (Girl Students)', department: 'Welfare Directorate', beneficiariesCount: 2 },
      { id: '5', name: 'Pre-Matric State Scholarship', department: 'Minority & Rural Affairs', beneficiariesCount: 1 },
    ],
  });
};

/**
 * @desc    Get linked students for the authenticated parent
 * @route   GET /api/students/linked
 * @access  Private (Parent, Guardian, Admin)
 */
export const getLinkedStudents = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    if (!['parent', 'student_parent', 'admin', 'headmaster_admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only parents/guardians and administration can access linked student profiles.',
      });
    }

    let allStudents = [];

    // 1. Query MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        let dbStudents = await Student.find().populate('class').lean();
        if (dbStudents && dbStudents.length > 0) {
          const studentIds = dbStudents.map((s) => s._id);
          const acadRecords = await AcademicRecord.find({ student: { $in: studentIds } }).lean();
          const acadMap = new Map();
          acadRecords.forEach((ar) => {
            if (!acadMap.has(ar.student?.toString())) {
              acadMap.set(ar.student?.toString(), ar.marks);
            }
          });

          allStudents = dbStudents.map((s) => {
            const marks = s.subjectMarks && s.subjectMarks.length > 0 ? s.subjectMarks : acadMap.get(s._id.toString()) || [];
            return {
              ...s,
              subjectMarks: marks,
            };
          });
        }
      } catch (dbErr) {
        console.warn('MongoDB getLinkedStudents fetch note:', dbErr.message);
      }
    }

    // 2. Fallback to store.students
    if (allStudents.length === 0) {
      allStudents = store.students.map((s) => {
        let marks = s.subjectMarks;
        if (!marks || marks.length === 0) {
          const sId = s._id?.toString();
          const ar = store.academicRecords.find((r) => r.student?.toString() === sId || r.student === sId);
          marks = ar ? ar.marks : [];
        }
        return {
          ...s,
          subjectMarks: marks,
        };
      });
    }

    const userPhone = req.user.phone || '';
    const userNormPhone = normalizePhone(userPhone);
    const userName = (req.user.name || '').toLowerCase().trim();
    const userChildren = (req.user.children || []).map((c) => String(c?._id || c));
    const userIdStr = String(userId);

    const linkedStudents = allStudents.filter((s) => {
      const sParentUser = String(s.parentUser?._id || s.parentUser || '');
      const sNormPhone = normalizePhone(s.parentPhone);
      const sParentName = (s.parentName || '').toLowerCase().trim();
      const sId = String(s._id);

      return (
        (sParentUser && sParentUser === userIdStr) ||
        (userNormPhone && sNormPhone && (userNormPhone === sNormPhone || s.parentPhone === userPhone)) ||
        (userName && sParentName && (sParentName === userName || sParentName.includes(userName) || userName.includes(sParentName))) ||
        userChildren.includes(sId)
      );
    });

    if (linkedStudents.length > 0) {
      await syncParentChildLink(req.user, linkedStudents);
    }

    return res.status(200).json({
      success: true,
      count: linkedStudents.length,
      data: linkedStudents,
      message:
        linkedStudents.length === 0
          ? 'No linked student found for this account. Please link a student or contact school administration.'
          : undefined,
    });
  } catch (error) {
    next(error);
  }
};
