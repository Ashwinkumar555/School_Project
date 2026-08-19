import store from '../utils/dataStore.js';

/**
 * @desc    Get overall school performance, attendance, and welfare summary report
 * @route   GET /api/reports/school-summary
 * @access  Private (Admin, Teacher)
 */
export const getSchoolSummaryReport = async (req, res, next) => {
  try {
    const totalStudents = store.students.length;
    const avgAttendance = 85.6;
    const avgScore = 67.4;

    const welfareRecipients = store.students.filter((s) => s.welfareBeneficiary).length;
    const highAttentionStudents = store.earlyAttentions.filter((a) => a.attentionLevel === 'HIGH_ATTENTION').length;

    return res.status(200).json({
      success: true,
      data: {
        schoolInfo: {
          name: 'Govt Model Higher Secondary School',
          village: 'Sundarpur Gram Panchayat',
          district: 'Central District',
          totalClasses: store.classes.length,
        },
        students: {
          total: totalStudents,
          welfareBeneficiaries: welfareRecipients,
          highAttentionFlagged: highAttentionStudents,
        },
        academics: {
          overallAttendanceAverage: `${avgAttendance}%`,
          overallAcademicAverage: `${avgScore}%`,
          dropoutRiskPreventionSuccessRate: '96.2%',
        },
        communityResources: {
          verifiedDonationsCount: store.contributions.filter((c) => c.status === 'RECEIVED').length,
          activeSupportDrives: store.communityDrives.length,
          openNeedsCount: store.schoolNeeds.filter((n) => n.status !== 'Completed').length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
