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
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Building,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card, { CardHeader, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EarlyAttentionBadge from '../../components/common/EarlyAttentionBadge';
import CreateNeedModal from '../../components/dashboard/CreateNeedModal';
import PhysicalVerificationModal from '../../components/dashboard/PhysicalVerificationModal';
import InterventionModal from '../../components/dashboard/InterventionModal';
import MarksEntryModal from '../../components/dashboard/MarksEntryModal';
import StudentAttendanceModal from '../../components/dashboard/StudentAttendanceModal';
import AttendanceMarkerModal from '../../components/dashboard/AttendanceMarkerModal';

// Services
import studentService from '../../services/studentService';
import attendanceService from '../../services/attendanceService';
import earlyAttentionService from '../../services/earlyAttentionService';
import schoolNeedService from '../../services/schoolNeedService';
import communityDriveService from '../../services/communityDriveService';
import contributionService from '../../services/contributionService';
import inventoryService from '../../services/inventoryService';
import announcementService from '../../services/announcementService';
import reportService from '../../services/reportService';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('early-attention');
  const [loading, setLoading] = useState(true);

  // State Data
  const [students, setStudents] = useState([]);
  const [attentionData, setAttentionData] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [schoolNeeds, setSchoolNeeds] = useState([]);
  const [drives, setDrives] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [schoolReport, setSchoolReport] = useState(null);

  // Modals
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedContributionForVerify, setSelectedContributionForVerify] = useState(null);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [selectedStudentForIntervention, setSelectedStudentForIntervention] = useState(null);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState(null);
  const [isStudentAttendanceModalOpen, setIsStudentAttendanceModalOpen] = useState(false);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        studentsRes,
        attentionRes,
        attendanceRes,
        needsRes,
        drivesRes,
        contribsRes,
        invRes,
        invSummaryRes,
        annRes,
        reportRes,
      ] = await Promise.allSettled([
        studentService.getStudents(),
        earlyAttentionService.getDashboard(),
        attendanceService.getTodaySummary(),
        schoolNeedService.getSchoolNeeds(),
        communityDriveService.getCommunityDrives(),
        contributionService.getContributions(),
        inventoryService.getInventory(),
        inventoryService.getInventorySummary(),
        announcementService.getAnnouncements(),
        reportService.getSchoolSummaryReport(),
      ]);

      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data || []);
      if (attentionRes.status === 'fulfilled') setAttentionData(attentionRes.value || null);
      if (attendanceRes.status === 'fulfilled') setAttendanceSummary(attendanceRes.value.data || null);
      if (needsRes.status === 'fulfilled') setSchoolNeeds(needsRes.value.data || []);
      if (drivesRes.status === 'fulfilled') setDrives(drivesRes.value.data || []);
      if (contribsRes.status === 'fulfilled') setContributions(contribsRes.value.data || []);
      if (invRes.status === 'fulfilled') setInventory(invRes.value.data || []);
      if (invSummaryRes.status === 'fulfilled') setInventorySummary(invSummaryRes.value.data || null);
      if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data || []);
      if (reportRes.status === 'fulfilled') setSchoolReport(reportRes.value.data || null);
    } catch (e) {
      console.error('Error fetching admin dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproveContribution = async (contribId) => {
    try {
      await contributionService.reviewContribution(contribId, 'APPROVE', 'Pledge approved by Headmaster. Ready for physical handover.');
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

  const openInterventionModal = (std) => {
    setSelectedStudentForIntervention(std);
    setIsInterventionModalOpen(true);
  };

  const tabs = [
    { id: 'early-attention', label: 'Early Attention & Welfare', icon: AlertTriangle, count: attentionData?.summary?.highAttentionCount },
    { id: 'needs-drives', label: 'School Needs & Drives', icon: HeartHandshake, count: schoolNeeds.length },
    { id: 'contributions', label: 'Contribution Verification', icon: PackageCheck, count: contributions.filter((c) => c.status === 'APPROVED' || c.status === 'PENDING').length },
    { id: 'inventory', label: 'School Resource Inventory', icon: Package, count: inventory.length },
    { id: 'students', label: 'Student Directory', icon: Users, count: students.length },
    { id: 'announcements', label: 'Notices & Reports', icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
              {user?.name || 'Dr. Ramesh Sharma'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              School Headmaster Governance Portal. Manage student support indicators, verified resource requisitions, village community drives, and physical inventory handovers.
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
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
            >
              Create School Need
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{students.length || 5} Students</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Today's Attendance</span>
            <span className="font-bold text-emerald-700">{attendanceSummary?.overallRate || 92}%</span>
          </div>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Early Attention</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-700 mt-2">
            {attentionData?.summary?.highAttentionCount || 1} High Attention
          </p>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Support Watchlist</span>
            <span className="font-bold text-amber-700">
              {attentionData?.summary?.moderateAttentionCount || 1} Moderate
            </span>
          </div>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified School Needs</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <School className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{schoolNeeds.length || 3} Requisitions</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Active Village Drives</span>
            <span className="font-bold text-indigo-700">{drives.length || 2} Active</span>
          </div>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Community Assets</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {inventorySummary?.communityDonatedCount || 3} Verified Items
          </p>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Total School Assets</span>
            <span className="font-bold text-slate-900">{inventorySummary?.totalAssets || 8} Units</span>
          </div>
        </Card>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EARLY ATTENTION & STUDENT SUPPORT */}
      {activeTab === 'early-attention' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Rule-Based Student Early Attention Indicator (Core Flow 1)</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              EduConnect evaluates attendance records and academic scores against transparent criteria (Attendance &lt;60%, Marks &lt;40%, Consecutive Absences &ge;3 days) to flag children needing prompt teacher intervention and parent counseling.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {attentionData?.data?.highAttention?.map((record) => {
              const std = record.student;
              return (
                <Card key={record._id} className="border-rose-300 bg-rose-50/30">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-rose-100">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-extrabold text-sm">
                        {std?.name?.charAt(0) || 'S'}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{std?.name}</h3>
                          <EarlyAttentionBadge level={record.attentionLevel} size="xs" />
                        </div>
                        <p className="text-xs text-slate-600">
                          Roll #{std?.rollNumber} • {std?.class?.name || 'Class 8-A'} • Parent: {std?.parentName} ({std?.parentPhone})
                        </p>
                      </div>
                    </div>

                    {/* Metric Indicators */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center text-xs shadow-xs">
                        <span className="text-[10px] text-slate-400 block font-semibold">Attendance</span>
                        <span className="text-sm font-extrabold text-rose-700">{record.attendanceRate}%</span>
                      </div>
                      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center text-xs shadow-xs">
                        <span className="text-[10px] text-slate-400 block font-semibold">Average Marks</span>
                        <span className="text-sm font-extrabold text-rose-700">{record.academicAverage}%</span>
                      </div>
                      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center text-xs shadow-xs">
                        <span className="text-[10px] text-slate-400 block font-semibold">Absence Streak</span>
                        <span className="text-sm font-extrabold text-rose-700">{record.consecutiveAbsences} Days</span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={HeartHandshake}
                        onClick={() => openInterventionModal(std)}
                        className="bg-rose-700 hover:bg-rose-800 text-white"
                      >
                        Log Support Intervention
                      </Button>
                    </div>
                  </div>

                  {/* Flagged Reasons & Actions */}
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-800">Triggered Deficit Reasons:</span>
                      <ul className="space-y-1">
                        {record.flaggedReasons?.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-rose-900 bg-white/80 p-2 rounded-lg border border-rose-200">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-800">Recommended Action Plan:</span>
                      <ul className="space-y-1">
                        {record.recommendedActions?.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-slate-800 bg-white/80 p-2 rounded-lg border border-slate-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Existing Interventions */}
                  {record.interventions && record.interventions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-rose-100 space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Intervention History:</span>
                      <div className="space-y-1.5">
                        {record.interventions.map((inv, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-900">{inv.actionType}</p>
                              <p className="text-slate-600 text-[11px] mt-0.5">{inv.notes}</p>
                              {inv.parentResponse && (
                                <p className="text-emerald-700 text-[11px] font-medium mt-1">Parent Feedback: {inv.parentResponse}</p>
                              )}
                            </div>
                            <Badge variant={inv.status === 'Resolved' ? 'emerald' : 'amber'} size="xs">
                              {inv.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            {/* Moderate & Normal overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Card className="border-amber-200 bg-amber-50/20">
                <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                  <h4 className="font-bold text-slate-900 text-sm">Moderate Attention Watchlist</h4>
                  <Badge variant="amber" size="xs">
                    {attentionData?.data?.moderateAttention?.length || 0} Students
                  </Badge>
                </div>
                <div className="space-y-2 mt-3 text-xs">
                  {attentionData?.data?.moderateAttention?.map((m) => (
                    <div key={m._id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{m.student?.name}</p>
                        <p className="text-[11px] text-slate-500">Attendance: {m.attendanceRate}% • Marks: {m.academicAverage}%</p>
                      </div>
                      <Button size="xs" variant="outline" onClick={() => openInterventionModal(m.student)}>
                        Intervene
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-emerald-200 bg-emerald-50/20">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <h4 className="font-bold text-slate-900 text-sm">Normal Academic Track</h4>
                  <Badge variant="emerald" size="xs">
                    {attentionData?.data?.normal?.length || 0} Students
                  </Badge>
                </div>
                <div className="space-y-2 mt-3 text-xs">
                  {attentionData?.data?.normal?.map((n) => (
                    <div key={n._id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{n.student?.name}</p>
                        <p className="text-[11px] text-slate-500">Attendance: {n.attendanceRate}% • Marks: {n.academicAverage}%</p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700">Healthy Progress</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHOOL NEEDS & COMMUNITY DRIVES (Core Flow 2) */}
      {activeTab === 'needs-drives' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Verified School Needs & Requisitions</h2>
              <p className="text-xs text-slate-500">
                Official resource shortages approved for community mobilization and government grants.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => setIsNeedModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create New School Need
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schoolNeeds.map((need) => {
              const progressPct = need.requiredQuantity > 0 ? Math.round((need.receivedQuantity / need.requiredQuantity) * 100) : 0;
              return (
                <Card key={need._id} className="border-slate-200 flex flex-col justify-between hover:border-emerald-300 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={need.category === 'IT & Computers' ? 'blue' : 'purple'} size="xs">
                        {need.category}
                      </Badge>
                      <Badge variant={need.status === 'Completed' ? 'emerald' : need.status === 'Partially Fulfilled' ? 'amber' : 'slate'} size="xs">
                        {need.status}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{need.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{need.description}</p>

                    {/* Quantity Counters (Core Flow 2: Required vs Received vs Remaining) */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Required</span>
                        <span className="font-extrabold text-slate-900">{need.requiredQuantity} {need.unit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Received</span>
                        <span className="font-extrabold text-emerald-700">{need.receivedQuantity} {need.unit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Remaining</span>
                        <span className="font-extrabold text-rose-700">{need.remainingQuantity} {need.unit}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Fulfillment</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Dept: {need.targetDepartment}</span>
                    <span className="font-bold text-emerald-700">Verified by Admin</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CONTRIBUTION VERIFICATION & PHYSICAL RECEIPT (Core Flow 2) */}
      {activeTab === 'contributions' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Two-Stage Verification Pipeline (Core Flow 2)</span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              <strong>Step 1:</strong> Approve or Reject citizen pledges. (Approved does NOT increment inventory).<br />
              <strong>Step 2:</strong> Upon physical arrival at school, click <strong>"MARK AS RECEIVED"</strong> to assign an Asset Tag, catalog the device in Inventory, and update the School Need received count.
            </p>
          </div>

          <div className="space-y-3">
            {contributions.map((contrib) => (
              <Card key={contrib._id} className="border-slate-200 hover:border-slate-300">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{contrib.itemDetails}</h4>
                      <Badge
                        variant={
                          contrib.status === 'RECEIVED'
                            ? 'emerald'
                            : contrib.status === 'APPROVED'
                            ? 'blue'
                            : contrib.status === 'REJECTED'
                            ? 'rose'
                            : 'amber'
                        }
                        size="xs"
                      >
                        {contrib.status}
                      </Badge>
                      <Badge variant="slate" size="xs">
                        {contrib.contributionType}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      Pledged by: <strong className="text-slate-900">{contrib.contributorName}</strong> ({contrib.contributorRole}) • Drive: {contrib.drive?.title}
                    </p>
                    {contrib.notes && <p className="text-xs text-slate-500 italic">Notes: "{contrib.notes}"</p>}
                  </div>

                  {/* Verification Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {contrib.status === 'PENDING' && (
                      <>
                        <Button
                          size="xs"
                          variant="primary"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleApproveContribution(contrib._id)}
                        >
                          Approve Pledge
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-rose-700 hover:bg-rose-50"
                          onClick={() => handleRejectContribution(contrib._id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {contrib.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={PackageCheck}
                        onClick={() => openVerificationModal(contrib)}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
                      >
                        Mark as Received & Add to Inventory
                      </Button>
                    )}

                    {contrib.status === 'RECEIVED' && (
                      <div className="text-right text-xs">
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Physically Verified
                        </span>
                        <span className="text-[10px] text-slate-500">Asset Tag: {contrib.physicalVerification?.assetTag}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SCHOOL INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">School Resource & Equipment Inventory</h2>
              <p className="text-xs text-slate-500">
                Live catalog of computers, laboratory instruments, and sports gear in active student use.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => (
              <Card key={item._id} className="border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.itemName}</h4>
                    <p className="text-slate-500">Tag: {item.assetTag || 'N/A'}</p>
                  </div>
                  <Badge variant={item.source === 'Community Donation' ? 'teal' : 'blue'} size="xs">
                    {item.source}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between text-slate-600">
                  <span>Location: {item.location}</span>
                  <span>Qty: <strong>{item.totalQuantity}</strong></span>
                  <span>Condition: <strong className="text-emerald-700">{item.condition}</strong></span>
                </div>
                {item.donorName && (
                  <p className="text-[11px] text-emerald-800 font-medium">Donor: {item.donorName}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Enrolled Student Directory</h2>
              <p className="text-xs text-slate-500">
                View student performance, record/edit individual exam marks, and manage single-session attendance records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={Award}
                onClick={() => { setSelectedStudentForMarks(null); setIsMarksModalOpen(true); }}
              >
                Enter Marks
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={CheckCircle2}
                onClick={() => setIsAttendanceModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
              >
                Class Attendance
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Roll</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Class</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Academic Avg</th>
                  <th className="p-3.5">Early Attention</th>
                  <th className="p-3.5">Parent / Contact</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-bold text-slate-900">{s.rollNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{s.name}</td>
                    <td className="p-3.5">{s.class?.name || 'Class 8-A'}</td>
                    <td className="p-3.5">
                      <span className={`font-bold ${s.currentAttendanceRate < 60 ? 'text-rose-700' : 'text-slate-900'}`}>
                        {s.currentAttendanceRate}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`font-bold ${s.currentAcademicAverage < 40 ? 'text-rose-700' : 'text-slate-900'}`}>
                        {s.currentAcademicAverage}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      <EarlyAttentionBadge level={s.attentionLevel} size="xs" />
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {s.parentName} ({s.parentPhone || 'N/A'})
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Award}
                        onClick={() => {
                          setSelectedStudentForMarks(s);
                          setIsMarksModalOpen(true);
                        }}
                      >
                        Marks
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Clock}
                        onClick={() => {
                          setSelectedStudentForAttendance(s);
                          setIsStudentAttendanceModalOpen(true);
                        }}
                      >
                        Attendance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: ANNOUNCEMENTS & NOTICES */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Official Notice Board & Governance Bulletins</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <Card key={ann._id} className="border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <Badge variant="blue" size="xs">
                    {ann.category}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-medium">Audience: {ann.targetAudience}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                <p className="text-slate-600 leading-relaxed">{ann.content}</p>
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                  <span>Author: {ann.authorName}</span>
                  <span>Published Officially</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
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
          onVerificationComplete={fetchDashboardData}
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

      <MarksEntryModal
        isOpen={isMarksModalOpen}
        onClose={() => {
          setIsMarksModalOpen(false);
          setSelectedStudentForMarks(null);
        }}
        student={selectedStudentForMarks}
        students={students}
        onMarksRecorded={fetchDashboardData}
      />

      {selectedStudentForAttendance && (
        <StudentAttendanceModal
          isOpen={isStudentAttendanceModalOpen}
          onClose={() => {
            setIsStudentAttendanceModalOpen(false);
            setSelectedStudentForAttendance(null);
          }}
          student={selectedStudentForAttendance}
          onAttendanceUpdated={fetchDashboardData}
        />
      )}

      <AttendanceMarkerModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        students={students}
        onAttendanceRecorded={fetchDashboardData}
      />
    </div>
  );
};

export default AdminDashboard;
