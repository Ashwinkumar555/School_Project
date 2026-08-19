import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = [
  'headmaster_admin',
  'teacher',
  'student',
  'parent',
  'village_head',
  'community_member',
  'alumni',
  'ngo',
  // Backward compatibility aliases
  'welfare_officer',
  'student_parent',
  'community_volunteer',
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
      default: 'Password123!',
    },
    aadhaarNumber: {
      type: String,
      trim: true,
      default: '',
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: '{VALUE} is not a valid EduConnect role',
      },
      default: 'community_member',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    isPhoneVerified: {
      type: Boolean,
      default: true,
    },
    schoolName: {
      type: String,
      trim: true,
      default: 'Govt Model Higher Secondary School',
    },
    village: {
      type: String,
      trim: true,
      default: 'Sundarpur',
    },
    district: {
      type: String,
      trim: true,
      default: 'Central District',
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    organizationName: {
      type: String,
      trim: true,
      default: '',
    },
    // Reference links
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password instance method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe user object sanitization
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.aadhaarNumber;
  delete obj.aadhaar;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
