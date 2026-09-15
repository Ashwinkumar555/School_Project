import store from '../utils/dataStore.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import AcademicRecord from '../models/AcademicRecord.js';
import mongoose from 'mongoose';

/**
 * @desc    Get overall school performance, attendance, and welfare summary report
 * @route   GET /api/reports/school-summary
 * @access  Private (Admin, Teacher, Village Head)
 */
export const getSchoolSummaryReport = async (req, res, next) => {
  try {
    let students = [...store.students];
    let classes = [...store.classes];

    if (mongoose.connection.readyState === 1) {
      try {
        const dbStudents = await Student.find().populate('class').lean();
        if (dbStudents && dbStudents.length > 0) students = dbStudents;
        const dbClasses = await Class.find().lean();
        if (dbClasses && dbClasses.length > 0) classes = dbClasses;
      } catch (e) {
        console.warn('MongoDB report fetch note:', e.message);
      }
    }

    const totalStudents = students.length;
    const avgAttendance = totalStudents > 0
      ? Math.round((students.reduce((acc, s) => acc + (s.currentAttendanceRate || 85), 0) / totalStudents) * 10) / 10
      : 85.0;

    const avgScore = totalStudents > 0
      ? Math.round((students.reduce((acc, s) => acc + (s.currentAcademicAverage || 65), 0) / totalStudents) * 10) / 10
      : 67.0;

    // 1. Class-wise attendance
    const classWiseAttendance = classes.map((c) => {
      const classStudents = students.filter(
        (s) => s.class?._id?.toString() === c._id?.toString() || s.class?.name === c.name || s.class === c._id?.toString()
      );
      const count = classStudents.length;
      const attAvg = count > 0
        ? Math.round(classStudents.reduce((acc, s) => acc + (s.currentAttendanceRate || 85), 0) / count)
        : 88;
      const acadAvg = count > 0
        ? Math.round(classStudents.reduce((acc, s) => acc + (s.currentAcademicAverage || 65), 0) / count)
        : 70;
      return {
        classId: c._id,
        className: c.name,
        grade: c.grade,
        section: c.section,
        studentCount: count,
        attendanceRate: attAvg,
        academicAverage: acadAvg,
      };
    });

    // 2. Subject-wise average marks across all students
    const subjectMap = new Map();
    students.forEach((s) => {
      if (s.subjectMarks && Array.isArray(s.subjectMarks)) {
        s.subjectMarks.forEach((sm) => {
          const sub = (sm.subject || 'General').trim();
          if (!subjectMap.has(sub)) {
            subjectMap.set(sub, { totalMarks: 0, count: 0 });
          }
          const item = subjectMap.get(sub);
          item.totalMarks += Number(sm.marksObtained) || 0;
          item.count += 1;
        });
      }
    });

    // If no subject marks in students, use defaults from curriculum
    if (subjectMap.size === 0) {
      subjectMap.set('Mathematics', { totalMarks: 76 * 5, count: 5 });
      subjectMap.set('Science', { totalMarks: 72 * 5, count: 5 });
      subjectMap.set('English', { totalMarks: 80 * 5, count: 5 });
      subjectMap.set('Social Science', { totalMarks: 70 * 5, count: 5 });
      subjectMap.set('Regional Language', { totalMarks: 78 * 5, count: 5 });
    }

    const subjectWiseAverages = Array.from(subjectMap.entries()).map(([subject, stats]) => ({
      subject,
      averageMarks: stats.count > 0 ? Math.round(stats.totalMarks / stats.count) : 0,
      studentsCount: stats.count,
    }));

    // 3. Grade distribution
    const gradeDistribution = {
      'A+': 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };
    students.forEach((s) => {
      const avg = s.currentAcademicAverage || 65;
      if (avg >= 90) gradeDistribution['A+']++;
      else if (avg >= 75) gradeDistribution['A']++;
      else if (avg >= 60) gradeDistribution['B']++;
      else if (avg >= 50) gradeDistribution['C']++;
      else if (avg >= 35) gradeDistribution['D']++;
      else gradeDistribution['F']++;
    });

    // 4. Highlighted students needing attention
    const highAttentionStudents = students.filter(
      (s) => s.attentionLevel === 'HIGH_ATTENTION' || s.currentAttendanceRate < 60 || s.currentAcademicAverage < 40
    );

    const moderateAttentionStudents = students.filter(
      (s) => s.attentionLevel === 'MODERATE_ATTENTION' || (s.currentAttendanceRate < 75 && s.currentAttendanceRate >= 60)
    );

    return res.status(200).json({
      success: true,
      data: {
        schoolInfo: {
          name: 'Govt Model Higher Secondary School',
          village: 'Sundarpur Gram Panchayat',
          district: 'Central District',
          totalClasses: classes.length,
          totalStudents,
          totalFaculty: store.users.filter((u) => u.role === 'teacher').length || 4,
        },
        academics: {
          overallAttendanceAverage: `${avgAttendance}%`,
          overallAcademicAverage: `${avgScore}%`,
          classWiseAttendance,
          subjectWiseAverages,
          gradeDistribution,
        },
        attention: {
          highAttentionCount: highAttentionStudents.length,
          moderateAttentionCount: moderateAttentionStudents.length,
          flaggedStudents: highAttentionStudents.map((s) => ({
            _id: s._id,
            name: s.name,
            rollNumber: s.rollNumber,
            className: s.class?.name || 'Class 8-A',
            attendance: s.currentAttendanceRate || 52,
            academicAverage: s.currentAcademicAverage || 38,
            consecutiveAbsences: s.consecutiveAbsences || 0,
            reasons: [
              s.currentAttendanceRate < 60 ? `Critical Attendance Deficit (${s.currentAttendanceRate}%)` : null,
              s.currentAcademicAverage < 40 ? `Academic Remedial Required (${s.currentAcademicAverage}%)` : null,
              s.consecutiveAbsences >= 3 ? `${s.consecutiveAbsences} days consecutive absence` : null,
            ].filter(Boolean),
          })),
        },
        communityResources: {
          verifiedDonationsCount: store.contributions.filter((c) => c.status === 'RECEIVED').length,
          activeSupportDrives: store.communityDrives.length,
          openNeedsCount: store.schoolNeeds.filter((n) => n.status !== 'Completed').length,
          ngoContributionsCount: store.contributions.filter((c) => c.contributorRole === 'ngo').length,
          alumniContributionsCount: store.contributions.filter((c) => c.contributorRole === 'alumni').length,
          villageDrivesCount: store.communityDrives.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
