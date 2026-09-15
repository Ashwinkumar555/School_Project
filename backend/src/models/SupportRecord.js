import mongoose from 'mongoose';

export const SUPPORT_RECORD_TYPES = [
  'Books',
  'Uniforms',
  'School bags',
  'Laptops/Tablets',
  'Scholarships',
  'Financial assistance',
  'Educational materials',
  'Other Support',
];

export const SUPPORT_RECORD_STATUSES = ['Completed', 'Ongoing', 'Scheduled'];

const supportRecordSchema = new mongoose.Schema(
  {
    ngo: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: [true, 'NGO reference is required'],
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientType: {
      type: String,
      enum: ['Student', 'School'],
      default: 'Student',
      required: true,
    },
    beneficiaryName: {
      type: String,
      required: [true, 'Beneficiary student or school name is required'],
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Student',
    },
    schoolName: {
      type: String,
      default: 'Govt Higher Secondary School',
      trim: true,
    },
    village: {
      type: String,
      default: 'Sundarpur',
      trim: true,
    },
    supportType: {
      type: String,
      enum: SUPPORT_RECORD_TYPES,
      required: [true, 'Support type is required'],
    },
    itemDetails: {
      type: String,
      required: [true, 'Item or support details are required'],
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Amount cannot be negative'],
    },
    dateProvided: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: SUPPORT_RECORD_STATUSES,
      default: 'Completed',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    linkedSupportRequest: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'SupportRequest',
    },
  },
  {
    timestamps: true,
  }
);

supportRecordSchema.index({ ngo: 1, status: 1 });
supportRecordSchema.index({ supportType: 1 });
supportRecordSchema.index({ dateProvided: -1 });

const SupportRecord = mongoose.model('SupportRecord', supportRecordSchema);
export default SupportRecord;
