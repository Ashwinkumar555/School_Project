import mongoose from 'mongoose';
import store from '../utils/dataStore.js';
import Announcement from '../models/Announcement.js';

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * @desc    Get announcements filtered for the user
 * @route   GET /api/announcements
 * @access  Public / Authenticated
 */
export const getAnnouncements = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let list = [];

    if (isDbConnected()) {
      try {
        const filter = {};
        if (category && category !== 'ALL') {
          filter.category = category;
        }
        if (search) {
          filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
          ];
        }
        list = await Announcement.find(filter).sort({ isPinned: -1, createdAt: -1 }).lean();
      } catch (e) {
        console.warn('MongoDB announcement fetch:', e.message);
      }
    }

    if (list.length === 0) {
      list = [...store.announcements];
      if (category && category !== 'ALL') {
        list = list.filter((a) => a.category?.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        const s = search.toLowerCase();
        list = list.filter((a) => a.title?.toLowerCase().includes(s) || a.content?.toLowerCase().includes(s));
      }
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
 * @desc    Create a new notice/announcement
 * @route   POST /api/announcements
 * @access  Private (Admin, Teacher, Village Head)
 */
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, category, targetAudience, priority, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    const newNotice = {
      _id: `ann-${Date.now()}`,
      title,
      content,
      category: category || 'General',
      targetAudience: targetAudience || 'All',
      priority: priority || 'Normal',
      authorName: req.user?.name || 'School Administration',
      isPinned: !!isPinned,
      createdAt: new Date(),
    };

    store.announcements.unshift(newNotice);

    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      data: newNotice,
    });
  } catch (error) {
    next(error);
  }
};
