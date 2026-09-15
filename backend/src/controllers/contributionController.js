import Contribution from '../models/Contribution.js';
import CommunityDrive from '../models/CommunityDrive.js';
import SchoolNeed from '../models/SchoolNeed.js';
import Inventory from '../models/Inventory.js';
import store from '../utils/dataStore.js';
import mongoose from 'mongoose';

/**
 * @desc    Submit a community pledge / contribution ("I CAN HELP")
 * @route   POST /api/contributions
 * @access  Private
 */
export const submitContribution = async (req, res, next) => {
  try {
    const { driveId, contributionType, itemDetails, quantity, estimatedValue, volunteerSkills, notes } = req.body;

    if (!driveId || !itemDetails) {
      return res.status(400).json({
        success: false,
        message: 'Drive ID and item details are required',
      });
    }

    const drive = store.communityDrives.find((d) => d._id.toString() === driveId.toString()) || store.communityDrives[0];
    const qty = Number(quantity) || 1;

    const newContrib = {
      _id: `contrib-${Date.now()}`,
      drive: drive,
      schoolNeed: drive?.schoolNeed || store.schoolNeeds[0],
      contributor: req.user._id,
      contributorName: req.user.name,
      contributorEmail: req.user.email,
      contributorPhone: req.user.phone || '',
      contributorRole: req.user.role,
      contributionType: contributionType || 'Donate Item',
      itemDetails,
      quantity: qty,
      estimatedValue: estimatedValue ? Number(estimatedValue) : 0,
      volunteerSkills: volunteerSkills || '',
      notes: notes || '',
      status: 'PENDING', // Step 1: PENDING
      createdAt: new Date(),
    };

    if (drive) {
      drive.contributionsCount = (drive.contributionsCount || 0) + 1;
      drive.pledgedQuantity = (drive.pledgedQuantity || 0) + qty;
    }

    store.contributions.unshift(newContrib);

    return res.status(201).json({
      success: true,
      message: 'Thank you for your pledge! Your contribution is currently PENDING school administration review.',
      data: newContrib,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of contributions
 * @route   GET /api/contributions
 * @access  Private
 */
export const getContributions = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    let list = store.contributions;

    if (['villager', 'community_member', 'alumni', 'parent', 'student_parent', 'community_volunteer'].includes(userRole)) {
      list = list.filter((c) => c.contributor?.toString() === userId.toString() || c.contributor?._id?.toString() === userId.toString());
    }

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Review a contribution pledge (APPROVE or REJECT) by School Admin
 * @route   PUT /api/contributions/:id/review
 * @access  Private (Admin)
 */
export const reviewContribution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, adminRemarks } = req.body;

    if (!action || !['APPROVE', 'REJECT'].includes(action.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either APPROVE or REJECT',
      });
    }

    const contrib = store.contributions.find((c) => c._id.toString() === id.toString());
    if (!contrib) {
      return res.status(404).json({ success: false, message: 'Contribution not found' });
    }

    const newStatus = action.toUpperCase() === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    contrib.status = newStatus;
    contrib.adminReview = {
      reviewedAt: new Date(),
      adminRemarks: adminRemarks || `Pledge ${newStatus.toLowerCase()} by administration.`,
    };

    return res.status(200).json({
      success: true,
      message: `Contribution status updated to ${newStatus}. Note: Approved does not mean received until physical item is verified.`,
      data: contrib,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Physical Verification: Mark contribution as RECEIVED
 *          Updates Inventory, School Need received quantity, and Community Drive progress
 * @route   POST /api/contributions/:id/mark-received
 * @access  Private (Admin)
 */
export const markAsReceived = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assetTag, condition, location, verificationNotes } = req.body;

    const contrib = store.contributions.find((c) => c._id.toString() === id.toString());
    if (!contrib) {
      return res.status(404).json({ success: false, message: 'Contribution record not found' });
    }

    if (contrib.status === 'RECEIVED') {
      return res.status(400).json({
        success: false,
        message: 'This contribution has already been marked as physically received and registered in inventory.',
      });
    }

    const receivedQty = contrib.quantity || 1;
    const generatedAssetTag = assetTag || `EDU-DON-${Date.now().toString().slice(-4)}`;

    // 1. Create Physical Asset in Inventory
    const inventoryItem = {
      _id: `inv-${Date.now()}`,
      itemName: contrib.itemDetails,
      category: contrib.schoolNeed?.category || 'IT & Computers',
      location: location || contrib.schoolNeed?.targetDepartment || 'Computer Lab',
      totalQuantity: receivedQty,
      availableQuantity: receivedQty,
      condition: condition || 'New',
      source: 'Community Donation',
      assetTag: generatedAssetTag,
      donorName: contrib.contributorName,
      linkedContribution: contrib._id,
      notes: verificationNotes || 'Physical asset verified and tested.',
      createdAt: new Date(),
    };
    store.inventory.unshift(inventoryItem);

    // 2. Update Contribution Status to RECEIVED
    contrib.status = 'RECEIVED';
    contrib.physicalVerification = {
      receivedAt: new Date(),
      assetTag: generatedAssetTag,
      condition: condition || 'New',
      inventoryItemId: inventoryItem._id,
      verificationNotes: verificationNotes || 'Physical asset verified and tested.',
    };

    // 3. Update School Need Received and Remaining Quantities
    const needId = contrib.schoolNeed?._id?.toString() || contrib.schoolNeed?.toString();
    const schoolNeed = store.schoolNeeds.find((n) => n._id.toString() === needId);
    if (schoolNeed) {
      schoolNeed.receivedQuantity = (schoolNeed.receivedQuantity || 0) + receivedQty;
      schoolNeed.remainingQuantity = Math.max(0, schoolNeed.requiredQuantity - schoolNeed.receivedQuantity);
      if (schoolNeed.receivedQuantity >= schoolNeed.requiredQuantity) {
        schoolNeed.status = 'Completed';
      } else {
        schoolNeed.status = 'Partially Fulfilled';
      }
    }

    // 4. Update Community Drive Fulfilled Quantity
    const driveId = contrib.drive?._id?.toString() || contrib.drive?.toString();
    const drive = store.communityDrives.find((d) => d._id.toString() === driveId);
    if (drive) {
      drive.fulfilledQuantity = (drive.fulfilledQuantity || 0) + receivedQty;
      if (drive.fulfilledQuantity >= drive.targetQuantity) {
        drive.status = 'Completed';
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Physical item verified! Inventory updated, school need counters updated, and drive progress refreshed.',
      data: {
        contribution: contrib,
        inventoryItem,
        updatedNeed: schoolNeed,
        updatedDrive: drive,
      },
    });
  } catch (error) {
    next(error);
  }
};
