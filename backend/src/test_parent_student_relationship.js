import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('  TESTING PARENT -> STUDENT RELATIONSHIP & WORKFLOW ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed++;
    } else {
      console.error(`  FAIL: ${message}`);
      failed++;
    }
  }

  // Helper to login via phone OTP
  async function loginParent(phone, role = 'parent') {
    const otpRes = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const otpData = await otpRes.json();
    const otp = otpData.data?.otp;

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, role, otp }),
    });
    return await loginRes.json();
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Parent Lakshmi Narayanan Login & Linked Student
    // -------------------------------------------------------------
    console.log('--- TEST 1: Parent Lakshmi Narayanan (984030216) ---');
    const lakshmiLogin = await loginParent('984030216');
    assert(lakshmiLogin.success, 'Lakshmi Narayanan login successful');
    assert(lakshmiLogin.data?.token, 'Received JWT token');
    const lakshmiToken = lakshmiLogin.data?.token;
    const lakshmiUser = lakshmiLogin.data?.user;

    assert(lakshmiUser?.role === 'parent', 'User role is parent');
    assert(Array.isArray(lakshmiUser?.children) && lakshmiUser.children.length > 0, 'User object contains children array');

    // Fetch linked students via GET /api/students/linked
    const linkedRes1 = await fetch(`${API_BASE}/students/linked`, {
      headers: { Authorization: `Bearer ${lakshmiToken}` },
    });
    assert(linkedRes1.status === 200, 'GET /api/students/linked returns 200 OK');
    const linkedData1 = await linkedRes1.json();
    assert(linkedData1.success && linkedData1.count >= 1, `Found ${linkedData1.count} linked student(s) for Lakshmi`);
    const student1 = linkedData1.data?.[0];
    assert(student1?.name === 'Dinesh Kumar', `Linked student name is ${student1?.name} (Expected: Dinesh Kumar)`);
    assert(student1?.rollNumber === '06', `Student roll number is ${student1?.rollNumber}`);
    assert(student1?._id, `Student has valid ID: ${student1?._id}`);

    // Fetch via GET /api/students as well
    const studentsRes1 = await fetch(`${API_BASE}/students`, {
      headers: { Authorization: `Bearer ${lakshmiToken}` },
    });
    const studentsData1 = await studentsRes1.json();
    assert(studentsData1.count >= 1, `GET /api/students returns ${studentsData1.count} student(s) for Lakshmi`);

    // -------------------------------------------------------------
    // Test 2: Teacher List Access for Parent Role
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Teacher List Access for Parent Role ---');
    const teachersRes = await fetch(`${API_BASE}/teachers`, {
      headers: { Authorization: `Bearer ${lakshmiToken}` },
    });
    assert(teachersRes.status === 200, 'GET /api/teachers accessible by parent (200 OK)');
    const teachersData = await teachersRes.json();
    const teachersList = teachersData.data || [];
    assert(teachersList.length > 0, `Teachers list retrieved (${teachersList.length} teachers available)`);
    const targetTeacher = teachersList[0];
    console.log(`  Selected Teacher: ${targetTeacher?.name} (${targetTeacher?._id})`);

    // -------------------------------------------------------------
    // Test 3: Parent Teacher Communication (Message & Meeting Request)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Teacher Communication (Message & Meeting) ---');
    
    // 3A: Message Teacher
    const messagePayload = {
      studentId: student1._id,
      teacherId: targetTeacher?._id,
      type: 'Academic Query',
      subject: 'Inquiry on Science Olympiad preparation',
      message: 'Hello teacher, I would like to know how Dinesh is preparing for the upcoming science competition.',
    };

    const sendMsgRes = await fetch(`${API_BASE}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lakshmiToken}`,
      },
      body: JSON.stringify(messagePayload),
    });
    assert(sendMsgRes.status === 201, 'POST /api/communications creates message (201 Created)');
    const sendMsgData = await sendMsgRes.json();
    assert(sendMsgData.success, 'Message creation response success: true');
    assert(sendMsgData.data?.student?.toString() === student1._id.toString(), 'Saved communication links student ID');
    assert(sendMsgData.data?.parent?.toString() === lakshmiUser._id.toString(), 'Saved communication links parent ID');
    assert(sendMsgData.data?.status === 'Pending', 'Initial communication status is "Pending"');

    // 3B: Request Meeting
    const meetingPayload = {
      studentId: student1._id,
      teacherId: targetTeacher?._id,
      type: 'Meeting Request',
      subject: 'Parent-Teacher Meeting regarding term marks',
      message: 'Requesting a 15-minute discussion during morning office hours.',
      requestedMeetingDate: '2026-09-15',
      preferredTime: 'Morning (10:00 AM - 12:00 PM)',
    };

    const meetingRes = await fetch(`${API_BASE}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lakshmiToken}`,
      },
      body: JSON.stringify(meetingPayload),
    });
    assert(meetingRes.status === 201, 'POST /api/communications creates meeting request (201 Created)');
    const meetingData = await meetingRes.json();
    assert(meetingData.success, 'Meeting request response success: true');
    assert(meetingData.data?.type === 'Meeting Request', 'Communication type is "Meeting Request"');

    // -------------------------------------------------------------
    // Test 4: Authorization & Security Checks
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Authorization Check (Cannot message for unlinked student) ---');
    // Attempt to communicate on behalf of student 'SCH-2024-001' (Aarav Kumar, who belongs to Meena Devi)
    const fakeStudentId = '65f200000000000000000001'; // Aarav Kumar
    const fraudPayload = {
      studentId: fakeStudentId,
      teacherId: targetTeacher?._id,
      type: 'Academic Query',
      subject: 'Unauthorized query test',
      message: 'This should be blocked by backend authorization.',
    };

    const fraudRes = await fetch(`${API_BASE}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lakshmiToken}`,
      },
      body: JSON.stringify(fraudPayload),
    });
    assert(fraudRes.status === 403, `Unauthorized student communication rejected with 403 Forbidden (Actual: ${fraudRes.status})`);

    // -------------------------------------------------------------
    // Test 5: Account with NO linked student
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Parent with NO Linked Student ---');
    // Register a new parent without linking any student
    const unlinkedPhone = '919999000001';
    const otpRes = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: unlinkedPhone }),
    });
    const otpData = await otpRes.json();
    const unlinkedOtp = otpData.data?.otp;

    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unlinked Parent Account',
        phone: unlinkedPhone,
        aadhaarNumber: '111122223333',
        role: 'parent',
        otp: unlinkedOtp,
      }),
    });
    const regData = await regRes.json();
    const unlinkedToken = regData.data?.token;

    if (unlinkedToken) {
      const unlinkedGetRes = await fetch(`${API_BASE}/students/linked`, {
        headers: { Authorization: `Bearer ${unlinkedToken}` },
      });
      const unlinkedGetData = await unlinkedGetRes.json();
      assert(unlinkedGetData.count === 0, 'Unlinked parent returns count 0');
      assert(
        unlinkedGetData.message === 'No linked student found for this account. Please link a student or contact school administration.',
        'Proper banner message returned for unlinked parent'
      );
    } else {
      console.log('  Note: Unlinked parent registration skipped (already registered or error: ' + regData.message + ')');
    }

    // -------------------------------------------------------------
    // Test 6: Parent Registration with studentIdentifier (Roll/Admission)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Parent Registration with studentIdentifier ---');
    const newPhone = '919876543299';
    const otpRes2 = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: newPhone }),
    });
    const otpData2 = await otpRes2.json();
    const newOtp = otpData2.data?.otp;

    const regRes2 = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Registered Parent',
        phone: newPhone,
        aadhaarNumber: '999988887777',
        role: 'parent',
        studentIdentifier: 'SCH-2024-004', // Ananya Patel
        otp: newOtp,
      }),
    });
    const regData2 = await regRes2.json();
    if (regData2.success) {
      const newToken = regData2.data?.token;
      const newLinkedRes = await fetch(`${API_BASE}/students/linked`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      const newLinkedData = await newLinkedRes.json();
      assert(newLinkedData.count >= 1, `Auto-linked ${newLinkedData.count} student(s) using studentIdentifier`);
      assert(newLinkedData.data?.[0]?.name === 'Ananya Patel', `Linked student is ${newLinkedData.data?.[0]?.name}`);
    } else {
      console.log('  Note: Registration test note: ' + regData2.message);
    }

    console.log('\n====================================================');
    console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
