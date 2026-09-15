import mongoose from 'mongoose';

export const COMMUNICATION_TYPES = [
  'Academic Query',
  'Attendance Query',
  'Meeting Request',
  'General Message',
];

export const COMMUNICATION_STATUSES = [
  'Pending',
  'Replied',
  'Meeting Scheduled',
  'Closed',
];

const communicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Student',
      required: [true, 'Linked student reference is required'],
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentRoll: {
      type: String,
      default: '',
      trim: true,
    },
    studentClass: {
      type: String,
      default: 'Class 8-A',
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: [true, 'Parent user reference is required'],
    },
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    parentPhone: {
      type: String,
      default: '',
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
    },
    teacherName: {
      type: String,
      default: 'Class Teacher',
      trim: true,
    },
    type: {
      type: String,
      enum: COMMUNICATION_TYPES,
      default: 'Academic Query',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Message subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message body is required'],
      trim: true,
    },
    requestedMeetingDate: {
      type: Date,
    },
    preferredTime: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: COMMUNICATION_STATUSES,
      default: 'Pending',
      required: true,
    },
    reply: {
      type: String,
      default: '',
      trim: true,
    },
    repliedBy: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
    },
    repliedByName: {
      type: String,
      default: '',
      trim: true,
    },
    repliedAt: {
      type: Date,
    },
    meetingDetails: {
      date: { type: Date },
      time: { type: String, default: '' },
      location: { type: String, default: 'School Campus / Staff Room' },
      notes: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

communicationSchema.index({ student: 1, parent: 1 });
communicationSchema.index({ teacher: 1, status: 1 });

const Communication = mongoose.model('Communication', communicationSchema);
export default Communication;
