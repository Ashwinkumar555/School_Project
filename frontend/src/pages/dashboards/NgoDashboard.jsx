import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  GraduationCap,
  Package,
  TrendingUp,
  Building,
  CheckCircle2,
  Clock,
  Check,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Sparkles,
  Award,
  BookOpen,
  Laptop,
  Shirt,
  DollarSign,
  AlertCircle,
  Edit3,
  Trash2,
  Phone,
  Mail,
  School,
  MapPin,
  FileText,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import SupportRequestTimelineModal from '../../components/dashboard/SupportRequestTimelineModal';

// Services
import supportRequestService from '../../services/supportRequestService';
import programService from '../../services/programService';
import supportRecordService from '../../services/supportRecordService';

export const NgoDashboard = () => {
  const { user } = useAuth();

  // Exactly 4 Main Dashboard Sections:
  // 1. Support Requests
  // 2. Scholarships & Programs
  // 3. Support Management
  // 4. Impact & Reports
  const [activeSection, setActiveSection] = useState('support-requests');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Support Requests State
  const [supportRequests, setSupportRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState('ALL');
  const [requestSearch, setRequestSearch] = useState('');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('Accept'); // 'Accept', 'Ongoing', 'Completed', 'Reject'
  const [selectedRequestForAction, setSelectedRequestForAction] = useState(null);
  const [actionForm, setActionForm] = useState({
    supportType: 'In-Kind Educational Supplies',
    supportDetails: '',
    completionNotes: '',
    rejectionReason: '',
  });
  const [selectedRequestForTimeline, setSelectedRequestForTimeline] = useState(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  // 2. Scholarships & Programs State
  const [programs, setPrograms] = useState([]);
  const [programFilter, setProgramFilter] = useState('ALL');
  const [programSearch, setProgramSearch] = useState('');
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [programForm, setProgramForm] = useState({
    title: '',
    type: 'Scholarship',
    description: '',
    eligibility: '',
    deadline: '',
    benefits: '',
    contactInfo: '',
    targetGrades: 'Class 6 - 12',
    status: 'Active',
    village: 'Sundarpur & Neighboring Villages',
  });

  // 3. Support Management State
  const [supportRecords, setSupportRecords] = useState([]);
  const [recordTypeFilter, setRecordTypeFilter] = useState('ALL');
  const [recordSearch, setRecordSearch] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({
    recipientType: 'Student',
    beneficiaryName: '',
    schoolName: 'Govt Higher Secondary School',
    village: 'Sundarpur',
    supportType: 'Books',
    itemDetails: '',
    quantity: 1,
    amount: '',
    dateProvided: new Date().toISOString().split('T')[0],
    status: 'Completed',
    notes: '',
  });

  // 4. Impact & Reports State
  const [impactData, setImpactData] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reqsRes, progRes, recsRes, impactRes] = await Promise.allSettled([
        supportRequestService.getSupportRequests(),
        programService.getPrograms(),
        supportRecordService.getSupportRecords(),
        supportRecordService.getNgoImpactStats(),
      ]);

      if (reqsRes.status === 'fulfilled') setSupportRequests(reqsRes.value.data || []);
      if (progRes.status === 'fulfilled') setPrograms(progRes.value.data || []);
      if (recsRes.status === 'fulfilled') setSupportRecords(recsRes.value.data || []);
      if (impactRes.status === 'fulfilled') setImpactData(impactRes.value.data || null);
    } catch (err) {
      console.error('Error loading NGO dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- SECTION 1: SUPPORT REQUEST HANDLERS ---
  const openActionModal = (request, action) => {
    setSelectedRequestForAction(request);
    setActionType(action);

    let defaultType = 'In-Kind Educational Supplies';
    const cat = request.category || '';
    if (cat.includes('Books')) defaultType = 'Textbooks & Notebooks Kit';
    else if (cat.includes('Uniform')) defaultType = 'School Uniform Sets';
    else if (cat.includes('Bag')) defaultType = 'School Bag & Stationery Set';
    else if (cat.includes('Laptop') || cat.includes('Tablet')) defaultType = 'Learning Tablet / Digital Device';
    else if (cat.includes('Scholarship') || cat.includes('Financial')) defaultType = 'Direct Educational Scholarship';

    setActionForm({
      supportType: defaultType,
      supportDetails: request.supportRequired || request.title || '',
      completionNotes: '',
      rejectionReason: '',
    });
    setIsActionModalOpen(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequestForAction) return;

    try {
      await supportRequestService.respondToSupportRequest(selectedRequestForAction._id, {
        action: actionType,
        ...actionForm,
      });
      setIsActionModalOpen(false);
      setSelectedRequestForAction(null);
      showToast(`Support request marked as ${actionType}!`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to update support request');
    }
  };

  const filteredSupportRequests = supportRequests.filter((req) => {
    if (requestFilter !== 'ALL' && req.status !== requestFilter) return false;
    if (requestSearch) {
      const q = requestSearch.toLowerCase();
      return (
        req.studentName?.toLowerCase().includes(q) ||
        req.title?.toLowerCase().includes(q) ||
        req.category?.toLowerCase().includes(q) ||
        req.village?.toLowerCase().includes(q) ||
        req.schoolName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // --- SECTION 2: SCHOLARSHIPS & PROGRAMS HANDLERS ---
  const openCreateProgramModal = (prog = null) => {
    if (prog) {
      setEditingProgram(prog);
      setProgramForm({
        title: prog.title,
        type: prog.type,
        description: prog.description,
        eligibility: prog.eligibility,
        deadline: prog.deadline ? new Date(prog.deadline).toISOString().split('T')[0] : '',
        benefits: prog.benefits,
        contactInfo: prog.contactInfo,
        targetGrades: prog.targetGrades || 'Class 6 - 12',
        status: prog.status || 'Active',
        village: prog.village || 'Sundarpur & Neighboring Villages',
      });
    } else {
      setEditingProgram(null);
      setProgramForm({
        title: '',
        type: 'Scholarship',
        description: '',
        eligibility: '',
        deadline: '',
        benefits: '',
        contactInfo: `${user?.email || 'contact@partner-ngo.org'} | ${user?.phone || '+91 98400 00000'}`,
        targetGrades: 'Class 6 - 12',
        status: 'Active',
        village: 'Sundarpur & Neighboring Villages',
      });
    }
    setIsProgramModalOpen(true);
  };

  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProgram) {
        await programService.updateProgram(editingProgram._id, programForm);
        showToast('Program opportunity updated successfully!');
      } else {
        await programService.createProgram(programForm);
        showToast('New Scholarship / Program published successfully!');
      }
      setIsProgramModalOpen(false);
      setEditingProgram(null);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to save program');
    }
  };

  const handleDeleteProgram = async (id) => {
    if (window.confirm('Are you sure you want to remove this published program opportunity?')) {
      try {
        await programService.deleteProgram(id);
        showToast('Program removed.');
        fetchDashboardData();
      } catch (err) {
        alert(err.response?.data?.message || err.response?.data?.error || 'Failed to delete program');
      }
    }
  };

  const filteredPrograms = programs.filter((p) => {
    if (programFilter !== 'ALL' && p.type !== programFilter) return false;
    if (programSearch) {
      const q = programSearch.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.benefits?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // --- SECTION 3: SUPPORT MANAGEMENT HANDLERS ---
  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    try {
      await supportRecordService.createSupportRecord({
        ...recordForm,
        quantity: Number(recordForm.quantity) || 1,
        amount: recordForm.amount ? Number(recordForm.amount) : 0,
      });
      setIsRecordModalOpen(false);
      showToast('Educational support record logged successfully!');
      setRecordForm({
        recipientType: 'Student',
        beneficiaryName: '',
        schoolName: 'Govt Higher Secondary School',
        village: 'Sundarpur',
        supportType: 'Books',
        itemDetails: '',
        quantity: 1,
        amount: '',
        dateProvided: new Date().toISOString().split('T')[0],
        status: 'Completed',
        notes: '',
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to record support');
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Delete this support entry from your management records?')) {
      try {
        await supportRecordService.deleteSupportRecord(id);
        showToast('Support record deleted.');
        fetchDashboardData();
      } catch (err) {
        alert(err.response?.data?.message || err.response?.data?.error || 'Failed to delete record');
      }
    }
  };

  const filteredRecords = supportRecords.filter((rec) => {
    if (recordTypeFilter !== 'ALL' && rec.supportType !== recordTypeFilter) return false;
    if (recordSearch) {
      const q = recordSearch.toLowerCase();
      return (
        rec.beneficiaryName?.toLowerCase().includes(q) ||
        rec.itemDetails?.toLowerCase().includes(q) ||
        rec.schoolName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // The 4 Main Dashboard Sections
  const dashboardSections = [
    {
      id: 'support-requests',
      title: '1. Support Requests',
      shortTitle: 'Support Requests',
      subtitle: 'Verified Requests Forwarded by Head Master',
      icon: HeartHandshake,
      badge: `${supportRequests.filter((r) => r.status === 'Forwarded to NGO/Partner').length} Action Required`,
      badgeColor: 'rose',
    },
    {
      id: 'scholarships-programs',
      title: '2. Scholarships & Programs',
      shortTitle: 'Scholarships & Programs',
      subtitle: 'Publish Grants, Workshops & Skill Training',
      icon: GraduationCap,
      badge: `${programs.length} Published`,
      badgeColor: 'indigo',
    },
    {
      id: 'support-management',
      title: '3. Support Management',
      shortTitle: 'Support Management',
      subtitle: 'Record & Audit Delivered Educational Support',
      icon: Package,
      badge: `${supportRecords.length} Logged`,
      badgeColor: 'emerald',
    },
    {
      id: 'impact-reports',
      title: '4. Impact & Reports',
      shortTitle: 'Impact & Reports',
      subtitle: 'Beneficiary Statistics & Reach Metrics',
      icon: TrendingUp,
      badge: 'Live Analytics',
      badgeColor: 'purple',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="rose" size="sm" dot>
                NGO / Partner Leadership
              </Badge>
              <span className="text-xs text-rose-300 font-semibold bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800">
                {user?.organizationName || 'Institutional Partner Foundation'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user?.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Collaborate on rural public education development. Fulfill verified student support requests, offer scholarships & skill programs, track material distributions, and measure social impact.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchDashboardData}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* EXACTLY 4 MAIN SECTIONS - NAVIGATION CARDS / MENU ITEMS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardSections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-rose-500 shadow-md shadow-rose-500/10 ring-2 ring-rose-500/20'
                  : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between w-full mb-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {sec.badge}
                </span>
              </div>
              <div>
                <h3 className={`font-bold text-sm ${isActive ? 'text-rose-950' : 'text-slate-800'}`}>
                  {sec.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{sec.subtitle}</p>
              </div>
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600" />}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: SUPPORT REQUESTS */}
      {activeSection === 'support-requests' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-6 h-6 text-rose-600" />
                Verified Student Support Requests
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Educational essentials verified and forwarded by the Head Master. You can Accept, Reject, mark as Ongoing, or complete delivery.
              </p>
            </div>

            {/* Filter Pill Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'Forwarded to NGO/Partner', 'Accepted', 'Ongoing', 'Completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setRequestFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    requestFilter === st
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'Forwarded to NGO/Partner'
                    ? 'Forwarded'
                    : st === 'ALL'
                    ? 'All Requests'
                    : st}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by student name, category, school, or village..."
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white"
            />
          </div>

          {/* Requests Grid */}
          {filteredSupportRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSupportRequests.map((req) => (
                <Card
                  key={req._id}
                  className={`border transition-all p-4 space-y-3.5 flex flex-col justify-between ${
                    req.status === 'Forwarded to NGO/Partner'
                      ? 'border-rose-200 bg-rose-50/20'
                      : req.status === 'Accepted'
                      ? 'border-indigo-200 bg-indigo-50/20'
                      : req.status === 'Ongoing'
                      ? 'border-amber-200 bg-amber-50/20'
                      : req.status === 'Completed'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          {req.category}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{req.title}</h4>
                      </div>
                      <div>
                        {req.status === 'Forwarded to NGO/Partner' && (
                          <Badge variant="rose" dot>Forwarded by HM</Badge>
                        )}
                        {req.status === 'Accepted' && (
                          <Badge variant="indigo" dot>Accepted / Pledged</Badge>
                        )}
                        {req.status === 'Ongoing' && (
                          <Badge variant="amber" dot>Ongoing Support</Badge>
                        )}
                        {req.status === 'Completed' && (
                          <Badge variant="emerald" dot>Completed</Badge>
                        )}
                        {req.status === 'Rejected' && (
                          <Badge variant="slate" dot>Declined</Badge>
                        )}
                      </div>
                    </div>

                    {/* Student essential info - strict privacy: no parent phone or private data */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Student</span>
                        <strong className="text-slate-800">{req.studentName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Class</span>
                        <span className="text-slate-700">{req.studentClass || 'Class 8-A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Village</span>
                        <span className="text-slate-700">{req.village || 'Sundarpur'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                        {req.description}
                      </p>
                      {req.supportRequired && (
                        <p className="text-xs text-slate-700">
                          <strong>Specific Items Required:</strong> {req.supportRequired}
                        </p>
                      )}
                    </div>

                    {/* Head Master Verification Notes */}
                    {req.headMasterReview?.reviewNotes && (
                      <div className="text-[11px] text-indigo-900 bg-indigo-50/80 p-2 rounded-lg border border-indigo-200 flex items-start gap-1.5">
                        <School className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Head Master Verification:</strong> {req.headMasterReview.reviewNotes}
                        </div>
                      </div>
                    )}

                    {/* Partner Support Commitment */}
                    {req.ngoSupport?.supportDetails && (
                      <div className="text-[11px] text-teal-900 bg-teal-50/80 p-2 rounded-lg border border-teal-200">
                        <strong>Committed Support:</strong> {req.ngoSupport.supportType} • {req.ngoSupport.supportDetails}
                        {req.ngoSupport.completionNotes && (
                          <div className="mt-0.5 text-emerald-800 font-semibold">
                            Handover Notes: {req.ngoSupport.completionNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${req.priority === 'Urgent' ? 'text-rose-600' : 'text-slate-600'}`}>
                        {req.priority} Priority
                      </span>
                      {req.estimatedAmount > 0 && (
                        <span className="font-bold text-emerald-700">• ₹{req.estimatedAmount}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Forwarded state: Accept or Reject */}
                      {req.status === 'Forwarded to NGO/Partner' && (
                        <>
                          <Button
                            size="xs"
                            variant="primary"
                            icon={Check}
                            onClick={() => openActionModal(req, 'Accept')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                          >
                            Accept Request
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => openActionModal(req, 'Reject')}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                          >
                            Decline
                          </Button>
                        </>
                      )}

                      {/* Accepted state: Update to Ongoing or Mark Completed */}
                      {req.status === 'Accepted' && (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            icon={Clock}
                            onClick={() => openActionModal(req, 'Ongoing')}
                            className="border-amber-400 text-amber-800 hover:bg-amber-50"
                          >
                            Mark Ongoing
                          </Button>
                          <Button
                            size="xs"
                            variant="primary"
                            icon={CheckCircle2}
                            onClick={() => openActionModal(req, 'Completed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Mark Completed
                          </Button>
                        </>
                      )}

                      {/* Ongoing state: Mark Completed */}
                      {req.status === 'Ongoing' && (
                        <Button
                          size="xs"
                          variant="primary"
                          icon={CheckCircle2}
                          onClick={() => openActionModal(req, 'Completed')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Mark Completed
                        </Button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedRequestForTimeline(req);
                          setIsTimelineModalOpen(true);
                        }}
                        className="text-slate-500 hover:text-slate-800 font-semibold text-xs flex items-center gap-1 cursor-pointer ml-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Timeline
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-10 text-slate-500 border-dashed border-slate-300">
              <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No support requests match your filter</p>
              <p className="text-xs text-slate-400 mt-1">
                Verified student support requests forwarded by the school Head Master will appear here.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* SECTION 2: SCHOLARSHIPS & PROGRAMS */}
      {activeSection === 'scholarships-programs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
                Scholarships & Educational Programs
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Publish scholarship grants, academic workshops, vocational training sessions, and skill-development programs for village students.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => openCreateProgramModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 self-start sm:self-auto"
            >
              + Publish Scholarship / Program
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'Scholarship', 'Educational Program', 'Workshop', 'Training', 'Skill Development'].map((t) => (
                <button
                  key={t}
                  onClick={() => setProgramFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    programFilter === t
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'ALL' ? 'All Types' : t}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search programs..."
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Programs Grid */}
          {filteredPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPrograms.map((prog) => (
                <Card
                  key={prog._id}
                  className="border-slate-200 hover:border-indigo-300 transition-all space-y-4 flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          {prog.type}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-1.5">{prog.title}</h3>
                        <span className="text-xs text-slate-500">By {prog.organizationName}</span>
                      </div>
                      <Badge
                        variant={prog.status === 'Active' ? 'green' : prog.status === 'Upcoming' ? 'amber' : 'slate'}
                        size="xs"
                      >
                        {prog.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{prog.description}</p>

                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-700">Eligibility:</strong>{' '}
                          <span className="text-slate-600">{prog.eligibility}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-700">Benefits:</strong>{' '}
                          <span className="text-slate-600">{prog.benefits}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>
                          Application Deadline:{' '}
                          <strong className="text-rose-700">
                            {prog.deadline ? new Date(prog.deadline).toLocaleDateString() : 'Rolling'}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Contact: {prog.contactInfo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Target: {prog.targetGrades}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Edit3}
                        onClick={() => openCreateProgramModal(prog)}
                        className="text-indigo-600 hover:bg-indigo-50"
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Trash2}
                        onClick={() => handleDeleteProgram(prog._id)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-10 text-slate-500 border-dashed border-slate-300">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No scholarships or programs published yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Click "+ Publish Scholarship / Program" to announce student opportunities visible to rural students and parents.
              </p>
              <Button
                size="sm"
                variant="primary"
                icon={Plus}
                onClick={() => openCreateProgramModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Publish First Program
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* SECTION 3: SUPPORT MANAGEMENT */}
      {activeSection === 'support-management' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-emerald-600" />
                Support Management & Distribution Records
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Log and maintain an audited history of all educational support provided (books, uniforms, bags, tablets, scholarships, and learning kits).
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsRecordModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 self-start sm:self-auto"
            >
              + Record Support Provided
            </Button>
          </div>

          {/* Type Filter & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'Books', 'Uniforms', 'School bags', 'Laptops/Tablets', 'Scholarships', 'Educational materials'].map((t) => (
                <button
                  key={t}
                  onClick={() => setRecordTypeFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    recordTypeFilter === t
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'ALL' ? 'All Support' : t}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search beneficiary or item..."
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Support History Records Table / Cards */}
          {filteredRecords.length > 0 ? (
            <Card className="overflow-hidden border-slate-200 p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Beneficiary</th>
                      <th className="py-3 px-4">Type of Support</th>
                      <th className="py-3 px-4">Details & Quantity</th>
                      <th className="py-3 px-4">School / Village</th>
                      <th className="py-3 px-4">Date Provided</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{rec.beneficiaryName}</div>
                          <span className="text-[10px] text-slate-400">Recipient: {rec.recipientType}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="emerald" size="xs">
                            {rec.supportType}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-700">{rec.itemDetails}</div>
                          <div className="text-[10px] text-slate-400">
                            Qty: {rec.quantity} {rec.amount > 0 && `• ₹${rec.amount}`}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{rec.schoolName}</div>
                          <div className="text-[10px] text-slate-400">{rec.village}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {rec.dateProvided ? new Date(rec.dateProvided).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={rec.status === 'Completed' ? 'green' : rec.status === 'Ongoing' ? 'amber' : 'blue'}
                            size="xs"
                          >
                            {rec.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteRecord(rec._id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="text-center py-10 text-slate-500 border-dashed border-slate-300">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No support records found</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Record supplies, uniforms, learning kits, or scholarships distributed to students and rural schools.
              </p>
              <Button
                size="sm"
                variant="primary"
                icon={Plus}
                onClick={() => setIsRecordModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Log First Support Record
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* SECTION 4: IMPACT & REPORTS */}
      {activeSection === 'impact-reports' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              Social Impact & Partnership Reports
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Holistic statistics and impact indicators summarizing educational aid, beneficiary students, scholarships, and village reach.
            </p>
          </div>

          {/* 6 Key Performance Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Requests
              </span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {impactData?.summary?.totalRequestsReceived || supportRequests.length}
              </p>
              <span className="text-[11px] text-slate-500">Forwarded by HM</span>
            </Card>

            <Card className="border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Accepted / Ongoing
              </span>
              <p className="text-2xl font-extrabold text-indigo-700 mt-1">
                {impactData?.summary?.requestsAccepted || supportRequests.filter((r) => r.status === 'Accepted' || r.status === 'Ongoing').length}
              </p>
              <span className="text-[11px] text-indigo-600 font-semibold">Active support</span>
            </Card>

            <Card className="border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Requests Completed
              </span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {impactData?.summary?.requestsCompleted || supportRequests.filter((r) => r.status === 'Completed').length}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">Delivered & verified</span>
            </Card>

            <Card className="border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Students Supported
              </span>
              <p className="text-2xl font-extrabold text-rose-700 mt-1">
                {impactData?.summary?.studentsSupported || 4}
              </p>
              <span className="text-[11px] text-slate-500">Distinct beneficiaries</span>
            </Card>

            <Card className="border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Scholarships / Grants
              </span>
              <p className="text-2xl font-extrabold text-purple-700 mt-1">
                {impactData?.summary?.totalScholarshipsProvided || 2}
              </p>
              <span className="text-[11px] text-slate-500">Awarded & funded</span>
            </Card>

            <Card className="border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Villages Reached
              </span>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">
                {impactData?.summary?.villagesSupported || 1}
              </p>
              <span className="text-[11px] text-slate-500">Gram Panchayats</span>
            </Card>
          </div>

          {/* Category Distribution Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Support Type Allocation Breakdown
              </h3>
              <div className="space-y-3">
                {(Array.isArray(impactData?.categoryBreakdown)
                  ? impactData.categoryBreakdown
                  : Object.entries(
                      impactData?.categoryCounts ||
                      impactData?.categoryBreakdown || {
                        'Books & Stationery': 3,
                        'School Uniforms': 2,
                        'School Bags': 1,
                        'Digital Devices & Laptops': 1,
                        'Scholarships & Grants': 2,
                        'Educational Materials': 1,
                      }
                    ).map(([cat, count]) => ({ category: cat, count }))
                ).map(({ category: cat, count }) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{cat}</span>
                      <span className="font-bold text-indigo-700">{count} Provided</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(10, count * 20))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Partnership Value & Institutional Reach
                </h3>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white space-y-3">
                  <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider block">
                    Cumulative Support Impact
                  </span>
                  <div className="text-3xl font-extrabold text-white">
                    ₹{(impactData?.summary?.totalEstimatedGrantValue || 14500).toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Direct educational materials and financial scholarship commitments deployed to keep rural students in school and improve academic retention.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  All completed support requests are verified through Head Master audit checkpoints.
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Support Request Action Modal (Accept, Ongoing, Completed, Reject) */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={
          actionType === 'Accept'
            ? 'Accept & Sponsor Support Request'
            : actionType === 'Ongoing'
            ? 'Update Request to Ongoing'
            : actionType === 'Completed'
            ? 'Mark Support as Completed & Handed Over'
            : 'Decline Support Request'
        }
        subtitle={
          selectedRequestForAction
            ? `Student: ${selectedRequestForAction.studentName} • ${selectedRequestForAction.category}`
            : ''
        }
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleActionSubmit} className="space-y-4 pt-2 text-left">
          {actionType === 'Accept' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Type of Support Pledged <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={actionForm.supportType}
                  onChange={(e) => setActionForm({ ...actionForm, supportType: e.target.value })}
                  placeholder="e.g. 2 Sets of School Uniforms, Textbooks Kit, Scholarship"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Support Commitment Details
                </label>
                <textarea
                  rows={2}
                  value={actionForm.supportDetails}
                  onChange={(e) => setActionForm({ ...actionForm, supportDetails: e.target.value })}
                  placeholder="e.g. Committed to provide uniforms before term exams begin..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </>
          )}

          {actionType === 'Ongoing' && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Ongoing Progress / Procurement Notes
              </label>
              <textarea
                rows={3}
                required
                value={actionForm.supportDetails}
                onChange={(e) => setActionForm({ ...actionForm, supportDetails: e.target.value })}
                placeholder="e.g. Uniforms have been stitched and dispatched for school delivery..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
          )}

          {actionType === 'Completed' && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Handover & Completion Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={actionForm.completionNotes}
                onChange={(e) => setActionForm({ ...actionForm, completionNotes: e.target.value })}
                placeholder="e.g. 2 sets of uniform handed over to student in presence of school head..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          )}

          {actionType === 'Reject' && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Reason for Declining <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={actionForm.rejectionReason}
                onChange={(e) => setActionForm({ ...actionForm, rejectionReason: e.target.value })}
                placeholder="e.g. Budget exhausted for current quarter, unable to fulfill at this time..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsActionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className={
                actionType === 'Completed'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                  : actionType === 'Ongoing'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold'
                  : actionType === 'Reject'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white font-bold'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold'
              }
            >
              Confirm {actionType}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Create / Edit Program Modal */}
      <Modal
        isOpen={isProgramModalOpen}
        onClose={() => setIsProgramModalOpen(false)}
        title={editingProgram ? 'Edit Program Opportunity' : 'Publish Scholarship / Educational Program'}
        subtitle="Publish opportunities that students and parents can view on their platform dashboards."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleProgramSubmit} className="space-y-3.5 pt-2 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Program Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={programForm.title}
                onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                placeholder="e.g. Rural Merit Scholarship 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={programForm.type}
                onChange={(e) => setProgramForm({ ...programForm, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Scholarship">Scholarship</option>
                <option value="Educational Program">Educational Program</option>
                <option value="Workshop">Workshop</option>
                <option value="Training">Training</option>
                <option value="Skill Development">Skill Development</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={programForm.description}
              onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
              placeholder="Explain the objectives, curriculum, or scope of this opportunity..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Eligibility Criteria <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={programForm.eligibility}
                onChange={(e) => setProgramForm({ ...programForm, eligibility: e.target.value })}
                placeholder="e.g. Class 8-10, Minimum 65% marks"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Application Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={programForm.deadline}
                onChange={(e) => setProgramForm({ ...programForm, deadline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Benefits Provided <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={programForm.benefits}
              onChange={(e) => setProgramForm({ ...programForm, benefits: e.target.value })}
              placeholder="e.g. ₹5,000 Annual Grant, Free Textbooks Kit, Certificate"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Contact Information <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={programForm.contactInfo}
                onChange={(e) => setProgramForm({ ...programForm, contactInfo: e.target.value })}
                placeholder="e.g. contact@foundation.org / 9840000000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Status
              </label>
              <select
                value={programForm.status}
                onChange={(e) => setProgramForm({ ...programForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsProgramModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              {editingProgram ? 'Save Changes' : 'Publish Opportunity'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Record Support Provided Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Educational Support Provided"
        subtitle="Log support distributions (books, uniforms, devices, scholarships) for audit and impact tracking."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-3.5 pt-2 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Recipient Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={recordForm.recipientType}
                onChange={(e) => setRecordForm({ ...recordForm, recipientType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Student">Individual Student</option>
                <option value="School">School / Institution</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Beneficiary Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={recordForm.beneficiaryName}
                onChange={(e) => setRecordForm({ ...recordForm, beneficiaryName: e.target.value })}
                placeholder="e.g. Rahul Verma or Class 8 Students"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Support Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={recordForm.supportType}
                onChange={(e) => setRecordForm({ ...recordForm, supportType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Books">Books & Notebooks</option>
                <option value="Uniforms">School Uniforms</option>
                <option value="School bags">School Bags & Stationery</option>
                <option value="Laptops/Tablets">Laptops / Tablets / Devices</option>
                <option value="Scholarships">Scholarships</option>
                <option value="Financial assistance">Financial Assistance</option>
                <option value="Educational materials">Educational Materials</option>
                <option value="Other Support">Other Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={recordForm.quantity}
                onChange={(e) => setRecordForm({ ...recordForm, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Support / Item Details <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={recordForm.itemDetails}
              onChange={(e) => setRecordForm({ ...recordForm, itemDetails: e.target.value })}
              placeholder="e.g. 2 Sets of uniform, 10 ruled notebooks, geometry kit"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Monetary Value (₹ Optional)
              </label>
              <input
                type="number"
                min="0"
                value={recordForm.amount}
                onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                placeholder="e.g. 2400"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Date Provided
              </label>
              <input
                type="date"
                required
                value={recordForm.dateProvided}
                onChange={(e) => setRecordForm({ ...recordForm, dateProvided: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                School Name
              </label>
              <input
                type="text"
                value={recordForm.schoolName}
                onChange={(e) => setRecordForm({ ...recordForm, schoolName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Village
              </label>
              <input
                type="text"
                value={recordForm.village}
                onChange={(e) => setRecordForm({ ...recordForm, village: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Save Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Timeline Modal */}
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

export default NgoDashboard;
