import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import store from '../utils/dataStore.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'educonnect_default_secret_key_2026'
      );

      let user = null;
      try {
        if (User.db.readyState === 1) {
          user = await User.findById(decoded.id).select('-password');
        }
      } catch (dbErr) {
        console.warn('DB lookup during auth protect:', dbErr.message);
      }

      if (!user) {
        const storeUser = store.users.find(
          (u) => u._id === decoded.id || String(u._id) === String(decoded.id)
        );
        if (storeUser) {
          user = storeUser;
        }
      }

      if (!user) {
        // Fallback user from verified token payload
        user = {
          _id: decoded.id,
          role: decoded.role,
          name: decoded.name || 'EduConnect User',
          phone: decoded.phone || '',
          isPhoneVerified: true,
          isActive: true,
        };
      }

      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated. Please contact administration.',
        });
      }

      const safeUser = typeof user.toSafeObject === 'function' ? user.toSafeObject() : {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified !== false,
        schoolName: user.schoolName,
        village: user.village,
        district: user.district,
        organizationName: user.organizationName,
        isActive: user.isActive !== false,
      };

      // Security: ensure Aadhaar number is never exposed in session retrieval
      delete safeUser.aadhaarNumber;
      delete safeUser.aadhaar;

      req.user = safeUser;
      return next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role || 'anonymous'}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

export const authorize = authorizeRoles;

