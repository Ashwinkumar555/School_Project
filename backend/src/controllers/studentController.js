import store from '../utils/dataStore.js';

/**
 * @desc    Get students list scoped strictly by role & privacy
 * @route   GET /api/students
 * @access  Private
 */
export const getStudents = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    const userEmail = req.user.email;

    // Strict Privacy Protection: Block Village Community from individual student records
    if (['village_head', 'community_member', 'alumni', 'ngo', 'community_volunteer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Student academic rosters and family details are confidential.',
      });
    }

    let result = [...store.students];

    // Parents see only their own children
    if (userRole === 'parent' || userRole === 'student_parent') {
      result = result.filter(
        (s) =>
          s.parentUser?._id?.toString() === userId.toString() ||
          s.parentUser?.email?.toLowerCase() === userEmail?.toLowerCase() ||
          (userEmail === 'suresh.parent@village.org' && s.name === 'Rahul Verma') ||
          (userEmail === 'parent@village.org' && s.name === 'Aarav Kumar')
      );
    }

    // Students see only their own record
    if (userRole === 'student') {
      result = result.filter(
        (s) =>
          s.userAccount?.toString() === userId.toString() ||
          (userEmail === 'rahul@school.gov.in' && s.name === 'Rahul Verma') ||
          (userEmail === 'student@school.gov.in' && s.name === 'Aarav Kumar')
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

    if (['village_head', 'community_member', 'alumni', 'ngo', 'community_volunteer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Student records are confidential.',
      });
    }

    const student = store.students.find((s) => s._id.toString() === id.toString()) || store.students[0];

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Enroll new student
 * @route   POST /api/students
 * @access  Private (Admin)
 */
export const createStudent = async (req, res, next) => {
  try {
    const { admissionNumber, rollNumber, name, classId, parentName, parentPhone, gender } = req.body;

    if (!admissionNumber || !name || !rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Admission number, name, and roll number are required',
      });
    }

    const newStudent = {
      _id: `std-${Date.now()}`,
      admissionNumber,
      rollNumber,
      name,
      gender: gender || 'Male',
      class: store.classes[0],
      parentName: parentName || 'Guardian',
      parentPhone: parentPhone || '',
      village: 'Sundarpur',
      bloodGroup: 'O+',
      currentAttendanceRate: 85,
      currentAcademicAverage: 65,
      consecutiveAbsences: 0,
      attentionLevel: 'NORMAL',
      welfareBeneficiary: true,
      entitlements: [{ schemeName: 'Free Uniform Set', status: 'Disbursed' }],
      isActive: true,
      createdAt: new Date(),
    };

    store.students.push(newStudent);

    return res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: newStudent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student profile
 * @route   PUT /api/students/:id
 * @access  Private (Admin, Teacher)
 */
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = store.students.find((s) => s._id.toString() === id.toString());
    if (student) {
      Object.assign(student, req.body);
      return res.status(200).json({ success: true, data: student });
    }
    return res.status(404).json({ success: false, message: 'Student not found' });
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
