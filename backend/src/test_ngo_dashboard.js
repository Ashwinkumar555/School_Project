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
import SupportRequest from './models/SupportRequest.js';
import Program from './models/Program.js';
import SupportRecord from './models/SupportRecord.js';
import { generateToken } from './utils/generateToken.js';

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting Dedicated NGO/Partner Dashboard Integration & RBAC Test Suite...\n');
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
    // 1. Database Connection
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    assert(mongoose.connection.readyState === 1, 'Connected to MongoDB Atlas');

    // 2. Setup Test Data
    let testClass = await Class.findOne();
    if (!testClass) {
      testClass = await Class.create({
        name: 'Class 8-A',
        grade: '8',
        section: 'A',
        academicYear: '2025-2026',
      });
    }

    let student = await Student.findOne();
    if (!student) {
      student = await Student.create({
        admissionNumber: `ADM-${Date.now()}`,
        rollNumber: '25',
        name: 'Kavitha Raman',
        gender: 'Female',
        class: testClass._id,
        section: 'A',
        parentName: 'Ramanathan',
        parentPhone: '9840112233',
        village: 'Sundarpur',
      });
    }

    // NGO User
    let ngoUser = await User.findOne({ role: 'ngo' });
    if (!ngoUser) {
      ngoUser = await User.create({
        name: 'Pratham Rural Education Trust',
        phone: `9840${Math.floor(10000 + Math.random() * 90000)}`,
        email: `pratham.${Date.now()}@ngo.org`,
        role: 'ngo',
        organizationName: 'Pratham Rural Education Trust',
      });
    }
    const ngoToken = generateToken(ngoUser._id, ngoUser.role, { phone: ngoUser.phone });

    // Headmaster User
    let headmaster = await User.findOne({ role: 'headmaster_admin' });
    if (!headmaster) {
      headmaster = await User.create({
        name: 'Dr. Meenakshi Sundaram',
        phone: `9841${Math.floor(10000 + Math.random() * 90000)}`,
        email: `headmaster.${Date.now()}@school.gov.in`,
        role: 'headmaster_admin',
        schoolName: 'Govt Higher Secondary School',
      });
    }
    const headmasterToken = generateToken(headmaster._id, headmaster.role, { phone: headmaster.phone });

    // Student User
    let studentUser = await User.findOne({ role: 'student' });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Student User',
        phone: `9842${Math.floor(10000 + Math.random() * 90000)}`,
        email: `student.${Date.now()}@school.gov.in`,
        role: 'student',
      });
    }
    const studentToken = generateToken(studentUser._id, studentUser.role, { phone: studentUser.phone });

    // =========================================================================
    // SECTION 1: SUPPORT REQUESTS WORKFLOW & PRIVACY
    // =========================================================================
    console.log('\n--- [SECTION 1] Support Requests (Forwarded by Head Master) ---');

    // Create a support request and forward it to NGO
    const newReq = await SupportRequest.create({
      student: student._id,
      studentName: student.name,
      studentClass: 'Class 8-A',
      schoolName: 'Govt Higher Secondary School',
      village: student.village || 'Sundarpur',
      requestedBy: headmaster._id,
      requesterRole: 'headmaster_admin',
      requesterName: headmaster.name,
      requesterPhone: '9841000000',
      category: 'Books & Notebooks',
      title: 'NCERT Grade 8 Science & Mathematics Textbooks',
      description: 'Standard textbook bundle required for academic term.',
      priority: 'High',
      estimatedAmount: 1200,
      status: 'Forwarded to NGO/Partner',
      forwardedToNgo: true,
      timeline: [
        {
          action: 'Forwarded to NGO/Partner',
          performedBy: headmaster._id,
          performedByName: headmaster.name,
          role: 'headmaster_admin',
          notes: 'Forwarded for NGO partner fulfillment.',
        },
      ],
    });
    assert(newReq._id != null, 'Created forwarded support request');

    // 1.1 NGO Fetches Support Requests
    const fetchReqsRes = await fetch(`${API_BASE}/support-requests`, {
      headers: { Authorization: `Bearer ${ngoToken}` },
    });
    const fetchReqsData = await fetchReqsRes.json();
    assert(fetchReqsRes.status === 200, 'NGO can fetch support requests list');
    assert(Array.isArray(fetchReqsData.data), 'Support requests returned as array');

    const retrievedReq = fetchReqsData.data.find((r) => r._id === newReq._id.toString());
    assert(retrievedReq != null, 'Retrieved the forwarded support request');

    // 1.2 Verify Student Privacy (no private phone or aadhaar in student / requester)
    if (retrievedReq) {
      assert(!retrievedReq.requesterPhone, 'Requester private phone is stripped for NGO privacy');
      if (retrievedReq.student && typeof retrievedReq.student === 'object') {
        assert(!retrievedReq.student.parentPhone, 'Student parentPhone is stripped for NGO privacy');
        assert(!retrievedReq.student.aadhaarNumber, 'Student aadhaarNumber is not exposed to NGO');
      }
    }

    // 1.3 NGO Accepts Request
    const acceptRes = await fetch(`${API_BASE}/support-requests/${newReq._id}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify({
        action: 'Accepted',
        notes: 'We have approved this request from our rural literacy grant.',
        supportDetails: '1x Science Book, 1x Math Book, 2x Notebooks',
      }),
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200, 'NGO can Accept the support request');
    assert(acceptData.data?.status === 'Accepted', 'Request status updated to Accepted');

    // 1.4 NGO Updates Request to "Ongoing"
    const ongoingRes = await fetch(`${API_BASE}/support-requests/${newReq._id}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify({
        action: 'Ongoing',
        notes: 'Books ordered from publisher; dispatch scheduled for Tuesday.',
      }),
    });
    const ongoingData = await ongoingRes.json();
    assert(ongoingRes.status === 200, 'NGO can update request status to Ongoing');
    assert(ongoingData.data?.status === 'Ongoing', 'Request status updated to Ongoing');

    // 1.5 NGO Marks Request as "Completed"
    const completeRes = await fetch(`${API_BASE}/support-requests/${newReq._id}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify({
        action: 'Completed',
        notes: 'Handed over textbook bundle in the school premises.',
        supportDetails: 'Complete NCERT Grade 8 Textbook Kit (Science + Math)',
        amount: 1200,
        quantity: 1,
      }),
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 200, 'NGO can mark request as Completed');
    assert(completeData.data?.status === 'Completed', 'Request status updated to Completed');

    // 1.6 Verify automated SupportRecord created from completion
    const linkedRecord = await SupportRecord.findOne({ linkedSupportRequest: newReq._id });
    assert(linkedRecord != null, 'Automated SupportRecord successfully created upon request completion');
    if (linkedRecord) {
      assert(linkedRecord.beneficiaryName === student.name, 'SupportRecord beneficiaryName matches student name');
      assert(linkedRecord.supportType === 'Books', 'SupportRecord supportType matches Books');
    }

    // =========================================================================
    // SECTION 2: SCHOLARSHIPS & PROGRAMS
    // =========================================================================
    console.log('\n--- [SECTION 2] Scholarships & Programs Management ---');

    // 2.1 NGO Creates a Scholarship
    const scholarshipPayload = {
      title: 'Rural STEM Merit Scholarship 2026',
      type: 'Scholarship',
      description: 'Annual ₹10,000 scholarship award for girl students scoring >75% in Grade 8 Science & Math.',
      eligibility: 'Class 8-10 students in village schools with family income < 1.5 Lakhs.',
      benefits: '₹10,000 annual grant + mentorship',
      deadline: '2026-10-31',
      contactInfo: 'scholarships@pratham.org',
      targetGrades: ['8', '9', '10'],
      status: 'Active',
    };

    const createProgRes = await fetch(`${API_BASE}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify(scholarshipPayload),
    });
    const createProgData = await createProgRes.json();
    assert(createProgRes.status === 201, 'NGO can create a Scholarship program');
    assert(createProgData.data?.title === scholarshipPayload.title, 'Program title verified');
    const scholarshipId = createProgData.data?._id;

    // 2.2 NGO Creates a Workshop Program
    const workshopPayload = {
      title: 'Foundational Digital Literacy & Coding Workshop',
      type: 'Workshop',
      description: 'Hands-on weekend computer basics and scratch programming workshop.',
      eligibility: 'All students from Class 6 to 9',
      benefits: 'Free participation kit & certificate of completion',
      contactInfo: 'workshops@pratham.org',
      status: 'Active',
    };
    const createWorkshopRes = await fetch(`${API_BASE}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify(workshopPayload),
    });
    assert(createWorkshopRes.status === 201, 'NGO can create an Educational Workshop program');
    const workshopId = (await createWorkshopRes.json()).data?._id;

    // 2.3 Students/Public can fetch Active Programs
    const fetchActiveProgRes = await fetch(`${API_BASE}/programs?status=Active`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const fetchActiveProgData = await fetchActiveProgRes.json();
    assert(fetchActiveProgRes.status === 200, 'Student can query active programs');
    assert(
      fetchActiveProgData.data?.some((p) => p._id === scholarshipId),
      'Created scholarship is visible to students'
    );

    // 2.4 NGO Updates Program
    const updateProgRes = await fetch(`${API_BASE}/programs/${scholarshipId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify({
        benefits: '₹12,000 annual grant + mentorship + free tablet',
      }),
    });
    const updateProgData = await updateProgRes.json();
    assert(updateProgRes.status === 200, 'NGO can update their program');
    assert(
      updateProgData.data?.benefits.includes('₹12,000'),
      'Program updated benefits reflected'
    );

    // 2.5 NGO Deletes Workshop Program
    const deleteProgRes = await fetch(`${API_BASE}/programs/${workshopId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ngoToken}` },
    });
    assert(deleteProgRes.status === 200, 'NGO can delete a program');

    // =========================================================================
    // SECTION 3: SUPPORT MANAGEMENT (DISTRIBUTION & AID LEDGER)
    // =========================================================================
    console.log('\n--- [SECTION 3] Support Management (Records & Ledger) ---');

    // 3.1 NGO Creates Direct Support Record
    const supportRecordPayload = {
      recipientType: 'Student',
      beneficiaryName: student.name,
      studentId: student._id,
      schoolName: 'Govt Higher Secondary School',
      village: 'Sundarpur',
      supportType: 'Uniforms',
      itemDetails: '2 pairs stitched school uniforms with belt & socks',
      quantity: 2,
      amount: 1800,
      dateProvided: new Date().toISOString(),
      status: 'Completed',
      notes: 'Delivered during annual distribution drive',
    };

    const createRecRes = await fetch(`${API_BASE}/support-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify(supportRecordPayload),
    });
    const createRecData = await createRecRes.json();
    assert(createRecRes.status === 201, 'NGO can create a direct SupportRecord');
    assert(createRecData.data?.supportType === 'Uniforms', 'SupportRecord supportType matches Uniforms');
    const recordId = createRecData.data?._id;

    // 3.2 NGO Fetches Support Records List
    const fetchRecsRes = await fetch(`${API_BASE}/support-records`, {
      headers: { Authorization: `Bearer ${ngoToken}` },
    });
    const fetchRecsData = await fetchRecsRes.json();
    assert(fetchRecsRes.status === 200, 'NGO can fetch their support records ledger');
    assert(Array.isArray(fetchRecsData.data), 'Support records returned as array');
    assert(
      fetchRecsData.data.some((r) => r._id === recordId),
      'Created support record found in ledger'
    );

    // 3.3 Filter by supportType works
    const fetchUniformsRes = await fetch(`${API_BASE}/support-records?supportType=Uniforms`, {
      headers: { Authorization: `Bearer ${ngoToken}` },
    });
    const fetchUniformsData = await fetchUniformsRes.json();
    assert(fetchUniformsRes.status === 200, 'Filtering support records by supportType works');
    assert(
      fetchUniformsData.data.every((r) => r.supportType === 'Uniforms'),
      'All filtered records have supportType Uniforms'
    );

    // 3.4 NGO Updates Support Record
    const updateRecRes = await fetch(`${API_BASE}/support-records/${recordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify({
        notes: 'Delivered and signed for by parent.',
      }),
    });
    const updateRecData = await updateRecRes.json();
    assert(updateRecRes.status === 200, 'NGO can update support record');
    assert(updateRecData.data?.notes === 'Delivered and signed for by parent.', 'Updated notes verified');

    // =========================================================================
    // SECTION 4: IMPACT & REPORTS
    // =========================================================================
    console.log('\n--- [SECTION 4] Impact & Real-Time Reports ---');

    const impactRes = await fetch(`${API_BASE}/support-records/impact`, {
      headers: { Authorization: `Bearer ${ngoToken}` },
    });
    const impactData = await impactRes.json();
    assert(impactRes.status === 200, 'NGO can fetch real-time impact statistics');
    const stats = impactData.data;
    assert(stats != null, 'Impact statistics payload is present');
    assert(typeof stats.totalRequestsReceived === 'number', 'totalRequestsReceived is numeric');
    assert(typeof stats.completedRequests === 'number', 'completedRequests is numeric');
    assert(typeof stats.totalStudentsSupported === 'number', 'totalStudentsSupported is numeric');
    assert(typeof stats.scholarshipsFunded === 'number', 'scholarshipsFunded is numeric');
    assert(typeof stats.totalAidValue === 'number', 'totalAidValue is numeric');
    assert(Array.isArray(stats.categoryBreakdown), 'categoryBreakdown is an array');
    console.log('  📊 Sample Real-time Impact Stats:', {
      totalRequestsReceived: stats.totalRequestsReceived,
      completedRequests: stats.completedRequests,
      totalStudentsSupported: stats.totalStudentsSupported,
      totalAidValue: stats.totalAidValue,
      categoryCount: stats.categoryBreakdown.length,
    });

    // =========================================================================
    // SECTION 5: ROLE-BASED ACCESS CONTROL (RBAC) DEFENSES
    // =========================================================================
    console.log('\n--- [SECTION 5] RBAC Security & Boundary Defenses ---');

    // 5.1 NGO attempts to enter Student Academic Marks -> 403 Forbidden
    const marksRes = await fetch(`${API_BASE}/academics/marks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify({
        student: student._id,
        term: 'Quarterly',
        academicYear: '2025-2026',
        marks: [{ subject: 'Math', marksObtained: 99, maxMarks: 100 }],
      }),
    });
    assert(marksRes.status === 403, 'NGO cannot enter or alter student academic marks (403 Forbidden)');

    // 5.2 NGO attempts to record student daily attendance -> 403 Forbidden
    const attRes = await fetch(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify({
        student: student._id,
        date: '2026-09-05',
        status: 'Present',
      }),
    });
    assert(attRes.status === 403, 'NGO cannot enter student attendance records (403 Forbidden)');

    // 5.3 NGO attempts to create/manage teachers -> 403 Forbidden
    const teacherRes = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify({
        name: 'Rogue Teacher Entry',
        phone: '9840999999',
      }),
    });
    assert(teacherRes.status === 403, 'NGO cannot create teacher records (403 Forbidden)');

    // 5.4 Student attempts to create a Scholarship Program -> 403 Forbidden
    const studentProgRes = await fetch(`${API_BASE}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Student Program',
        type: 'Scholarship',
      }),
    });
    assert(studentProgRes.status === 403, 'Student cannot publish Scholarship Programs (403 Forbidden)');

    // 5.5 Student attempts to create a Support Record -> 403 Forbidden
    const studentRecRes = await fetch(`${API_BASE}/support-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        supportType: 'Books',
        amount: 500,
      }),
    });
    assert(studentRecRes.status === 403, 'Student cannot create Support Records (403 Forbidden)');

    // Clean up created test programs/records to keep DB clean
    await Program.deleteOne({ _id: scholarshipId });
    await SupportRecord.deleteOne({ _id: recordId });
    await SupportRequest.deleteOne({ _id: newReq._id });

    console.log(`\n========================================`);
    console.log(`🎯 NGO Dashboard Test Suite Summary:`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
