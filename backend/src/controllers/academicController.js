import store from '../utils/dataStore.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Student from '../models/Student.js';
import mongoose from 'mongoose';
import { normalizePhone } from './authController.js';

/**
 * @desc    Record or update student term examination marks
 * @route   POST /api/academic/marks
 * @access  Private (Teacher, Admin)
 */
export const recordMarks = async (req, res, next) => {
  try {
    const { studentId, term, academicYear, marks, teacherRemarks, recordId } = req.body;

    if (!studentId || !marks || !Array.isArray(marks)) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and marks array are required',
      });
    }

    let totalObtained = 0;
    let totalMax = 0;
    const processedMarks = marks.map((m) => {
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
        subject: m.subject || 'General Subject',
        marksObtained: obtained,
        maxMarks: max,
        grade,
      };
    });

    const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    let overallGrade = 'F';
    if (percentage >= 90) overallGrade = 'A+';
    else if (percentage >= 75) overallGrade = 'A';
    else if (percentage >= 60) overallGrade = 'B';
    else if (percentage >= 50) overallGrade = 'C';
    else if (percentage >= 35) overallGrade = 'D';

    const finalTerm = term || 'Quarterly Exam';
    const finalYear = academicYear || '2025-2026';
    const finalRemarks = teacherRemarks !== undefined ? teacherRemarks : 'Good academic effort.';

    // Check if record already exists for this student and term in store
    const existingIndex = store.academicRecords.findIndex(
      (r) =>
        (recordId && (r._id === recordId || r._id?.toString() === recordId.toString())) ||
        ((r.student === studentId || r.student?._id === studentId || r.student?.toString() === studentId.toString()) &&
          r.term === finalTerm &&
          r.academicYear === finalYear)
    );

    let savedRecord = null;

    if (existingIndex !== -1) {
      // Edit / Update existing mark record
      store.academicRecords[existingIndex] = {
        ...store.academicRecords[existingIndex],
        marks: processedMarks,
        percentage,
        overallGrade,
        teacherRemarks: finalRemarks,
        updatedAt: new Date(),
      };
      savedRecord = store.academicRecords[existingIndex];
    } else {
      // Create new individual mark record
      const newRecord = {
        _id: `acad-${Date.now()}`,
        student: studentId,
        term: finalTerm,
        academicYear: finalYear,
        marks: processedMarks,
        percentage,
        overallGrade,
        teacherRemarks: finalRemarks,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.academicRecords.unshift(newRecord);
      savedRecord = newRecord;
    }

    // Persist to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(studentId)) {
          const filter = {
            student: studentId,
            term: finalTerm,
            academicYear: finalYear,
          };
          const update = {
            marks: processedMarks,
            totalMarksObtained: totalObtained,
            totalMaxMarks: totalMax,
            percentage,
            overallGrade,
            teacherRemarks: finalRemarks,
            recordedBy: req.user?._id,
          };
          await AcademicRecord.findOneAndUpdate(filter, update, { upsert: true, new: true });

          // Also synchronize subjectMarks and average onto the Student document in MongoDB
          const stdDoc = await Student.findById(studentId);
          if (stdDoc) {
            stdDoc.subjectMarks = processedMarks;
            stdDoc.currentAcademicAverage = percentage;
            if (stdDoc.currentAttendanceRate < 60 || stdDoc.consecutiveAbsences >= 7 || stdDoc.currentAcademicAverage < 40) {
              stdDoc.attentionLevel = 'HIGH_ATTENTION';
            } else if (stdDoc.currentAttendanceRate < 75 || stdDoc.consecutiveAbsences >= 3 || stdDoc.currentAcademicAverage < 50) {
              stdDoc.attentionLevel = 'MODERATE_ATTENTION';
            } else {
              stdDoc.attentionLevel = 'NORMAL';
            }
            await stdDoc.save();
          }
        }
      } catch (dbErr) {
        console.warn('DB marks persist warning:', dbErr.message);
      }
    }

    // Recalculate this specific student's average and support level based on all their saved marks
    const studentRecords = store.academicRecords.filter(
      (r) => r.student === studentId || r.student?._id === studentId || r.student?.toString() === studentId.toString()
    );
    const avgScore = studentRecords.length > 0
      ? Math.round(studentRecords.reduce((acc, cur) => acc + (cur.percentage || 0), 0) / studentRecords.length)
      : percentage;

    const student = store.students.find(
      (s) => s._id === studentId || s._id?.toString() === studentId.toString() || s.id === studentId
    );
    if (student) {
      student.currentAcademicAverage = avgScore;
      if (student.currentAttendanceRate < 60 || student.consecutiveAbsences >= 7 || student.currentAcademicAverage < 40) {
        student.attentionLevel = 'HIGH_ATTENTION';
      } else if (student.currentAttendanceRate < 75 || student.consecutiveAbsences >= 3 || student.currentAcademicAverage < 50) {
        student.attentionLevel = 'MODERATE_ATTENTION';
      } else {
        student.attentionLevel = 'NORMAL';
      }
    }

    return res.status(200).json({
      success: true,
      message: `Marks saved successfully for ${student?.name || 'Student'} (${finalTerm}: ${percentage}%, Grade: ${overallGrade})`,
      data: savedRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit / Update an existing academic mark record
 * @route   PUT /api/academic/marks/:id
 * @access  Private (Teacher, Admin)
 */
export const updateMarksRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { marks, teacherRemarks, term, academicYear } = req.body;

    const recordIndex = store.academicRecords.findIndex(
      (r) => r._id === id || r._id?.toString() === id.toString()
    );

    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Academic mark record not found',
      });
    }

    const currentRecord = store.academicRecords[recordIndex];
    let processedMarks = currentRecord.marks;
    let percentage = currentRecord.percentage;
    let overallGrade = currentRecord.overallGrade;

    if (marks && Array.isArray(marks)) {
      let totalObtained = 0;
      let totalMax = 0;
      processedMarks = marks.map((m) => {
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
          subject: m.subject || 'General Subject',
          marksObtained: obtained,
          maxMarks: max,
          grade,
        };
      });

      percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
      if (percentage >= 90) overallGrade = 'A+';
      else if (percentage >= 75) overallGrade = 'A';
      else if (percentage >= 60) overallGrade = 'B';
      else if (percentage >= 50) overallGrade = 'C';
      else if (percentage >= 35) overallGrade = 'D';
      else overallGrade = 'F';
    }

    store.academicRecords[recordIndex] = {
      ...currentRecord,
      term: term || currentRecord.term,
      academicYear: academicYear || currentRecord.academicYear,
      marks: processedMarks,
      percentage,
      overallGrade,
      teacherRemarks: teacherRemarks !== undefined ? teacherRemarks : currentRecord.teacherRemarks,
      updatedAt: new Date(),
    };

    const updated = store.academicRecords[recordIndex];

    // Update student's overall average
    const studentId = updated.student;
    const student = store.students.find(
      (s) => s._id === studentId || s._id?.toString() === studentId.toString() || s.id === studentId
    );
    if (student) {
      student.currentAcademicAverage = percentage;
    }

    return res.status(200).json({
      success: true,
      message: 'Marks updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get term marks & report card for a specific student
 * @route   GET /api/academic/student/:studentId
 * @access  Private
 */
export const getStudentMarks = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    if (['villager', 'village_head', 'community_member', 'alumni', 'ngo', 'community_volunteer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Student academic scores and report cards are confidential.',
      });
    }

    const { studentId } = req.params;
    let student = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(studentId)) {
      try {
        student = await Student.findById(studentId).lean();
      } catch (e) {
        console.warn('MongoDB student marks lookup:', e.message);
      }
    }
    if (!student) {
      student = store.students.find(
        (s) => s._id === studentId || s._id?.toString() === studentId.toString() || s.id === studentId
      );
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Role-Based Isolation: Parent can ONLY view their linked child's marks
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
          message: "Access Denied: You are not authorized to view another student's academic marks.",
        });
      }
    }

    // Retrieve only actual saved marks for this specific student
    let records = store.academicRecords.filter(
      (r) =>
        r.student === studentId ||
        r.student?._id === studentId ||
        r.student?.toString() === studentId.toString() ||
        r.student?._id?.toString() === studentId.toString()
    );

    // If live DB has records
    if (records.length === 0 && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(studentId)) {
      try {
        const dbRecords = await AcademicRecord.find({ student: studentId }).sort({ createdAt: -1 });
        if (dbRecords && dbRecords.length > 0) {
          records = dbRecords;
        }
      } catch (dbErr) {
        console.warn('DB student marks lookup warning:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        student,
        currentAcademicAverage: student.currentAcademicAverage || 0,
        reportCards: records, // Return only this student's real saved records
      },
    });
  } catch (error) {
    next(error);
  }
};
