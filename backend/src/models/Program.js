import mongoose from 'mongoose';

export const PROGRAM_TYPES = [
  'Scholarship',
  'Educational Program',
  'Workshop',
  'Training',
  'Skill Development',
];

export const PROGRAM_STATUSES = ['Active', 'Upcoming', 'Closed'];

const programSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Program or scholarship title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    type: {
      type: String,
      enum: PROGRAM_TYPES,
      default: 'Scholarship',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    eligibility: {
      type: String,
      required: [true, 'Eligibility criteria are required'],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Application or registration deadline is required'],
    },
    benefits: {
      type: String,
      required: [true, 'Benefits / grant details are required'],
      trim: true,
    },
    contactInfo: {
      type: String,
      required: [true, 'Contact information is required'],
      trim: true,
    },
    targetGrades: {
      type: String,
      default: 'Class 6 - 12',
      trim: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: PROGRAM_STATUSES,
      default: 'Active',
    },
    applicantsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    village: {
      type: String,
      default: 'All Villages / Sundarpur Scope',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

programSchema.index({ status: 1, type: 1 });
programSchema.index({ postedBy: 1 });

const Program = mongoose.model('Program', programSchema);
export default Program;
