import store from '../utils/dataStore.js';

/**
 * @desc    Get all classes
 * @route   GET /api/classes
 * @access  Private
 */
export const getClasses = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      count: store.classes.length,
      data: store.classes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single class details with students
 * @route   GET /api/classes/:id
 * @access  Private
 */
export const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cls = store.classes.find((c) => c._id.toString() === id.toString()) || store.classes[0];
    const students = store.students.filter(
      (s) => s.class?._id?.toString() === cls._id.toString() || s.class?.name === cls.name
    );

    return res.status(200).json({
      success: true,
      data: {
        ...cls,
        students,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new class
 * @route   POST /api/classes
 * @access  Private (Admin)
 */
export const createClass = async (req, res, next) => {
  try {
    const { name, grade, section, academicYear, roomNumber } = req.body;

    const newClass = {
      _id: `class-${Date.now()}`,
      name: name || `Class ${grade}-${section || 'A'}`,
      grade: grade || '8',
      section: section || 'A',
      academicYear: academicYear || '2025-2026',
      roomNumber: roomNumber || 'Room 101',
      studentCount: 0,
      isActive: true,
    };

    store.classes.push(newClass);

    return res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update class
 * @route   PUT /api/classes/:id
 * @access  Private (Admin)
 */
export const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cls = store.classes.find((c) => c._id.toString() === id.toString());
    if (cls) {
      Object.assign(cls, req.body);
      return res.status(200).json({ success: true, data: cls });
    }
    return res.status(404).json({ success: false, message: 'Class not found' });
  } catch (error) {
    next(error);
  }
};
