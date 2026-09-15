import mongoose from 'mongoose';
import SupportRecord, { SUPPORT_RECORD_TYPES, SUPPORT_RECORD_STATUSES } from '../models/SupportRecord.js';
import SupportRequest from '../models/SupportRequest.js';
import Program from '../models/Program.js';
import store from '../utils/dataStore.js';

// In-memory fallback
store.supportRecords = store.supportRecords || [];

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * @desc    Get support history records for logged in NGO
 * @route   GET /api/support-records
 * @access  Private (NGO / Partner, Head Master, Admin)
 */
export const getSupportRecords = async (req, res) => {
  try {
    const { supportType, status, search, recipientType } = req.query;
    const filter = {};

    if (req.user.role === 'ngo') {
      filter.ngo = req.user._id;
    }

    if (supportType && supportType !== 'ALL') {
      filter.supportType = supportType;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (recipientType && recipientType !== 'ALL') {
      filter.recipientType = recipientType;
    }

    if (search) {
      filter.$or = [
        { beneficiaryName: { $regex: search, $options: 'i' } },
        { itemDetails: { $regex: search, $options: 'i' } },
        { schoolName: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    let records = [];
    if (isDbConnected()) {
      records = await SupportRecord.find(filter)
        .populate('ngo', 'name organizationName email phone')
        .populate('studentId', 'name rollNumber class section')
        .sort({ dateProvided: -1, createdAt: -1 });
    } else {
      records = store.supportRecords.filter((r) => {
        if (req.user.role === 'ngo' && String(r.ngo) !== String(req.user._id)) return false;
        if (filter.supportType && r.supportType !== filter.supportType) return false;
        if (filter.status && r.status !== filter.status) return false;
        if (filter.recipientType && r.recipientType !== filter.recipientType) return false;
        if (search) {
          const s = search.toLowerCase();
          return (
            r.beneficiaryName?.toLowerCase().includes(s) ||
            r.itemDetails?.toLowerCase().includes(s) ||
            r.schoolName?.toLowerCase().includes(s)
          );
        }
        return true;
      });
    }

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('getSupportRecords error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve support records',
      error: error.message,
    });
  }
};

/**
 * @desc    Record educational support provided
 * @route   POST /api/support-records
 * @access  Private (NGO / Partner, Head Master, Admin)
 */
export const createSupportRecord = async (req, res) => {
  try {
    const {
      recipientType = 'Student',
      beneficiaryName,
      studentId,
      schoolName = 'Govt Higher Secondary School',
      village = 'Sundarpur',
      supportType,
      itemDetails,
      quantity = 1,
      amount = 0,
      dateProvided = new Date(),
      status = 'Completed',
      notes = '',
    } = req.body;

    if (!beneficiaryName || !supportType || !itemDetails) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary Name, Support Type, and Item Details are required',
      });
    }

    if (!SUPPORT_RECORD_TYPES.includes(supportType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid support type. Allowed types: ${SUPPORT_RECORD_TYPES.join(', ')}`,
      });
    }

    const partnerName = req.user.organizationName || req.user.name || 'Partner NGO';

    const newRecordData = {
      ngo: req.user._id,
      organizationName: partnerName,
      recipientType,
      beneficiaryName: beneficiaryName.trim(),
      studentId: studentId || null,
      schoolName: schoolName.trim(),
      village: village.trim(),
      supportType,
      itemDetails: itemDetails.trim(),
      quantity: Math.max(1, Number(quantity) || 1),
      amount: Math.max(0, Number(amount) || 0),
      dateProvided: new Date(dateProvided),
      status: SUPPORT_RECORD_STATUSES.includes(status) ? status : 'Completed',
      notes: notes.trim(),
    };

    let created = null;
    if (isDbConnected()) {
      created = await SupportRecord.create(newRecordData);
    } else {
      created = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...newRecordData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.supportRecords.unshift(created);
    }

    return res.status(201).json({
      success: true,
      message: 'Educational support recorded successfully!',
      data: created,
    });
  } catch (error) {
    console.error('createSupportRecord error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to record educational support',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a support record
 * @route   PUT /api/support-records/:id
 * @access  Private (Owner NGO or Admin)
 */
export const updateSupportRecord = async (req, res) => {
  try {
    const { id } = req.params;
    let record = null;

    if (isDbConnected()) {
      record = await SupportRecord.findById(id);
    } else {
      record = store.supportRecords.find((r) => String(r._id) === String(id));
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Support record not found',
      });
    }

    const isOwner = String(record.ngo?._id || record.ngo) === String(req.user._id);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'headmaster_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own support records.',
      });
    }

    const {
      beneficiaryName,
      schoolName,
      village,
      supportType,
      itemDetails,
      quantity,
      amount,
      dateProvided,
      status,
      notes,
    } = req.body;

    if (beneficiaryName) record.beneficiaryName = beneficiaryName.trim();
    if (schoolName) record.schoolName = schoolName.trim();
    if (village) record.village = village.trim();
    if (supportType && SUPPORT_RECORD_TYPES.includes(supportType)) record.supportType = supportType;
    if (itemDetails) record.itemDetails = itemDetails.trim();
    if (quantity) record.quantity = Math.max(1, Number(quantity) || 1);
    if (typeof amount === 'number') record.amount = Math.max(0, amount);
    if (dateProvided) record.dateProvided = new Date(dateProvided);
    if (status && SUPPORT_RECORD_STATUSES.includes(status)) record.status = status;
    if (notes !== undefined) record.notes = notes.trim();

    if (isDbConnected()) {
      await record.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Support record updated successfully',
      data: record,
    });
  } catch (error) {
    console.error('updateSupportRecord error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update support record',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a support record
 * @route   DELETE /api/support-records/:id
 * @access  Private (Owner NGO or Admin)
 */
export const deleteSupportRecord = async (req, res) => {
  try {
    const { id } = req.params;
    let record = null;

    if (isDbConnected()) {
      record = await SupportRecord.findById(id);
    } else {
      record = store.supportRecords.find((r) => String(r._id) === String(id));
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Support record not found',
      });
    }

    const isOwner = String(record.ngo?._id || record.ngo) === String(req.user._id);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'headmaster_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own support records.',
      });
    }

    if (isDbConnected()) {
      await SupportRecord.findByIdAndDelete(id);
    } else {
      store.supportRecords = store.supportRecords.filter((r) => String(r._id) !== String(id));
    }

    return res.status(200).json({
      success: true,
      message: 'Support record deleted successfully',
    });
  } catch (error) {
    console.error('deleteSupportRecord error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete support record',
      error: error.message,
    });
  }
};

/**
 * @desc    Get aggregate impact & reports summary for NGO
 * @route   GET /api/support-records/impact
 * @access  Private (NGO, Head Master, Admin)
 */
export const getNgoImpactStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const orgName = req.user.organizationName || req.user.name || '';

    let supportRequestsList = [];
    let supportRecordsList = [];
    let programsList = [];

    if (isDbConnected()) {
      const ngoReqFilter = {
        $or: [
          { targetNgo: userId },
          { 'ngoSupport.acceptedBy': userId },
          { status: { $in: ['Forwarded to NGO/Partner', 'Accepted', 'Ongoing', 'Completed'] } },
        ],
      };
      supportRequestsList = await SupportRequest.find(ngoReqFilter);
      supportRecordsList = await SupportRecord.find(req.user.role === 'ngo' ? { ngo: userId } : {});
      programsList = await Program.find(req.user.role === 'ngo' ? { postedBy: userId } : {});
    } else {
      supportRequestsList = store.supportRequests || [];
      supportRecordsList = store.supportRecords || [];
      programsList = store.programs || [];
    }

    // 1. Support Request Metrics
    const totalRequestsReceived = supportRequestsList.length;
    const requestsAccepted = supportRequestsList.filter((r) => r.status === 'Accepted' || r.status === 'Ongoing').length;
    const requestsCompleted = supportRequestsList.filter((r) => r.status === 'Completed').length;
    const requestsPendingAction = supportRequestsList.filter((r) => r.status === 'Forwarded to NGO/Partner').length;

    // 2. Beneficiaries & Reach
    const uniqueStudentsSet = new Set();
    const uniqueSchoolsSet = new Set();
    const uniqueVillagesSet = new Set();

    let totalDirectGrantValue = 0;
    let totalScholarshipsCount = 0;

    // From completed requests
    supportRequestsList.forEach((r) => {
      if (r.status === 'Completed' || r.status === 'Accepted' || r.status === 'Ongoing') {
        if (r.studentName) uniqueStudentsSet.add(r.studentName.toLowerCase().trim());
        if (r.schoolName) uniqueSchoolsSet.add(r.schoolName.trim());
        if (r.village) uniqueVillagesSet.add(r.village.trim());
        if (r.category?.includes('Scholarship') || r.category?.includes('Financial')) {
          totalScholarshipsCount++;
        }
        totalDirectGrantValue += Number(r.estimatedAmount) || 0;
      }
    });

    // From direct support records
    supportRecordsList.forEach((sr) => {
      if (sr.beneficiaryName && sr.recipientType === 'Student') {
        uniqueStudentsSet.add(sr.beneficiaryName.toLowerCase().trim());
      }
      if (sr.schoolName) uniqueSchoolsSet.add(sr.schoolName.trim());
      if (sr.village) uniqueVillagesSet.add(sr.village.trim());
      if (sr.supportType === 'Scholarships' || sr.supportType === 'Financial assistance') {
        totalScholarshipsCount += sr.quantity || 1;
      }
      totalDirectGrantValue += Number(sr.amount) || 0;
    });

    // Default base metrics if newly registered
    const studentsSupportedCount = Math.max(uniqueStudentsSet.size, requestsCompleted > 0 ? requestsCompleted : 0);
    const schoolsSupportedCount = Math.max(uniqueSchoolsSet.size, 1);
    const villagesSupportedCount = Math.max(uniqueVillagesSet.size, 1);

    // 3. Category Breakdown (combine requests + records)
    const categoryCounts = {
      'Books & Stationery': 0,
      'School Uniforms': 0,
      'School Bags': 0,
      'Scholarships & Grants': totalScholarshipsCount,
      'Digital Devices & Laptops': 0,
      'Educational Materials': 0,
    };

    supportRequestsList.forEach((r) => {
      const cat = r.category || '';
      if (cat.includes('Books') || cat.includes('Notebook')) categoryCounts['Books & Stationery']++;
      else if (cat.includes('Uniform')) categoryCounts['School Uniforms']++;
      else if (cat.includes('Bag')) categoryCounts['School Bags']++;
      else if (cat.includes('Tablet') || cat.includes('Laptop') || cat.includes('Digital')) categoryCounts['Digital Devices & Laptops']++;
      else if (cat.includes('Scholarship') || cat.includes('Financial')) {}
      else categoryCounts['Educational Materials']++;
    });

    supportRecordsList.forEach((sr) => {
      const t = sr.supportType || '';
      if (t === 'Books') categoryCounts['Books & Stationery'] += sr.quantity || 1;
      else if (t === 'Uniforms') categoryCounts['School Uniforms'] += sr.quantity || 1;
      else if (t === 'School bags') categoryCounts['School Bags'] += sr.quantity || 1;
      else if (t === 'Laptops/Tablets') categoryCounts['Digital Devices & Laptops'] += sr.quantity || 1;
      else if (t === 'Scholarships' || t === 'Financial assistance') {}
      else categoryCounts['Educational Materials'] += sr.quantity || 1;
    });

    // 4. Programs & Scholarships summary
    const totalProgramsPublished = programsList.length;
    const activeProgramsCount = programsList.filter((p) => p.status === 'Active').length;
    const categoryBreakdownArray = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRequestsReceived,
          requestsAccepted,
          requestsCompleted,
          requestsPendingAction,
          studentsSupported: studentsSupportedCount,
          totalScholarshipsProvided: totalScholarshipsCount,
          totalEstimatedGrantValue: totalDirectGrantValue,
          schoolsSupported: schoolsSupportedCount,
          villagesSupported: villagesSupportedCount,
          totalProgramsPublished,
          activeProgramsCount,
          totalDirectRecordsCount: supportRecordsList.length,
        },
        totalRequestsReceived,
        requestsAccepted,
        completedRequests: requestsCompleted,
        totalStudentsSupported: studentsSupportedCount,
        scholarshipsFunded: totalScholarshipsCount,
        totalAidValue: totalDirectGrantValue,
        schoolsSupported: schoolsSupportedCount,
        villagesSupported: villagesSupportedCount,
        categoryBreakdown: categoryBreakdownArray,
        categoryCounts,
        recentDeliveries: supportRecordsList.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('getNgoImpactStats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate impact statistics',
      error: error.message,
    });
  }
};
