import User from '../models/User.js';

export const seedDemoUsers = async () => {
  try {
    const demoUsers = [
      {
        name: 'Dr. Ramesh Sharma (Headmaster)',
        email: 'headmaster@school.gov.in',
        password: 'Password123!',
        role: 'headmaster_admin',
        phone: '+91 98765 00001',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur Ward 4',
        district: 'Central District',
      },
      {
        name: 'Priya Sundaram (Educator)',
        email: 'teacher@school.gov.in',
        password: 'Password123!',
        role: 'teacher',
        phone: '+91 98765 00002',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur Ward 4',
        district: 'Central District',
      },
      {
        name: 'Anand Verma (Welfare Officer)',
        email: 'officer@welfare.gov.in',
        password: 'Password123!',
        role: 'welfare_officer',
        phone: '+91 98765 00003',
        schoolName: 'District Education Office',
        village: 'District HQ',
        district: 'Central District',
      },
      {
        name: 'Kavitha Nathan (Volunteer Tutor)',
        email: 'volunteer@village.org',
        password: 'Password123!',
        role: 'community_volunteer',
        phone: '+91 98765 00004',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur East',
        district: 'Central District',
      },
      {
        name: 'Meena Devi (Parent Guardian)',
        email: 'parent@village.org',
        password: 'Password123!',
        role: 'student_parent',
        phone: '+91 98765 00005',
        schoolName: 'Govt Model Higher Secondary School',
        village: 'Sundarpur Ward 2',
        district: 'Central District',
      },
    ];

    for (const demoUser of demoUsers) {
      const existing = await User.findOne({ email: demoUser.email });
      if (!existing) {
        await User.create(demoUser);
      }
    }
    console.log('🌱 EduConnect demo accounts verified in database.');
  } catch (error) {
    console.warn('⚠️ Demo user seeding note:', error.message);
  }
};
