import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const USERS_FILE = path.resolve(DATA_DIR, 'users.json');

class EduConnectDataStore {
  constructor() {
    this.resetToDefaults();
  }

  loadUsersFromFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out any potential demo/test users from prior sessions
          return parsed.filter(
            (u) =>
              u &&
              u.email !== 'headmaster@school.gov.in' &&
              u.email !== 'teacher@school.gov.in' &&
              u.email !== 'student@school.gov.in' &&
              u.email !== 'parent@village.org' &&
              u.email !== 'localhead@village.gov.in' &&
              u.email !== 'alumni@school.gov.in' &&
              u.email !== 'ngo@smilefoundation.org' &&
              u.email !== 'villager@village.org' &&
              !u.name?.includes('Dr. Ramesh Sharma') &&
              !u.name?.includes('Priya Sundaram') &&
              !u.name?.includes('Sarpanch Baldev') &&
              !u.name?.includes('John Doe')
          );
        }
      }
    } catch (e) {
      console.warn('Note reading users file:', e.message);
    }
    return [];
  }

  saveUsersToFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Note writing users file:', e.message);
    }
  }

  resetToDefaults() {
    // 1. Users: Strictly REAL registered users only (NO demo accounts)
    this.users = this.loadUsersFromFile();

    // 2. Classes
    this.classes = [
      {
        _id: '65f100000000000000000001',
        name: 'Class 8-A',
        grade: '8',
        section: 'A',
        academicYear: '2025-2026',
        roomNumber: 'Room 101',
        classTeacher: '65f000000000000000000002',
        subjects: [
          { name: 'Mathematics', code: 'MATH-8' },
          { name: 'Science', code: 'SCI-8' },
          { name: 'English', code: 'ENG-8' },
          { name: 'Social Science', code: 'SOC-8' },
          { name: 'Regional Language', code: 'LANG-8' },
        ],
        studentCount: 5,
        isActive: true,
      },
      {
        _id: '65f100000000000000000002',
        name: 'Class 9-A',
        grade: '9',
        section: 'A',
        academicYear: '2025-2026',
        roomNumber: 'Room 102',
        studentCount: 4,
        isActive: true,
      },
    ];

    // 3. Students
    this.students = [
      {
        _id: '65f200000000000000000001',
        admissionNumber: 'SCH-2024-001',
        rollNumber: '01',
        name: 'Aarav Kumar',
        gender: 'Male',
        class: { _id: '65f100000000000000000001', name: 'Class 8-A', grade: '8', section: 'A' },
        userAccount: '65f000000000000000000003',
        parentUser: { _id: '65f000000000000000000005', name: 'Meena Devi', email: 'parent@village.org', phone: '+91 98765 00005' },
        parentName: 'Meena Devi',
        parentPhone: '+91 98765 00005',
        village: 'Sundarpur East',
        bloodGroup: 'B+',
        currentAttendanceRate: 92,
        currentAcademicAverage: 78,
        consecutiveAbsences: 0,
        attentionLevel: 'NORMAL',
        welfareBeneficiary: true,
        entitlements: [
          { schemeName: 'Free Uniform Set (2 Pairs)', status: 'Disbursed' },
          { schemeName: 'Textbook & Notebook Kit', status: 'Disbursed' },
          { schemeName: 'Mid-Day Meal Scheme', status: 'Disbursed' },
        ],
        isActive: true,
      },
      {
        _id: '65f200000000000000000002',
        admissionNumber: 'SCH-2024-002',
        rollNumber: '02',
        name: 'Rahul Verma',
        gender: 'Male',
        class: { _id: '65f100000000000000000001', name: 'Class 8-A', grade: '8', section: 'A' },
        userAccount: '65f000000000000000000004',
        parentUser: { _id: '65f000000000000000000006', name: 'Suresh Verma', email: 'suresh.parent@village.org', phone: '+91 98765 00012' },
        parentName: 'Suresh Verma',
        parentPhone: '+91 98765 00012',
        village: 'Sundarpur Ward 1',
        bloodGroup: 'O+',
        currentAttendanceRate: 52, // Core Flow 1 example: 52% attendance
        currentAcademicAverage: 38, // Core Flow 1 example: 38% marks
        consecutiveAbsences: 8,     // Core Flow 1 example: 8 days absence streak
        attentionLevel: 'HIGH_ATTENTION',
        welfareBeneficiary: true,
        entitlements: [
          { schemeName: 'Free Uniform Set', status: 'Disbursed' },
          { schemeName: 'Pre-Matric State Scholarship', status: 'Pending' },
        ],
        isActive: true,
      },
      {
        _id: '65f200000000000000000003',
        admissionNumber: 'SCH-2024-003',
        rollNumber: '03',
        name: 'Kavya Sharma',
        gender: 'Female',
        class: { _id: '65f100000000000000000001', name: 'Class 8-A', grade: '8', section: 'A' },
        parentName: 'Radha Sharma',
        parentPhone: '+91 98765 00013',
        village: 'Sundarpur Ward 3',
        bloodGroup: 'A+',
        currentAttendanceRate: 72,
        currentAcademicAverage: 64,
        consecutiveAbsences: 3,
        attentionLevel: 'MODERATE_ATTENTION',
        welfareBeneficiary: true,
        entitlements: [
          { schemeName: 'Free Bicycle Scheme (Girl Child)', status: 'Disbursed' },
          { schemeName: 'Textbook Kit', status: 'Disbursed' },
        ],
        isActive: true,
      },
      {
        _id: '65f200000000000000000004',
        admissionNumber: 'SCH-2024-004',
        rollNumber: '04',
        name: 'Ananya Patel',
        gender: 'Female',
        class: { _id: '65f100000000000000000001', name: 'Class 8-A', grade: '8', section: 'A' },
        parentName: 'Ramesh Patel',
        parentPhone: '+91 98765 00014',
        village: 'Sundarpur Center',
        bloodGroup: 'AB+',
        currentAttendanceRate: 96,
        currentAcademicAverage: 88,
        consecutiveAbsences: 0,
        attentionLevel: 'NORMAL',
        welfareBeneficiary: true,
        entitlements: [{ schemeName: 'Merit Scholarship Grant', status: 'Disbursed' }],
        isActive: true,
      },
      {
        _id: '65f200000000000000000005',
        admissionNumber: 'SCH-2024-005',
        rollNumber: '05',
        name: 'Manoj Kumar',
        gender: 'Male',
        class: { _id: '65f100000000000000000001', name: 'Class 8-A', grade: '8', section: 'A' },
        parentName: 'Gopal Kumar',
        parentPhone: '+91 98765 00015',
        village: 'Sundarpur West',
        bloodGroup: 'O-',
        currentAttendanceRate: 88,
        currentAcademicAverage: 70,
        consecutiveAbsences: 1,
        attentionLevel: 'NORMAL',
        welfareBeneficiary: true,
        entitlements: [{ schemeName: 'Free Uniform Set', status: 'Disbursed' }],
        isActive: true,
      },
      {
        _id: '65f200000000000000000006',
        admissionNumber: 'SCH-2024-006',
        rollNumber: '06',
        name: 'Dinesh Kumar',
        gender: 'Male',
        class: { _id: '65f100000000000000000001', name: 'Class 8-A', grade: '8', section: 'A' },
        parentName: 'Lakshmi Narayanan',
        parentPhone: '984030216',
        village: 'Sundarpur East',
        bloodGroup: 'A+',
        currentAttendanceRate: 88,
        currentAcademicAverage: 75,
        consecutiveAbsences: 0,
        attentionLevel: 'NORMAL',
        welfareBeneficiary: true,
        entitlements: [
          { schemeName: 'Free Uniform Set (2 Pairs)', status: 'Disbursed' },
          { schemeName: 'Textbook & Notebook Kit', status: 'Disbursed' },
        ],
        isActive: true,
        subjectMarks: [
          { subject: 'Mathematics', marksObtained: 80, maxMarks: 100, grade: 'A' },
          { subject: 'Science', marksObtained: 75, maxMarks: 100, grade: 'A' },
          { subject: 'English', marksObtained: 70, maxMarks: 100, grade: 'B' },
          { subject: 'Social Science', marksObtained: 72, maxMarks: 100, grade: 'B' },
          { subject: 'Regional Language', marksObtained: 78, maxMarks: 100, grade: 'A' },
        ],
      },
    ];

    // 4. Early Attention (Core Flow 1)
    this.earlyAttentions = [
      {
        _id: '65f300000000000000000002',
        student: this.students[1], // Rahul Verma (HIGH ATTENTION)
        academicYear: '2025-2026',
        attendanceRate: 52,
        academicAverage: 38,
        consecutiveAbsences: 8,
        attentionLevel: 'HIGH_ATTENTION',
        flaggedReasons: [
          'Critical Attendance Deficit (52%, below 60% threshold)',
          'Academic Support Required (Average marks 38%, below 40%)',
          'Prolonged Unnotified Absence (8 consecutive school days)',
        ],
        recommendedActions: [
          'Contact parent immediately',
          'Attendance daily monitoring',
          'Teacher-Parent in-person meeting',
          'Remedial academic coaching',
        ],
        interventions: [
          {
            actionType: 'Contact Parent / Phone Call',
            notes: 'Called father Suresh Verma regarding 8 days consecutive absence. Father reported seasonal farm harvesting work; counseled on compulsory attendance.',
            status: 'In Progress',
            parentResponse: 'Father agreed to send Rahul back to school starting Monday and attend teacher counseling.',
            date: new Date(),
          },
        ],
      },
      {
        _id: '65f300000000000000000003',
        student: this.students[2], // Kavya Sharma (MODERATE ATTENTION)
        academicYear: '2025-2026',
        attendanceRate: 72,
        academicAverage: 64,
        consecutiveAbsences: 3,
        attentionLevel: 'MODERATE_ATTENTION',
        flaggedReasons: [
          'Low Attendance Rate (72%, below 75% standard)',
          'Consecutive Absence Pattern (3 consecutive days)',
        ],
        recommendedActions: ['Attendance monitoring', 'Followup call with parent'],
        interventions: [],
      },
      {
        _id: '65f300000000000000000001',
        student: this.students[0], // Aarav Kumar (NORMAL)
        academicYear: '2025-2026',
        attendanceRate: 92,
        academicAverage: 78,
        consecutiveAbsences: 0,
        attentionLevel: 'NORMAL',
        flaggedReasons: ['Student records meet normal academic & attendance criteria'],
        recommendedActions: ['Continue routine observation & encouragement'],
        interventions: [],
      },
    ];

    // 5. Academic Records (Stored individually per student)
    this.academicRecords = [
      {
        _id: '65f400000000000000000001',
        student: '65f200000000000000000001',
        term: 'Quarterly Exam',
        academicYear: '2025-2026',
        percentage: 78,
        overallGrade: 'A',
        teacherRemarks: 'Excellent performance in Mathematics and Science.',
        marks: [
          { subject: 'Mathematics', marksObtained: 82, maxMarks: 100, grade: 'A' },
          { subject: 'Science', marksObtained: 76, maxMarks: 100, grade: 'A' },
          { subject: 'English', marksObtained: 80, maxMarks: 100, grade: 'A' },
          { subject: 'Social Science', marksObtained: 74, maxMarks: 100, grade: 'B' },
          { subject: 'Regional Language', marksObtained: 78, maxMarks: 100, grade: 'A' },
        ],
      },
      {
        _id: '65f400000000000000000002',
        student: '65f200000000000000000002',
        term: 'Quarterly Exam',
        academicYear: '2025-2026',
        percentage: 38,
        overallGrade: 'D',
        teacherRemarks: 'Requires urgent remedial coaching and regular class presence.',
        marks: [
          { subject: 'Mathematics', marksObtained: 34, maxMarks: 100, grade: 'F' },
          { subject: 'Science', marksObtained: 40, maxMarks: 100, grade: 'D' },
          { subject: 'English', marksObtained: 42, maxMarks: 100, grade: 'D' },
          { subject: 'Social Science', marksObtained: 36, maxMarks: 100, grade: 'D' },
          { subject: 'Regional Language', marksObtained: 38, maxMarks: 100, grade: 'D' },
        ],
      },
      {
        _id: '65f400000000000000000003',
        student: '65f200000000000000000003',
        term: 'Quarterly Exam',
        academicYear: '2025-2026',
        percentage: 64,
        overallGrade: 'B',
        teacherRemarks: 'Good potential; attendance consistency will improve grades.',
        marks: [
          { subject: 'Mathematics', marksObtained: 62, maxMarks: 100, grade: 'B' },
          { subject: 'Science', marksObtained: 68, maxMarks: 100, grade: 'B' },
          { subject: 'English', marksObtained: 64, maxMarks: 100, grade: 'B' },
          { subject: 'Social Science', marksObtained: 60, maxMarks: 100, grade: 'B' },
          { subject: 'Regional Language', marksObtained: 66, maxMarks: 100, grade: 'B' },
        ],
      },
      {
        _id: '65f400000000000000000004',
        student: '65f200000000000000000004',
        term: 'Quarterly Exam',
        academicYear: '2025-2026',
        percentage: 88,
        overallGrade: 'A',
        teacherRemarks: 'Outstanding analytical capability and class leadership.',
        marks: [
          { subject: 'Mathematics', marksObtained: 92, maxMarks: 100, grade: 'A+' },
          { subject: 'Science', marksObtained: 86, maxMarks: 100, grade: 'A' },
          { subject: 'English', marksObtained: 90, maxMarks: 100, grade: 'A+' },
          { subject: 'Social Science', marksObtained: 84, maxMarks: 100, grade: 'A' },
          { subject: 'Regional Language', marksObtained: 88, maxMarks: 100, grade: 'A' },
        ],
      },
      {
        _id: '65f400000000000000000005',
        student: '65f200000000000000000005',
        term: 'Quarterly Exam',
        academicYear: '2025-2026',
        percentage: 70,
        overallGrade: 'B',
        teacherRemarks: 'Consistent effort and good classroom participation.',
        marks: [
          { subject: 'Mathematics', marksObtained: 70, maxMarks: 100, grade: 'B' },
          { subject: 'Science', marksObtained: 72, maxMarks: 100, grade: 'B' },
          { subject: 'English', marksObtained: 68, maxMarks: 100, grade: 'B' },
          { subject: 'Social Science', marksObtained: 66, maxMarks: 100, grade: 'B' },
          { subject: 'Regional Language', marksObtained: 74, maxMarks: 100, grade: 'B' },
        ],
      },
    ];

    // 5b. Individual Daily Attendance Records Store
    this.attendanceRecords = [
      {
        _id: 'att-2026-08-15',
        date: '2026-08-15',
        class: '65f100000000000000000001',
        records: [
          { student: '65f200000000000000000001', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000002', status: 'Absent', remarks: 'Uninformed absence' },
          { student: '65f200000000000000000003', status: 'Absent', remarks: 'Uninformed absence' },
          { student: '65f200000000000000000004', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000005', status: 'Present', remarks: 'On time' },
        ],
      },
      {
        _id: 'att-2026-08-14',
        date: '2026-08-14',
        class: '65f100000000000000000001',
        records: [
          { student: '65f200000000000000000001', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000002', status: 'Absent', remarks: 'Uninformed absence' },
          { student: '65f200000000000000000003', status: 'Absent', remarks: 'Sick leave' },
          { student: '65f200000000000000000004', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000005', status: 'Present', remarks: 'On time' },
        ],
      },
      {
        _id: 'att-2026-08-13',
        date: '2026-08-13',
        class: '65f100000000000000000001',
        records: [
          { student: '65f200000000000000000001', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000002', status: 'Absent', remarks: 'Uninformed absence' },
          { student: '65f200000000000000000003', status: 'Absent', remarks: 'Uninformed absence' },
          { student: '65f200000000000000000004', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000005', status: 'Present', remarks: 'On time' },
        ],
      },
      {
        _id: 'att-2026-08-12',
        date: '2026-08-12',
        class: '65f100000000000000000001',
        records: [
          { student: '65f200000000000000000001', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000002', status: 'Absent', remarks: 'Uninformed absence' },
          { student: '65f200000000000000000003', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000004', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000005', status: 'Present', remarks: 'On time' },
        ],
      },
      {
        _id: 'att-2026-08-11',
        date: '2026-08-11',
        class: '65f100000000000000000001',
        records: [
          { student: '65f200000000000000000001', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000002', status: 'Absent', remarks: 'Uninformed absence' },
          { student: '65f200000000000000000003', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000004', status: 'Present', remarks: 'On time' },
          { student: '65f200000000000000000005', status: 'Present', remarks: 'On time' },
        ],
      },
    ];

    // 6. School Needs (Core Flow 2)
    this.schoolNeeds = [
      {
        _id: '65f500000000000000000001',
        title: '2 Laptops Needed for Computer Laboratory',
        description: 'Required 2 Core i5 laptops for student coding curriculum and digital learning tutorials.',
        category: 'IT & Computers',
        urgency: 'High',
        targetDepartment: 'Computer Lab',
        requiredQuantity: 2,
        receivedQuantity: 1,
        remainingQuantity: 1,
        unit: 'Laptops',
        status: 'Partially Fulfilled',
        verifiedByAdmin: true,
        createdAt: new Date(),
      },
      {
        _id: '65f500000000000000000002',
        title: '10 Science Compound Microscopes',
        description: 'Compound optical microscopes for Middle & High School biology and chemistry practicals.',
        category: 'Laboratory Equipment',
        urgency: 'Medium',
        targetDepartment: 'Science Lab',
        requiredQuantity: 10,
        receivedQuantity: 0,
        remainingQuantity: 10,
        unit: 'Units',
        status: 'Open',
        verifiedByAdmin: true,
        createdAt: new Date(),
      },
      {
        _id: '65f500000000000000000003',
        title: '4 Complete Cricket & Football Sports Kits',
        description: 'Quality sports equipment including bats, balls, footballs, protective pads, and goal nets.',
        category: 'Sports Equipment',
        urgency: 'Medium',
        targetDepartment: 'Sports Ground',
        requiredQuantity: 4,
        receivedQuantity: 2,
        remainingQuantity: 2,
        unit: 'Kits',
        status: 'Partially Fulfilled',
        verifiedByAdmin: true,
        createdAt: new Date(),
      },
    ];

    // 7. Community Drives (Core Flow 2)
    this.communityDrives = [
      {
        _id: '65f600000000000000000001',
        title: 'Sundarpur Digital Lab: 2 Laptops Drive',
        description: 'Panchayat-led village initiative to sponsor 2 laptops for government school digital literacy.',
        schoolNeed: this.schoolNeeds[0],
        organizedBy: '65f000000000000000000007',
        organizerName: 'Sarpanch Baldev Singh (Village Head)',
        village: 'Sundarpur Gram Panchayat',
        targetQuantity: 2,
        fulfilledQuantity: 1,
        pledgedQuantity: 2,
        unit: 'Laptops',
        status: 'Active',
        impactMessage: 'Connecting rural children with modern software, typing skills, and digital textbooks.',
        contributionsCount: 2,
        createdAt: new Date(),
      },
      {
        _id: '65f600000000000000000002',
        title: 'Village Youth & Sports Equipment Mobilization',
        description: 'Providing sports kits and athletic training items for school children.',
        schoolNeed: this.schoolNeeds[2],
        organizedBy: '65f000000000000000000007',
        organizerName: 'Sarpanch Baldev Singh (Village Head)',
        village: 'Sundarpur Gram Panchayat',
        targetQuantity: 4,
        fulfilledQuantity: 2,
        pledgedQuantity: 2,
        unit: 'Kits',
        status: 'Active',
        contributionsCount: 1,
        createdAt: new Date(),
      },
    ];

    // 8. Contributions (Core Flow 2: Demonstrating PENDING, APPROVED, and RECEIVED states)
    this.contributions = [
      {
        _id: '65f700000000000000000001',
        drive: this.communityDrives[0],
        schoolNeed: this.schoolNeeds[0],
        contributor: '65f000000000000000000009',
        contributorName: 'Vikram Seth (Alumni)',
        contributorEmail: 'alumni@school.gov.in',
        contributorPhone: '+91 98765 00007',
        contributorRole: 'alumni',
        contributionType: 'Donate Item',
        itemDetails: 'Lenovo ThinkPad Core i5 Laptop (Donated by Alumni)',
        quantity: 1,
        estimatedValue: 40000,
        status: 'RECEIVED', // Step 3: Verified with Asset Tag
        adminReview: {
          reviewedAt: new Date('2025-07-20'),
          adminRemarks: 'Approved for Computer Lab ICT curriculum.',
        },
        physicalVerification: {
          receivedAt: new Date('2025-07-22'),
          assetTag: 'EDU-IT-2025-001',
          condition: 'New',
          verificationNotes: 'Device unboxed, verified working, student educational software configured.',
        },
        createdAt: new Date('2025-07-18'),
      },
      {
        _id: '65f700000000000000000002',
        drive: this.communityDrives[0],
        schoolNeed: this.schoolNeeds[0],
        contributor: '65f000000000000000000008',
        contributorName: 'Kavitha Nathan (Villager)',
        contributorEmail: 'villager@village.org',
        contributorPhone: '+91 98765 00004',
        contributorRole: 'community_member',
        contributionType: 'Donate Item',
        itemDetails: 'Dell Inspiron Laptop 15-inch',
        quantity: 1,
        estimatedValue: 38000,
        notes: 'Pledging laptop for school lab. Can bring to school office on Friday.',
        status: 'PENDING', // Step 1: PENDING Review
        createdAt: new Date(),
      },
      {
        _id: '65f700000000000000000003',
        drive: this.communityDrives[1],
        schoolNeed: this.schoolNeeds[2],
        contributor: '65f000000000000000000010',
        contributorName: 'Dr. Ananya Ray (Gramin Foundation NGO)',
        contributorEmail: 'ngo@gramin.org',
        contributorPhone: '+91 98765 00008',
        contributorRole: 'ngo',
        contributionType: 'Donate Item',
        itemDetails: '2 Complete Cricket & Football Training Kits',
        quantity: 2,
        estimatedValue: 12000,
        status: 'APPROVED', // Step 2: APPROVED (Awaiting physical receipt)
        adminReview: {
          reviewedAt: new Date('2025-08-01'),
          adminRemarks: 'Approved. Awaiting physical courier delivery at school reception.',
        },
        createdAt: new Date('2025-07-28'),
      },
    ];

    // 9. Inventory
    this.inventory = [
      {
        _id: '65f800000000000000000001',
        itemName: 'Lenovo ThinkPad Core i5 Laptop',
        category: 'IT & Computers',
        location: 'Computer Lab',
        totalQuantity: 1,
        availableQuantity: 1,
        condition: 'Good',
        source: 'Community Donation',
        assetTag: 'EDU-IT-2025-001',
        donorName: 'Vikram Seth (Alumni Donor)',
        notes: 'Equipped with Python and Scratch programming environments.',
        createdAt: new Date('2025-07-22'),
      },
      {
        _id: '65f800000000000000000002',
        itemName: 'Desktop Computer Workstations',
        category: 'IT & Computers',
        location: 'Computer Lab',
        totalQuantity: 5,
        availableQuantity: 5,
        condition: 'Good',
        source: 'Government Supply',
        assetTag: 'GOV-ICT-001-005',
        donorName: 'State Education ICT Fund',
        createdAt: new Date('2025-06-01'),
      },
      {
        _id: '65f800000000000000000003',
        itemName: 'Inter-School Cricket & Football Kit',
        category: 'Sports & Physical Education',
        location: 'Sports Room',
        totalQuantity: 2,
        availableQuantity: 2,
        condition: 'Good',
        source: 'Community Donation',
        assetTag: 'EDU-SPT-001-002',
        donorName: 'Village Youth Welfare Fund',
        createdAt: new Date('2025-06-15'),
      },
    ];

    // 10. Announcements
    this.announcements = [
      {
        _id: '65f900000000000000000001',
        title: 'Annual Comprehensive Student Health & Dental Checkup Camp',
        content: 'Free pediatric health screening, eye checkup, and nutritional assessment will be conducted by District Health Team on Tuesday, 10:00 AM.',
        category: 'Health Camp',
        targetAudience: 'All',
        priority: 'High',
        authorName: 'Dr. Ramesh Sharma (Headmaster)',
        isPinned: true,
        createdAt: new Date(),
      },
      {
        _id: '65f900000000000000000002',
        title: 'Quarterly Parent-Teacher Conference & Learning Progress Review',
        content: 'Parents of Class 6 to 10 are warmly invited for individual academic discussions with subject educators on Saturday at 9:30 AM.',
        category: 'Academic',
        targetAudience: 'Parents',
        priority: 'Normal',
        authorName: 'School Academic Council',
        createdAt: new Date(),
      },
      {
        _id: '65f900000000000000000003',
        title: 'Sundarpur Digital Classroom Community Drive Launched',
        content: 'Village Panchayat and School Administration announce support drive for 2 laptops for student digital laboratory.',
        category: 'Community Drive',
        targetAudience: 'Village Community',
        priority: 'High',
        authorName: 'Sarpanch Baldev Singh (Local Head)',
        isPinned: true,
        createdAt: new Date(),
      },
      {
        _id: '65f900000000000000000004',
        title: 'Quarterly Term Examination Timetable & Student Guidelines',
        content: 'Quarterly examinations will commence from September 15. Students must carry their school ID card and arrive by 9:00 AM. Timetable sheets have been handed over to students.',
        category: 'Academic',
        targetAudience: 'Parents',
        priority: 'High',
        authorName: 'Dr. Meenakshi Sundaram (Head Master)',
        isPinned: true,
        createdAt: new Date(),
      },
      {
        _id: '65f900000000000000000005',
        title: 'State Educational Holiday & School Reopening Notice',
        content: 'The school will remain closed on Friday for the state cultural festival. Classes will resume normally on Monday at 8:30 AM.',
        category: 'Holiday',
        targetAudience: 'All',
        priority: 'Normal',
        authorName: 'School Administration Office',
        createdAt: new Date(),
      },
    ];

    // 11. Support Requests
    this.supportRequests = [];
  }
}

export const store = new EduConnectDataStore();
export default store;
