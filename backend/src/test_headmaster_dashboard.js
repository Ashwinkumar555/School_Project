import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from './models/User.js';
import Student from './models/Student.js';
import Class from './models/Class.js';
import { generateToken } from './utils/generateToken.js';

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting Dedicated Head Master Dashboard Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // 1. Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    assert(mongoose.connection.readyState === 1, 'Connected to MongoDB Atlas');

    // 2. Setup Headmaster user & Teacher user & Student user tokens
    let headmaster = await User.findOne({ role: 'headmaster_admin' });
    if (!headmaster) {
      headmaster = await User.create({
        name: 'Dr. Meenakshi Sundaram',
        phone: '984041854',
        email: 'headmaster@school.gov.in',
        role: 'headmaster_admin',
        schoolName: 'Govt Higher Secondary School',
      });
    }
    const adminToken = generateToken(headmaster._id, headmaster.role, { name: headmaster.name, phone: headmaster.phone });
    assert(!!adminToken, `Head Master token generated: ${headmaster.name}`);

    let teacher = await User.findOne({ role: 'teacher' });
    const teacherToken = generateToken(teacher?._id || new mongoose.Types.ObjectId(), 'teacher', { name: teacher?.name || 'Teacher' });

    let student = await User.findOne({ role: 'student' });
    const studentToken = generateToken(student?._id || new mongoose.Types.ObjectId(), 'student', { name: student?.name || 'Student' });

    // -------------------------------------------------------------
    // SECTION 1: STUDENT MANAGEMENT TESTS
    // -------------------------------------------------------------
    console.log('\n--- Section 1: Student Management ---');
    const stdRes = await fetch(`${API_BASE}/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const stdData = await stdRes.json();
    assert(stdRes.status === 200 && stdData.success === true, 'Head Master can view all students (200 OK)');
    assert(Array.isArray(stdData.data) && stdData.data.length > 0, `Retrieved ${stdData.data.length} students`);

    const firstStudent = stdData.data[0];
    const updateStdRes = await fetch(`${API_BASE}/students/${firstStudent._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `${firstStudent.name} (Verified)`,
        gender: 'Male',
        parentPhone: '+91 98765 00099',
      }),
    });
    const updateStdData = await updateStdRes.json();
    assert(updateStdRes.status === 200 && updateStdData.success === true, 'Head Master updated student details & parent contact');

    // -------------------------------------------------------------
    // SECTION 2: TEACHER MANAGEMENT TESTS
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Teacher Management ---');
    // Get Teachers
    const getTeachRes = await fetch(`${API_BASE}/teachers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getTeachData = await getTeachRes.json();
    assert(getTeachRes.status === 200 && getTeachData.success === true, 'Head Master retrieved faculty list (200 OK)');

    // Create New Teacher
    const newTeachPhone = `9840${Date.now().toString().slice(-5)}`;
    const createTeachRes = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Smt. Radhika Raman',
        phone: newTeachPhone,
        email: `radhika.${Date.now()}@school.gov.in`,
        specialization: 'Physical Science',
        isClassTeacher: false,
        assignedSubjectNames: ['Science'],
      }),
    });
    const createTeachData = await createTeachRes.json();
    assert(createTeachRes.status === 201 && createTeachData.success === true, 'Head Master created new teacher profile');
    const createdTeacherId = createTeachData.data?._id;

    // Update Teacher
    const updateTeachRes = await fetch(`${API_BASE}/teachers/${createdTeacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        specialization: 'Physics & General Science',
      }),
    });
    const updateTeachData = await updateTeachRes.json();
    assert(updateTeachRes.status === 200 && updateTeachData.success === true, 'Head Master updated teacher specialization');

    // Assign Teacher to Class & Subject
    const classes = await Class.find();
    if (classes.length > 0) {
      const assignRes = await fetch(`${API_BASE}/teachers/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          teacherId: createdTeacherId,
          classId: classes[0]._id,
          isClassTeacher: true,
          subjectName: 'Physical Science',
        }),
      });
      const assignData = await assignRes.json();
      assert(assignRes.status === 200 && assignData.success === true, 'Head Master assigned teacher to class & subject');
    }

    // Delete Teacher
    const delTeachRes = await fetch(`${API_BASE}/teachers/${createdTeacherId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const delTeachData = await delTeachRes.json();
    assert(delTeachRes.status === 200 && delTeachData.success === true, 'Head Master removed teacher profile');

    // -------------------------------------------------------------
    // SECTION 3: ACADEMIC MONITORING TESTS
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Academic Monitoring ---');
    assert(
      firstStudent.currentAttendanceRate !== undefined && firstStudent.currentAcademicAverage !== undefined,
      'Head Master can monitor student attendance percentage and academic average'
    );
    assert(Array.isArray(firstStudent.subjectMarks), 'Head Master can review teacher-entered subject marks array');

    // -------------------------------------------------------------
    // SECTION 4: REPORTS & ANALYTICS TESTS
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Reports & Analytics ---');
    const reportRes = await fetch(`${API_BASE}/reports/school-summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reportData = await reportRes.json();
    assert(reportRes.status === 200 && reportData.success === true, 'Head Master retrieved institutional summary report');
    assert(Array.isArray(reportData.data?.academics?.classWiseAttendance), 'Report contains class-wise attendance rates');
    assert(Array.isArray(reportData.data?.academics?.subjectWiseAverages), 'Report contains subject-wise averages');
    assert(reportData.data?.academics?.gradeDistribution !== undefined, 'Report contains grade distribution (A+, A, B, C, D, F)');
    assert(reportData.data?.attention !== undefined, 'Report highlights students needing attention');

    // -------------------------------------------------------------
    // SECTION 5: COMMUNITY & SUPPORT TESTS
    // -------------------------------------------------------------
    console.log('\n--- Section 5: Community & Support ---');
    const needsRes = await fetch(`${API_BASE}/school-needs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const needsData = await needsRes.json();
    assert(needsRes.status === 200 && needsData.success === true, 'Head Master viewed school needs');

    const drivesRes = await fetch(`${API_BASE}/drives`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const drivesData = await drivesRes.json();
    assert(drivesRes.status === 200 && drivesData.success === true, 'Head Master viewed village community drives');

    const contribsRes = await fetch(`${API_BASE}/contributions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const contribsData = await contribsRes.json();
    assert(contribsRes.status === 200 && contribsData.success === true, 'Head Master viewed contributions and sponsorships');

    // -------------------------------------------------------------
    // ROLE & SECURITY (RBAC) TESTS
    // -------------------------------------------------------------
    console.log('\n--- Role-Based Access Control (RBAC) Protection ---');
    // Student attempting to access /api/teachers (POST)
    const studentTeacherRes = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized Teacher', phone: '9999999999' }),
    });
    assert(studentTeacherRes.status === 403, 'Student cannot add teachers (403 Forbidden as expected)');

    // Teacher attempting to delete another teacher
    const teacherDelRes = await fetch(`${API_BASE}/teachers/dummy-id`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert(teacherDelRes.status === 403, 'Teacher cannot delete faculty members (403 Forbidden as expected)');

    console.log(`\n========================================`);
    console.log(`🏁 Head Master Test Suite: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 Test Execution Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
