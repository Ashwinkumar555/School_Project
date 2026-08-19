import mongoose from 'mongoose';

const subjectMarkSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    grade: {
      type: String,
      default: 'B',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const academicRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    term: {
      type: String,
      required: [true, 'Term name is required (e.g. Mid Term, Quarterly, Annual)'],
      enum: ['Unit Test 1', 'Quarterly Exam', 'Half Yearly Exam', 'Unit Test 2', 'Annual Exam'],
      default: 'Quarterly Exam',
    },
    academicYear: {
      type: String,
      default: '2025-2026',
    },
    examDate: {
      type: Date,
      default: Date.now,
    },
    marks: [subjectMarkSchema],
    totalMarksObtained: {
      type: Number,
      default: 0,
    },
    totalMaxMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    overallGrade: {
      type: String,
      default: 'B',
    },
    passed: {
      type: Boolean,
      default: true,
    },
    teacherRemarks: {
      type: String,
      default: 'Satisfactory academic progress.',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save calculate totals and grade
academicRecordSchema.pre('save', function (next) {
  if (this.marks && this.marks.length > 0) {
    this.totalMarksObtained = this.marks.reduce((acc, cur) => acc + (cur.marksObtained || 0), 0);
    this.totalMaxMarks = this.marks.reduce((acc, cur) => acc + (cur.maxMarks || 100), 0);
    this.percentage = Math.round((this.totalMarksObtained / (this.totalMaxMarks || 1)) * 100);

    if (this.percentage >= 90) this.overallGrade = 'A+';
    else if (this.percentage >= 75) this.overallGrade = 'A';
    else if (this.percentage >= 60) this.overallGrade = 'B';
    else if (this.percentage >= 50) this.overallGrade = 'C';
    else if (this.percentage >= 35) this.overallGrade = 'D';
    else this.overallGrade = 'F';

    this.passed = this.percentage >= 35;
  }
  next();
});

const AcademicRecord = mongoose.model('AcademicRecord', academicRecordSchema);
export default AcademicRecord;
