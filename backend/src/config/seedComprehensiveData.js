import User from '../models/User.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import AcademicRecord from '../models/AcademicRecord.js';
import EarlyAttention from '../models/EarlyAttention.js';
import Inventory from '../models/Inventory.js';
import SchoolNeed from '../models/SchoolNeed.js';
import CommunityDrive from '../models/CommunityDrive.js';
import Contribution from '../models/Contribution.js';
import Announcement from '../models/Announcement.js';

export const seedComprehensiveData = async () => {
  try {
    console.log('🌱 Checking and seeding comprehensive EduConnect data...');

    // 1. Seed Users (All 8 Roles)
    const demoPassword = 'Password123!';

    const usersData = [
      {
        name: 'Dr. Ramesh Sharma (Headmaster)',
        email: 'headmaster@school.gov.in',
        password: demoPassword,
        role: 'headmaster_admin',
        phone: '+91 98765 00001',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur Ward 4',
        district: 'Central District',
        designation: 'Headmaster / School Administrator',
      },
      {
        name: 'Priya Sundaram (Class 8 Teacher)',
        email: 'teacher@school.gov.in',
        password: demoPassword,
        role: 'teacher',
        phone: '+91 98765 00002',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur Ward 4',
        district: 'Central District',
        designation: 'Senior Mathematics & Science Educator',
      },
      {
        name: 'Rajesh Nair (Science Teacher)',
        email: 'science.teacher@school.gov.in',
        password: demoPassword,
        role: 'teacher',
        phone: '+91 98765 00003',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur Ward 2',
        district: 'Central District',
        designation: 'Laboratory In-Charge',
      },
      {
        name: 'Aarav Kumar (Student)',
        email: 'student@school.gov.in',
        password: demoPassword,
        role: 'student',
        phone: '+91 98765 00010',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur East',
        district: 'Central District',
      },
      {
        name: 'Rahul Verma (Student)',
        email: 'rahul@school.gov.in',
        password: demoPassword,
        role: 'student',
        phone: '+91 98765 00011',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur Ward 1',
        district: 'Central District',
      },
      {
        name: 'Meena Devi (Parent)',
        email: 'parent@village.org',
        password: demoPassword,
        role: 'parent',
        phone: '+91 98765 00005',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur Ward 2',
        district: 'Central District',
        designation: 'Parent Guardian (Aarav Kumar)',
      },
      {
        name: 'Suresh Verma (Parent)',
        email: 'suresh.parent@village.org',
        password: demoPassword,
        role: 'parent',
        phone: '+91 98765 00012',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur Ward 1',
        district: 'Central District',
        designation: 'Parent Guardian (Rahul Verma)',
      },
      {
        name: 'Sarpanch Baldev Singh',
        email: 'localhead@village.gov.in',
        password: demoPassword,
        role: 'village_head',
        phone: '+91 98765 00006',
        aadhaarNumber: '123456789006',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur Gram Panchayat',
        district: 'Central District',
        designation: 'Village Panchayat President / Local Head',
      },
      {
        name: 'Kavitha Nathan (Villager / Donor)',
        email: 'villager@village.org',
        password: demoPassword,
        role: 'community_member',
        phone: '+91 98765 00004',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur East',
        district: 'Central District',
        designation: 'Community Volunteer & Resident',
      },
      {
        name: 'Vikram Seth',
        email: 'alumni@school.gov.in',
        password: demoPassword,
        role: 'alumni',
        phone: '+91 98765 00007',
        aadhaarNumber: '123456789007',
        schoolName: 'Govt Model Higher Secondary School (Batch of 2012)',
        village: 'Sundarpur / Bengaluru',
        district: 'Central District',
        designation: 'School Alumni & Contributing Patron',
      },
      {
        name: 'Ananya Roy (Smile NGO)',
        email: 'ngo@smilefoundation.org',
        password: demoPassword,
        role: 'ngo',
        phone: '+91 98765 00008',
        aadhaarNumber: '123456789008',
        schoolName: 'Govt Model Higher Secondary School',
        organizationName: 'Smile Rural Education Foundation',
        village: 'District Center',
        district: 'Central District',
        designation: 'NGO Partner & Project Lead',
      },
    ];

    const usersMap = {};
    for (const u of usersData) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
      } else {
        // update role if needed
        user.role = u.role;
        user.designation = u.designation || user.designation;
        user.organizationName = u.organizationName || user.organizationName;
        await user.save();
      }
      usersMap[u.email] = user;
    }

    // 2. Seed Classes
    let class8A = await Class.findOne({ name: 'Class 8-A' });
    if (!class8A) {
      class8A = await Class.create({
        name: 'Class 8-A',
        grade: '8',
        section: 'A',
        academicYear: '2025-2026',
        roomNumber: 'Room 101',
        classTeacher: usersMap['teacher@school.gov.in']?._id,
        subjects: [
          { name: 'Mathematics', code: 'MATH-8', teacher: usersMap['teacher@school.gov.in']?._id },
          { name: 'Science', code: 'SCI-8', teacher: usersMap['science.teacher@school.gov.in']?._id },
          { name: 'English', code: 'ENG-8', teacher: usersMap['teacher@school.gov.in']?._id },
          { name: 'Social Science', code: 'SOC-8', teacher: usersMap['teacher@school.gov.in']?._id },
          { name: 'Regional Language', code: 'LANG-8', teacher: usersMap['teacher@school.gov.in']?._id },
        ],
        studentCount: 5,
      });
    }

    let class9A = await Class.findOne({ name: 'Class 9-A' });
    if (!class9A) {
      class9A = await Class.create({
        name: 'Class 9-A',
        grade: '9',
        section: 'A',
        academicYear: '2025-2026',
        roomNumber: 'Room 102',
        classTeacher: usersMap['science.teacher@school.gov.in']?._id,
        subjects: [
          { name: 'Mathematics', code: 'MATH-9' },
          { name: 'Science', code: 'SCI-9' },
          { name: 'English', code: 'ENG-9' },
        ],
        studentCount: 4,
      });
    }

    // 3. Seed Students
    const studentsData = [
      {
        admissionNumber: 'SCH-2024-001',
        rollNumber: '01',
        name: 'Aarav Kumar',
        gender: 'Male',
        dob: new Date('2012-05-14'),
        class: class8A._id,
        section: 'A',
        userAccount: usersMap['student@school.gov.in']?._id,
        parentUser: usersMap['parent@village.org']?._id,
        parentName: 'Meena Devi',
        parentPhone: '+91 98765 00005',
        parentOccupation: 'Farmer / Tailor',
        village: 'Sundarpur East',
        bloodGroup: 'B+',
        currentAttendanceRate: 92,
        currentAcademicAverage: 78,
        consecutiveAbsences: 0,
        attentionLevel: 'NORMAL',
        entitlements: [
          { schemeName: 'Free Uniform Set (2 Pairs)', status: 'Disbursed', disbursedDate: new Date('2025-06-15') },
          { schemeName: 'Textbook & Notebook Kit', status: 'Disbursed', disbursedDate: new Date('2025-06-15') },
          { schemeName: 'Mid-Day Meal Scheme', status: 'Disbursed', notes: 'Active daily' },
        ],
      },
      {
        admissionNumber: 'SCH-2024-002',
        rollNumber: '02',
        name: 'Rahul Verma',
        gender: 'Male',
        dob: new Date('2012-08-20'),
        class: class8A._id,
        section: 'A',
        userAccount: usersMap['rahul@school.gov.in']?._id,
        parentUser: usersMap['suresh.parent@village.org']?._id,
        parentName: 'Suresh Verma',
        parentPhone: '+91 98765 00012',
        parentOccupation: 'Seasonal Agricultural Worker',
        village: 'Sundarpur Ward 1',
        bloodGroup: 'O+',
        currentAttendanceRate: 52, // Core Flow 1 example: 52% attendance
        currentAcademicAverage: 38, // Core Flow 1 example: 38% marks
        consecutiveAbsences: 8,     // Core Flow 1 example: 8 days consecutive absence
        attentionLevel: 'HIGH_ATTENTION',
        entitlements: [
          { schemeName: 'Free Uniform Set', status: 'Disbursed', disbursedDate: new Date('2025-06-15') },
          { schemeName: 'Pre-Matric State Scholarship', status: 'Pending', notes: 'Bank account verification in progress' },
        ],
      },
      {
        admissionNumber: 'SCH-2024-003',
        rollNumber: '03',
        name: 'Kavya Sharma',
        gender: 'Female',
        dob: new Date('2012-11-03'),
        class: class8A._id,
        section: 'A',
        parentName: 'Radha Sharma',
        parentPhone: '+91 98765 00013',
        parentOccupation: 'Shopkeeper',
        village: 'Sundarpur Ward 3',
        bloodGroup: 'A+',
        currentAttendanceRate: 72,
        currentAcademicAverage: 64,
        consecutiveAbsences: 3,
        attentionLevel: 'MODERATE_ATTENTION',
        entitlements: [
          { schemeName: 'Free Bicycle Scheme (Girl Child)', status: 'Disbursed', disbursedDate: new Date('2025-07-10') },
          { schemeName: 'Textbook Kit', status: 'Disbursed', disbursedDate: new Date('2025-06-15') },
        ],
      },
      {
        admissionNumber: 'SCH-2024-004',
        rollNumber: '04',
        name: 'Ananya Patel',
        gender: 'Female',
        dob: new Date('2012-02-18'),
        class: class8A._id,
        section: 'A',
        parentName: 'Ramesh Patel',
        parentPhone: '+91 98765 00014',
        village: 'Sundarpur Center',
        bloodGroup: 'AB+',
        currentAttendanceRate: 96,
        currentAcademicAverage: 88,
        consecutiveAbsences: 0,
        attentionLevel: 'NORMAL',
        entitlements: [
          { schemeName: 'Merit Scholarship Grant', status: 'Disbursed', disbursedDate: new Date('2025-07-01') },
        ],
      },
      {
        admissionNumber: 'SCH-2024-005',
        rollNumber: '05',
        name: 'Manoj Kumar',
        gender: 'Male',
        dob: new Date('2012-09-12'),
        class: class8A._id,
        section: 'A',
        parentName: 'Gopal Kumar',
        parentPhone: '+91 98765 00015',
        village: 'Sundarpur West',
        bloodGroup: 'O-',
        currentAttendanceRate: 88,
        currentAcademicAverage: 71,
        consecutiveAbsences: 1,
        attentionLevel: 'NORMAL',
        entitlements: [
          { schemeName: 'Free Uniform Set', status: 'Disbursed' },
        ],
      },
    ];

    const studentsMap = {};
    for (const s of studentsData) {
      let student = await Student.findOne({ admissionNumber: s.admissionNumber });
      if (!student) {
        student = await Student.create(s);
      } else {
        student.currentAttendanceRate = s.currentAttendanceRate;
        student.currentAcademicAverage = s.currentAcademicAverage;
        student.consecutiveAbsences = s.consecutiveAbsences;
        student.attentionLevel = s.attentionLevel;
        await student.save();
      }
      studentsMap[s.admissionNumber] = student;
    }

    // Link student profile & parent children
    if (usersMap['student@school.gov.in'] && studentsMap['SCH-2024-001']) {
      usersMap['student@school.gov.in'].studentProfile = studentsMap['SCH-2024-001']._id;
      await usersMap['student@school.gov.in'].save();
    }
    if (usersMap['parent@village.org'] && studentsMap['SCH-2024-001']) {
      usersMap['parent@village.org'].children = [studentsMap['SCH-2024-001']._id];
      await usersMap['parent@village.org'].save();
    }
    if (usersMap['suresh.parent@village.org'] && studentsMap['SCH-2024-002']) {
      usersMap['suresh.parent@village.org'].children = [studentsMap['SCH-2024-002']._id];
      await usersMap['suresh.parent@village.org'].save();
    }

    // 4. Seed Early Attention Records (Core Flow 1)
    const earlyAttentionData = [
      {
        student: studentsMap['SCH-2024-002']._id, // Rahul Verma (HIGH ATTENTION)
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
        isMonitored: true,
        interventions: [
          {
            actionType: 'Contact Parent / Phone Call',
            notes: 'Called father Suresh Verma regarding 8 days consecutive absence. Father reported seasonal farm harvesting work; counseled on compulsory attendance.',
            recordedBy: usersMap['teacher@school.gov.in']._id,
            status: 'In Progress',
            parentResponse: 'Father agreed to send Rahul back to school starting Monday and attend teacher counseling.',
          },
        ],
      },
      {
        student: studentsMap['SCH-2024-003']._id, // Kavya Sharma (MODERATE ATTENTION)
        academicYear: '2025-2026',
        attendanceRate: 72,
        academicAverage: 64,
        consecutiveAbsences: 3,
        attentionLevel: 'MODERATE_ATTENTION',
        flaggedReasons: [
          'Low Attendance Rate (72%, below 75% standard)',
          'Consecutive Absence Pattern (3 consecutive days)',
        ],
        recommendedActions: [
          'Attendance monitoring',
          'Followup call with parent',
        ],
        isMonitored: true,
        interventions: [],
      },
      {
        student: studentsMap['SCH-2024-001']._id, // Aarav Kumar (NORMAL)
        academicYear: '2025-2026',
        attendanceRate: 92,
        academicAverage: 78,
        consecutiveAbsences: 0,
        attentionLevel: 'NORMAL',
        flaggedReasons: ['Student records meet normal academic & attendance criteria'],
        recommendedActions: ['Continue routine observation & encouragement'],
        isMonitored: false,
        interventions: [],
      },
    ];

    for (const ea of earlyAttentionData) {
      const existing = await EarlyAttention.findOne({ student: ea.student });
      if (!existing) {
        await EarlyAttention.create(ea);
      } else {
        existing.attendanceRate = ea.attendanceRate;
        existing.academicAverage = ea.academicAverage;
        existing.consecutiveAbsences = ea.consecutiveAbsences;
        existing.attentionLevel = ea.attentionLevel;
        existing.flaggedReasons = ea.flaggedReasons;
        existing.recommendedActions = ea.recommendedActions;
        await existing.save();
      }
    }

    // 5. Seed Academic Records
    const academicData = [
      {
        student: studentsMap['SCH-2024-001']._id, // Aarav Kumar
        class: class8A._id,
        term: 'Quarterly Exam',
        marks: [
          { subject: 'Mathematics', marksObtained: 82, maxMarks: 100, grade: 'A' },
          { subject: 'Science', marksObtained: 76, maxMarks: 100, grade: 'A' },
          { subject: 'English', marksObtained: 80, maxMarks: 100, grade: 'A' },
          { subject: 'Social Science', marksObtained: 74, maxMarks: 100, grade: 'B' },
          { subject: 'Regional Language', marksObtained: 78, maxMarks: 100, grade: 'A' },
        ],
        teacherRemarks: 'Excellent analytical skills in Mathematics and Science.',
        recordedBy: usersMap['teacher@school.gov.in']._id,
      },
      {
        student: studentsMap['SCH-2024-002']._id, // Rahul Verma
        class: class8A._id,
        term: 'Quarterly Exam',
        marks: [
          { subject: 'Mathematics', marksObtained: 34, maxMarks: 100, grade: 'F', remarks: 'Needs remedial support' },
          { subject: 'Science', marksObtained: 40, maxMarks: 100, grade: 'D', remarks: 'Missed key practical classes' },
          { subject: 'English', marksObtained: 42, maxMarks: 100, grade: 'D' },
          { subject: 'Social Science', marksObtained: 36, maxMarks: 100, grade: 'D' },
          { subject: 'Regional Language', marksObtained: 38, maxMarks: 100, grade: 'D' },
        ],
        teacherRemarks: 'Requires urgent remedial coaching and regular class presence.',
        recordedBy: usersMap['teacher@school.gov.in']._id,
      },
    ];

    for (const ac of academicData) {
      const existing = await AcademicRecord.findOne({ student: ac.student, term: ac.term });
      if (!existing) {
        await AcademicRecord.create(ac);
      }
    }

    // 6. Seed School Needs (Core Flow 2)
    // Need 1: Exactly matches user's prompt (2 Laptops Needed for Computer Laboratory)
    let laptopNeed = await SchoolNeed.findOne({ title: '2 Laptops Needed for Computer Laboratory' });
    if (!laptopNeed) {
      laptopNeed = await SchoolNeed.create({
        title: '2 Laptops Needed for Computer Laboratory',
        description: 'Required 2 Core i5 laptops for student coding curriculum and digital learning tutorials.',
        category: 'IT & Computers',
        urgency: 'High',
        targetDepartment: 'Computer Lab',
        requiredQuantity: 2,
        receivedQuantity: 1, // 1 received, 1 remaining
        remainingQuantity: 1,
        unit: 'Units',
        estimatedCost: 80000,
        status: 'Partially Fulfilled',
        verifiedByAdmin: true,
        createdBy: usersMap['headmaster@school.gov.in']._id,
      });
    }

    let scienceNeed = await SchoolNeed.findOne({ title: '10 Science Compound Microscopes' });
    if (!scienceNeed) {
      scienceNeed = await SchoolNeed.create({
        title: '10 Science Compound Microscopes',
        description: 'Compound optical microscopes for Middle & High School biology and chemistry practicals.',
        category: 'Laboratory Equipment',
        urgency: 'Medium',
        targetDepartment: 'Science Lab',
        requiredQuantity: 10,
        receivedQuantity: 0,
        remainingQuantity: 10,
        unit: 'Units',
        estimatedCost: 45000,
        status: 'Open',
        verifiedByAdmin: true,
        createdBy: usersMap['headmaster@school.gov.in']._id,
      });
    }

    let sportsNeed = await SchoolNeed.findOne({ title: '4 Complete Cricket & Football Sports Kits' });
    if (!sportsNeed) {
      sportsNeed = await SchoolNeed.create({
        title: '4 Complete Cricket & Football Sports Kits',
        description: 'Quality sports equipment including bats, balls, footballs, protective pads, and goal nets for inter-school tournaments.',
        category: 'Sports Equipment',
        urgency: 'Medium',
        targetDepartment: 'Sports Ground',
        requiredQuantity: 4,
        receivedQuantity: 2,
        remainingQuantity: 2,
        unit: 'Kits',
        estimatedCost: 24000,
        status: 'Partially Fulfilled',
        verifiedByAdmin: true,
        createdBy: usersMap['headmaster@school.gov.in']._id,
      });
    }

    // 7. Seed Community Drives (Core Flow 2)
    let laptopDrive = await CommunityDrive.findOne({ title: 'Sundarpur Digital Lab: 2 Laptops Drive' });
    if (!laptopDrive) {
      laptopDrive = await CommunityDrive.create({
        title: 'Sundarpur Digital Lab: 2 Laptops Drive',
        description: 'Panchayat-led village initiative to sponsor 2 laptops for government school digital literacy and coding education.',
        schoolNeed: laptopNeed._id,
        organizedBy: usersMap['localhead@village.gov.in']._id,
        organizerName: 'Sarpanch Baldev Singh (Village Head)',
        village: 'Sundarpur Gram Panchayat',
        targetQuantity: 2,
        fulfilledQuantity: 1, // 1 verified received
        pledgedQuantity: 2,   // 1 received + 1 pending
        unit: 'Laptops',
        status: 'Active',
        impactMessage: 'Connecting rural children with modern software, typing skills, and digital textbooks.',
        contributionsCount: 2,
      });
      laptopNeed.linkedDrive = laptopDrive._id;
      laptopNeed.status = 'Partially Fulfilled';
      await laptopNeed.save();
    }

    let sportsDrive = await CommunityDrive.findOne({ title: 'Village Youth & Sports Equipment Mobilization' });
    if (!sportsDrive) {
      sportsDrive = await CommunityDrive.create({
        title: 'Village Youth & Sports Equipment Mobilization',
        description: 'Providing sports kits and athletic training items for school children.',
        schoolNeed: sportsNeed._id,
        organizedBy: usersMap['localhead@village.gov.in']._id,
        organizerName: 'Sarpanch Baldev Singh (Village Head)',
        village: 'Sundarpur Gram Panchayat',
        targetQuantity: 4,
        fulfilledQuantity: 2,
        pledgedQuantity: 2,
        unit: 'Kits',
        status: 'Active',
        contributionsCount: 1,
      });
      sportsNeed.linkedDrive = sportsDrive._id;
      await sportsNeed.save();
    }

    // 8. Seed Contributions (Core Flow 2: Demonstrating PENDING, APPROVED, and RECEIVED states)
    // Contribution 1: RECEIVED (Physically verified with Asset Tag and in Inventory)
    let contrib1 = await Contribution.findOne({ itemDetails: 'Lenovo ThinkPad Core i5 Laptop (Donated by Alumni)' });
    if (!contrib1) {
      contrib1 = await Contribution.create({
        drive: laptopDrive._id,
        schoolNeed: laptopNeed._id,
        contributor: usersMap['alumni@school.gov.in']._id,
        contributorName: 'Vikram Seth (Alumni)',
        contributorEmail: 'alumni@school.gov.in',
        contributorPhone: '+91 98765 00007',
        contributorRole: 'alumni',
        contributionType: 'Donate Item',
        itemDetails: 'Lenovo ThinkPad Core i5 Laptop (Donated by Alumni)',
        quantity: 1,
        estimatedValue: 40000,
        status: 'RECEIVED', // Successfully verified
        adminReview: {
          reviewedBy: usersMap['headmaster@school.gov.in']._id,
          reviewedAt: new Date('2025-07-20'),
          adminRemarks: 'Approved for Computer Lab ICT curriculum.',
        },
        physicalVerification: {
          verifiedBy: usersMap['headmaster@school.gov.in']._id,
          receivedAt: new Date('2025-07-22'),
          assetTag: 'EDU-IT-2025-001',
          condition: 'New',
          verificationNotes: 'Device unboxed, verified working, Windows & educational software configured.',
        },
      });
    }

    // Contribution 2: PENDING (From Kavitha Nathan, ready for Headmaster to Approve/Reject)
    let contrib2 = await Contribution.findOne({ itemDetails: 'Dell Inspiron Laptop 15-inch' });
    if (!contrib2) {
      contrib2 = await Contribution.create({
        drive: laptopDrive._id,
        schoolNeed: laptopNeed._id,
        contributor: usersMap['villager@village.org']._id,
        contributorName: 'Kavitha Nathan (Villager)',
        contributorEmail: 'villager@village.org',
        contributorPhone: '+91 98765 00004',
        contributorRole: 'community_member',
        contributionType: 'Donate Item',
        itemDetails: 'Dell Inspiron Laptop 15-inch',
        quantity: 1,
        estimatedValue: 38000,
        notes: 'Pledging laptop for school lab. Can bring to school office on Friday.',
        status: 'PENDING', // PENDING review
      });
    }

    // Contribution 3: APPROVED (From Gramin NGO, ready for Headmaster to "MARK AS RECEIVED" upon physical arrival)
    let contrib3 = await Contribution.findOne({ itemDetails: '2 Complete Cricket & Football Training Kits' });
    if (!contrib3) {
      contrib3 = await Contribution.create({
        drive: sportsDrive._id,
        schoolNeed: sportsNeed._id,
        contributor: usersMap['ngo@gramin.org']._id,
        contributorName: 'Dr. Ananya Ray (Gramin Foundation NGO)',
        contributorEmail: 'ngo@gramin.org',
        contributorPhone: '+91 98765 00008',
        contributorRole: 'ngo',
        contributionType: 'Donate Item',
        itemDetails: '2 Complete Cricket & Football Training Kits',
        quantity: 2,
        estimatedValue: 12000,
        status: 'APPROVED', // APPROVED but NOT YET MARKED AS RECEIVED
        adminReview: {
          reviewedBy: usersMap['headmaster@school.gov.in']._id,
          reviewedAt: new Date('2025-08-01'),
          adminRemarks: 'Approved. Awaiting physical courier delivery at school reception.',
        },
      });
    }

    // 9. Seed Inventory Items
    let invLaptop = await Inventory.findOne({ assetTag: 'EDU-IT-2025-001' });
    if (!invLaptop) {
      invLaptop = await Inventory.create({
        itemName: 'Lenovo ThinkPad Core i5 Laptop',
        category: 'IT & Computers',
        location: 'Computer Lab',
        totalQuantity: 1,
        availableQuantity: 1,
        condition: 'Good',
        source: 'Community Donation',
        assetTag: 'EDU-IT-2025-001',
        donorName: 'Vikram Seth (Alumni Donor)',
        linkedContribution: contrib1._id,
        notes: 'Equipped with Python and Scratch programming environments.',
      });
    }

    let invDesktops = await Inventory.findOne({ itemName: 'Desktop Computer Workstations' });
    if (!invDesktops) {
      invDesktops = await Inventory.create({
        itemName: 'Desktop Computer Workstations',
        category: 'IT & Computers',
        location: 'Computer Lab',
        totalQuantity: 5,
        availableQuantity: 5,
        condition: 'Good',
        source: 'Government Supply',
        assetTag: 'GOV-ICT-001-005',
        donorName: 'State Education ICT Fund',
      });
    }

    let invSports = await Inventory.findOne({ itemName: 'Inter-School Cricket & Football Kit' });
    if (!invSports) {
      invSports = await Inventory.create({
        itemName: 'Inter-School Cricket & Football Kit',
        category: 'Sports & Physical Education',
        location: 'Sports Room',
        totalQuantity: 2,
        availableQuantity: 2,
        condition: 'Good',
        source: 'Community Donation',
        assetTag: 'EDU-SPT-001-002',
        donorName: 'Village Youth Welfare Fund',
      });
    }

    // 10. Seed Announcements
    const announcementsData = [
      {
        title: 'Annual Comprehensive Student Health & Dental Checkup Camp',
        content: 'Free pediatric health screening, eye checkup, and nutritional assessment will be conducted by District Health Team on Tuesday, 10:00 AM.',
        category: 'Health Camp',
        targetAudience: 'All',
        priority: 'High',
        publishedBy: usersMap['headmaster@school.gov.in']._id,
        authorName: 'Dr. Ramesh Sharma (Headmaster)',
        isPinned: true,
      },
      {
        title: 'Quarterly Parent-Teacher Conference & Learning Progress Review',
        content: 'Parents of Class 6 to 10 are warmly invited for individual academic discussions with subject educators on Saturday at 9:30 AM.',
        category: 'Academic',
        targetAudience: 'Parents',
        priority: 'Normal',
        publishedBy: usersMap['headmaster@school.gov.in']._id,
        authorName: 'School Academic Council',
      },
      {
        title: 'Sundarpur Digital Classroom Community Drive Launched',
        content: 'Village Panchayat and School Administration announce support drive for 2 laptops for student digital laboratory. Community members and alumni are invited to contribute.',
        category: 'Community Drive',
        targetAudience: 'Village Community',
        priority: 'High',
        publishedBy: usersMap['localhead@village.gov.in']._id,
        authorName: 'Sarpanch Baldev Singh (Local Head)',
        isPinned: true,
      },
    ];

    for (const ann of announcementsData) {
      const existing = await Announcement.findOne({ title: ann.title });
      if (!existing) {
        await Announcement.create(ann);
      }
    }

    console.log('✅ Comprehensive EduConnect seed dataset initialized successfully!');
  } catch (error) {
    console.error('❌ Error seeding comprehensive data:', error);
  }
};
