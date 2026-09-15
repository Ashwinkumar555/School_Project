import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    admissionNumber: {
      type: String,
      required: [true, 'Admission number is required'],
      unique: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    dob: {
      type: Date,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class assignment is required'],
    },
    section: {
      type: String,
      default: 'A',
    },
    // User login link for the student (optional)
    userAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Parent details
    parentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    parentName: {
      type: String,
      trim: true,
      default: '',
    },
    parentPhone: {
      type: String,
      trim: true,
      default: '',
    },
    parentOccupation: {
      type: String,
      trim: true,
      default: 'Farmer / Daily Wage',
    },
    village: {
      type: String,
      trim: true,
      default: 'Sundarpur',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    // Health & Welfare
    bloodGroup: {
      type: String,
      default: 'O+',
    },
    healthNotes: {
      type: String,
      default: 'Good health',
    },
    welfareBeneficiary: {
      type: Boolean,
      default: true,
    },
    entitlements: [
      {
        schemeName: { type: String, required: true }, // e.g. Free Uniform Set, Textbook Grant, Bicycle Scheme, Pre-Matric Scholarship
        status: { type: String, enum: ['Pending', 'Approved', 'Disbursed'], default: 'Disbursed' },
        disbursedDate: { type: Date },
        notes: { type: String, default: '' },
      },
    ],
    // Quick metric aggregates
    currentAttendanceRate: {
      type: Number,
      default: 85, // percentage
    },
    currentAcademicAverage: {
      type: Number,
      default: 65, // percentage
    },
    consecutiveAbsences: {
      type: Number,
      default: 0,
    },
    attentionLevel: {
      type: String,
      enum: ['NORMAL', 'MODERATE_ATTENTION', 'HIGH_ATTENTION'],
      default: 'NORMAL',
    },
    // Subject marks entered by teacher
    subjectMarks: [
      {
        subject: { type: String, required: true },
        marksObtained: { type: Number, required: true, default: 0 },
        maxMarks: { type: Number, default: 100 },
        grade: { type: String, default: 'B' },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup
studentSchema.index({ class: 1, rollNumber: 1 });
studentSchema.index({ parentUser: 1 });

const Student = mongoose.model('Student', studentSchema);
export default Student;
