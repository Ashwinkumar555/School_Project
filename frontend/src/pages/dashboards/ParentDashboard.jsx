import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  Calendar,
  Sparkles,
  PlusCircle,
  Clock,
  Send,
  Lock,
  Search,
  Filter,
  HeartHandshake,
  UserCheck,
  Check,
  ChevronRight,
  Info,
  Layers,
  MapPin,
  CalendarDays,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import CreateSupportRequestModal from '../../components/dashboard/CreateSupportRequestModal';
import SupportRequestTimelineModal from '../../components/dashboard/SupportRequestTimelineModal';

// Services
import studentService from '../../services/studentService';
import academicService from '../../services/academicService';
import attendanceService from '../../services/attendanceService';
import announcementService from '../../services/announcementService';
import communicationService from '../../services/communicationService';
import supportRequestService from '../../services/supportRequestService';
import teacherService from '../../services/teacherService';

export const ParentDashboard = () => {
  const { user } = useAuth();

  // Exactly 4 Main Dashboard Sections:
  // 1. Student Performance
  // 2. Attendance
  // 3. School Updates
  // 4. Teacher Communication
  const [activeSection, setActiveSection] = useState('student-performance');

  // Shared Data States
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Student Performance State
  const [reportCards, setReportCards] = useState([]);

  // 2. Attendance State
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState('ALL');

  // 3. School Updates State
  const [announcements, setAnnouncements] = useState([]);
  const [announcementCategory, setAnnouncementCategory] = useState('ALL');
  const [announcementSearch, setAnnouncementSearch] = useState('');

  // 4. Teacher Communication State
  const [commSubTab, setCommSubTab] = useState('messages'); // 'messages' | 'support-requests'
  const [communications, setCommunications] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isNewCommModalOpen, setIsNewCommModalOpen] = useState(false);
  const [commForm, setCommForm] = useState({
    studentId: '',
    teacherId: '',
    type: 'Academic Query',
    subject: '',
    message: '',
    requestedMeetingDate: '',
    preferredTime: 'Morning (10:00 AM - 12:00 PM)',
  });
  const [commSubmitting, setCommSubmitting] = useState(false);

  // Existing Support Requests State (inside Section 4 subsection)
  const [supportRequests, setSupportRequests] = useState([]);
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(false);
  const [selectedRequestForTimeline, setSelectedRequestForTimeline] = useState(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch support requests for child
  const fetchSupportRequests = async () => {
    try {
      const res = await supportRequestService.getSupportRequests();
      setSupportRequests(res.data || []);
    } catch (e) {
      console.error('Error fetching support requests:', e);
    }
  };

  // Fetch teacher communications
  const fetchCommunications = async () => {
    try {
      const res = await communicationService.getCommunications();
      setCommunications(res.data || []);
    } catch (e) {
      console.error('Error fetching communications:', e);
    }
  };

  // Fetch teachers for communication selection
  const fetchTeachers = async () => {
    try {
      const res = await teacherService.getTeachers();
      const list = res.data || [];
      setTeachers(list);
      if (list.length > 0) {
        setCommForm((prev) => ({
          ...prev,
          teacherId: prev.teacherId || list[0]._id || list[0].id || '',
        }));
      }
    } catch (e) {
      console.warn('Note fetching teachers for parent communication:', e);
    }
  };

  // Fetch school updates/announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await announcementService.getAnnouncements();
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error('Error fetching announcements:', e);
    }
  };

  // Load specific child's academic and attendance data
  const loadChildData = async (child) => {
    if (!child) return;
    setSelectedChild(child);
    setCommForm((prev) => ({ ...prev, studentId: child._id }));
    try {
      const [marksRes, attRes] = await Promise.allSettled([
        academicService.getStudentMarks(child._id),
        attendanceService.getStudentAttendance(child._id),
      ]);

      if (marksRes.status === 'fulfilled' && marksRes.value.data) {
        setReportCards(marksRes.value.data.reportCards || []);
      } else {
        setReportCards([]);
      }

      if (attRes.status === 'fulfilled' && attRes.value.data) {
        setAttendanceLogs(attRes.value.data.logs || []);
      } else {
        setAttendanceLogs([]);
      }
    } catch (e) {
      console.error('Error fetching child data:', e);
    }
  };

  // Main data loader
  const fetchParentData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchSupportRequests(),
        fetchCommunications(),
        fetchAnnouncements(),
        fetchTeachers(),
      ]);

      let studentList = [];
      try {
        const linkedRes = await studentService.getLinkedStudents();
        studentList = linkedRes.data || [];
      } catch (err) {
        const res = await studentService.getStudents();
        studentList = res.data || [];
      }

      // If student list is empty, also try getEligibleStudents as fallback
      if (studentList.length === 0) {
        try {
          const eligibleRes = await supportRequestService.getEligibleStudents();
          if (eligibleRes?.data?.length > 0) {
            studentList = eligibleRes.data;
          }
        } catch (err) {
          console.warn('Fallback to eligible students note:', err);
        }
      }

      setChildren(studentList);
      if (studentList.length > 0) {
        const prevId = selectedChild?._id;
        const matched = studentList.find((c) => String(c._id) === String(prevId));
        const activeChild = matched || studentList[0];
        await loadChildData(activeChild);
        setCommForm((prev) => ({ ...prev, studentId: activeChild._id }));
      } else {
        setSelectedChild(null);
        setCommForm((prev) => ({ ...prev, studentId: '' }));
      }
    } catch (e) {
      console.error('Error fetching parent data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, [user]);

  // Helper to open Communication Modal with prefilled child and type
  const openNewCommModal = (initialType = 'Academic Query', initialSubject = '') => {
    let targetChild = selectedChild;
    if (!targetChild && children.length > 0) {
      targetChild = children[0];
      setSelectedChild(children[0]);
    }

    const defaultStudentId = targetChild?._id || (children.length > 0 ? children[0]._id : '');
    const defaultTeacherId = commForm.teacherId || (teachers.length > 0 ? (teachers[0]._id || teachers[0].id) : '');

    setCommForm((prev) => ({
      ...prev,
      type: initialType,
      subject: initialSubject !== undefined && initialSubject !== '' ? initialSubject : prev.subject,
      studentId: defaultStudentId,
      teacherId: prev.teacherId || defaultTeacherId,
    }));
    setIsNewCommModalOpen(true);
  };

  // Handle New Teacher Message / PTM Request Submission
  const handleCommSubmit = async (e) => {
    e.preventDefault();

    // Automatically resolve child ID from:
    // 1) commForm.studentId
    // 2) selectedChild._id
    // 3) children[0]._id if only one linked child exists
    const targetStudentId =
      commForm.studentId ||
      selectedChild?._id ||
      (children.length === 1 ? children[0]._id : null);

    if (!targetStudentId) {
      showToast('Please select a linked child first.');
      return;
    }

    // Ensure selectedChild is in sync
    const matchedChild = children.find((c) => String(c._id) === String(targetStudentId)) || selectedChild;
    if (matchedChild && (!selectedChild || String(selectedChild._id) !== String(matchedChild._id))) {
      setSelectedChild(matchedChild);
    }

    if (!commForm.subject.trim() || !commForm.message.trim()) {
      showToast('Subject and message are required.');
      return;
    }

    setCommSubmitting(true);
    try {
      await communicationService.createCommunication({
        studentId: targetStudentId,
        teacherId: commForm.teacherId || undefined,
        type: commForm.type,
        subject: commForm.subject.trim(),
        message: commForm.message.trim(),
        requestedMeetingDate: commForm.requestedMeetingDate || undefined,
        preferredTime: commForm.preferredTime,
      });

      showToast('Your message has been delivered to the teacher successfully!');
      setIsNewCommModalOpen(false);
      setCommForm({
        studentId: targetStudentId,
        teacherId: teachers.length > 0 ? (teachers[0]._id || teachers[0].id) : '',
        type: 'Academic Query',
        subject: '',
        message: '',
        requestedMeetingDate: '',
        preferredTime: 'Morning (10:00 AM - 12:00 PM)',
      });
      await fetchCommunications();
    } catch (err) {
      console.error('Failed to send communication:', err);
      showToast(err.response?.data?.message || 'Failed to send message to teacher');
    } finally {
      setCommSubmitting(false);
    }
  };

  // Nav cards definition
  const NAV_SECTIONS = [
    {
      id: 'student-performance',
      title: '1. Student Performance',
      subtitle: 'Subject marks & exam reports',
      icon: Award,
      badge: selectedChild?.currentAcademicAverage ? `${selectedChild.currentAcademicAverage}% Avg` : 'Marks & Reports',
      color: 'blue',
    },
    {
      id: 'attendance',
      title: '2. Attendance',
      subtitle: 'Daily logs & percentage',
      icon: CheckCircle2,
      badge: selectedChild?.currentAttendanceRate ? `${selectedChild.currentAttendanceRate}% Rate` : 'Attendance Logs',
      color: selectedChild?.currentAttendanceRate < 75 ? 'rose' : 'emerald',
    },
    {
      id: 'school-updates',
      title: '3. School Updates',
      subtitle: 'Exam dates, holidays & notices',
      icon: BookOpen,
      badge: `${announcements.length} Notices`,
      color: 'amber',
    },
    {
      id: 'teacher-communication',
      title: '4. Teacher Communication',
      subtitle: 'Queries, PTM & support',
      icon: MessageSquare,
      badge: `${communications.length} Messages`,
      color: 'purple',
    },
  ];

  // Filtered announcements
  const filteredAnnouncements = announcements.filter((ann) => {
    if (announcementCategory !== 'ALL') {
      const cat = (ann.category || '').toLowerCase();
      if (announcementCategory === 'Academic' && !cat.includes('academic')) return false;
      if (announcementCategory === 'Holiday' && !cat.includes('holiday')) return false;
      if (announcementCategory === 'General' && (cat.includes('academic') || cat.includes('holiday'))) return false;
    }
    if (announcementSearch) {
      const s = announcementSearch.toLowerCase();
      return (
        (ann.title || '').toLowerCase().includes(s) ||
        (ann.content || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Filtered attendance logs
  const filteredLogs = attendanceLogs.filter((log) => {
    if (attendanceFilter === 'ALL') return true;
    return log.status === attendanceFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="amber" size="sm" dot>
                Parent / Guardian Portal
              </Badge>
              <span className="text-xs text-amber-300 font-semibold bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800">
                Govt Model Higher Secondary School
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Parent'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Monitor your child's academic performance, daily attendance, school updates, and communicate directly with educators in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={() => {
                setActiveSection('teacher-communication');
                setCommSubTab('messages');
                openNewCommModal('Academic Query');
              }}
              className="bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-700/20 text-white font-bold"
            >
              + Message Teacher
            </Button>
          </div>
        </div>
      </div>

      {/* Child Switcher if multiple children are linked */}
      {children.length > 0 && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Active Student:
            </span>
            {children.map((c) => (
              <button
                key={c._id}
                onClick={() => {
                  loadChildData(c);
                  setCommForm((prev) => ({ ...prev, studentId: c._id }));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedChild?._id === c._id
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[10px] opacity-80">(Roll #{c.rollNumber})</span>
              </button>
            ))}
          </div>

          {selectedChild && (
            <div className="text-xs text-slate-500 hidden sm:block">
              {selectedChild.class?.name || 'Class 8-A'} • Admission #{selectedChild.admissionNumber} • Village: {selectedChild.village || 'Sundarpur'}
            </div>
          )}
        </div>
      )}

      {/* EXACTLY 4 MAIN DASHBOARD SECTIONS SWITCHER CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {NAV_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <Badge variant={isActive ? 'amber' : 'slate'} size="xs">
                  {sec.badge}
                </Badge>
              </div>
              <div>
                <h3 className={`font-extrabold text-sm ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>
                  {sec.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{sec.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: STUDENT PERFORMANCE (VIEW-ONLY ACADEMIC MARKS & REPORTS)       */}
      {/* ========================================================================= */}
      {activeSection === 'student-performance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-blue-600" />
                Student Academic Performance
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Subject-wise exam marks, grades, and term evaluation reports for {selectedChild?.name || 'your child'}.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>View-Only Access (Teacher Evaluated)</span>
            </div>
          </div>

          {/* Academic Overview Scorecard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 bg-white p-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Overall Academic Average
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-700">
                  {selectedChild?.currentAcademicAverage || 78}%
                </span>
                <span className="text-xs font-semibold text-slate-500">Average Marks</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${selectedChild?.currentAcademicAverage || 78}%` }}
                />
              </div>
            </Card>

            <Card className="border-slate-200 bg-white p-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Overall Grade Standing
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700">
                  {selectedChild?.currentAcademicAverage >= 90
                    ? 'Grade A+'
                    : selectedChild?.currentAcademicAverage >= 75
                    ? 'Grade A'
                    : selectedChild?.currentAcademicAverage >= 60
                    ? 'Grade B'
                    : selectedChild?.currentAcademicAverage >= 50
                    ? 'Grade C'
                    : 'Grade D'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Performance across all scheduled examinations</p>
            </Card>

            <Card className="border-slate-200 bg-white p-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Subjects Evaluated
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-purple-700">
                  {selectedChild?.subjectMarks?.length || (reportCards[0]?.marks?.length || 5)}
                </span>
                <span className="text-xs font-semibold text-slate-500">Active Subjects</span>
              </div>
              <p className="text-xs text-slate-500">Mathematics, Science, English, Regional Language, Social</p>
            </Card>
          </div>

          {/* Current Subject-Wise Marks */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Current Subject Marks & Grading
            </h3>

            {selectedChild?.subjectMarks && selectedChild.subjectMarks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedChild.subjectMarks.map((sm, idx) => {
                  const pct = sm.maxMarks > 0 ? Math.round((sm.marksObtained / sm.maxMarks) * 100) : 0;
                  return (
                    <Card key={idx} className="border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">{sm.subject}</span>
                        <Badge
                          variant={pct >= 75 ? 'emerald' : pct >= 50 ? 'blue' : 'rose'}
                          size="xs"
                        >
                          Grade {sm.grade || (pct >= 75 ? 'A' : pct >= 50 ? 'B' : 'C')}
                        </Badge>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">Marks Scored:</span>
                        <span className="font-extrabold text-slate-900 text-base">
                          {sm.marksObtained}{' '}
                          <span className="text-xs text-slate-400 font-normal">/ {sm.maxMarks}</span>
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-6 text-slate-500 text-xs">
                No subject marks recorded for this academic term yet.
              </Card>
            )}
          </div>

          {/* Published Term Exam Report Cards */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Examination Term Reports & Teacher Remarks
            </h3>

            {reportCards.length > 0 ? (
              reportCards.map((rc) => (
                <Card key={rc._id} className="border-slate-200 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {rc.term} ({rc.academicYear})
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Teacher Evaluation: "{rc.teacherRemarks || 'Satisfactory academic progress.'}"
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        Overall: {rc.overallGrade} ({rc.percentage}%)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 text-xs">
                    {rc.marks?.map((m) => (
                      <div key={m.subject} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                        <p className="text-slate-500 font-medium truncate">{m.subject}</p>
                        <p className="font-bold text-slate-900 text-sm mt-1">
                          {m.marksObtained} <span className="text-xs text-slate-400 font-normal">/ {m.maxMarks}</span>
                        </p>
                        <Badge variant={m.marksObtained >= 75 ? 'emerald' : m.marksObtained >= 50 ? 'blue' : 'rose'} size="xs" className="mt-1">
                          Grade {m.grade}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="text-center py-6 text-slate-500 text-xs">
                Formal term examination report card will be published at the end of the current term.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ATTENDANCE (DAILY LOGS, MONTHLY SUMMARY, LOW ATTENDANCE ALERT) */}
      {/* ========================================================================= */}
      {activeSection === 'attendance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                Attendance Monitoring
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Daily and monthly roll-call attendance records for {selectedChild?.name || 'your child'}.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>View-Only (Marked by Class Teacher)</span>
            </div>
          </div>

          {/* Prominent Low Attendance Warning Banner */}
          {(selectedChild?.currentAttendanceRate < 75 || selectedChild?.consecutiveAbsences >= 3) && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-rose-900 text-sm">
                  Attention Required: Low Attendance Alert ({selectedChild?.currentAttendanceRate}%)
                </h4>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Your child's attendance is currently at <strong>{selectedChild?.currentAttendanceRate}%</strong>, which is below the mandatory 75% standard.
                  {selectedChild?.consecutiveAbsences > 0 && (
                    <span> Current unnotified absence streak: <strong>{selectedChild.consecutiveAbsences} days</strong>.</span>
                  )}
                  Regular attendance is required for term exams. Please contact the class teacher via the <strong>Teacher Communication</strong> section to resolve any queries.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveSection('teacher-communication');
                      setCommSubTab('messages');
                      openNewCommModal(
                        'Attendance Query',
                        `Query regarding attendance rate (${selectedChild?.currentAttendanceRate || 0}%)`
                      );
                    }}
                    className="text-xs font-bold text-rose-900 bg-white border border-rose-300 px-3 py-1 rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
                  >
                    Send Attendance Query to Teacher &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200 bg-white p-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Attendance Percentage
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold ${
                    selectedChild?.currentAttendanceRate < 60
                      ? 'text-rose-700'
                      : selectedChild?.currentAttendanceRate < 75
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {selectedChild?.currentAttendanceRate || 85}%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {selectedChild?.currentAttendanceRate >= 75 ? 'Healthy Attendance' : 'Below 75% Standard'}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${
                    selectedChild?.currentAttendanceRate < 60
                      ? 'bg-rose-600'
                      : selectedChild?.currentAttendanceRate < 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${selectedChild?.currentAttendanceRate || 85}%` }}
                />
              </div>
            </Card>

            <Card className="border-slate-200 bg-white p-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Absence Streak Tracker
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold ${
                    selectedChild?.consecutiveAbsences >= 3 ? 'text-rose-700' : 'text-slate-800'
                  }`}
                >
                  {selectedChild?.consecutiveAbsences || 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">Consecutive Days</span>
              </div>
              <p className="text-xs text-slate-500">
                {selectedChild?.consecutiveAbsences === 0
                  ? 'No ongoing absence streak recorded.'
                  : 'Teacher will be notified if streak exceeds 3 days.'}
              </p>
            </Card>

            <Card className="border-slate-200 bg-white p-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                School Sessions Tracked
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-700">
                  {attendanceLogs.length || 24}
                </span>
                <span className="text-xs font-semibold text-slate-500">Days Recorded</span>
              </div>
              <p className="text-xs text-slate-500">Academic Year 2025-2026 Daily Roll-Call</p>
            </Card>
          </div>

          {/* Daily Recorded Attendance Logs */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                Daily Recorded Attendance Logs
              </h3>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                {['ALL', 'Present', 'Absent', 'Late'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setAttendanceFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      attendanceFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredLogs.length > 0 ? (
              <Card className="border-slate-200 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                  {filteredLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-center space-y-1 ${
                        log.status === 'Present'
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : log.status === 'Absent'
                          ? 'bg-rose-50/60 border-rose-200'
                          : 'bg-amber-50/60 border-amber-200'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 font-semibold block">{log.date}</span>
                      <Badge
                        variant={
                          log.status === 'Present'
                            ? 'emerald'
                            : log.status === 'Absent'
                            ? 'rose'
                            : 'amber'
                        }
                        size="xs"
                      >
                        {log.status}
                      </Badge>
                      {log.remarks && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{log.remarks}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="text-center py-6 text-slate-500 text-xs">
                No attendance logs found matching "{attendanceFilter}".
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SCHOOL UPDATES (ANNOUNCEMENTS, EXAM DATES, HOLIDAYS, NOTICES)  */}
      {/* ========================================================================= */}
      {activeSection === 'school-updates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-600" />
                School Updates & Announcements
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Official notices, exam timetables, holiday schedules, and events issued by the Head Master and teachers.
              </p>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'All Updates' },
                { id: 'Academic', label: 'Exam Dates & Academic' },
                { id: 'Holiday', label: 'Holidays & Events' },
                { id: 'General', label: 'General Notices' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAnnouncementCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    announcementCategory === tab.id
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                placeholder="Search updates..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Announcements Grid */}
          {filteredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAnnouncements.map((notice) => (
                <Card
                  key={notice._id}
                  className={`border p-5 space-y-3 transition-all hover:shadow-sm ${
                    notice.isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          notice.category?.includes('Academic')
                            ? 'blue'
                            : notice.category?.includes('Holiday')
                            ? 'purple'
                            : 'amber'
                        }
                        size="xs"
                      >
                        {notice.category || 'School Update'}
                      </Badge>
                      {notice.priority === 'High' && (
                        <Badge variant="rose" size="xs">
                          Important Notice
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                      {notice.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                      {notice.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-700">
                        {notice.authorName || 'School Administration'}
                      </span>
                    </div>
                    {notice.isPinned && (
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100/70 px-2 py-0.5 rounded-full">
                        Pinned Notice
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-10 border-dashed border-slate-300">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No school updates found</p>
              <p className="text-xs text-slate-500 mt-1">
                Check back soon for new exam dates, holiday notifications, and school announcements.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: TEACHER COMMUNICATION (QUERIES, PTM, & SUPPORT REQUESTS)       */}
      {/* ========================================================================= */}
      {activeSection === 'teacher-communication' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-purple-600" />
                Teacher Communication & Support
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Communicate directly with your child's teachers, send academic or attendance queries, schedule meetings, and request educational assistance.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {commSubTab === 'messages' ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Send}
                  onClick={() => openNewCommModal('Academic Query')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  + New Teacher Query / PTM
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon={PlusCircle}
                  onClick={() => setIsCreateRequestModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  + Request Student Support
                </Button>
              )}
            </div>
          </div>

          {/* Subsection Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setCommSubTab('messages')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                commSubTab === 'messages'
                  ? 'bg-purple-100 text-purple-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Teacher Messages & Meeting Requests</span>
              <span className="bg-purple-200 text-purple-800 text-[10px] px-2 py-0.2 rounded-full font-extrabold">
                {communications.length}
              </span>
            </button>

            <button
              onClick={() => setCommSubTab('support-requests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                commSubTab === 'support-requests'
                  ? 'bg-amber-100 text-amber-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Educational Support Requests</span>
              <span className="bg-amber-200 text-amber-800 text-[10px] px-2 py-0.2 rounded-full font-extrabold">
                {supportRequests.length}
              </span>
            </button>
          </div>

          {/* SUBSECTION 1: TEACHER MESSAGES & PTM REQUESTS */}
          {commSubTab === 'messages' && (
            <div className="space-y-4">
              {communications.length > 0 ? (
                <div className="space-y-4">
                  {communications.map((item) => (
                    <Card key={item._id} className="border-slate-200 p-5 space-y-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                item.type === 'Meeting Request'
                                  ? 'purple'
                                  : item.type === 'Attendance Query'
                                  ? 'rose'
                                  : 'blue'
                              }
                              size="xs"
                            >
                              {item.type}
                            </Badge>
                            <span className="text-[11px] text-slate-500 font-semibold">
                              Student: {item.studentName} ({item.studentClass || 'Class 8-A'})
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-base">{item.subject}</h4>
                        </div>

                        <div>
                          {item.status === 'Pending' && (
                            <Badge variant="amber" dot>
                              Awaiting Teacher Reply
                            </Badge>
                          )}
                          {item.status === 'Replied' && (
                            <Badge variant="emerald" dot>
                              Teacher Replied
                            </Badge>
                          )}
                          {item.status === 'Meeting Scheduled' && (
                            <Badge variant="purple" dot>
                              PTM Scheduled
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Parent's Message */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
                          <span>Your Message:</span>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{item.message}</p>
                        {item.requestedMeetingDate && (
                          <div className="pt-1 text-[11px] text-purple-700 font-semibold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Requested Date: {new Date(item.requestedMeetingDate).toLocaleDateString()}</span>
                            {item.preferredTime && <span>• Preferred: {item.preferredTime}</span>}
                          </div>
                        )}
                      </div>

                      {/* Teacher's Reply Box */}
                      {item.reply ? (
                        <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-emerald-700" />
                              Teacher Response ({item.repliedByName || item.teacherName || 'Class Teacher'}):
                            </span>
                            <span className="text-[10px] text-emerald-700">
                              {item.repliedAt ? new Date(item.repliedAt).toLocaleDateString() : 'Received'}
                            </span>
                          </div>
                          <p className="text-emerald-950 font-medium leading-relaxed">{item.reply}</p>

                          {item.meetingDetails && item.meetingDetails.date && (
                            <div className="mt-2 p-2.5 bg-white rounded-lg border border-emerald-300 text-xs space-y-1">
                              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Confirmed In-Person Meeting:</span>
                              </div>
                              <p className="text-slate-700">
                                <strong>Date:</strong> {new Date(item.meetingDetails.date).toLocaleDateString()} at{' '}
                                <strong>{item.meetingDetails.time || '10:30 AM'}</strong>
                              </p>
                              <p className="text-slate-600">
                                <strong>Location:</strong> {item.meetingDetails.location || 'Staff Room'}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Waiting for subject/class teacher review. You will receive an update here shortly.</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-10 border-dashed border-slate-300">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No teacher communications yet</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    Have a doubt regarding term marks or daily attendance? Want to schedule an in-person meeting with your child's educator? Send a message now.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    onClick={() => openNewCommModal('Academic Query')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Send Query or Request Meeting
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* SUBSECTION 2: STUDENT SUPPORT REQUESTS */}
          {commSubTab === 'support-requests' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Request textbooks, school uniform sets, school bags, or scholarship assistance verified by the Head Master and sponsored by verified NGO partners.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={PlusCircle}
                  onClick={() => setIsCreateRequestModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white self-start sm:self-auto shrink-0"
                >
                  Create Support Request
                </Button>
              </div>

              {supportRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportRequests.map((req) => (
                    <Card key={req._id} className="border-slate-200 hover:border-amber-300 transition-all p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {req.category}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{req.title}</h4>
                          <p className="text-xs text-slate-500">
                            Student: <strong className="text-slate-700">{req.studentName}</strong> • {req.studentClass}
                          </p>
                        </div>
                        <div>
                          {req.status === 'Pending' && <Badge variant="amber" dot>Pending</Badge>}
                          {req.status === 'Under Review' && <Badge variant="indigo" dot>Under Review</Badge>}
                          {req.status === 'Approved' && <Badge variant="emerald" dot>Approved</Badge>}
                          {req.status === 'Forwarded to NGO/Partner' && <Badge variant="purple" dot>Forwarded to NGO</Badge>}
                          {req.status === 'Accepted' && <Badge variant="teal" dot>Accepted by NGO</Badge>}
                          {req.status === 'Ongoing' && <Badge variant="amber" dot>Ongoing</Badge>}
                          {req.status === 'Rejected' && <Badge variant="rose" dot>Declined</Badge>}
                          {req.status === 'Completed' && <Badge variant="green" dot>Completed</Badge>}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {req.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${req.priority === 'Urgent' ? 'text-rose-600' : 'text-slate-600'}`}>
                            {req.priority} Priority
                          </span>
                          {req.estimatedAmount > 0 && <span>• ₹{req.estimatedAmount}</span>}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedRequestForTimeline(req);
                            setIsTimelineModalOpen(true);
                          }}
                          className="text-amber-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          View Timeline
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-10 border-dashed border-slate-300">
                  <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No support requests created yet</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    Need assistance with textbooks, uniforms, bags, bicycle transport, or scholarship grants? Submit a request for Head Master and NGO review.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={PlusCircle}
                    onClick={() => setIsCreateRequestModalOpen(true)}
                    className="border-amber-300 text-amber-800 hover:bg-amber-50"
                  >
                    Request Support Now
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: NEW TEACHER COMMUNICATION, SUPPORT REQUEST, & TIMELINE            */}
      {/* ========================================================================= */}

      {/* New Communication / PTM Request Modal */}
      <Modal
        isOpen={isNewCommModalOpen}
        onClose={() => setIsNewCommModalOpen(false)}
        title={commForm.type === 'Meeting Request' ? 'Request Parent-Teacher Meeting (PTM)' : 'Send Query or Request Meeting with Teacher'}
        subtitle="Communicate directly with your child's teachers"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCommSubmit} className="space-y-4 pt-2 text-left">
          {/* Child Selector for Multi-child or Confirmation for Single Child */}
          {children.length > 1 ? (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Select Linked Child <span className="text-rose-500">*</span>
              </label>
              <select
                id="comm-child-select"
                value={commForm.studentId || selectedChild?._id || ''}
                onChange={(e) => {
                  const sId = e.target.value;
                  setCommForm((prev) => ({ ...prev, studentId: sId }));
                  const found = children.find((c) => String(c._id) === String(sId));
                  if (found) {
                    setSelectedChild(found);
                  }
                }}
                required
                className="w-full px-3 py-2 rounded-xl border border-purple-300 text-xs focus:ring-2 focus:ring-purple-500 bg-purple-50/40 font-medium text-slate-800"
              >
                <option value="">-- Choose Linked Child --</option>
                {children.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} (Roll #{c.rollNumber || 'N/A'} - {c.class?.name || (typeof c.class === 'string' ? c.class : 'Class 8-A')})
                  </option>
                ))}
              </select>
            </div>
          ) : (children.length === 1 || selectedChild) ? (
            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Linked Student
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {selectedChild?.name || children[0]?.name}
                </span>
                <span className="text-[11px] text-slate-500 ml-2">
                  ({selectedChild?.class?.name || children[0]?.class?.name || 'Class 8-A'} • Roll #{selectedChild?.rollNumber || children[0]?.rollNumber || 'N/A'})
                </span>
              </div>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg font-bold">
                Auto-Selected
              </span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              No linked student found for this account. Please link a student or contact school administration.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Communication Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={commForm.type}
              onChange={(e) => setCommForm({ ...commForm, type: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="Academic Query">Academic Query (Marks / Homework)</option>
              <option value="Attendance Query">Attendance Query (Absences / Streak)</option>
              <option value="Meeting Request">Request Parent-Teacher Meeting (PTM)</option>
              <option value="General Message">General Encouragement / Notice</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Select Teacher <span className="text-rose-500">*</span>
            </label>
            <select
              value={commForm.teacherId}
              onChange={(e) => setCommForm({ ...commForm, teacherId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 bg-white"
              required
            >
              <option value="">-- Choose Teacher --</option>
              {teachers.map((t) => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.name} {t.subjectSpecialization ? `(${t.subjectSpecialization})` : t.assignedSubject ? `(${t.assignedSubject})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Subject / Topic <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={commForm.subject}
              onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })}
              placeholder="e.g. Query regarding Science test scores and extra tutoring"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Detailed Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={commForm.message}
              onChange={(e) => setCommForm({ ...commForm, message: e.target.value })}
              placeholder="Write your message or question for the educator..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {commForm.type === 'Meeting Request' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div>
                <label className="block text-xs font-bold uppercase text-purple-900 mb-1">
                  Requested Date
                </label>
                <input
                  type="date"
                  value={commForm.requestedMeetingDate}
                  onChange={(e) => setCommForm({ ...commForm, requestedMeetingDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-purple-300 text-xs bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-purple-900 mb-1">
                  Preferred Time Slot
                </label>
                <select
                  value={commForm.preferredTime}
                  onChange={(e) => setCommForm({ ...commForm, preferredTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-purple-300 text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Morning (9:00 AM - 11:00 AM)">Morning (9:00 AM - 11:00 AM)</option>
                  <option value="Afternoon (1:30 PM - 3:30 PM)">Afternoon (1:30 PM - 3:30 PM)</option>
                  <option value="After School (4:00 PM - 5:00 PM)">After School (4:00 PM - 5:00 PM)</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsNewCommModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={commSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              {commSubmitting ? 'Sending...' : 'Send to Teacher'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Support Request Creation Modal */}
      <CreateSupportRequestModal
        isOpen={isCreateRequestModalOpen}
        onClose={() => setIsCreateRequestModalOpen(false)}
        onSuccess={fetchSupportRequests}
        role="parent"
        defaultStudentId={selectedChild?._id}
      />

      {/* Support Request Timeline Audit Modal */}
      <SupportRequestTimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => {
          setIsTimelineModalOpen(false);
          setSelectedRequestForTimeline(null);
        }}
        request={selectedRequestForTimeline}
      />
    </div>
  );
};

export default ParentDashboard;
