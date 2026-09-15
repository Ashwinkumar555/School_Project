import User from '../models/User.js';

export const seedDemoUsers = async () => {
  // Demo accounts removed completely per requirements
  try {
    if (User.db?.readyState === 1) {
      await User.deleteMany({
        email: {
          $in: [
            'headmaster@school.gov.in',
            'teacher@school.gov.in',
            'science.teacher@school.gov.in',
            'officer@welfare.gov.in',
            'volunteer@village.org',
            'parent@village.org',
            'student@school.gov.in',
            'rahul@school.gov.in',
            'suresh.parent@village.org',
            'localhead@village.gov.in',
            'villager@village.org',
            'alumni@school.gov.in',
            'ngo@smilefoundation.org',
          ],
        },
      });
    }
  } catch (error) {
    console.warn('Cleanup note:', error.message);
  }
};

