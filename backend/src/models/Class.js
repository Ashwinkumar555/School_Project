import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required (e.g. Class 8-A)'],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Grade level is required (e.g. 8)'],
      trim: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required (e.g. A)'],
      trim: true,
      uppercase: true,
      default: 'A',
    },
    academicYear: {
      type: String,
      default: '2025-2026',
    },
    roomNumber: {
      type: String,
      default: 'Room 101',
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    subjects: [
      {
        name: { type: String, required: true },
        code: { type: String, default: '' },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    studentCount: {
      type: Number,
      default: 0,
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

const Class = mongoose.model('Class', classSchema);
export default Class;
