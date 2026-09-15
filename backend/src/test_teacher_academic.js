import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Student from './models/Student.js';
import AcademicRecord from './models/AcademicRecord.js';
import Class from './models/Class.js';
import User from './models/User.js';
import { generateToken } from './utils/generateToken.js';

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting Dedicated Teacher Dashboard & Academic Management Test Suite...\n');
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

    // 2. Setup or find teacher user and student user
    let teacherUser = await User.findOne({ role: 'teacher' });
    if (!teacherUser) {
      teacherUser = await User.create({
        name: 'Teacher Smt. Lakshmi',
        email: `lakshmi.teacher.${Date.now()}@school.gov.in`,
        password: 'Password@123',
        role: 'teacher',
        phone: '+91 98765 11111',
      });
    }
    const teacherToken = generateToken(teacherUser._id, teacherUser.role, { name: teacherUser.name, phone: teacherUser.phone });
    assert(!!teacherToken, `Generated auth token for Teacher: ${teacherUser.name} (${teacherUser.role})`);

    let studentUser = await User.findOne({ role: 'student' });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Test Student User',
        email: `student.test.${Date.now()}@school.gov.in`,
        password: 'Password@123',
        role: 'student',
        phone: '+91 98765 22222',
      });
    }
    const studentToken = generateToken(studentUser._id, studentUser.role, { name: studentUser.name, phone: studentUser.phone });
    assert(!!studentToken, `Generated auth token for Student: ${studentUser.name} (${studentUser.role})`);

    // 3. Test GET /api/students as Teacher
    console.log('\n--- 1. Testing GET /api/students as Teacher ---');
    const getRes = await fetch(`${API_BASE}/students`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const getData = await getRes.json();
    assert(getRes.status === 200 && getData.success === true, 'Teacher retrieves student roster (200 OK)');
    assert(Array.isArray(getData.data) && getData.data.length > 0, `Roster returned ${getData.data?.length} students`);

    // 4. Test POST /api/students (Add Student with Name, Roll No, Attendance, and Multiple Dynamic Subjects & Marks)
    console.log('\n--- 2. Testing POST /api/students (Create Student with Dynamic Subjects & Marks) ---');
    const newStudentPayload = {
      name: 'Aditya Nair',
      rollNumber: '88',
      attendance: 92,
      currentAttendanceRate: 92,
      subjectMarks: [
        { subject: 'Mathematics', marksObtained: 95, maxMarks: 100 },
        { subject: 'Science', marksObtained: 88, maxMarks: 100 },
        { subject: 'English', marksObtained: 92, maxMarks: 100 },
        { subject: 'Computer Science', marksObtained: 98, maxMarks: 100 },
      ],
    };

    const postRes = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify(newStudentPayload),
    });
    const postData = await postRes.json();
    assert(postRes.status === 201 && postData.success === true, 'Teacher created new student successfully (201 Created)');
    assert(postData.data?.name === 'Aditya Nair', 'Created student name matches "Aditya Nair"');
    assert(postData.data?.rollNumber === '88', 'Created student roll number matches "88"');
    assert(postData.data?.currentAttendanceRate === 92, 'Created student attendance rate is 92%');
    assert(postData.data?.subjectMarks?.length === 4, `Created student has 4 subjects (${postData.data?.subjectMarks?.map(m => m.subject).join(', ')})`);

    const createdStudentId = postData.data?._id;

    // 5. Verify Persistence in MongoDB Atlas directly
    console.log('\n--- 3. Verifying Direct MongoDB Atlas Persistence ---');
    const dbStudent = await Student.findById(createdStudentId);
    assert(!!dbStudent, 'Student document exists directly in MongoDB Atlas');
    assert(dbStudent?.name === 'Aditya Nair', 'MongoDB student name verified');
    assert(dbStudent?.currentAttendanceRate === 92, 'MongoDB attendance rate verified');
    assert(dbStudent?.subjectMarks?.length === 4, 'MongoDB subjectMarks array has all 4 subjects');

    const dbAcadRecord = await AcademicRecord.findOne({ student: createdStudentId });
    assert(!!dbAcadRecord, 'AcademicRecord document automatically upserted in MongoDB Atlas');
    assert(dbAcadRecord?.marks?.length === 4, 'MongoDB AcademicRecord contains 4 subjects with marks');

    // 6. Test PUT /api/students/:id (Edit Student Details, Attendance & Add New Subject)
    console.log('\n--- 4. Testing PUT /api/students/:id (Edit Details, Attendance, Subject Marks) ---');
    const updatePayload = {
      name: 'Aditya K. Nair',
      rollNumber: '88',
      attendance: 96,
      currentAttendanceRate: 96,
      subjectMarks: [
        { subject: 'Mathematics', marksObtained: 98, maxMarks: 100 },
        { subject: 'Science', marksObtained: 91, maxMarks: 100 },
        { subject: 'English', marksObtained: 94, maxMarks: 100 },
        { subject: 'Computer Science', marksObtained: 100, maxMarks: 100 },
        { subject: 'Social Science', marksObtained: 89, maxMarks: 100 }, // Added 5th subject dynamically
      ],
    };

    const putRes = await fetch(`${API_BASE}/students/${createdStudentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify(updatePayload),
    });
    const putData = await putRes.json();
    assert(putRes.status === 200 && putData.success === true, 'Teacher updated student details (200 OK)');
    assert(putData.data?.name === 'Aditya K. Nair', 'Updated name reflected');
    assert(putData.data?.currentAttendanceRate === 96, 'Updated attendance (96%) reflected');
    assert(putData.data?.subjectMarks?.length === 5, '5th subject "Social Science" added dynamically');

    // Verify DB update
    const updatedDbStudent = await Student.findById(createdStudentId);
    assert(updatedDbStudent?.name === 'Aditya K. Nair', 'Updated name persisted in MongoDB Atlas');
    assert(updatedDbStudent?.currentAttendanceRate === 96, 'Updated attendance persisted in MongoDB Atlas');
    assert(updatedDbStudent?.subjectMarks?.length === 5, '5 subjects persisted in MongoDB Atlas');

    // 7. Test Role-Based Access Control
    console.log('\n--- 5. Testing Role-Based Access Control (RBAC) Protection ---');
    // Student role attempting to create student
    const studentPostRes = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ name: 'Hacked Student', rollNumber: '99' }),
    });
    assert(studentPostRes.status === 403, `Student cannot create students (Got 403 Forbidden as expected)`);

    // Student role attempting to edit student marks/attendance
    const studentPutRes = await fetch(`${API_BASE}/students/${createdStudentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ attendance: 100 }),
    });
    assert(studentPutRes.status === 403, `Student cannot edit student details or marks (Got 403 Forbidden as expected)`);

    // Student role attempting to delete student
    const studentDelRes = await fetch(`${API_BASE}/students/${createdStudentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentDelRes.status === 403, `Student cannot delete students (Got 403 Forbidden as expected)`);

    // 8. Test DELETE /api/students/:id by Teacher
    console.log('\n--- 6. Testing DELETE /api/students/:id by Teacher ---');
    const deleteRes = await fetch(`${API_BASE}/students/${createdStudentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const delData = await deleteRes.json();
    assert(deleteRes.status === 200 && delData.success === true, 'Teacher deleted student successfully (200 OK)');

    const deletedCheck = await Student.findById(createdStudentId);
    assert(!deletedCheck, 'Student was permanently removed from MongoDB Atlas');
    const deletedAcadCheck = await AcademicRecord.findOne({ student: createdStudentId });
    assert(!deletedAcadCheck, 'Student AcademicRecord was cleaned up from MongoDB Atlas');

    console.log(`\n========================================`);
    console.log(`🏁 Test Results: ${passed} Passed, ${failed} Failed`);
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
