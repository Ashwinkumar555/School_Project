import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { generateToken } from './utils/generateToken.js';

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting Dedicated Parent/Guardian Dashboard Integration & RBAC Test Suite...\n');
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
    // 1. Health check to ensure server is running
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'healthy', 'Backend API server is healthy and running on port 5000');

    // 2. Fetch student roster using Head Master token
    const headmasterToken = generateToken('6a84836a43e0fd90d353e6e1', 'headmaster_admin', {
      phone: '984041854',
      name: 'Dr. Meenakshi Sundaram',
    });

    const studentsListRes = await fetch(`${API_BASE}/students`, {
      headers: { Authorization: `Bearer ${headmasterToken}` },
    });
    const studentsListData = await studentsListRes.json();
    assert(studentsListRes.status === 200 && Array.isArray(studentsListData.data), 'Retrieved students list for testing');

    const student1 = studentsListData.data[0];
    const student2 = studentsListData.data[1];
    assert(student1 != null && student2 != null, 'Found at least 2 distinct students for linkage and isolation tests');

    console.log(`  ℹ️ Test Target Student 1: ${student1.name} (Parent: ${student1.parentName}, Phone: ${student1.parentPhone})`);
    console.log(`  ℹ️ Test Target Student 2: ${student2.name} (Parent: ${student2.parentName}, Phone: ${student2.parentPhone})`);

    // 3. Generate role tokens
    const linkedParentToken = generateToken('parent-user-linked', 'parent', {
      phone: student1.parentPhone,
      name: student1.parentName,
    });

    const unlinkedParentToken = generateToken('parent-user-unlinked', 'parent', {
      phone: '9849999999',
      name: 'Completely Unlinked Guardian',
    });

    const teacherToken = generateToken('teacher-user-1', 'teacher', {
      phone: '984041855',
      name: 'Smt. Lakshmi Teacher',
    });

    // =========================================================================
    // SECTION 1: STUDENT PERFORMANCE (VIEW-ONLY ACADEMIC MARKS & REPORTS)
    // =========================================================================
    console.log('\n--- [SECTION 1] Student Performance ---');

    // 1.1 Linked Parent queries student details
    const student1Res = await fetch(`${API_BASE}/students/${student1._id}`, {
      headers: { Authorization: `Bearer ${linkedParentToken}` },
    });
    const student1Data = await student1Res.json();
    assert(student1Res.status === 200, 'Linked parent can view child profile (200 OK)');
    assert(student1Data.data?.name === student1.name, 'Child name matches profile');

    // 1.2 Linked Parent queries student marks
    const marksRes = await fetch(`${API_BASE}/academic/student/${student1._id}`, {
      headers: { Authorization: `Bearer ${linkedParentToken}` },
    });
    const marksData = await marksRes.json();
    assert(marksRes.status === 200, 'Linked parent can view child academic marks (200 OK)');
    assert(marksData.data?.currentAverage !== undefined || marksData.data?.reportCards !== undefined, 'Academic report structure is present');

    // 1.3 View-Only: Parent cannot record marks (403 Forbidden)
    const postMarksRes = await fetch(`${API_BASE}/academic/marks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify({
        studentId: student1._id,
        term: 'Quarterly Exam',
        marks: [{ subject: 'Mathematics', marksObtained: 100, maxMarks: 100 }],
      }),
    });
    assert(postMarksRes.status === 403, 'Parent blocked with 403 Forbidden from creating/recording marks');

    // 1.4 View-Only: Parent cannot edit marks (403 Forbidden)
    const putMarksRes = await fetch(`${API_BASE}/academic/marks/dummy-record-id`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify({ marks: [] }),
    });
    assert(putMarksRes.status === 403, 'Parent blocked with 403 Forbidden from editing marks');

    // =========================================================================
    // SECTION 2: ATTENDANCE (VIEW-ONLY LOGS & SUMMARY)
    // =========================================================================
    console.log('\n--- [SECTION 2] Attendance Monitoring ---');

    // 2.1 Linked Parent queries student attendance logs
    const attRes = await fetch(`${API_BASE}/attendance/student/${student1._id}`, {
      headers: { Authorization: `Bearer ${linkedParentToken}` },
    });
    const attData = await attRes.json();
    assert(attRes.status === 200, 'Linked parent can view child attendance logs (200 OK)');
    assert(attData.data?.attendanceRate !== undefined, 'Attendance rate percentage is present');
    assert(Array.isArray(attData.data?.logs), 'Daily attendance logs returned as array');

    // 2.2 View-Only: Parent cannot record attendance (403 Forbidden)
    const postAttRes = await fetch(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify({
        student: student1._id,
        date: '2026-09-06',
        status: 'Present',
      }),
    });
    assert(postAttRes.status === 403, 'Parent blocked with 403 Forbidden from recording attendance');

    // 2.3 View-Only: Parent cannot update attendance (403 Forbidden)
    const putAttRes = await fetch(`${API_BASE}/attendance/student/${student1._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify({ status: 'Present' }),
    });
    assert(putAttRes.status === 403, 'Parent blocked with 403 Forbidden from updating attendance');

    // =========================================================================
    // SECTION 3: SCHOOL UPDATES (ANNOUNCEMENTS, EXAMS, HOLIDAYS)
    // =========================================================================
    console.log('\n--- [SECTION 3] School Updates ---');

    const annRes = await fetch(`${API_BASE}/announcements`, {
      headers: { Authorization: `Bearer ${linkedParentToken}` },
    });
    const annData = await annRes.json();
    assert(annRes.status === 200, 'Parent can fetch school updates & announcements (200 OK)');
    assert(Array.isArray(annData.data), 'Announcements returned as array');
    assert(annData.data.length > 0, 'Announcements list is populated');

    // Query category filter: Academic (Exam Dates)
    const examNoticesRes = await fetch(`${API_BASE}/announcements?category=Academic`, {
      headers: { Authorization: `Bearer ${linkedParentToken}` },
    });
    assert(examNoticesRes.status === 200, 'Parent can filter announcements by category Academic (200 OK)');

    // Query category filter: Holiday
    const holidayNoticesRes = await fetch(`${API_BASE}/announcements?category=Holiday`, {
      headers: { Authorization: `Bearer ${linkedParentToken}` },
    });
    assert(holidayNoticesRes.status === 200, 'Parent can filter announcements by category Holiday (200 OK)');

    // =========================================================================
    // SECTION 4: TEACHER COMMUNICATION (MESSAGES, PTM & REPLIES)
    // =========================================================================
    console.log('\n--- [SECTION 4] Teacher Communication ---');

    // 4.1 Linked Parent sends an Academic Query
    const commPayload = {
      studentId: student1._id,
      type: 'Academic Query',
      subject: 'Query regarding Mathematics homework and term syllabus',
      message: 'Hello Smt. Lakshmi, I would like to know if extra practice sheets are available for chapter 5.',
    };
    const sendCommRes = await fetch(`${API_BASE}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify(commPayload),
    });
    const sendCommData = await sendCommRes.json();
    assert(sendCommRes.status === 201, 'Linked parent can send query to teacher (201 Created)');
    assert(sendCommData.data?.subject === commPayload.subject, 'Message subject verified');
    const commId = sendCommData.data?._id;

    // 4.2 Linked Parent sends a Parent-Teacher Meeting (PTM) Request
    const ptmPayload = {
      studentId: student1._id,
      type: 'Meeting Request',
      subject: 'Request for in-person Parent-Teacher discussion',
      message: 'Requesting a 15-minute discussion regarding overall academic progress.',
      requestedMeetingDate: '2026-09-12',
      preferredTime: 'Morning (10:00 AM - 12:00 PM)',
    };
    const sendPtmRes = await fetch(`${API_BASE}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify(ptmPayload),
    });
    assert(sendPtmRes.status === 201, 'Linked parent can request a Parent-Teacher Meeting (201 Created)');
    const ptmId = (await sendPtmRes.json()).data?._id;

    // 4.3 Parent queries their communications list
    const parentCommsRes = await fetch(`${API_BASE}/communications`, {
      headers: { Authorization: `Bearer ${linkedParentToken}` },
    });
    const parentCommsData = await parentCommsRes.json();
    assert(parentCommsRes.status === 200, 'Parent can fetch their communications list (200 OK)');
    assert(
      parentCommsData.data.some((c) => String(c._id) === String(commId)),
      'Created communication is present in parent communications list'
    );

    // 4.4 Teacher replies to Parent Query
    const replyRes = await fetch(`${API_BASE}/communications/${commId}/reply`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        reply: 'Yes, I have handed over supplementary problem sets to your child today in class.',
      }),
    });
    const replyData = await replyRes.json();
    assert(replyRes.status === 200, 'Teacher can reply to parent communication (200 OK)');
    assert(replyData.data?.status === 'Replied', 'Communication status updated to Replied');
    assert(replyData.data?.reply.includes('supplementary problem sets'), 'Teacher reply text saved');

    // 4.5 Teacher confirms and schedules the PTM
    const schedulePtmRes = await fetch(`${API_BASE}/communications/${ptmId}/reply`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        reply: 'Meeting confirmed. Please meet in the Staff Room on Saturday.',
        meetingDate: '2026-09-12',
        meetingTime: '10:30 AM',
        meetingLocation: 'Room 102 / Staff Room',
      }),
    });
    const schedulePtmData = await schedulePtmRes.json();
    assert(schedulePtmRes.status === 200, 'Teacher can confirm and schedule PTM (200 OK)');
    assert(schedulePtmData.data?.status === 'Meeting Scheduled', 'Status updated to Meeting Scheduled');

    // =========================================================================
    // SECTION 5: STRICT ROLE-BASED ACCESS CONTROL (RBAC) BOUNDARIES
    // =========================================================================
    console.log('\n--- [SECTION 5] Strict RBAC & Child Isolation Defenses ---');

    // 5.1 Parent blocked from viewing unlinked student details (student2)
    const unlinkedStudentRes = await fetch(`${API_BASE}/students/${student2._id}`, {
      headers: { Authorization: `Bearer ${linkedParentToken}` },
    });
    assert(unlinkedStudentRes.status === 403, 'Parent blocked with 403 Forbidden from viewing unlinked student profile');

    // 5.2 Parent blocked from viewing unlinked student marks (student2)
    const unlinkedMarksRes = await fetch(`${API_BASE}/academic/student/${student2._id}`, {
      headers: { Authorization: `Bearer ${linkedParentToken}` },
    });
    assert(unlinkedMarksRes.status === 403, 'Parent blocked with 403 Forbidden from viewing unlinked student marks');

    // 5.3 Parent blocked from viewing unlinked student attendance (student2)
    const unlinkedAttRes = await fetch(`${API_BASE}/attendance/student/${student2._id}`, {
      headers: { Authorization: `Bearer ${linkedParentToken}` },
    });
    assert(unlinkedAttRes.status === 403, 'Parent blocked with 403 Forbidden from viewing unlinked student attendance');

    // 5.4 Parent blocked from messaging teacher for an unlinked student (student2)
    const unlinkedCommRes = await fetch(`${API_BASE}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify({
        studentId: student2._id,
        subject: 'Unauthorized parent inquiry',
        message: 'Trying to contact teacher for student that does not belong to me.',
      }),
    });
    assert(unlinkedCommRes.status === 403, 'Parent blocked with 403 Forbidden from messaging teacher for unlinked child');

    // 5.5 Parent blocked from calling teacher reply endpoint
    const parentReplyRes = await fetch(`${API_BASE}/communications/${commId}/reply`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify({ reply: 'Parent attempting to impersonate teacher' }),
    });
    assert(parentReplyRes.status === 403, 'Parent blocked with 403 Forbidden from calling teacher reply endpoint');

    // 5.6 Parent blocked from administrative endpoints (creating students, teachers, classes)
    const parentCreateStudentRes = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify({ name: 'Rogue Student' }),
    });
    assert(parentCreateStudentRes.status === 403, 'Parent blocked with 403 Forbidden from student creation');

    const parentCreateTeacherRes = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify({ name: 'Rogue Teacher' }),
    });
    assert(parentCreateTeacherRes.status === 403, 'Parent blocked with 403 Forbidden from teacher creation');

    const parentCreateClassRes = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedParentToken}`,
      },
      body: JSON.stringify({ name: 'Class 9-Z' }),
    });
    assert(parentCreateClassRes.status === 403, 'Parent blocked with 403 Forbidden from class management');

    console.log(`\n========================================`);
    console.log(`🎯 Parent Dashboard Test Suite Summary:`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`========================================\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

runTests();
