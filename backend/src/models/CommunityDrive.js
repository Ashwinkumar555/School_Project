import mongoose from 'mongoose';

const communityDriveSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Drive title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Drive description is required'],
    },
    schoolNeed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolNeed',
      required: [true, 'Linked school need is required'],
    },
    organizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizerName: {
      type: String,
      default: 'Village Education Committee / Panchayat Head',
    },
    village: {
      type: String,
      default: 'Sundarpur',
    },
    targetQuantity: {
      type: Number,
      required: true,
    },
    fulfilledQuantity: {
      type: Number,
      default: 0,
    },
    pledgedQuantity: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: 'Units',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Paused'],
      default: 'Active',
    },
    impactMessage: {
      type: String,
      default: 'Empowering government school children with digital resources and learning aids.',
    },
    contributionsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const CommunityDrive = mongoose.model('CommunityDrive', communityDriveSchema);
export default CommunityDrive;
