import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
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
          if (mongoose.Types.ObjectId.isValid(decoded.id)) {
            user = await User.findById(decoded.id).select('-password');
          }
          if (!user && (decoded.phone || decoded.pNo)) {
            user = await User.findOne({
              $or: [
                ...(decoded.phone ? [{ phone: decoded.phone }] : []),
                ...(decoded.pNo ? [{ pNo: decoded.pNo }] : []),
              ],
            }).select('-password');
          }
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
          name: decoded.name || '',
          phone: decoded.phone || '',
          pNo: decoded.pNo || '',
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
        pNo: user.pNo || decoded.pNo || '',
        name: user.name || decoded.name || '',
        email: user.email,
        role: user.role,
        phone: user.phone || decoded.phone || '',
        children: user.children || [],
        isPhoneVerified: user.isPhoneVerified !== false,
        schoolName: user.schoolName,
        village: user.village,
        district: user.district,
        organizationName: user.organizationName,
        isActive: user.isActive !== false,
      };

      if (!safeUser.children && user.children) {
        safeUser.children = user.children;
      }

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

