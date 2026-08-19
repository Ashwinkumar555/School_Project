import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'IT & Computers',
        'Laboratory',
        'Library & Books',
        'Sports & Physical Education',
        'Furniture & Classroom',
        'Learning Kits & Stationery',
      ],
      default: 'IT & Computers',
    },
    location: {
      type: String,
      required: [true, 'Location within school is required (e.g. Computer Lab, Room 4)'],
      trim: true,
      default: 'Computer Lab',
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    availableQuantity: {
      type: Number,
      default: 1,
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Needs Repair'],
      default: 'Good',
    },
    source: {
      type: String,
      enum: ['Government Supply', 'Community Donation', 'School Purchase', 'NGO Grant'],
      default: 'Community Donation',
    },
    assetTag: {
      type: String,
      trim: true,
      default: '',
    },
    donorName: {
      type: String,
      trim: true,
      default: '',
    },
    linkedContribution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contribution',
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
