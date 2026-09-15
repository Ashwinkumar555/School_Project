import dotenv from 'dotenv';
import { generateToken } from './utils/generateToken.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('TEST SUITE: TEACHER COMMUNICATION & LINKED CHILD RESOLUTION');
  console.log('===============================================================\n');

  // Test Tokens
  const meenaParentToken = generateToken('65f000000000000000000005', 'parent', {
    phone: '+91 98765 00005',
    name: 'Meena Devi',
  });

  const meena10DigitToken = generateToken('65f000000000000000000005', 'parent', {
    phone: '9876500005', // unformatted 10 digits
    name: 'Meena Devi',
  });

  const sureshParentToken = generateToken('65f000000000000000000006', 'parent', {
    phone: '+91 98765 00012',
    name: 'Suresh Verma',
  });

  // 1. Single Linked Child Roster Loading
  console.log('1. Testing Linked Child Retrieval for Parent (Meena Devi)...');
  const resStudents = await fetch(`${BASE_URL}/students`, {
    headers: { Authorization: `Bearer ${meenaParentToken}` },
  });
  const dataStudents = await resStudents.json();
  assert(resStudents.status === 200, `GET /api/students returns 200 (Got ${resStudents.status})`);
  assert(dataStudents.success === true, 'Response indicates success: true');
  assert(Array.isArray(dataStudents.data) && dataStudents.data.length >= 1, `Found ${dataStudents.data?.length} linked child(ren)`);
  
  const meenaChild = dataStudents.data?.[0];
  assert(meenaChild && meenaChild.name === 'Aarav Kumar', `First linked child is Aarav Kumar (Got ${meenaChild?.name})`);
  assert(!!meenaChild?._id, `Valid MongoDB _id present: ${meenaChild?._id}`);

  // 2. Phone Normalization (10-digit login token)
  console.log('\n2. Testing Child Lookup with Unformatted 10-Digit Phone ("9876500005")...');
  const res10Digit = await fetch(`${BASE_URL}/students`, {
    headers: { Authorization: `Bearer ${meena10DigitToken}` },
  });
  const data10Digit = await res10Digit.json();
  assert(res10Digit.status === 200, 'GET /api/students with 10-digit phone returns 200');
  assert(data10Digit.data?.length >= 1, `Found ${data10Digit.data?.length} linked child with unformatted phone`);

  // 3. Create Teacher Message for Single Linked Child (studentId)
  console.log('\n3. Testing Message Teacher Submission (studentId)...');
  const messagePayload = {
    studentId: meenaChild._id,
    type: 'Academic Query',
    subject: 'Doubt in Mathematics term syllabus chapter 4',
    message: 'Could you please clarify the key topics included in the upcoming term test for Aarav?',
  };

  const resMsg = await fetch(`${BASE_URL}/communications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${meenaParentToken}`,
    },
    body: JSON.stringify(messagePayload),
  });
  const dataMsg = await resMsg.json();
  assert(resMsg.status === 201, `POST /api/communications returns 201 Created (Got ${resMsg.status})`);
  assert(dataMsg.success === true, 'Response indicates success: true');
  assert(dataMsg.data?.student?.toString() === meenaChild._id.toString(), 'Saved document links correct student ObjectId');
  assert(dataMsg.data?.studentName === 'Aarav Kumar', 'Saved document stores studentName');
  assert(dataMsg.data?.type === 'Academic Query', 'Type is Academic Query');
  assert(dataMsg.data?.status === 'Pending', 'Initial status is Pending');

  // 4. Request Parent-Teacher Meeting (PTM)
  console.log('\n4. Testing Request Meeting with Preferred Date & Time...');
  const meetingPayload = {
    studentId: meenaChild._id,
    type: 'Meeting Request',
    subject: 'Request discussion on science performance and science exhibition participation',
    message: 'Would like to meet with science teacher next week.',
    requestedMeetingDate: '2026-09-18',
    preferredTime: 'Morning (9:00 AM - 11:00 AM)',
  };

  const resMeeting = await fetch(`${BASE_URL}/communications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${meenaParentToken}`,
    },
    body: JSON.stringify(meetingPayload),
  });
  const dataMeeting = await resMeeting.json();
  assert(resMeeting.status === 201, `POST /api/communications returns 201 Created for PTM (Got ${resMeeting.status})`);
  assert(dataMeeting.data?.type === 'Meeting Request', 'Type is Meeting Request');
  assert(dataMeeting.data?.preferredTime === 'Morning (9:00 AM - 11:00 AM)', 'Preferred time slot preserved');
  assert(!!dataMeeting.data?.requestedMeetingDate, 'Requested meeting date preserved');

  // 5. Aliased Field Name Support (childId and linkedStudentId)
  console.log('\n5. Testing Aliased Field Names (childId / linkedStudentId)...');
  const aliasChildPayload = {
    childId: meenaChild._id, // using childId instead of studentId
    type: 'General Message',
    subject: 'Thank you note for extra math guidance',
    message: 'Aarav is showing great progress in math tests now.',
  };
  const resAliasChild = await fetch(`${BASE_URL}/communications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${meenaParentToken}`,
    },
    body: JSON.stringify(aliasChildPayload),
  });
  assert(resAliasChild.status === 201, `childId alias returns 201 Created (Got ${resAliasChild.status})`);

  const aliasLinkedPayload = {
    linkedStudentId: meenaChild._id, // using linkedStudentId instead of studentId
    type: 'Attendance Query',
    subject: 'Absence due to seasonal flu',
    message: 'Aarav had fever yesterday. Submitting doctor prescription note.',
  };
  const resAliasLinked = await fetch(`${BASE_URL}/communications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${meenaParentToken}`,
    },
    body: JSON.stringify(aliasLinkedPayload),
  });
  assert(resAliasLinked.status === 201, `linkedStudentId alias returns 201 Created (Got ${resAliasLinked.status})`);

  // 6. Multiple Linked Children Simulation
  console.log('\n6. Testing Multiple Linked Children Scenario...');
  // Let's check Suresh Verma's linked child
  const resSureshStudents = await fetch(`${BASE_URL}/students`, {
    headers: { Authorization: `Bearer ${sureshParentToken}` },
  });
  const dataSureshStudents = await resSureshStudents.json();
  const sureshChild = dataSureshStudents.data?.[0];
  assert(sureshChild && sureshChild.name === 'Rahul Verma', `Suresh Verma is linked to Rahul Verma (Got ${sureshChild?.name})`);

  // Suresh submits communication for his child
  const sureshMsgPayload = {
    studentId: sureshChild._id,
    type: 'Academic Query',
    subject: 'Query regarding English grammar workbook',
    message: 'Could you let us know which textbook chapters are being reviewed this week?',
  };
  const resSureshMsg = await fetch(`${BASE_URL}/communications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sureshParentToken}`,
    },
    body: JSON.stringify(sureshMsgPayload),
  });
  assert(resSureshMsg.status === 201, `Suresh Verma submits communication for Rahul Verma -> 201 Created`);

  // 7. Security: Parent trying to submit communication for UNLINKED child
  console.log('\n7. Testing Security: Parent Attempting to Submit for Unlinked Child...');
  // Meena Devi tries to submit communication for Suresh's child (Rahul Verma)
  const breachPayload = {
    studentId: sureshChild._id, // Aarav's mother trying to message for Rahul
    type: 'Academic Query',
    subject: 'Attempting to submit for unlinked child',
    message: 'This should be blocked by backend authorization.',
  };
  const resBreach = await fetch(`${BASE_URL}/communications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${meenaParentToken}`,
    },
    body: JSON.stringify(breachPayload),
  });
  const dataBreach = await resBreach.json();
  assert(resBreach.status === 403, `Unlinked child submission returns 403 Forbidden (Got ${resBreach.status})`);
  assert(dataBreach.message.includes('Access Denied'), `Proper access denied message returned: "${dataBreach.message}"`);

  // 8. Validation: Missing Student ID
  console.log('\n8. Testing Validation: Missing Student ID...');
  const noChildPayload = {
    type: 'Academic Query',
    subject: 'No child specified',
    message: 'Missing student ID',
  };
  const resNoChild = await fetch(`${BASE_URL}/communications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${meenaParentToken}`,
    },
    body: JSON.stringify(noChildPayload),
  });
  assert(resNoChild.status === 400, `Missing child ID returns 400 Bad Request (Got ${resNoChild.status})`);

  // 9. Validation: Missing Subject / Message
  console.log('\n9. Testing Validation: Missing Subject & Message...');
  const resNoSubject = await fetch(`${BASE_URL}/communications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${meenaParentToken}`,
    },
    body: JSON.stringify({ studentId: meenaChild._id, type: 'Academic Query', message: 'No subject' }),
  });
  assert(resNoSubject.status === 400, `Missing subject returns 400 Bad Request (Got ${resNoSubject.status})`);

  // 10. Query Communications List for Parent
  console.log('\n10. Testing Communications Retrieval for Parent...');
  const resList = await fetch(`${BASE_URL}/communications`, {
    headers: { Authorization: `Bearer ${meenaParentToken}` },
  });
  const dataList = await resList.json();
  assert(resList.status === 200, `GET /api/communications returns 200 (Got ${resList.status})`);
  assert(Array.isArray(dataList.data) && dataList.data.length >= 3, `Retrieved ${dataList.data?.length} messages for Meena Devi`);
  // Verify that all messages in Meena's list are strictly for Meena / Aarav, and do NOT contain Rahul Verma
  const hasOtherChild = dataList.data?.some(c => c.studentName === 'Rahul Verma');
  assert(!hasOtherChild, 'Communications list strictly contains only linked child messages (no leak of other students)');

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
