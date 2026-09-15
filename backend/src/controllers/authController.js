import bcrypt from 'bcryptjs';
import User, { USER_ROLES } from '../models/User.js';
import Student from '../models/Student.js';
import { generateToken } from '../utils/generateToken.js';
import { getDbStatus } from '../config/db.js';
import store from '../utils/dataStore.js';
import mongoose from 'mongoose';

// In-memory OTP verification store (key -> { otp, expiresAt, phone })
const otpStore = new Map();

export const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
};

export const normalizeAadhaar = (aadhaar) => {
  if (!aadhaar) return '';
  return String(aadhaar).replace(/\D/g, '');
};

const verifyOtpCode = (key, otp) => {
  const cleanKey = (key || '').trim();
  const cleanOtp = (otp || '').trim();
  if (!cleanKey || !cleanOtp) return false;

  const norm = normalizePhone(cleanKey);
  const record = otpStore.get(cleanKey) || (norm ? otpStore.get(norm) : null);

  if (record && record.otp === cleanOtp) {
    if (record.expiresAt && record.expiresAt < Date.now()) {
      otpStore.delete(cleanKey);
      if (norm) otpStore.delete(norm);
      return false;
    }
    return true;
  }
  return false;
};

/**
 * @desc    Send OTP to user phone number or registered P.No
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
export const sendOtp = async (req, res, next) => {
  try {
    const { phone, identifier } = req.body;
    const input = (phone || identifier || '').trim();

    if (!input) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Phone Number or P.No to receive OTP',
      });
    }

    let targetPhone = input;
    let registeredPNo = null;

    // If input does not look like a pure phone number (contains letters or less than 10 digits without +)
    // or if an account with this P.No exists in DB / store, lookup the registered phone number
    const norm = normalizePhone(input);
    let matchedUser = null;

    if (mongoose.connection.readyState === 1) {
      try {
        matchedUser = await User.findOne({
          $or: [
            { pNo: input },
            { phone: input },
            ...(norm ? [{ phone: norm }, { phone: { $regex: norm + '$', $options: 'i' } }] : []),
          ],
        });
      } catch (dbErr) {
        console.warn('DB lookup during send-otp:', dbErr.message);
      }
    }

    if (!matchedUser) {
      matchedUser = store.users.find(
        (u) =>
          u.pNo === input ||
          u.phone === input ||
          (norm && normalizePhone(u.phone) === norm)
      );
    }

    if (matchedUser) {
      targetPhone = matchedUser.phone || input;
      registeredPNo = matchedUser.pNo || null;
    }

    const cleanPhone = targetPhone.trim();
    const phoneNorm = normalizePhone(cleanPhone);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    const otpPayload = { otp: generatedOtp, expiresAt, phone: cleanPhone };

    otpStore.set(cleanPhone, otpPayload);
    if (phoneNorm) {
      otpStore.set(phoneNorm, otpPayload);
    }
    if (input && input !== cleanPhone) {
      otpStore.set(input, otpPayload);
    }
    if (registeredPNo) {
      otpStore.set(registeredPNo, otpPayload);
    }

    console.log(`[EduConnect OTP Service] OTP for ${cleanPhone} (key: ${input}): ${generatedOtp}`);

    const maskedPhone =
      cleanPhone.length > 4
        ? '******' + cleanPhone.slice(-4)
        : cleanPhone;

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to registered mobile ending in ${cleanPhone.slice(-4)}`,
      data: {
        phone: cleanPhone,
        maskedPhone,
        otp: generatedOtp, // returned for verification feedback in UI & testing
        expiresIn: 300,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP for phone number or P.No
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, identifier, otp } = req.body;
    const key = (phone || identifier || '').trim();

    if (!key || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number / P.No and OTP are required for verification',
      });
    }

    const isValid = verifyOtpCode(key, otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please enter the correct OTP code.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new user account in MongoDB
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const {
      pNo,
      name,
      role,
      phone,
      aadhaarNumber,
      aadhaar,
      schoolName,
      otp,
      studentIdentifier,
      admissionNumber,
      rollNumber,
    } = req.body;

    // 1. Role validation
    if (!role || !USER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid platform role for registration',
      });
    }

    // 2. Required fields validation
    const rolePrefixes = {
      village_head: 'VHD',
      alumni: 'ALM',
      ngo: 'NGO',
      headmaster_admin: 'HMA',
      teacher: 'TCH',
      parent: 'PAR',
      student: 'STD',
      villager: 'VIL',
    };
    const prefix = rolePrefixes[role] || 'USR';
    const finalPNo =
      (pNo || '').trim() ||
      `${prefix}-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

    const finalName = (name || '').trim();
    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      });
    }

    const finalPhone = (phone || '').trim();
    if (!finalPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const finalAadhaar = (aadhaarNumber || aadhaar || '').trim();
    if (!finalAadhaar) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number is required',
      });
    }

    if (role === 'headmaster_admin' && (!schoolName || !schoolName.trim())) {
      return res.status(400).json({
        success: false,
        message: 'School Name is required for Headmaster / Admin registration',
      });
    }

    const finalOtp = (otp || '').trim();
    if (!finalOtp) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the OTP received on your phone number',
      });
    }

    // 3. Verify OTP
    const isOtpValid = verifyOtpCode(finalPhone, finalOtp) || verifyOtpCode(finalPNo, finalOtp);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please enter the valid OTP sent to your phone number.',
      });
    }

    const normPhone = normalizePhone(finalPhone);
    const normAadhaar = normalizeAadhaar(finalAadhaar);

    // 4. Duplicate checks (P.No, phone number, Aadhaar number)
    let duplicateError = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const existingPNo = await User.findOne({ pNo: finalPNo });
        if (existingPNo) duplicateError = 'An account with this P.No already exists.';

        if (!duplicateError) {
          const phoneQuery = [{ phone: finalPhone }];
          if (normPhone) {
            phoneQuery.push({ phone: normPhone }, { phone: { $regex: normPhone + '$', $options: 'i' } });
          }
          const existingPhone = await User.findOne({ $or: phoneQuery });
          if (existingPhone) duplicateError = 'An account with this phone number already exists.';
        }

        if (!duplicateError && finalAadhaar) {
          const aadhaarQuery = [{ aadhaarNumber: finalAadhaar }];
          if (normAadhaar) aadhaarQuery.push({ aadhaarNumber: normAadhaar });
          const existingAadhaar = await User.findOne({ $or: aadhaarQuery });
          if (existingAadhaar) duplicateError = 'An account with this Aadhaar number already exists.';
        }
      } catch (dbErr) {
        console.warn('DB duplicate check warning:', dbErr.message);
      }
    }

    // Check store duplicates as well
    if (!duplicateError) {
      const existingInStorePNo = store.users.find((u) => u.pNo === finalPNo);
      if (existingInStorePNo) duplicateError = 'An account with this P.No already exists.';

      const existingInStorePhone = store.users.find(
        (u) => u.phone === finalPhone || (normPhone && normalizePhone(u.phone) === normPhone)
      );
      if (existingInStorePhone) duplicateError = 'An account with this phone number already exists.';

      const existingInStoreAadhaar = store.users.find(
        (u) => u.aadhaarNumber === finalAadhaar || (normAadhaar && normalizeAadhaar(u.aadhaarNumber) === normAadhaar)
      );
      if (existingInStoreAadhaar) duplicateError = 'An account with this Aadhaar number already exists.';
    }

    if (duplicateError) {
      return res.status(400).json({
        success: false,
        message: duplicateError,
      });
    }

    // 5. If registering as a parent, find and link student(s)
    let matchedStudentIds = [];
    if (role === 'parent' || role === 'student_parent') {
      const studentIdent = (studentIdentifier || admissionNumber || rollNumber || '').trim().toLowerCase();

      // Look up in store.students
      const matchedInStore = store.students.filter((s) => {
        const sAdmission = (s.admissionNumber || '').toLowerCase().trim();
        const sRoll = (s.rollNumber || '').toLowerCase().trim();
        const sParentPhoneNorm = normalizePhone(s.parentPhone);
        const sParentName = (s.parentName || '').toLowerCase().trim();
        const finalNameLower = finalName.toLowerCase().trim();

        const identMatch = studentIdent && (sAdmission === studentIdent || sRoll === studentIdent);
        const phoneMatch = normPhone && sParentPhoneNorm && (normPhone === sParentPhoneNorm || s.parentPhone === finalPhone);
        const nameMatch = finalNameLower && sParentName && (sParentName === finalNameLower || sParentName.includes(finalNameLower) || finalNameLower.includes(sParentName));

        return identMatch || phoneMatch || nameMatch;
      });
      matchedStudentIds.push(...matchedInStore.map((s) => s._id));

      // Look up in MongoDB if connected
      if (mongoose.connection.readyState === 1) {
        try {
          const conditions = [];
          if (studentIdent) {
            conditions.push({ admissionNumber: new RegExp('^' + studentIdent + '$', 'i') });
            conditions.push({ rollNumber: new RegExp('^' + studentIdent + '$', 'i') });
          }
          if (finalPhone) {
            conditions.push({ parentPhone: finalPhone });
          }
          if (normPhone) {
            conditions.push({ parentPhone: { $regex: normPhone + '$', $options: 'i' } });
          }
          if (finalName) {
            conditions.push({ parentName: new RegExp('^' + finalName + '$', 'i') });
          }

          if (conditions.length > 0) {
            const dbMatched = await Student.find({ $or: conditions });
            matchedStudentIds.push(...dbMatched.map((s) => s._id));
          }
        } catch (dbFindErr) {
          console.warn('DB student lookup during parent register:', dbFindErr.message);
        }
      }

      matchedStudentIds = Array.from(new Set(matchedStudentIds.map(String)));
    }

    const validStudentObjectIds = matchedStudentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    // 6. Create Real User in MongoDB
    const newUserObj = {
      _id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pNo: finalPNo,
      name: finalName,
      role,
      phone: finalPhone,
      aadhaarNumber: finalAadhaar,
      children: matchedStudentIds,
      isPhoneVerified: true,
      schoolName: role === 'headmaster_admin' ? (schoolName || '').trim() : '',
      village: 'Sundarpur',
      district: 'Central District',
      organizationName: '',
      isActive: true,
      createdAt: new Date(),
    };

    let createdDbUser = null;
    if (mongoose.connection.readyState === 1) {
      try {
        createdDbUser = await User.create({
          pNo: newUserObj.pNo,
          name: newUserObj.name,
          role: newUserObj.role,
          phone: newUserObj.phone,
          aadhaarNumber: newUserObj.aadhaarNumber,
          children: validStudentObjectIds,
          isPhoneVerified: true,
          schoolName: newUserObj.schoolName,
          village: newUserObj.village,
          district: newUserObj.district,
          organizationName: newUserObj.organizationName,
        });
        if (createdDbUser) {
          newUserObj._id = createdDbUser._id.toString();
        }
      } catch (createErr) {
        console.warn('DB creation error during register, persisting to file-backed store:', createErr.message);
      }
    }

    // Save to persistent file-backed store
    store.users.push(newUserObj);
    store.saveUsersToFile();

    const userId = createdDbUser ? createdDbUser._id : newUserObj._id;

    // Two-way link: update matched students' parentUser
    if (matchedStudentIds.length > 0) {
      store.students.forEach((s) => {
        if (matchedStudentIds.includes(String(s._id))) {
          s.parentUser = String(userId);
        }
      });
      if (mongoose.connection.readyState === 1 && validStudentObjectIds.length > 0) {
        try {
          await Student.updateMany(
            { _id: { $in: validStudentObjectIds } },
            { $set: { parentUser: userId } }
          );
        } catch (linkErr) {
          console.warn('DB student parent link error during register:', linkErr.message);
        }
      }
    }

    const token = generateToken(userId, role, {
      name: finalName,
      phone: finalPhone,
      pNo: finalPNo,
    });

    const safeUser = createdDbUser
      ? createdDbUser.toSafeObject()
      : {
          _id: newUserObj._id,
          pNo: newUserObj.pNo,
          name: newUserObj.name,
          role: newUserObj.role,
          phone: newUserObj.phone,
          children: matchedStudentIds,
          isPhoneVerified: true,
          schoolName: newUserObj.schoolName,
          village: newUserObj.village,
          district: newUserObj.district,
          organizationName: newUserObj.organizationName,
          isActive: true,
        };

    if (!safeUser.children && matchedStudentIds.length > 0) {
      safeUser.children = matchedStudentIds;
    }

    delete safeUser.aadhaarNumber;
    delete safeUser.aadhaar;
    delete safeUser.password;

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: safeUser,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user using P.No / Phone Number + OTP
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { role, identifier, phone, pNo, otp } = req.body;
    const targetIdentifier = (identifier || pNo || phone || '').trim();
    const targetRole = (role || '').trim();
    const finalOtp = (otp || '').trim();

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Please select your role',
      });
    }

    if (!targetIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Phone Number is required for login',
      });
    }

    if (!finalOtp) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the OTP received on your phone number',
      });
    }

    // 1. Verify OTP
    const isOtpValid =
      verifyOtpCode(targetIdentifier, finalOtp) ||
      verifyOtpCode(normalizePhone(targetIdentifier), finalOtp);

    if (!isOtpValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP. Please enter the valid OTP code.',
      });
    }

    // 2. Find user in MongoDB or Store
    const normPhone = normalizePhone(targetIdentifier);
    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const query = [
          { pNo: targetIdentifier },
          { phone: targetIdentifier },
        ];
        if (normPhone) {
          query.push({ phone: normPhone }, { phone: { $regex: normPhone + '$', $options: 'i' } });
        }
        user = await User.findOne({ $or: query });
      } catch (dbErr) {
        console.warn('DB lookup failed during login:', dbErr.message);
      }
    }

    if (!user) {
      user = store.users.find(
        (u) =>
          u.pNo === targetIdentifier ||
          u.phone === targetIdentifier ||
          (normPhone && normalizePhone(u.phone) === normPhone)
      );
      if (user && mongoose.connection.readyState === 1 && !mongoose.Types.ObjectId.isValid(user._id)) {
        try {
          const mongoUser = await User.findOne({
            $or: [
              ...(user.phone ? [{ phone: user.phone }] : []),
              ...(user.pNo ? [{ pNo: user.pNo }] : []),
            ],
          });
          if (mongoUser) {
            user = mongoUser;
          } else {
            const synced = await User.create({
              name: user.name,
              role: user.role,
              phone: user.phone,
              pNo: user.pNo,
              village: user.village || 'Sundarpur',
              district: user.district || 'Central District',
              schoolName: user.schoolName || '',
              organizationName: user.organizationName || '',
              isPhoneVerified: true,
              isActive: true,
            });
            if (synced) {
              user = synced;
            }
          }
        } catch (syncErr) {
          console.warn('Sync to Mongo on login:', syncErr.message);
        }
      }
    }

    // If user not found, DO NOT auto-create!
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this P.No / Phone Number. Please register first.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact administration.',
      });
    }

    // 3. Strict Role Verification: Selected role must match registered role in database
    if (user.role !== targetRole) {
      return res.status(403).json({
        success: false,
        message: 'Selected role does not match your registered role.',
      });
    }

    // 4. For Parent role: link child automatically if not linked or if matching child exists
    if (user.role === 'parent' || user.role === 'student_parent') {
      let matchedChildren = [];
      const userPhoneNorm = normalizePhone(user.phone);
      const userNameLower = (user.name || '').toLowerCase().trim();
      const userIdStr = String(user._id);

      // Search in store.students
      const storeMatches = store.students.filter((s) => {
        const sParentUser = String(s.parentUser?._id || s.parentUser || '');
        const sNormPhone = normalizePhone(s.parentPhone);
        const sParentName = (s.parentName || '').toLowerCase().trim();
        const sId = String(s._id);
        const userChildrenList = (user.children || []).map((c) => String(c?._id || c));

        return (
          userChildrenList.includes(sId) ||
          (sParentUser && sParentUser === userIdStr) ||
          (userPhoneNorm && sNormPhone && (userPhoneNorm === sNormPhone || s.parentPhone === user.phone)) ||
          (userNameLower && sParentName && (sParentName === userNameLower || sParentName.includes(userNameLower) || userNameLower.includes(sParentName)))
        );
      });
      matchedChildren.push(...storeMatches.map((s) => s._id));

      // Search in MongoDB if connected
      if (mongoose.connection.readyState === 1) {
        try {
          const conditions = [];
          if (mongoose.Types.ObjectId.isValid(user._id)) {
            conditions.push({ parentUser: user._id });
          }
          if (user.phone) {
            conditions.push({ parentPhone: user.phone });
          }
          if (userPhoneNorm) {
            conditions.push({ parentPhone: { $regex: userPhoneNorm + '$', $options: 'i' } });
          }
          if (user.name) {
            conditions.push({ parentName: new RegExp('^' + user.name + '$', 'i') });
          }

          if (conditions.length > 0) {
            const dbMatches = await Student.find({ $or: conditions });
            matchedChildren.push(...dbMatches.map((s) => s._id));
          }
        } catch (dbFindErr) {
          console.warn('DB student lookup during parent login:', dbFindErr.message);
        }
      }

      matchedChildren = Array.from(new Set(matchedChildren.map(String)));

      if (matchedChildren.length > 0) {
        user.children = matchedChildren;
        // Keep store.users updated
        const stUser = store.users.find((u) => String(u._id) === userIdStr || (user.phone && u.phone === user.phone));
        if (stUser) {
          stUser.children = matchedChildren;
        }
        // Keep store.students updated
        store.students.forEach((s) => {
          if (matchedChildren.includes(String(s._id))) {
            s.parentUser = userIdStr;
          }
        });
        // Keep MongoDB updated
        if (mongoose.connection.readyState === 1) {
          try {
            const validStudentObjectIds = matchedChildren.filter((id) => mongoose.Types.ObjectId.isValid(id));
            if (mongoose.Types.ObjectId.isValid(user._id)) {
              await User.findByIdAndUpdate(user._id, { $addToSet: { children: { $each: validStudentObjectIds } } });
              await Student.updateMany({ _id: { $in: validStudentObjectIds } }, { $set: { parentUser: user._id } });
            } else {
              const mongoUser = await User.findOne({
                $or: [
                  ...(user.phone ? [{ phone: user.phone }] : []),
                  ...(user.pNo ? [{ pNo: user.pNo }] : []),
                ],
              });
              if (mongoUser && validStudentObjectIds.length > 0) {
                await User.findByIdAndUpdate(mongoUser._id, { $addToSet: { children: { $each: validStudentObjectIds } } });
                await Student.updateMany({ _id: { $in: validStudentObjectIds } }, { $set: { parentUser: mongoUser._id } });
              }
            }
          } catch (syncErr) {
            console.warn('DB sync during parent login:', syncErr.message);
          }
        }
      }
    }

    // Mark phone verified if needed
    user.isPhoneVerified = true;
    if (typeof user.save === 'function') {
      try {
        await user.save();
      } catch (e) {
        // ignore
      }
    }

    const token = generateToken(user._id, user.role, {
      name: user.name,
      phone: user.phone,
      pNo: user.pNo,
    });

    const safeUser = typeof user.toSafeObject === 'function' ? user.toSafeObject() : {
      _id: user._id,
      pNo: user.pNo,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      children: user.children || [],
      isPhoneVerified: true,
      schoolName: user.schoolName,
      village: user.village,
      district: user.district,
      organizationName: user.organizationName,
      isActive: user.isActive !== false,
    };

    if (!safeUser.children && user.children) {
      safeUser.children = user.children;
    }

    delete safeUser.aadhaarNumber;
    delete safeUser.aadhaar;
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

/**
 * @desc    Get all 8 supported platform roles
 * @route   GET /api/auth/roles
 * @access  Public
 */
