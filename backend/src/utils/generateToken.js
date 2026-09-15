import jwt from 'jsonwebtoken';

export const generateToken = (userId, role, extra = {}) => {
  const secret = process.env.JWT_SECRET || 'educonnect_default_secret_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: userId,
      role,
      name: extra.name || '',
      phone: extra.phone || '',
      pNo: extra.pNo || '',
      email: extra.email || '',
    },
    secret,
    {
      expiresIn,
    }
  );
};
