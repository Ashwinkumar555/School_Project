import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema(
  {
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityDrive',
      required: [true, 'Linked community drive is required'],
    },
    schoolNeed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolNeed',
      required: [true, 'Linked school need is required'],
    },
    contributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contributorName: {
      type: String,
      required: true,
      trim: true,
    },
    contributorEmail: {
      type: String,
      trim: true,
    },
    contributorPhone: {
      type: String,
      trim: true,
      default: '',
    },
    contributorRole: {
      type: String,
      enum: ['community_member', 'parent', 'alumni', 'ngo', 'village_head', 'student_parent', 'community_volunteer'],
      default: 'community_member',
    },
    contributionType: {
      type: String,
      required: true,
      enum: ['Donate Item', 'Sponsor Purchase', 'Volunteer Time', 'Other Support'],
      default: 'Donate Item',
    },
    itemDetails: {
      type: String,
      required: [true, 'Item / support details are required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    estimatedValue: {
      type: Number,
      default: 0,
    },
    volunteerSkills: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    // Two-step verification state machine: PENDING -> APPROVED/REJECTED -> RECEIVED
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'RECEIVED'],
      default: 'PENDING',
    },
    adminReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
      adminRemarks: { type: String, default: '' },
    },
    physicalVerification: {
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      receivedAt: { type: Date },
      assetTag: { type: String, default: '' },
      condition: { type: String, enum: ['New', 'Good', 'Fair', 'Needs Repair'], default: 'Good' },
      inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
      verificationNotes: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
contributionSchema.index({ drive: 1, status: 1 });
contributionSchema.index({ contributor: 1 });
contributionSchema.index({ schoolNeed: 1 });

const Contribution = mongoose.model('Contribution', contributionSchema);
export default Contribution;
