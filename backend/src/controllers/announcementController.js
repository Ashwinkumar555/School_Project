import store from '../utils/dataStore.js';

/**
 * @desc    Get announcements filtered for the user
 * @route   GET /api/announcements
 * @access  Public / Authenticated
 */
export const getAnnouncements = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      count: store.announcements.length,
      data: store.announcements,
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
