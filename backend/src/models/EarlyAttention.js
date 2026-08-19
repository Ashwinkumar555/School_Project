import mongoose from 'mongoose';

const interventionSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      enum: [
        'Contact Parent / Phone Call',
        'In-Person Parent Teacher Meeting',
        'Remedial Academic Coaching',
        'Attendance Daily Monitoring',
        'Mid-Day Meal & Nutrition Check',
        'Counseling Session',
        'Welfare Scheme Followup',
        'Other Support',
      ],
    },
    notes: {
      type: String,
      required: [true, 'Intervention notes are required'],
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved'],
      default: 'Open',
    },
    parentResponse: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const earlyAttentionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    academicYear: {
      type: String,
      default: '2025-2026',
    },
    attendanceRate: {
      type: Number,
      default: 100,
    },
    academicAverage: {
      type: Number,
      default: 75,
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
    flaggedReasons: [
      {
        type: String,
      },
    ],
    recommendedActions: [
      {
        type: String,
      },
    ],
    interventions: [interventionSchema],
    lastEvaluatedAt: {
      type: Date,
      default: Date.now,
    },
    isMonitored: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Transparent rule-based evaluator (Pure Rule-Based Logic - NO AI Claims)
 */
earlyAttentionSchema.methods.evaluateRules = function () {
  const reasons = [];
  const actions = [];
  let isHigh = false;
  let isModerate = false;

  // Rule 1: Attendance checks
  if (this.attendanceRate < 60) {
    reasons.push(`Critical Attendance Deficit (${this.attendanceRate}%, below 60% threshold)`);
    actions.push('Contact parent immediately');
    actions.push('Attendance daily monitoring');
    isHigh = true;
  } else if (this.attendanceRate < 75) {
    reasons.push(`Low Attendance Rate (${this.attendanceRate}%, below 75% standard)`);
    actions.push('Attendance monitoring');
    isModerate = true;
  }

  // Rule 2: Consecutive Absences
  if (this.consecutiveAbsences >= 7) {
    reasons.push(`Prolonged Unnotified Absence (${this.consecutiveAbsences} consecutive school days)`);
    actions.push('Urgent home visit / Parent contact');
    isHigh = true;
  } else if (this.consecutiveAbsences >= 3) {
    reasons.push(`Consecutive Absence Pattern (${this.consecutiveAbsences} consecutive days)`);
    actions.push('Followup call with parent');
    isModerate = true;
  }

  // Rule 3: Academic performance
  if (this.academicAverage < 40) {
    reasons.push(`Academic Support Required (Average marks ${this.academicAverage}%, below 40%)`);
    actions.push('Teacher remedial tutoring');
    actions.push('Academic counseling');
    if (this.attendanceRate < 70) {
      isHigh = true;
    } else {
      isModerate = true;
    }
  } else if (this.academicAverage < 50) {
    reasons.push(`Marginal Academic Performance (Average marks ${this.academicAverage}%)`);
    actions.push('Provide extra study materials & subject mentoring');
    isModerate = true;
  }

  // Assign calculated status
  if (isHigh) {
    this.attentionLevel = 'HIGH_ATTENTION';
    if (!actions.includes('Teacher-Parent in-person meeting')) {
      actions.unshift('Teacher-Parent in-person meeting');
    }
  } else if (isModerate) {
    this.attentionLevel = 'MODERATE_ATTENTION';
  } else {
    this.attentionLevel = 'NORMAL';
    reasons.push('Student records meet normal academic & attendance criteria');
    actions.push('Continue routine observation & encouragement');
  }

  this.flaggedReasons = reasons;
  this.recommendedActions = [...new Set(actions)];
  this.lastEvaluatedAt = new Date();
  return this.attentionLevel;
};

const EarlyAttention = mongoose.model('EarlyAttention', earlyAttentionSchema);
export default EarlyAttention;