export const getRoles = (req, res) => {
  const roles = [
    {
      id: 'village_head',
      name: 'Village Local Head',
      description: 'Gram Panchayat Sarpanch or local village leader coordinating school community support drives.',
    },
    {
      id: 'alumni',
      name: 'School Alumni',
      description: 'Former students giving back through learning equipment and community scholarship drives.',
    },
    {
      id: 'ngo',
      name: 'NGO / Partner',
      description: 'Non-governmental organizations and institutional sponsors supporting school infrastructure.',
    },
    {
      id: 'headmaster_admin',
      name: 'Headmaster / Admin',
      description: 'Principal and head administration of the government school with full institutional governance.',
    },
    {
      id: 'teacher',
      name: 'Teacher',
      description: 'Classroom educator managing attendance, term marks, student welfare, and early support interventions.',
    },
    {
      id: 'parent',
      name: 'Parent / Guardian',
      description: 'Parent guardian tracking child attendance, performance, and teacher support communications.',
    },
    {
      id: 'student',
      name: 'Student',
      description: 'Enrolled school student viewing personal academic scores, attendance, and welfare entitlements.',
    },
    {
      id: 'villager',
      name: 'Villager',
      description: 'Local village resident supporting school community drives and student welfare.',
    },
  ];

  return res.status(200).json({
    success: true,
    data: roles,
  });
};
