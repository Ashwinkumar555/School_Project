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
import { generateToken } from './utils/generateToken.js';

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting Comprehensive Support Request Workflow & RBAC Test Suite...\n');
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

    // 2. Setup Test Student
    let testClass = await Class.findOne();
    if (!testClass) {
      testClass = await Class.create({
        name: 'Class 8-A',
        grade: '8',
        section: 'A',
        academicYear: '2025-2026',
      });
    }

    const parentPhone = `9840${Math.floor(10000 + Math.random() * 90000)}`;
    let student = await Student.findOne();
    if (!student) {
      student = await Student.create({
        admissionNumber: `ADM-${Date.now()}`,
        rollNumber: '19',
        name: 'Pooja Selvam',
        gender: 'Female',
        class: testClass._id,
        section: 'A',
        parentName: 'Selvam Murugan',
        parentPhone: parentPhone,
        village: 'Sundarpur',
      });
    } else {
      student.parentPhone = parentPhone;
      student.village = 'Sundarpur';
      await student.save();
    }

    // 3. Setup Users for all roles
    // A. Linked Parent
    let parentUser = await User.findOne({ phone: parentPhone });
    if (!parentUser) {
      parentUser = await User.create({
        name: 'Selvam Murugan',
        phone: parentPhone,
        email: `parent.${Date.now()}@village.org`,
        role: 'parent',
        village: 'Sundarpur',
      });
    }
    const parentToken = generateToken(parentUser._id, parentUser.role, { phone: parentUser.phone });

    // B. Unlinked Parent
    const unlinkedPhone = `9841${Math.floor(10000 + Math.random() * 90000)}`;
    let unlinkedParent = await User.create({
      name: 'Unlinked Parent User',
      phone: unlinkedPhone,
      email: `unlinked.${Date.now()}@village.org`,
      role: 'parent',
      village: 'Sundarpur',
    });
    const unlinkedParentToken = generateToken(unlinkedParent._id, unlinkedParent.role, { phone: unlinkedParent.phone });

    // C. Village Local Head
    let localHead = await User.findOne({ role: 'village_head' });
    if (!localHead) {
      localHead = await User.create({
        name: 'Sarpanch Baldev Singh',
        phone: `9842${Math.floor(10000 + Math.random() * 90000)}`,
        email: `localhead.${Date.now()}@village.gov.in`,
        role: 'village_head',
        village: 'Sundarpur',
      });
    }
    const localHeadToken = generateToken(localHead._id, localHead.role, { phone: localHead.phone });

    // D. Head Master
    let headmaster = await User.findOne({ role: 'headmaster_admin' });
    if (!headmaster) {
      headmaster = await User.create({
        name: 'Dr. Meenakshi Sundaram',
        phone: `9843${Math.floor(10000 + Math.random() * 90000)}`,
        email: `headmaster.${Date.now()}@school.gov.in`,
        role: 'headmaster_admin',
        schoolName: 'Govt Higher Secondary School',
      });
    }
    const headmasterToken = generateToken(headmaster._id, headmaster.role, { phone: headmaster.phone });

    // E. NGO / Partner
    let ngoUser = await User.findOne({ role: 'ngo' });
    if (!ngoUser) {
      ngoUser = await User.create({
        name: 'Shreya Sengupta',
        phone: `9844${Math.floor(10000 + Math.random() * 90000)}`,
        email: `ngo.${Date.now()}@gramin.org`,
        role: 'ngo',
        organizationName: 'Smile India Foundation',
      });
    }
    const ngoToken = generateToken(ngoUser._id, ngoUser.role, { phone: ngoUser.phone });

    // F. Student User (for permission check)
    let studentUser = await User.findOne({ role: 'student' });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Dinesh Kumar',
        phone: `9845${Math.floor(10000 + Math.random() * 90000)}`,
        email: `student.${Date.now()}@school.gov.in`,
        role: 'student',
      });
    }
    const studentToken = generateToken(studentUser._id, studentUser.role, { phone: studentUser.phone });

    // ----------------------------------------------------------------
    // SECTION 1: PARENT SUPPORT REQUEST CREATION & PERMISSION CHECK
    // ----------------------------------------------------------------
    console.log('\n--- 1. Parent Support Request Flow ---');
    let parentRequestId = null;

    // Positive: Parent creates request for linked child
    const createReqRes = await fetch(`${API_BASE}/support-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`,
      },
      body: JSON.stringify({
        studentId: student._id,
        category: 'School Uniform',
        title: '2 Sets of School Uniform & Winter Cardigan (Size 32)',
        description: 'Student has outgrown previous uniform and requires assistance to continue attending classes regularly.',
        priority: 'High',
        estimatedAmount: 1800,
        supportRequired: '2 Sets of Uniforms, 1 Cardigan',
      }),
    });
    const createReqData = await createReqRes.json();
    console.log('createReqRes status:', createReqRes.status, createReqData);
    assert(createReqRes.status === 201 && createReqData.success, 'Parent successfully created support request (201 Created)');
    assert(createReqData.data?.status === 'Pending', 'Initial request status is "Pending"');
    assert(createReqData.data?.requesterRole === 'parent', 'Requester role correctly recorded as parent');
    assert(createReqData.data?.statusHistory?.length === 1, 'Initial statusHistory audit entry created');
    parentRequestId = createReqData.data?._id;

    // Negative: Unlinked Parent attempts to create request for this student
    const unlinkedReqRes = await fetch(`${API_BASE}/support-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unlinkedParentToken}`,
      },
      body: JSON.stringify({
        studentId: student._id,
        category: 'Books & Notebooks',
        title: 'Unauthorized Request',
        description: 'Testing unlinked access',
      }),
    });
    assert(
      unlinkedReqRes.status === 403,
      'Unlinked Parent blocked with 403 Forbidden when requesting for unlinked student'
    );

    // ----------------------------------------------------------------
    // SECTION 2: VILLAGE LOCAL HEAD SUPPORT REQUEST
    // ----------------------------------------------------------------
    console.log('\n--- 2. Village Local Head Request Flow ---');
    const localHeadReqRes = await fetch(`${API_BASE}/support-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localHeadToken}`,
      },
      body: JSON.stringify({
        studentId: student._id,
        category: 'Laptop / Tablet / Digital Device',
        title: 'Refurbished Tablet for Online Educational Content',
        description: 'Village Gram Panchayat request for digital learning assistance for promising student.',
        priority: 'Medium',
        estimatedAmount: 4500,
        supportRequired: '1 8-inch Android Tablet',
      }),
    });
    const localHeadReqData = await localHeadReqRes.json();
    assert(localHeadReqRes.status === 201 && localHeadReqData.success, 'Village Local Head created support request (201 Created)');
    assert(localHeadReqData.data?.requesterRole === 'village_head', 'Requester role recorded as village_head');
    assert(localHeadReqData.data?.village === 'Sundarpur', 'Student village properly linked');

    // ----------------------------------------------------------------
    // SECTION 3: HEAD MASTER REVIEW, VERIFICATION & NGO FORWARDING
    // ----------------------------------------------------------------
    console.log('\n--- 3. Head Master Review & Forwarding Flow ---');

    // Head Master views all requests
    const hmListRes = await fetch(`${API_BASE}/support-requests`, {
      headers: { Authorization: `Bearer ${headmasterToken}` },
    });
    const hmListData = await hmListRes.json();
    assert(hmListRes.status === 200 && hmListData.count >= 2, 'Head Master retrieves all institutional support requests');

    // Step A: Head Master puts request under review / requests information
    const underReviewRes = await fetch(`${API_BASE}/support-requests/${parentRequestId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headmasterToken}`,
      },
      body: JSON.stringify({
        action: 'Request Information',
        reviewNotes: 'Verifying student attendance record and uniform sizes with class teacher.',
      }),
    });
    const underReviewData = await underReviewRes.json();
    assert(underReviewRes.status === 200, 'Head Master updated request to Under Review (200 OK)');
    assert(underReviewData.data?.status === 'Under Review', 'Status changed to "Under Review"');

    // Step B: Head Master approves request
    const approveRes = await fetch(`${API_BASE}/support-requests/${parentRequestId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headmasterToken}`,
      },
      body: JSON.stringify({
        action: 'Approve',
        reviewNotes: 'Verified need with Class Teacher Smt. Lakshmi. Eligible for welfare support.',
      }),
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, 'Head Master approved request (200 OK)');
    assert(approveData.data?.status === 'Approved', 'Status changed to "Approved"');
    assert(approveData.data?.headMasterReview?.decision === 'Approved', 'Review decision recorded as Approved');

    // Step C: Head Master forwards request to target NGO Partner
    const forwardRes = await fetch(`${API_BASE}/support-requests/${parentRequestId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headmasterToken}`,
      },
      body: JSON.stringify({
        action: 'Forward to NGO/Partner',
        targetNgoId: ngoUser._id,
        targetNgoName: ngoUser.organizationName || 'Smile India Foundation',
        reviewNotes: 'Recommending priority sponsorship for student uniform requirements.',
      }),
    });
    const forwardData = await forwardRes.json();
    assert(forwardRes.status === 200, 'Head Master forwarded request to NGO Partner (200 OK)');
    assert(forwardData.data?.status === 'Forwarded to NGO/Partner', 'Status changed to "Forwarded to NGO/Partner"');
    assert(String(forwardData.data?.targetNgo) === String(ngoUser._id), 'Target NGO correctly stored on request');

    // ----------------------------------------------------------------
    // SECTION 4: NGO / PARTNER FULFILLMENT & COMPLETION
    // ----------------------------------------------------------------
    console.log('\n--- 4. NGO / Partner Response & Completion Flow ---');

    // NGO views forwarded requests
    const ngoListRes = await fetch(`${API_BASE}/support-requests`, {
      headers: { Authorization: `Bearer ${ngoToken}` },
    });
    const ngoListData = await ngoListRes.json();
    assert(ngoListRes.status === 200, 'NGO Partner retrieves forwarded requests (200 OK)');
    const foundForwarded = ngoListData.data?.some((r) => String(r._id) === String(parentRequestId));
    assert(foundForwarded, 'Forwarded request is visible to the assigned NGO Partner');

    // Step A: NGO accepts request and pledges support
    const acceptRes = await fetch(`${API_BASE}/support-requests/${parentRequestId}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify({
        action: 'Accept',
        supportType: 'School Uniform Sets',
        supportDetails: 'Pledged 2 sets of high quality stitched uniforms (Size 32) and woolen cardigan.',
      }),
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200, 'NGO accepted support request (200 OK)');
    assert(acceptData.data?.status === 'Accepted', 'Status changed to "Accepted"');
    assert(acceptData.data?.ngoSupport?.supportType === 'School Uniform Sets', 'Support type properly saved');
    assert(!!acceptData.data?.ngoSupport?.fulfillmentDate, 'Expected fulfillment date generated');

    // Step B: NGO marks request as Completed & Disbursed
    const completeRes = await fetch(`${API_BASE}/support-requests/${parentRequestId}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngoToken}`,
      },
      body: JSON.stringify({
        action: 'Completed',
        completionNotes: 'Uniforms and winter cardigan handed over to Pooja Selvam in school assembly.',
      }),
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 200, 'NGO marked support request as Completed (200 OK)');
    assert(completeData.data?.status === 'Completed', 'Final status is "Completed"');
    assert(
      completeData.data?.ngoSupport?.completionNotes?.includes('handed over'),
      'Completion notes recorded'
    );

    // ----------------------------------------------------------------
    // SECTION 5: AUDIT TRAIL & HISTORY INTEGRITY
    // ----------------------------------------------------------------
    console.log('\n--- 5. Audit Trail & History Verification ---');
    const finalReq = await SupportRequest.findById(parentRequestId);
    assert(!!finalReq, 'Verified document persisted directly in MongoDB Atlas');
    assert(
      finalReq.statusHistory?.length >= 5,
      `Complete audit trail maintained (${finalReq.statusHistory?.length} lifecycle steps logged)`
    );

    const historyStatuses = finalReq.statusHistory?.map((h) => h.status);
    assert(
      historyStatuses.includes('Pending') &&
      historyStatuses.includes('Under Review') &&
      historyStatuses.includes('Approved') &&
      historyStatuses.includes('Forwarded to NGO/Partner') &&
      historyStatuses.includes('Accepted') &&
      historyStatuses.includes('Completed'),
      'All lifecycle states (Pending -> Under Review -> Approved -> Forwarded -> Accepted -> Completed) captured in history'
    );

    // ----------------------------------------------------------------
    // SECTION 6: ROLE-BASED ACCESS CONTROL (RBAC) DEFENSE
    // ----------------------------------------------------------------
    console.log('\n--- 6. Role-Based Access Control (RBAC) Defense ---');

    // Student blocked from creating support requests
    const studentCreateRes = await fetch(`${API_BASE}/support-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        studentId: student._id,
        category: 'School Bag & Stationery',
        title: 'Student Attempt',
        description: 'Testing RBAC',
      }),
    });
    assert(studentCreateRes.status === 403, 'Student blocked with 403 Forbidden from creating support requests');

    // Student blocked from reviewing support requests
    const studentReviewRes = await fetch(`${API_BASE}/support-requests/${parentRequestId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ action: 'Approve' }),
    });
    assert(studentReviewRes.status === 403, 'Student blocked with 403 Forbidden from reviewing support requests');

    // Student blocked from NGO response endpoint
    const studentRespondRes = await fetch(`${API_BASE}/support-requests/${parentRequestId}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ action: 'Completed' }),
    });
    assert(studentRespondRes.status === 403, 'Student blocked with 403 Forbidden from NGO respond endpoint');

    // Clean up test document
    await SupportRequest.deleteMany({ _id: { $in: [parentRequestId, localHeadReqData.data?._id] } });
    await unlinkedParent.deleteOne();

    console.log('\n======================================================');
    console.log(`🏁 Support Request Suite: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');
    await mongoose.disconnect();

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Test execution error:', err);
    process.exit(1);
  }
};

runTests();
