import React, { useState, useEffect } from 'react';
import {
  School,
  Users,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  PlusCircle,
  PackageCheck,
  Package,
  Layers,
  FileText,
  Clock,
  Award,
  BookOpen,
  Sparkles,
  TrendingUp,
  Building,
  RefreshCw,
  Search,
  Edit3,
  Trash2,
  UserCheck,
  BarChart3,
  GraduationCap,
  X,
  Save,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Check,
  ChevronRight,
  Filter,
  User,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card, { CardHeader, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EarlyAttentionBadge from '../../components/common/EarlyAttentionBadge';
import CreateNeedModal from '../../components/dashboard/CreateNeedModal';
import PhysicalVerificationModal from '../../components/dashboard/PhysicalVerificationModal';
import InterventionModal from '../../components/dashboard/InterventionModal';

// Services
import studentService from '../../services/studentService';
import teacherService from '../../services/teacherService';
import classService from '../../services/classService';
import attendanceService from '../../services/attendanceService';
import earlyAttentionService from '../../services/earlyAttentionService';
import schoolNeedService from '../../services/schoolNeedService';
import communityDriveService from '../../services/communityDriveService';
import contributionService from '../../services/contributionService';
import inventoryService from '../../services/inventoryService';
import announcementService from '../../services/announcementService';
import reportService from '../../services/reportService';
import supportRequestService from '../../services/supportRequestService';
import SupportRequestTimelineModal from '../../components/dashboard/SupportRequestTimelineModal';

export const AdminDashboard = () => {
  const { user } = useAuth();

  // Exactly 5 Main Dashboard Sections
  const [activeSection, setActiveSection] = useState('student-management');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Student Management State
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [studentAttentionFilter, setStudentAttentionFilter] = useState('ALL');
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [studentBeingEdited, setStudentBeingEdited] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    rollNumber: '',
    gender: 'Male',
    classId: '',
    section: 'A',
    parentName: '',
    parentPhone: '',
  });

  // 2. Teacher Management State
  const [teachers, setTeachers] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: 'Mathematics',
    classId: '',
    isClassTeacher: false,
    assignedSubjectNames: ['Mathematics'],
  });

  // 3. Academic Monitoring State
  const [attentionData, setAttentionData] = useState(null);
  const [academicFilter, setAcademicFilter] = useState('ALL');
  const [selectedStudentForIntervention, setSelectedStudentForIntervention] = useState(null);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);

  // 4. Reports & Analytics State
  const [schoolReport, setSchoolReport] = useState(null);

  // 5. Community & Support State
  const [communityTab, setCommunityTab] = useState('support-requests');
  const [schoolNeeds, setSchoolNeeds] = useState([]);
  const [drives, setDrives] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedContributionForVerify, setSelectedContributionForVerify] = useState(null);

  // Support Requests State
  const [supportRequests, setSupportRequests] = useState([]);
  const [supportRequestFilter, setSupportRequestFilter] = useState('ALL');
  const [supportRequestSearch, setSupportRequestSearch] = useState('');
  const [ngos, setNgos] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    action: 'Approve',
    reviewNotes: '',
    targetNgoId: '',
    targetNgoName: '',
  });
  const [selectedRequestForTimeline, setSelectedRequestForTimeline] = useState(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        studentsRes,
        teachersRes,
        classesRes,
        attentionRes,
        reportRes,
        needsRes,
        drivesRes,
        contribsRes,
        invRes,
        requestsRes,
        ngosRes,
      ] = await Promise.allSettled([
        studentService.getStudents(),
        teacherService.getTeachers(),
        classService.getClasses(),
        earlyAttentionService.getDashboard(),
        reportService.getSchoolSummaryReport(),
        schoolNeedService.getSchoolNeeds(),
        communityDriveService.getCommunityDrives(),
        contributionService.getContributions(),
        inventoryService.getInventory(),
        supportRequestService.getSupportRequests(),
        supportRequestService.getNgos(),
      ]);

      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data || []);
      if (teachersRes.status === 'fulfilled') setTeachers(teachersRes.value.data || []);
      if (classesRes.status === 'fulfilled') setClasses(classesRes.value.data || []);
      if (attentionRes.status === 'fulfilled') setAttentionData(attentionRes.value || null);
      if (reportRes.status === 'fulfilled') setSchoolReport(reportRes.value.data || null);
      if (needsRes.status === 'fulfilled') setSchoolNeeds(needsRes.value.data || []);
      if (drivesRes.status === 'fulfilled') setDrives(drivesRes.value.data || []);
      if (contribsRes.status === 'fulfilled') setContributions(contribsRes.value.data || []);
      if (invRes.status === 'fulfilled') setInventory(invRes.value.data || []);
      if (requestsRes.status === 'fulfilled') setSupportRequests(requestsRes.value.data || []);
      if (ngosRes.status === 'fulfilled') setNgos(ngosRes.value.data || []);
    } catch (e) {
      console.error('Error loading headmaster dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (req) => {
    setSelectedRequestForReview(req);
    const initialAction = req.status === 'Approved' ? 'Forward to NGO/Partner' : 'Approve';
    setReviewForm({
      action: initialAction,
      reviewNotes: '',
      targetNgoId: ngos[0]?._id || '',
      targetNgoName: ngos[0]?.organizationName || ngos[0]?.name || 'Institutional Partner Foundation',
    });
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequestForReview) return;
    try {
      await supportRequestService.reviewSupportRequest(selectedRequestForReview._id, reviewForm);
      showToast(`Support request "${selectedRequestForReview.title}" updated successfully!`);
      setIsReviewModalOpen(false);
      const res = await supportRequestService.getSupportRequests();
      setSupportRequests(res.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update support request');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- 1. STUDENT MANAGEMENT HANDLERS ---
  const handleOpenEditStudent = (student) => {
    setStudentBeingEdited(student);
    setEditStudentForm({
      name: student.name || '',
      rollNumber: student.rollNumber || '',
      gender: student.gender || 'Male',
      classId: student.class?._id || student.class || classes[0]?._id || '',
      section: student.section || student.class?.section || 'A',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
    });
    setIsEditStudentModalOpen(true);
  };

  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    if (!studentBeingEdited) return;

    try {
      await studentService.updateStudent(studentBeingEdited._id, editStudentForm);
      showToast(`Student ${editStudentForm.name} profile and class updated successfully!`);
      setIsEditStudentModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update student details');
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    const matchQuery =
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.rollNumber && s.rollNumber.toString().includes(q));

    const matchClass =
      selectedClassFilter === 'ALL' ||
      s.class?._id === selectedClassFilter ||
      s.class?.name === selectedClassFilter ||
      s.class === selectedClassFilter;

    const matchAttention =
      studentAttentionFilter === 'ALL' ||
      (studentAttentionFilter === 'ATTENTION' &&
        (s.attentionLevel === 'HIGH_ATTENTION' ||
          s.currentAttendanceRate < 60 ||
          s.currentAcademicAverage < 40)) ||
      (studentAttentionFilter === 'NORMAL' && s.attentionLevel !== 'HIGH_ATTENTION');

    return matchQuery && matchClass && matchAttention;
  });

  // --- 2. TEACHER MANAGEMENT HANDLERS ---
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({
      name: '',
      phone: '',
      email: '',
      specialization: 'Mathematics',
      classId: classes[0]?._id || '',
      isClassTeacher: false,
      assignedSubjectNames: ['Mathematics'],
    });
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({
      name: teacher.name || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      specialization: teacher.specialization || 'General Subject',
      classId: teacher.classTeacherOf?._id || classes[0]?._id || '',
      isClassTeacher: !!teacher.classTeacherOf,
      assignedSubjectNames: teacher.assignedSubjects?.map((s) => s.subjectName) || ['Mathematics'],
    });
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await teacherService.updateTeacher(editingTeacher._id, teacherForm);
        showToast(`Teacher ${teacherForm.name} profile updated successfully!`);
      } else {
        await teacherService.createTeacher(teacherForm);
        showToast(`Faculty member ${teacherForm.name} added successfully!`);
      }
      setIsTeacherModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save teacher profile');
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (window.confirm(`Are you sure you want to remove teacher ${teacherName}?`)) {
      try {
        await teacherService.deleteTeacher(teacherId);
        showToast(`Faculty member ${teacherName} removed.`);
        fetchDashboardData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete teacher');
      }
    }
  };

  // --- 3. ACADEMIC MONITORING HANDLERS ---
  const academicStudents = students.filter((s) => {
    if (academicFilter === 'LOW_ATTENDANCE') {
      return (s.currentAttendanceRate || 85) < 75;
    }
    if (academicFilter === 'POOR_MARKS') {
      return (s.currentAcademicAverage || 65) < 50;
    }
    if (academicFilter === 'ABSENCE_STREAK') {
      return (s.consecutiveAbsences || 0) >= 3;
    }
    if (academicFilter === 'HIGH_ATTENTION') {
      return (
        s.attentionLevel === 'HIGH_ATTENTION' ||
        (s.currentAttendanceRate || 85) < 60 ||
        (s.currentAcademicAverage || 65) < 40
      );
    }
    return true;
  });

  const openInterventionModal = (std) => {
    setSelectedStudentForIntervention(std);
    setIsInterventionModalOpen(true);
  };

  // --- 5. COMMUNITY & SUPPORT HANDLERS ---
  const handleApproveContribution = async (contribId) => {
    try {
      await contributionService.reviewContribution(
        contribId,
        'APPROVE',
        'Pledge approved by Head Master. Ready for physical handover.'
      );
      showToast('Community contribution approved!');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve contribution');
    }
  };

  const handleRejectContribution = async (contribId) => {
    const reason = prompt('Please provide reason for declining pledge:');
    if (reason !== null) {
      try {
        await contributionService.reviewContribution(contribId, 'REJECT', reason);
        showToast('Community contribution updated.');
        fetchDashboardData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to reject contribution');
      }
    }
  };

  const openVerificationModal = (contrib) => {
    setSelectedContributionForVerify(contrib);
    setIsVerifyModalOpen(true);
  };

  // Filter contributions by role
  const ngoContributions = contributions.filter((c) => c.contributorRole === 'ngo');
  const alumniContributions = contributions.filter((c) => c.contributorRole === 'alumni');
  const villageContributions = contributions.filter(
    (c) => c.contributorRole === 'village_head' || c.contributorRole === 'villager' || c.contributorRole === 'community_member'
  );

  // Overall metric helpers
  const totalStudentsCount = students.length;
  const avgAttendance = totalStudentsCount > 0
    ? Math.round(students.reduce((acc, cur) => acc + (cur.currentAttendanceRate || 85), 0) / totalStudentsCount)
    : 88;
  const avgAcademicScore = totalStudentsCount > 0
    ? Math.round(students.reduce((acc, cur) => acc + (cur.currentAcademicAverage || 65), 0) / totalStudentsCount)
    : 72;
  const atRiskCount = students.filter(
    (s) => s.attentionLevel === 'HIGH_ATTENTION' || s.currentAttendanceRate < 60 || s.currentAcademicAverage < 40
  ).length;

  // The 5 Main Dashboard Sections definition
  const dashboardSections = [
    {
      id: 'student-management',
      title: '1. Student Management',
      shortTitle: 'Students',
      subtitle: 'Roster, Profiles & Class Allocations',
      icon: Users,
      badge: `${students.length} Enrolled`,
      badgeColor: 'blue',
    },
    {
      id: 'teacher-management',
      title: '2. Teacher Management',
      shortTitle: 'Faculty',
      subtitle: 'Profiles, Class & Subject Allocation',
      icon: BookOpen,
      badge: `${teachers.length} Faculty`,
      badgeColor: 'emerald',
    },
    {
      id: 'academic-monitoring',
      title: '3. Academic Monitoring',
      shortTitle: 'Academics',
      subtitle: 'Teacher Attendance & Subject Marks',
      icon: Award,
      badge: `${atRiskCount} Need Attention`,
      badgeColor: atRiskCount > 0 ? 'rose' : 'emerald',
    },
    {
      id: 'reports-analytics',
      title: '4. Reports & Analytics',
      shortTitle: 'Analytics',
      subtitle: 'Class Attendance & Subject Averages',
      icon: TrendingUp,
      badge: 'Institutional Reports',
      badgeColor: 'indigo',
    },
    {
      id: 'community-support',
      title: '5. Community & Support',
      shortTitle: 'Community',
      subtitle: 'Support Requests, NGOs & Village Drives',
      icon: HeartHandshake,
      badge: supportRequests.filter((r) => r.status === 'Pending').length > 0
        ? `${supportRequests.filter((r) => r.status === 'Pending').length} Pending Requests`
        : `${supportRequests.length + contributions.length} Initiatives`,
      badgeColor: supportRequests.filter((r) => r.status === 'Pending').length > 0 ? 'amber' : 'emerald',
    },
  ];

  const pendingRequestsCount = supportRequests.filter(
    (r) => r.status === 'Pending' || r.status === 'Under Review'
  ).length;

  const forwardedRequestsCount = supportRequests.filter(
    (r) => r.status === 'Forwarded to NGO/Partner' || r.status === 'Accepted'
  ).length;

  const completedRequestsCount = supportRequests.filter(
    (r) => r.status === 'Completed'
  ).length;

  const filteredSupportRequests = supportRequests.filter((r) => {
    if (supportRequestFilter !== 'ALL' && r.status !== supportRequestFilter) return false;
    if (supportRequestSearch.trim()) {
      const q = supportRequestSearch.toLowerCase();
      const matchName = r.studentName?.toLowerCase().includes(q);
      const matchRoll = r.studentRoll?.toLowerCase().includes(q);
      const matchTitle = r.title?.toLowerCase().includes(q);
      const matchCategory = r.category?.toLowerCase().includes(q);
      const matchRequester = r.requesterName?.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchTitle && !matchCategory && !matchRequester) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="emerald" size="sm" dot>
                Institutional Head Office
              </Badge>
              <span className="text-xs text-emerald-300 font-semibold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                Govt Model Higher Secondary School • Sundarpur
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Headmaster'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              School Head Master Administrative Portal. Oversee students, teachers, academic progress, institutional analytics, and village stakeholder partnerships.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchDashboardData}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
            >
              Refresh Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => setIsNeedModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold"
            >
              + Post School Need
            </Button>
          </div>
        </div>
      </div>

      {/* Institutional Top Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 p-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalStudentsCount}</p>
          <p className="text-[11px] text-slate-500">Students across all classes</p>
        </Card>
        <Card className="border-slate-200 p-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Faculty Members</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{teachers.length}</p>
          <p className="text-[11px] text-slate-500">Active teaching staff</p>
        </Card>
        <Card className="border-slate-200 p-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">School Attendance</span>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">{avgAttendance}%</p>
          <p className="text-[11px] text-slate-500">Cumulative average</p>
        </Card>
        <Card className="border-slate-200 p-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Academic Score</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{avgAcademicScore}%</p>
          <p className="text-[11px] text-slate-500">Institution academic average</p>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 5 MAIN DASHBOARD SECTION SELECTOR CARDS / MENU ITEMS      */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Head Master Governance Workspace</h2>
          <span className="text-xs text-slate-500">Select any section to access its dedicated management tools</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {dashboardSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />
                )}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sec.badge}
                  </span>
                </div>
                <h3 className={`font-extrabold text-sm ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {sec.title}
                </h3>
                <p className={`text-[11px] mt-1 line-clamp-2 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  {sec.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: STUDENT MANAGEMENT                             */}
      {/* ========================================================= */}
      {activeSection === 'student-management' && (
        <Card className="border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Student Directory & Classroom Assignment
              </h3>
              <p className="text-xs text-slate-500">
                View all students, update personal profiles, assign class/sections, and filter records without data duplication.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name or roll..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 w-44 sm:w-56"
                />
              </div>

              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-semibold"
              >
                <option value="ALL">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={studentAttentionFilter}
                onChange={(e) => setStudentAttentionFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="NORMAL">Normal Progress</option>
                <option value="ATTENTION">Needs Attention</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Roll No</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Class & Section</th>
                  <th className="p-3.5">Parent / Guardian</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Academic Avg</th>
                  <th className="p-3.5">Support Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70">
                    <td className="p-3.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-extrabold text-xs">
                        #{s.rollNumber}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                      <p className="text-[10px] text-slate-500">{s.gender || 'Male'}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold border border-blue-200 text-[11px]">
                        {s.class?.name || 'Class 8-A'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="text-slate-800 font-semibold">{s.parentName || 'Guardian'}</p>
                      <p className="text-[10px] text-slate-500">{s.parentPhone || 'Phone unlisted'}</p>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-bold ${
                          (s.currentAttendanceRate || 85) < 60
                            ? 'text-rose-700'
                            : (s.currentAttendanceRate || 85) < 75
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {s.currentAttendanceRate !== undefined ? s.currentAttendanceRate : 85}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">
                        {s.currentAcademicAverage !== undefined ? s.currentAcademicAverage : 65}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      <EarlyAttentionBadge level={s.attentionLevel} size="xs" />
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Edit3}
                        onClick={() => handleOpenEditStudent(s)}
                        className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                      >
                        Edit Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: TEACHER MANAGEMENT                             */}
      {/* ========================================================= */}
      {activeSection === 'teacher-management' && (
        <div className="space-y-6">
          <Card className="border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  Faculty Management & Subject Allocation
                </h3>
                <p className="text-xs text-slate-500">
                  Manage teacher profiles, assign faculty to classes, and review which educator is teaching which subject.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  icon={PlusCircle}
                  onClick={handleOpenAddTeacher}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  + Add Faculty Member
                </Button>
              </div>
            </div>

            {/* Faculty Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5">Faculty Name</th>
                    <th className="p-3.5">Contact Details</th>
                    <th className="p-3.5">Primary Specialization</th>
                    <th className="p-3.5">Class Teacher Role</th>
                    <th className="p-3.5">Assigned Subjects</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {teachers.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/70">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xs shrink-0">
                            {t.name ? t.name.charAt(0).toUpperCase() : 'T'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                            <p className="text-[10px] text-slate-500">{t.schoolName || 'Govt School'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">{t.phone}</p>
                        <p className="text-[10px] text-slate-500">{t.email || 'Email unlisted'}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {t.specialization || 'General Academic'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {t.classTeacherOf ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200 text-[11px]">
                            <Check className="w-3 h-3" /> Class Teacher of {t.classTeacherOf.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Subject Teacher</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {t.assignedSubjects && t.assignedSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {t.assignedSubjects.map((sub, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold"
                              >
                                {sub.className}: {sub.subjectName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No active subjects allocated</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <Button
                          size="xs"
                          variant="outline"
                          icon={Edit3}
                          onClick={() => handleOpenEditTeacher(t)}
                          className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                        >
                          Edit & Assign
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          icon={Trash2}
                          onClick={() => handleDeleteTeacher(t._id, t.name)}
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
          </Card>

          {/* Class & Subject Teaching Matrix */}
          <Card className="border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Classroom & Subject Teaching Matrix (Who is Handling What)
            </h4>
            <p className="text-xs text-slate-500">
              Clear institutional overview of all classrooms and educator assignments across grades.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-sm">{cls.name}</h5>
                      <p className="text-[11px] text-slate-500">
                        {cls.roomNumber || 'Room 101'} • Grade {cls.grade}-{cls.section}
                      </p>
                    </div>
                    <Badge variant="blue" size="xs">
                      Class Teacher: {cls.classTeacher?.name || teachers.find((t) => t.classTeacherOf?._id === cls._id)?.name || 'Unassigned'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subjects & Faculty</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cls.subjects && cls.subjects.length > 0 ? (
                        cls.subjects.map((sub, i) => (
                          <div key={i} className="p-2 rounded-xl bg-white border border-slate-200 text-xs">
                            <p className="font-bold text-slate-800">{sub.name}</p>
                            <p className="text-[10px] text-slate-500">
                              Educator: {sub.teacher?.name || teachers[0]?.name || 'Staff Allocated'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-400">
                          General Academic Curriculum
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: ACADEMIC MONITORING                            */}
      {/* ========================================================= */}
      {activeSection === 'academic-monitoring' && (
        <Card className="border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Academic Progress & Attendance Monitoring
              </h3>
              <p className="text-xs text-slate-500">
                Supervise student attendance and subject marks entered by classroom teachers. Identify at-risk students for counseling without disrupting teacher workflows.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAcademicFilter('ALL')}
                className={`px-3 py-1 text-xs rounded-xl font-bold transition-colors ${
                  academicFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Students ({students.length})
              </button>
              <button
                onClick={() => setAcademicFilter('LOW_ATTENDANCE')}
                className={`px-3 py-1 text-xs rounded-xl font-bold transition-colors ${
                  academicFilter === 'LOW_ATTENDANCE'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                Low Attendance (&lt;75%)
              </button>
              <button
                onClick={() => setAcademicFilter('POOR_MARKS')}
                className={`px-3 py-1 text-xs rounded-xl font-bold transition-colors ${
                  academicFilter === 'POOR_MARKS'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Academic Remedial (&lt;50%)
              </button>
              <button
                onClick={() => setAcademicFilter('ABSENCE_STREAK')}
                className={`px-3 py-1 text-xs rounded-xl font-bold transition-colors ${
                  academicFilter === 'ABSENCE_STREAK'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                Absence Streaks (&ge;3 days)
              </button>
            </div>
          </div>

          {/* Academic Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Roll</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Class</th>
                  <th className="p-3.5">Teacher-Entered Attendance</th>
                  <th className="p-3.5">Academic Average</th>
                  <th className="p-3.5">Teacher-Entered Subject Marks</th>
                  <th className="p-3.5">Support Level</th>
                  <th className="p-3.5 text-right">Head Master Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {academicStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-bold text-slate-900">#{s.rollNumber}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                      <p className="text-[10px] text-slate-500">Parent: {s.parentName} ({s.parentPhone || 'N/A'})</p>
                    </td>
                    <td className="p-3.5">{s.class?.name || 'Class 8-A'}</td>
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              (s.currentAttendanceRate || 85) < 60
                                ? 'text-rose-700'
                                : (s.currentAttendanceRate || 85) < 75
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {s.currentAttendanceRate !== undefined ? s.currentAttendanceRate : 85}%
                          </span>
                          {(s.consecutiveAbsences || 0) >= 3 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-extrabold">
                              {s.consecutiveAbsences}d absent
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-bold ${
                          (s.currentAcademicAverage || 65) < 40
                            ? 'text-rose-700'
                            : (s.currentAcademicAverage || 65) >= 75
                            ? 'text-emerald-700'
                            : 'text-indigo-700'
                        }`}
                      >
                        {s.currentAcademicAverage !== undefined ? s.currentAcademicAverage : 65}%
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      {s.subjectMarks && s.subjectMarks.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.subjectMarks.map((sm, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]"
                            >
                              <span className="text-slate-500">{sm.subject}:</span> <strong>{sm.marksObtained}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Awaiting teacher marks</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <EarlyAttentionBadge level={s.attentionLevel} size="xs" />
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="xs"
                        variant={s.attentionLevel === 'HIGH_ATTENTION' ? 'primary' : 'outline'}
                        className={s.attentionLevel === 'HIGH_ATTENTION' ? 'bg-rose-700 hover:bg-rose-800 text-white font-bold' : ''}
                        onClick={() => openInterventionModal(s)}
                      >
                        Institutional Counseling
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: REPORTS & ANALYTICS                            */}
      {/* ========================================================= */}
      {activeSection === 'reports-analytics' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Institutional Reports & Academic Analytics
              </h3>
              <p className="text-xs text-slate-500">
                School-wide attendance trends, subject performance benchmarks, and student grade distribution.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={RefreshCw}
              onClick={fetchDashboardData}
              className="text-slate-700 bg-white"
            >
              Recalculate
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Class-wise Attendance Comparison */}
            <Card className="border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Class-Wise Attendance Comparison
                </h4>
                <Badge variant="emerald" size="xs">
                  Target: &ge; 85%
                </Badge>
              </div>

              <div className="space-y-3 pt-2">
                {(schoolReport?.academics?.classWiseAttendance || [
                  { className: 'Class 8-A', attendanceRate: 88, studentCount: 5 },
                  { className: 'Class 9-A', attendanceRate: 91, studentCount: 4 },
                ]).map((cls, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">{cls.className}</span>
                      <span className="font-extrabold text-emerald-700">
                        {cls.attendanceRate}% ({cls.studentCount} Students)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${cls.attendanceRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 2. Subject-Wise Average Marks */}
            <Card className="border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Subject-Wise Academic Averages
                </h4>
                <Badge variant="blue" size="xs">
                  School Curriculum
                </Badge>
              </div>

              <div className="space-y-3 pt-2">
                {(schoolReport?.academics?.subjectWiseAverages || [
                  { subject: 'Mathematics', averageMarks: 76 },
                  { subject: 'Science', averageMarks: 74 },
                  { subject: 'English', averageMarks: 81 },
                  { subject: 'Social Science', averageMarks: 72 },
                  { subject: 'Regional Language', averageMarks: 79 },
                ]).map((sub, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{sub.subject}</span>
                      <span className="font-extrabold text-indigo-700">{sub.averageMarks}% Average</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${sub.averageMarks}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3. Overall Student Performance Distribution */}
            <Card className="border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                Student Performance & Grade Distribution
              </h4>
              <p className="text-xs text-slate-500">
                Distribution of cumulative grades across all active students in the institution.
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-2">
                {Object.entries(
                  schoolReport?.academics?.gradeDistribution || {
                    'A+': 1,
                    A: 1,
                    B: 2,
                    C: 0,
                    D: 1,
                    F: 0,
                  }
                ).map(([grade, count]) => (
                  <div key={grade} className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500">Grade {grade}</span>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">{count}</p>
                    <span className="text-[10px] text-slate-400">Students</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 4. Highlighted Students Needing Attention */}
            <Card className="border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Students Requiring Institutional Support
                </h4>
                <Badge variant="rose" size="xs">
                  Urgent Action
                </Badge>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(schoolReport?.attention?.flaggedStudents || [
                  {
                    name: 'Rahul Verma',
                    className: 'Class 8-A',
                    attendance: 52,
                    academicAverage: 38,
                    reasons: ['Critical Attendance Deficit (52%)', 'Academic Remedial Required (38%)', '8 days absence streak'],
                  },
                ]).map((std, i) => (
                  <div key={i} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">{std.name}</span>
                      <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[10px]">
                        {std.className}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Attendance: <strong>{std.attendance}%</strong> • Marks Average: <strong>{std.academicAverage}%</strong>
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {std.reasons?.map((r, ri) => (
                        <span key={ri} className="px-1.5 py-0.5 rounded bg-rose-200/60 text-rose-900 font-semibold text-[10px]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 5: COMMUNITY & SUPPORT                            */}
      {/* ========================================================= */}
      {activeSection === 'community-support' && (
        <div className="space-y-6">
          <Card className="border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-amber-600" />
                  Community, NGO & Alumni Support Coordination
                </h3>
                <p className="text-xs text-slate-500">
                  Review and coordinate education initiatives, sponsorship drives, and physical donations from village stakeholders.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  icon={PlusCircle}
                  onClick={() => setIsNeedModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  + Post School Need
                </Button>
              </div>
            </div>

            {/* Coordinated Stakeholder Sub-Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setCommunityTab('support-requests')}
                className={`px-3.5 py-1.5 text-xs rounded-xl font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                  communityTab === 'support-requests'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                Student Support Requests ({supportRequests.length})
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold">
                    {pendingRequestsCount} Pending
                  </span>
                )}
              </button>
              <button
                onClick={() => setCommunityTab('ngo')}
                className={`px-3.5 py-1.5 text-xs rounded-xl font-extrabold transition-all cursor-pointer ${
                  communityTab === 'ngo'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                NGO / Partner Support ({ngoContributions.length})
              </button>
              <button
                onClick={() => setCommunityTab('alumni')}
                className={`px-3.5 py-1.5 text-xs rounded-xl font-extrabold transition-all cursor-pointer ${
                  communityTab === 'alumni'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Alumni Support & Mentorship ({alumniContributions.length})
              </button>
              <button
                onClick={() => setCommunityTab('village')}
                className={`px-3.5 py-1.5 text-xs rounded-xl font-extrabold transition-all cursor-pointer ${
                  communityTab === 'village'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Village Local Head Requests & Drives ({drives.length})
              </button>
            </div>

            {/* Sub-Tab 0: Student Support Requests (Parent & Village Head) */}
            {communityTab === 'support-requests' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-emerald-600" />
                      Student Support Requests Verification & NGO Routing
                    </h4>
                    <p className="text-xs text-slate-500">
                      Review requests from Parents and Village Local Heads for uniforms, books, bags, scholarships, and digital devices. Verify and forward to NGOs.
                    </p>
                  </div>
                </div>

                {/* Quick KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-slate-500 block">Total Requests</span>
                    <span className="text-lg font-bold text-slate-900">{supportRequests.length}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <span className="text-amber-800 block">Pending Verification</span>
                    <span className="text-lg font-bold text-amber-900">{pendingRequestsCount}</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                    <span className="text-purple-800 block">Forwarded to NGOs</span>
                    <span className="text-lg font-bold text-purple-900">{forwardedRequestsCount}</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <span className="text-emerald-800 block">Completed & Disbursed</span>
                    <span className="text-lg font-bold text-emerald-900">{completedRequestsCount}</span>
                  </div>
                </div>

                {/* Search & Status Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={supportRequestSearch}
                      onChange={(e) => setSupportRequestSearch(e.target.value)}
                      placeholder="Search student, roll number, category, or requester..."
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs">
                    {['ALL', 'Pending', 'Under Review', 'Approved', 'Forwarded to NGO/Partner', 'Accepted', 'Completed', 'Rejected'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setSupportRequestFilter(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          supportRequestFilter === st
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st === 'ALL' ? 'All Statuses' : st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table of Requests */}
                {filteredSupportRequests.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No support requests match this filter.</p>
                    <p className="text-[11px] text-slate-400">
                      When parents or village heads submit educational requests, they appear here for verification.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">Student</th>
                          <th className="p-3">Category & Need</th>
                          <th className="p-3">Requester</th>
                          <th className="p-3">Est. Value</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Forwarded NGO</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredSupportRequests.map((req) => (
                          <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{req.studentName}</div>
                              <div className="text-[11px] text-slate-500">
                                {req.studentClass} • Roll: {req.studentRoll || 'N/A'} • {req.village}
                              </div>
                            </td>
                            <td className="p-3 max-w-xs">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-semibold text-slate-900 text-xs">{req.category}</span>
                                <Badge
                                  variant={
                                    req.priority === 'Urgent'
                                      ? 'rose'
                                      : req.priority === 'High'
                                      ? 'amber'
                                      : 'slate'
                                  }
                                  size="xs"
                                >
                                  {req.priority}
                                </Badge>
                              </div>
                              <p className="text-slate-600 line-clamp-1 text-[11px]">{req.title}</p>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{req.requesterName}</div>
                              <div className="text-[11px] text-slate-500">
                                <Badge variant={req.requesterRole === 'village_head' ? 'indigo' : 'amber'} size="xs">
                                  {req.requesterRole === 'village_head' ? 'Local Head' : 'Parent'}
                                </Badge>{' '}
                                {req.requesterPhone}
                              </div>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">
                              {req.estimatedAmount > 0 ? `₹${req.estimatedAmount}` : req.supportRequired || 'Essentials'}
                            </td>
                            <td className="p-3">
                              {req.status === 'Pending' && <Badge variant="amber" dot>Pending</Badge>}
                              {req.status === 'Under Review' && <Badge variant="indigo" dot>Under Review</Badge>}
                              {req.status === 'Approved' && <Badge variant="emerald" dot>Approved</Badge>}
                              {req.status === 'Forwarded to NGO/Partner' && <Badge variant="purple" dot>Forwarded</Badge>}
                              {req.status === 'Accepted' && <Badge variant="teal" dot>Accepted</Badge>}
                              {req.status === 'Rejected' && <Badge variant="rose" dot>Declined</Badge>}
                              {req.status === 'Completed' && <Badge variant="green" dot>Completed</Badge>}
                            </td>
                            <td className="p-3 text-[11px] text-slate-600">
                              {req.targetNgoName ? (
                                <span className="font-semibold text-purple-700">{req.targetNgoName}</span>
                              ) : (
                                <span className="text-slate-400">Not Assigned</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="xs"
                                  variant="primary"
                                  onClick={() => handleOpenReviewModal(req)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                                >
                                  Review
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequestForTimeline(req);
                                    setIsTimelineModalOpen(true);
                                  }}
                                  className="text-slate-600 border-slate-200 cursor-pointer"
                                >
                                  Timeline
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 1: NGO Support */}
            {communityTab === 'ngo' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Educational Sponsorships from NGOs & Partners</h4>
                  <span className="text-xs text-slate-500">Pledged equipment, kits, and learning grants</span>
                </div>

                {ngoContributions.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                    No NGO pledges submitted yet. Click "+ Post School Need" to invite support.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {ngoContributions.map((c) => (
                      <div key={c._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{c.itemDetails}</span>
                            <Badge
                              variant={
                                c.status === 'RECEIVED' ? 'emerald' : c.status === 'APPROVED' ? 'blue' : 'amber'
                              }
                              size="xs"
                            >
                              {c.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600">
                            Organization: <strong>{c.contributorName}</strong> • Phone: {c.contributorPhone || 'N/A'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Quantity: {c.quantity} • Value: ₹{c.estimatedValue?.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {c.status === 'PENDING' && (
                            <>
                              <Button size="xs" variant="primary" onClick={() => handleApproveContribution(c._id)} className="bg-emerald-600 text-white">
                                Approve
                              </Button>
                              <Button size="xs" variant="outline" onClick={() => handleRejectContribution(c._id)} className="text-rose-600 border-rose-200">
                                Decline
                              </Button>
                            </>
                          )}
                          {c.status === 'APPROVED' && (
                            <Button size="xs" variant="primary" icon={PackageCheck} onClick={() => openVerificationModal(c)} className="bg-indigo-600 text-white font-bold">
                              Verify Receipt
                            </Button>
                          )}
                          {c.status === 'RECEIVED' && (
                            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Received & Asset Tagged
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 2: Alumni Support */}
            {communityTab === 'alumni' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Alumni Mentorship, Scholarships & Equipment</h4>
                  <span className="text-xs text-slate-500">Support from school graduates & alumni network</span>
                </div>

                {alumniContributions.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                    No alumni contributions recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {alumniContributions.map((c) => (
                      <div key={c._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{c.itemDetails}</span>
                            <Badge
                              variant={
                                c.status === 'RECEIVED' ? 'emerald' : c.status === 'APPROVED' ? 'blue' : 'amber'
                              }
                              size="xs"
                            >
                              {c.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600">
                            Donor: <strong>{c.contributorName} (Alumni)</strong> • {c.contributorEmail}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Quantity: {c.quantity} • Value: ₹{c.estimatedValue?.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {c.status === 'PENDING' && (
                            <>
                              <Button size="xs" variant="primary" onClick={() => handleApproveContribution(c._id)} className="bg-emerald-600 text-white">
                                Approve
                              </Button>
                              <Button size="xs" variant="outline" onClick={() => handleRejectContribution(c._id)} className="text-rose-600 border-rose-200">
                                Decline
                              </Button>
                            </>
                          )}
                          {c.status === 'APPROVED' && (
                            <Button size="xs" variant="primary" icon={PackageCheck} onClick={() => openVerificationModal(c)} className="bg-indigo-600 text-white font-bold">
                              Verify Receipt
                            </Button>
                          )}
                          {c.status === 'RECEIVED' && (
                            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Received & Tagged
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 3: Village Head Drives */}
            {communityTab === 'village' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Village Local Head & Panchayat Support Drives</h4>
                  <span className="text-xs text-slate-500">Community campaigns coordinated by Village Leadership</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drives.map((d) => (
                    <div key={d._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Badge variant="emerald" size="xs">
                          {d.status || 'Active'}
                        </Badge>
                        <span className="text-[10px] text-slate-500">
                          {d.contributionsCount || 0} Pledges Received
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm">{d.title}</h5>
                      <p className="text-xs text-slate-600">{d.description}</p>
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-600">Goal: {d.targetQuantity} {d.unit}</span>
                          <span className="text-emerald-700">Fulfilled: {d.fulfilledQuantity || 0}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((d.fulfilledQuantity || 0) / (d.targetQuantity || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200">
                        Organized by: {d.organizerName || 'Sarpanch Baldev Singh (Village Head)'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: EDIT STUDENT PROFILE & CLASS REASSIGNMENT MODAL  */}
      {/* ========================================================= */}
      <Modal
        isOpen={isEditStudentModalOpen}
        onClose={() => setIsEditStudentModalOpen(false)}
        title={`Edit Student: ${studentBeingEdited?.name}`}
        subtitle="Update student personal details and reassign class/section."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveStudentEdit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Student Full Name</label>
            <input
              type="text"
              value={editStudentForm.name}
              onChange={(e) => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Roll Number</label>
              <input
                type="text"
                value={editStudentForm.rollNumber}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, rollNumber: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Gender</label>
              <select
                value={editStudentForm.gender}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-emerald-600"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-900">Manage Class Assignment</label>
              <select
                value={editStudentForm.classId}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, classId: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl font-bold focus:outline-none focus:border-blue-600"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-900">Section</label>
              <select
                value={editStudentForm.section}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, section: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl font-bold focus:outline-none focus:border-blue-600"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Parent / Guardian Name</label>
              <input
                type="text"
                value={editStudentForm.parentName}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, parentName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Parent Phone Number</label>
              <input
                type="tel"
                value={editStudentForm.parentPhone}
                onChange={(e) => setEditStudentForm({ ...editStudentForm, parentPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditStudentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Save} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Save Student Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT TEACHER PROFILE & ALLOCATIONS MODAL   */}
      {/* ========================================================= */}
      <Modal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        title={editingTeacher ? `Edit Faculty: ${editingTeacher.name}` : 'Add Faculty Member'}
        subtitle="Manage educator profile, assigned classrooms, and teaching subjects."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveTeacher} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Faculty Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Smt. Lakshmi Sundaram"
              value={teacherForm.name}
              onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Phone Number *</label>
              <input
                type="tel"
                placeholder="e.g. 984041855"
                value={teacherForm.phone}
                onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Official Email</label>
              <input
                type="email"
                placeholder="teacher@school.gov.in"
                value={teacherForm.email}
                onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Primary Specialization / Subject</label>
            <input
              type="text"
              placeholder="e.g. Mathematics, Physical Science"
              value={teacherForm.specialization}
              onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Class & Subject Assignment */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-emerald-900 block">Classroom & Subject Assignment</span>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">Assign to Class</label>
              <select
                value={teacherForm.classId}
                onChange={(e) => setTeacherForm({ ...teacherForm, classId: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl font-bold focus:outline-none focus:border-emerald-600"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={teacherForm.isClassTeacher}
                onChange={(e) => setTeacherForm({ ...teacherForm, isClassTeacher: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-800">
                Designate as Primary Class Teacher of this class
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTeacherModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Save} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {editingTeacher ? 'Save Changes' : 'Create Faculty Profile'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* AUXILIARY SHARED MODALS */}
      <CreateNeedModal
        isOpen={isNeedModalOpen}
        onClose={() => setIsNeedModalOpen(false)}
        onNeedCreated={fetchDashboardData}
      />

      {selectedContributionForVerify && (
        <PhysicalVerificationModal
          isOpen={isVerifyModalOpen}
          onClose={() => {
            setIsVerifyModalOpen(false);
            setSelectedContributionForVerify(null);
          }}
          contribution={selectedContributionForVerify}
          onVerified={fetchDashboardData}
        />
      )}

      {selectedStudentForIntervention && (
        <InterventionModal
          isOpen={isInterventionModalOpen}
          onClose={() => {
            setIsInterventionModalOpen(false);
            setSelectedStudentForIntervention(null);
          }}
          student={selectedStudentForIntervention}
          onInterventionAdded={fetchDashboardData}
        />
      )}

      {/* SUPPORT REQUEST REVIEW & FORWARD MODAL */}
      {selectedRequestForReview && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedRequestForReview(null);
          }}
          title="Review & Verify Student Support Request"
          subtitle={`Student: ${selectedRequestForReview.studentName} (${selectedRequestForReview.studentClass}) • Requester: ${selectedRequestForReview.requesterName}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4 text-left pt-2">
            {/* Request Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{selectedRequestForReview.title}</span>
                <Badge variant="indigo" size="xs">{selectedRequestForReview.category}</Badge>
              </div>
              <p className="text-slate-600">{selectedRequestForReview.description}</p>
              <div className="grid grid-cols-2 gap-2 text-slate-500 pt-1 border-t border-slate-200/60">
                <div>
                  <strong>Estimated Value / Items:</strong>{' '}
                  {selectedRequestForReview.estimatedAmount > 0
                    ? `₹${selectedRequestForReview.estimatedAmount}`
                    : selectedRequestForReview.supportRequired || 'Essential Supplies'}
                </div>
                <div>
                  <strong>Current Status:</strong>{' '}
                  <span className="font-semibold text-slate-800">{selectedRequestForReview.status}</span>
                </div>
              </div>
            </div>

            {/* Decision / Action Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Verification Decision / Action
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'Approve', label: 'Verify & Approve', color: 'emerald' },
                  { value: 'Forward to NGO/Partner', label: 'Forward to NGO / Partner', color: 'purple' },
                  { value: 'Request Information', label: 'Request More Info', color: 'indigo' },
                  { value: 'Reject', label: 'Reject Request', color: 'rose' },
                ].map((act) => (
                  <button
                    key={act.value}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, action: act.value })}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      reviewForm.action === act.value
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target NGO Selection when Forwarding */}
            {reviewForm.action === 'Forward to NGO/Partner' && (
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-purple-950 block">
                  Select Target NGO / Partner Organization
                </label>
                {ngos.length === 0 ? (
                  <p className="text-xs text-purple-700">
                    No verified partner NGOs registered yet. The request will be forwarded to the general verified NGO partner queue.
                  </p>
                ) : (
                  <select
                    value={reviewForm.targetNgoId}
                    onChange={(e) => {
                      const found = ngos.find((n) => n._id === e.target.value);
                      setReviewForm({
                        ...reviewForm,
                        targetNgoId: e.target.value,
                        targetNgoName: found?.organizationName || found?.name || '',
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
                  >
                    {ngos.map((n) => (
                      <option key={n._id} value={n._id}>
                        {n.organizationName || n.name} ({n.phone || n.email || 'Partner'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Review Notes / Recommendation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Head Master Review Notes / Instructions
              </label>
              <textarea
                value={reviewForm.reviewNotes}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                placeholder="Enter verification notes, recommendations for NGO partner, or reason for status update..."
                rows={3}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setSelectedRequestForReview(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Check}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                Confirm Decision
              </Button>
            </div>
          </form>
        </Modal>
      )}

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

export default AdminDashboard;
