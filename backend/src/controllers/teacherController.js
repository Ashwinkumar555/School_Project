import store from '../utils/dataStore.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import mongoose from 'mongoose';

/**
 * @desc    Get all teachers with class and subject assignments
 * @route   GET /api/teachers
 * @access  Private (Headmaster, Admin, Teacher)
 */
export const getTeachers = async (req, res, next) => {
  try {
    let teachersList = [];
    let classesList = [];

    // Query MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const dbTeachers = await User.find({ role: 'teacher' }).select('-password -aadhaarNumber').lean();
        const dbClasses = await Class.find().populate('classTeacher', 'name phone email').populate('subjects.teacher', 'name phone email').lean();

        classesList = dbClasses || [];
        if (dbTeachers && dbTeachers.length > 0) {
          teachersList = dbTeachers.map((t) => {
            const tId = t._id.toString();

            // Find classes where this teacher is classTeacher
            const classTeacherOf = classesList.find((c) => {
              const ctId = c.classTeacher?._id?.toString() || c.classTeacher?.toString();
              return ctId === tId;
            });

            // Find subjects assigned to this teacher across all classes
            const assignedSubjects = [];
            classesList.forEach((c) => {
              if (c.subjects && Array.isArray(c.subjects)) {
                c.subjects.forEach((sub) => {
                  const subTeacherId = sub.teacher?._id?.toString() || sub.teacher?.toString();
                  if (subTeacherId === tId) {
                    assignedSubjects.push({
                      className: c.name,
                      classId: c._id,
                      subjectName: sub.name,
                      code: sub.code,
                    });
                  }
                });
              }
            });

            return {
              ...t,
              classTeacherOf: classTeacherOf ? { _id: classTeacherOf._id, name: classTeacherOf.name } : null,
              assignedSubjects,
            };
          });
        }
      } catch (dbErr) {
        console.warn('MongoDB teachers fetch note:', dbErr.message);
      }
    }

    // Fallback to store if empty
    if (teachersList.length === 0) {
      const storeTeachers = store.users.filter((u) => u.role === 'teacher');
      classesList = store.classes || [];

      teachersList = storeTeachers.map((t) => {
        const tId = t._id?.toString();
        const classTeacherOf = classesList.find((c) => c.classTeacher?.toString() === tId);

        const assignedSubjects = [];
        classesList.forEach((c) => {
          if (c.subjects && Array.isArray(c.subjects)) {
            c.subjects.forEach((sub) => {
              if (sub.teacher?.toString() === tId) {
                assignedSubjects.push({
                  className: c.name,
                  classId: c._id,
                  subjectName: sub.name,
                  code: sub.code,
                });
              }
            });
          }
        });

        return {
          ...t,
          classTeacherOf: classTeacherOf ? { _id: classTeacherOf._id, name: classTeacherOf.name } : null,
          assignedSubjects,
        };
      });
    }

    // If still empty, add default mock teacher so dashboard has immediate data
    if (teachersList.length === 0) {
      teachersList = [
        {
          _id: 'tch-001',
          name: 'Bharath Srinivasan',
          phone: '984041855',
          email: 'bharath.teacher@school.gov.in',
          role: 'teacher',
          specialization: 'Mathematics & Science',
          schoolName: 'Govt Model Higher Secondary School',
          classTeacherOf: { _id: 'class-8a', name: 'Class 8-A' },
          assignedSubjects: [
            { className: 'Class 8-A', subjectName: 'Mathematics' },
            { className: 'Class 8-A', subjectName: 'Science' },
          ],
          isActive: true,
        },
      ];
    }

    return res.status(200).json({
      success: true,
      count: teachersList.length,
      data: teachersList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new teacher profile
 * @route   POST /api/teachers
 * @access  Private (Headmaster, Admin)
 */
export const createTeacher = async (req, res, next) => {
  try {
    const { name, phone, email, specialization, classId, isClassTeacher, assignedSubjectNames } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Teacher full name is required' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Teacher contact phone number is required' });
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email?.trim() || `${trimmedName.toLowerCase().replace(/\s+/g, '.')}@school.gov.in`;

    let teacherDoc = null;

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        // Check for existing phone
        const existing = await User.findOne({ phone: trimmedPhone });
        if (existing) {
          return res.status(400).json({ success: false, message: 'A user with this phone number already exists' });
        }

        teacherDoc = await User.create({
          name: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail,
          role: 'teacher',
          schoolName: 'Govt Model Higher Secondary School',
          isActive: true,
        });

        // Assign to Class if provided
        if (classId && mongoose.Types.ObjectId.isValid(classId)) {
          const classDoc = await Class.findById(classId);
          if (classDoc) {
            if (isClassTeacher) {
              classDoc.classTeacher = teacherDoc._id;
            }
            if (assignedSubjectNames && Array.isArray(assignedSubjectNames)) {
              assignedSubjectNames.forEach((subName) => {
                const existingSub = classDoc.subjects.find((s) => s.name.toLowerCase() === subName.toLowerCase());
                if (existingSub) {
                  existingSub.teacher = teacherDoc._id;
                } else {
                  classDoc.subjects.push({ name: subName, teacher: teacherDoc._id });
                }
              });
            }
            await classDoc.save();
          }
        }
      } catch (dbErr) {
        console.warn('MongoDB teacher create note:', dbErr.message);
      }
    }

    // In-memory store sync
    const newTeacher = {
      _id: teacherDoc ? teacherDoc._id.toString() : `tch-${Date.now()}`,
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      role: 'teacher',
      specialization: specialization || 'General Subjects',
      schoolName: 'Govt Model Higher Secondary School',
      classTeacherOf: null,
      assignedSubjects: [],
      isActive: true,
      createdAt: new Date(),
    };

    if (classId) {
      const cls = store.classes.find((c) => c._id?.toString() === classId.toString());
      if (cls) {
        if (isClassTeacher) {
          cls.classTeacher = newTeacher._id;
          newTeacher.classTeacherOf = { _id: cls._id, name: cls.name };
        }
        if (assignedSubjectNames && Array.isArray(assignedSubjectNames)) {
          assignedSubjectNames.forEach((sn) => {
            newTeacher.assignedSubjects.push({ className: cls.name, subjectName: sn });
            const sMatch = cls.subjects?.find((s) => s.name.toLowerCase() === sn.toLowerCase());
            if (sMatch) sMatch.teacher = newTeacher._id;
            else cls.subjects?.push({ name: sn, teacher: newTeacher._id });
          });
        }
      }
    }

    store.users.push(newTeacher);
    store.saveUsersToFile();

    return res.status(201).json({
      success: true,
      message: `Faculty member "${trimmedName}" created and assigned successfully`,
      data: teacherDoc ? { ...teacherDoc.toObject(), specialization } : newTeacher,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update teacher profile
 * @route   PUT /api/teachers/:id
 * @access  Private (Headmaster, Admin)
 */
export const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, specialization, classId, isClassTeacher, assignedSubjectNames } = req.body;

    let updatedTeacher = null;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        const teacherDoc = await User.findById(id);
        if (teacherDoc) {
          if (name) teacherDoc.name = name.trim();
          if (phone) teacherDoc.phone = phone.trim();
          if (email) teacherDoc.email = email.trim();
          await teacherDoc.save();
          updatedTeacher = teacherDoc.toObject();

          // Update Class allocations
          if (classId && mongoose.Types.ObjectId.isValid(classId)) {
            const classDoc = await Class.findById(classId);
            if (classDoc) {
              if (isClassTeacher !== undefined) {
                classDoc.classTeacher = isClassTeacher ? teacherDoc._id : null;
              }
              if (assignedSubjectNames && Array.isArray(assignedSubjectNames)) {
                assignedSubjectNames.forEach((subName) => {
                  const existingSub = classDoc.subjects.find((s) => s.name.toLowerCase() === subName.toLowerCase());
                  if (existingSub) {
                    existingSub.teacher = teacherDoc._id;
                  } else {
                    classDoc.subjects.push({ name: subName, teacher: teacherDoc._id });
                  }
                });
              }
              await classDoc.save();
            }
          }
        }
      } catch (dbErr) {
        console.warn('MongoDB teacher update note:', dbErr.message);
      }
    }

    // Store update
    const storeTeacher = store.users.find((u) => u._id?.toString() === id.toString());
    if (storeTeacher) {
      if (name) storeTeacher.name = name.trim();
      if (phone) storeTeacher.phone = phone.trim();
      if (email) storeTeacher.email = email.trim();
      if (specialization) storeTeacher.specialization = specialization;

      if (classId) {
        const cls = store.classes.find((c) => c._id?.toString() === classId.toString());
        if (cls) {
          if (isClassTeacher) {
            cls.classTeacher = storeTeacher._id;
            storeTeacher.classTeacherOf = { _id: cls._id, name: cls.name };
          }
        }
      }

      store.saveUsersToFile();
      if (!updatedTeacher) updatedTeacher = storeTeacher;
    }

    if (!updatedTeacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher details updated successfully',
      data: updatedTeacher,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign teacher to class and subjects
 * @route   POST /api/teachers/assign
 * @access  Private (Headmaster, Admin)
 */
export const assignTeacher = async (req, res, next) => {
  try {
    const { teacherId, classId, isClassTeacher, subjectName } = req.body;

    if (!teacherId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID and Class ID are required',
      });
    }

    let updatedClass = null;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(classId)) {
      try {
        const classDoc = await Class.findById(classId);
        if (classDoc) {
          if (isClassTeacher) {
            classDoc.classTeacher = teacherId;
          }
          if (subjectName && subjectName.trim()) {
            const subNameTrim = subjectName.trim();
            const existingSub = classDoc.subjects.find((s) => s.name.toLowerCase() === subNameTrim.toLowerCase());
            if (existingSub) {
              existingSub.teacher = teacherId;
            } else {
              classDoc.subjects.push({ name: subNameTrim, teacher: teacherId });
            }
          }
          await classDoc.save();
          updatedClass = classDoc.toObject();
        }
      } catch (dbErr) {
        console.warn('MongoDB assign teacher note:', dbErr.message);
      }
    }

    // Store update
    const storeClass = store.classes.find((c) => c._id?.toString() === classId.toString());
    if (storeClass) {
      if (isClassTeacher) {
        storeClass.classTeacher = teacherId;
      }
      if (subjectName && subjectName.trim()) {
        const subNameTrim = subjectName.trim();
        const existingSub = storeClass.subjects?.find((s) => s.name.toLowerCase() === subNameTrim.toLowerCase());
        if (existingSub) {
          existingSub.teacher = teacherId;
        } else {
          storeClass.subjects?.push({ name: subNameTrim, teacher: teacherId });
        }
      }
      if (!updatedClass) updatedClass = storeClass;
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher assigned to class and subjects successfully',
      data: updatedClass,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete / deactivate teacher
 * @route   DELETE /api/teachers/:id
 * @access  Private (Headmaster, Admin)
 */
export const deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await User.findByIdAndDelete(id);
        // Clear class teacher references
        await Class.updateMany({ classTeacher: id }, { $unset: { classTeacher: 1 } });
      } catch (dbErr) {
        console.warn('MongoDB teacher delete note:', dbErr.message);
      }
    }

    store.users = store.users.filter((u) => u._id?.toString() !== id.toString());
    store.classes.forEach((c) => {
      if (c.classTeacher?.toString() === id.toString()) {
        delete c.classTeacher;
      }
    });
    store.saveUsersToFile();

    return res.status(200).json({
      success: true,
      message: 'Teacher removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
