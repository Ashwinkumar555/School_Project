import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  Sparkles,
  PlusCircle,
  RefreshCw,
  Search,
  Edit3,
  Trash2,
  Plus,
  X,
  User,
  Hash,
  Percent,
  GraduationCap,
  Save,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EarlyAttentionBadge from '../../components/common/EarlyAttentionBadge';
import AttendanceMarkerModal from '../../components/dashboard/AttendanceMarkerModal';
import InterventionModal from '../../components/dashboard/InterventionModal';

// Services
import studentService from '../../services/studentService';
import classService from '../../services/classService';
import earlyAttentionService from '../../services/earlyAttentionService';
import announcementService from '../../services/announcementService';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attentionData, setAttentionData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Student CRUD Modal states
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formName, setFormName] = useState('');
  const [formRollNo, setFormRollNo] = useState('');
  const [formAttendance, setFormAttendance] = useState(85);
  const [formSubjectMarks, setFormSubjectMarks] = useState([]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [showAddSubjectField, setShowAddSubjectField] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Delete Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Other support modals
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [selectedStudentForIntervention, setSelectedStudentForIntervention] = useState(null);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes, attentionRes, annRes] = await Promise.allSettled([
        classService.getClasses(),
        studentService.getStudents(),
        earlyAttentionService.getDashboard(),
        announcementService.getAnnouncements(),
      ]);

      if (classesRes.status === 'fulfilled' && classesRes.value.data) {
        const clsList = classesRes.value.data;
        setClasses(clsList);
        if (clsList.length > 0 && !selectedClass) {
          setSelectedClass(clsList[0]);
        }
      }

      if (studentsRes.status === 'fulfilled') {
        setStudents(studentsRes.value.data || []);
      }
      if (attentionRes.status === 'fulfilled') setAttentionData(attentionRes.value || null);
      if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data || []);
    } catch (e) {
      console.error('Error fetching teacher data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Flash notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Open Add Student Modal
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setFormName('');
    // Suggest next roll number
    const nextRoll = students.length > 0
      ? (Math.max(...students.map((s) => parseInt(s.rollNumber, 10) || 0)) + 1).toString().padStart(2, '0')
      : '01';
    setFormRollNo(nextRoll);
    setFormAttendance(85);
    setFormSubjectMarks([
      { subject: 'Mathematics', marksObtained: 80, maxMarks: 100 },
      { subject: 'Science', marksObtained: 75, maxMarks: 100 },
      { subject: 'English', marksObtained: 85, maxMarks: 100 },
    ]);
    setNewSubjectInput('');
    setShowAddSubjectField(false);
    setFormError('');
    setIsStudentModalOpen(true);
  };

  // Open Edit Student Modal
  const handleOpenEditStudent = (student) => {
    setEditingStudent(student);
    setFormName(student.name || '');
    setFormRollNo(student.rollNumber || '');
    setFormAttendance(student.currentAttendanceRate !== undefined ? student.currentAttendanceRate : 85);

    let defaultMarks = [
      { subject: 'Mathematics', marksObtained: 80, maxMarks: 100 },
      { subject: 'Science', marksObtained: 75, maxMarks: 100 },
      { subject: 'English', marksObtained: 85, maxMarks: 100 },
    ];
    if (student.subjectMarks && student.subjectMarks.length > 0) {
      defaultMarks = student.subjectMarks.map((m) => ({
        subject: m.subject,
        marksObtained: m.marksObtained !== undefined ? m.marksObtained : '',
        maxMarks: m.maxMarks || 100,
      }));
    }
    setFormSubjectMarks(defaultMarks);
    setNewSubjectInput('');
    setShowAddSubjectField(false);
    setFormError('');
    setIsStudentModalOpen(true);
  };

  // Handle adding a new subject dynamically
  const handleAddSubjectConfirm = () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) {
      setFormError('Please enter a valid subject name');
      return;
    }

    const alreadyExists = formSubjectMarks.some(
      (m) => m.subject.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      setFormError(`Subject "${trimmed}" is already in the list`);
      return;
    }

    setFormSubjectMarks([
      ...formSubjectMarks,
      { subject: trimmed, marksObtained: '', maxMarks: 100 },
    ]);
    setNewSubjectInput('');
    setShowAddSubjectField(false);
    setFormError('');
  };

  // Handle removing a subject
  const handleRemoveSubject = (index) => {
    if (formSubjectMarks.length <= 1) {
      setFormError('At least one subject is recommended');
      return;
    }
    setFormSubjectMarks(formSubjectMarks.filter((_, i) => i !== index));
  };

  // Handle mark value change
  const handleMarkChange = (index, val) => {
    const updated = [...formSubjectMarks];
    if (val === '') {
      updated[index].marksObtained = '';
    } else {
      const num = Math.min(100, Math.max(0, Number(val)));
      updated[index].marksObtained = isNaN(num) ? 0 : num;
    }
    setFormSubjectMarks(updated);
    if (formError) setFormError('');
  };

  // Handle subject title editing
  const handleSubjectTitleChange = (index, val) => {
    const updated = [...formSubjectMarks];
    updated[index].subject = val;
    setFormSubjectMarks(updated);
  };

  // Computed totals for student form
  const totalObtained = formSubjectMarks.reduce(
    (acc, cur) => acc + (Number(cur.marksObtained) || 0),
    0
  );
  const totalMax = formSubjectMarks.reduce(
    (acc, cur) => acc + (Number(cur.maxMarks) || 100),
    0
  );
  const computedAverage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

  const getGradeForPct = (pct) => {
    if (pct >= 90) return 'A+';
    if (pct >= 75) return 'A';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 35) return 'D';
    return 'F';
  };

  // Save student data to MongoDB
  const handleSaveStudent = async (e) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFormError("Please enter the student's full name");
      return;
    }

    if (!formRollNo.toString().trim()) {
      setFormError("Please enter the student's roll number");
      return;
    }

    const attendanceNum = Number(formAttendance);
    if (isNaN(attendanceNum) || attendanceNum < 0 || attendanceNum > 100) {
      setFormError('Attendance percentage must be a number between 0 and 100');
      return;
    }

    // Filter valid subjects
    const validSubjects = formSubjectMarks.filter((m) => m.subject.trim() !== '');
    if (validSubjects.length === 0) {
      setFormError('Please provide at least one subject');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const payload = {
        name: formName.trim(),
        rollNumber: formRollNo.toString().trim(),
        attendance: attendanceNum,
        currentAttendanceRate: attendanceNum,
        subjectMarks: validSubjects.map((m) => ({
          subject: m.subject.trim(),
          marksObtained: Number(m.marksObtained) || 0,
          maxMarks: Number(m.maxMarks) || 100,
        })),
        classId: selectedClass?._id,
      };

      if (editingStudent) {
        // Update existing student
        await studentService.updateStudent(editingStudent._id, payload);
        showToast(`Student "${payload.name}" updated and saved successfully!`);
      } else {
        // Create new student
        await studentService.createStudent(payload);
        showToast(`New student "${payload.name}" enrolled and saved successfully!`);
      }

      setIsStudentModalOpen(false);
      await fetchTeacherData();
    } catch (err) {
      console.error('Error saving student:', err);
      setFormError(
        err.response?.data?.message || 'Failed to save student details. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Delete student
  const handleOpenDelete = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await studentService.deleteStudent(studentToDelete._id);
      showToast(`Student "${studentToDelete.name}" was successfully removed.`);
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      await fetchTeacherData();
    } catch (err) {
      console.error('Error deleting student:', err);
      showToast(err.response?.data?.message || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.rollNumber && s.rollNumber.toString().includes(q))
    );
  });

  // Summary statistics
  const totalStudentsCount = students.length;
  const avgAttendance = totalStudentsCount > 0
    ? Math.round(
        students.reduce((acc, cur) => acc + (cur.currentAttendanceRate || 0), 0) /
          totalStudentsCount
      )
    : 0;
  const avgAcademic = totalStudentsCount > 0
    ? Math.round(
        students.reduce((acc, cur) => acc + (cur.currentAcademicAverage || 0), 0) /
          totalStudentsCount
      )
    : 0;
  const needAttentionCount = students.filter(
    (s) =>
      s.attentionLevel === 'HIGH_ATTENTION' ||
      s.currentAttendanceRate < 60 ||
      s.currentAcademicAverage < 40
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="blue" size="sm" dot>
                Teacher Academic Dashboard
              </Badge>
              <span className="text-xs text-blue-300 font-semibold bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800">
                Faculty Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Teacher'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Enter and manage student academic details, record roll numbers, update attendance rates, and manage multi-subject marks directly into MongoDB.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchTeacherData}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={handleOpenAddStudent}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 font-bold"
            >
              + Add Student
            </Button>
          </div>
        </div>
      </div>

      {/* Classroom Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Class</span>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{selectedClass?.name || 'Class 8-A'}</p>
          <p className="text-xs text-slate-500 mt-1">{totalStudentsCount} Enrolled Students</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Attendance</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">{avgAttendance}%</p>
          <p className="text-xs text-slate-500 mt-1">Class average attendance rate</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Average</span>
            <Award className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-700 mt-2">{avgAcademic}%</p>
          <p className="text-xs text-slate-500 mt-1">Average across all subject marks</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Needs Support</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-700 mt-2">{needAttentionCount} Students</p>
          <p className="text-xs text-slate-500 mt-1">Flagged for attendance or marks</p>
        </Card>
      </div>

      {/* Main Student Academic Details & Management Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Student Academic Management & Performance Roster
            </h2>
            <p className="text-xs text-slate-500">
              Manage student profiles, roll numbers, attendance percentages, and multi-subject marks. All changes persist permanently in MongoDB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 w-48 sm:w-64"
              />
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={PlusCircle}
              onClick={handleOpenAddStudent}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-bold"
            >
              + Add Student
            </Button>
          </div>
        </div>

        {/* Student Table / Cards */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading student academic records from database...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">No Students Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'No student matched your search query.'
                : 'Click "+ Add Student" above to create your first student profile with attendance and subject marks.'}
            </p>
            {!searchTerm && (
              <Button size="sm" variant="primary" icon={PlusCircle} onClick={handleOpenAddStudent} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Add First Student
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5 w-16">Roll No</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Academic Average</th>
                  <th className="p-3.5">Subject Marks</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Roll No */}
                    <td className="p-3.5">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-extrabold text-xs border border-slate-200">
                        #{s.rollNumber}
                      </span>
                    </td>

                    {/* Student Name */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xs shrink-0">
                          {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {s.class?.name || 'Class 8-A'} • {s.gender || 'Male'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-extrabold text-sm ${
                              (s.currentAttendanceRate ?? 85) < 60
                                ? 'text-rose-700'
                                : (s.currentAttendanceRate ?? 85) < 75
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {s.currentAttendanceRate !== undefined ? s.currentAttendanceRate : 85}%
                          </span>
                          {(s.currentAttendanceRate ?? 85) < 60 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                              Low
                            </span>
                          )}
                        </div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (s.currentAttendanceRate ?? 85) < 60
                                ? 'bg-rose-500'
                                : (s.currentAttendanceRate ?? 85) < 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, s.currentAttendanceRate ?? 85))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Academic Average */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-extrabold text-sm ${
                            (s.currentAcademicAverage ?? 65) < 40
                              ? 'text-rose-700'
                              : (s.currentAcademicAverage ?? 65) >= 75
                              ? 'text-emerald-700'
                              : 'text-indigo-700'
                          }`}
                        >
                          {s.currentAcademicAverage !== undefined ? s.currentAcademicAverage : 65}%
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            (s.currentAcademicAverage ?? 65) >= 75
                              ? 'bg-emerald-100 text-emerald-800'
                              : (s.currentAcademicAverage ?? 65) >= 60
                              ? 'bg-blue-100 text-blue-800'
                              : (s.currentAcademicAverage ?? 65) >= 40
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          Grade {getGradeForPct(s.currentAcademicAverage ?? 65)}
                        </span>
                      </div>
                    </td>

                    {/* Subject Marks Pills */}
                    <td className="p-3.5 max-w-md">
                      {s.subjectMarks && s.subjectMarks.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {s.subjectMarks.map((sm, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px]"
                            >
                              <span className="font-medium text-slate-600">{sm.subject}:</span>
                              <span className="font-extrabold text-slate-900">{sm.marksObtained}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No subjects logged</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Edit3}
                        onClick={() => handleOpenEditStudent(s)}
                        className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                      >
                        Edit Details & Marks
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Trash2}
                        onClick={() => handleOpenDelete(s)}
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Classroom Secondary Utilities */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-900">Classroom Support & Session Tools</h4>
          <p className="text-xs text-slate-500">
            Take complete classroom roll-call or trigger early support interventions for flagged children.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            icon={CheckCircle2}
            onClick={() => setIsAttendanceModalOpen(true)}
            className="border-slate-300 text-slate-700 bg-white hover:bg-slate-100 font-semibold"
          >
            Mark Daily Classroom Attendance
          </Button>
        </div>
      </div>

      {/* Faculty Notices & Announcements */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-base">Faculty Notices & Announcements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((ann) => (
            <Card key={ann._id} className="border-slate-200 text-xs space-y-1">
              <Badge variant="blue" size="xs">
                {ann.category}
              </Badge>
              <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
              <p className="text-slate-600">{ann.content}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT STUDENT ACADEMIC DETAILS MODAL       */}
      {/* ========================================================= */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.name}` : 'Add New Student'}
        subtitle="Enter student profile, roll number, attendance percentage, and subject examination marks."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveStudent} className="space-y-5">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{formError}</span>
            </div>
          )}

          {/* Student Profile & Roll No & Attendance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Student Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                1. Student Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Aarav Kumar"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* 2. Roll No */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                2. Roll No <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 01"
                  value={formRollNo}
                  onChange={(e) => {
                    setFormRollNo(e.target.value);
                    if (formError) setFormError('');
                  }}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* 3. Attendance */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                3. Attendance Percentage (%) <span className="text-rose-500">*</span>
              </label>
              <span className="font-extrabold text-sm text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {formAttendance}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="100"
                value={formAttendance}
                onChange={(e) => {
                  setFormAttendance(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-24 px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={formAttendance}
                onChange={(e) => setFormAttendance(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Enter the student's cumulative or term attendance percentage (0 to 100%).
            </p>
          </div>

          {/* 4 & 5. Subject Marks & + Add Subject */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  4. Subject Marks
                </label>
                <p className="text-[11px] text-slate-500">
                  Enter student marks for each subject out of 100.
                </p>
              </div>

              {/* 5. + Add Subject button */}
              <Button
                type="button"
                size="xs"
                variant="outline"
                icon={Plus}
                onClick={() => {
                  setShowAddSubjectField(true);
                  setNewSubjectInput('');
                }}
                className="border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold"
              >
                + Add Subject
              </Button>
            </div>

            {/* Dynamic New Subject Input Field */}
            {showAddSubjectField && (
              <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Enter New Subject Name:</span>
                  <button
                    type="button"
                    onClick={() => setShowAddSubjectField(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Social Science, Tamil, Computer"
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubjectConfirm();
                      }
                    }}
                    autoFocus
                    className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-600 font-medium"
                  />
                  <Button
                    type="button"
                    size="xs"
                    variant="primary"
                    onClick={handleAddSubjectConfirm}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-bold"
                  >
                    Confirm Add
                  </Button>
                </div>
              </div>
            )}

            {/* Subject Marks List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {formSubjectMarks.map((sm, index) => {
                const markNum = Number(sm.marksObtained);
                const markGrade = sm.marksObtained !== '' ? getGradeForPct(markNum) : '-';
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/70 transition-colors"
                  >
                    {/* Subject Name */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={sm.subject}
                        onChange={(e) => handleSubjectTitleChange(index, e.target.value)}
                        placeholder="Subject Name"
                        className="w-full px-2.5 py-1 text-xs font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* Marks Obtained Field */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Marks"
                        value={sm.marksObtained}
                        onChange={(e) => handleMarkChange(index, e.target.value)}
                        className="w-18 px-2.5 py-1 text-xs text-center font-extrabold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                      <span className="text-xs text-slate-400 font-medium">/ 100</span>
                    </div>

                    {/* Grade Indicator */}
                    <div className="w-12 text-center">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded font-extrabold ${
                          markGrade === 'A+' || markGrade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : markGrade === 'B' || markGrade === 'C'
                            ? 'bg-blue-100 text-blue-800'
                            : markGrade === 'D'
                            ? 'bg-amber-100 text-amber-800'
                            : markGrade === 'F'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {markGrade}
                      </span>
                    </div>

                    {/* Remove Subject button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                      title="Remove subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Real-time Computed Summary */}
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs">
              <div className="space-x-4 text-indigo-900 font-medium">
                <span>
                  Total: <strong className="font-extrabold">{totalObtained}</strong> / {totalMax}
                </span>
                <span>
                  Average: <strong className="font-extrabold text-indigo-700">{computedAverage}%</strong>
                </span>
              </div>
              <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-md font-extrabold text-xs">
                Grade: {getGradeForPct(computedAverage)}
              </span>
            </div>
          </div>

          {/* 7. Modal Footer: Save Data Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStudentModalOpen(false)}
              disabled={isSaving}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Save}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 font-bold"
            >
              {isSaving ? 'Saving to Database...' : 'Save Student Information'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: DELETE CONFIRMATION MODAL                        */}
      {/* ========================================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Student Record"
        subtitle="This action will permanently delete the student and their academic marks from MongoDB."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 space-y-1">
              <p className="font-bold text-sm">Are you sure you want to delete this student?</p>
              <p>
                Student: <strong>{studentToDelete?.name}</strong> (Roll #{studentToDelete?.rollNumber})
              </p>
              <p className="text-[11px] text-rose-700">
                All term examination marks and attendance records will be removed from the system.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Trash2}
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Student'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Auxiliary Modals */}
      <AttendanceMarkerModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        classData={selectedClass || classes[0]}
        students={students}
        onAttendanceRecorded={fetchTeacherData}
      />

      {selectedStudentForIntervention && (
        <InterventionModal
          isOpen={isInterventionModalOpen}
          onClose={() => {
            setIsInterventionModalOpen(false);
            setSelectedStudentForIntervention(null);
          }}
          student={selectedStudentForIntervention}
          onInterventionAdded={fetchTeacherData}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
