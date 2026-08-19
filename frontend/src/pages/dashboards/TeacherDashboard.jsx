import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  Sparkles,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EarlyAttentionBadge from '../../components/common/EarlyAttentionBadge';
import AttendanceMarkerModal from '../../components/dashboard/AttendanceMarkerModal';
import StudentAttendanceModal from '../../components/dashboard/StudentAttendanceModal';
import MarksEntryModal from '../../components/dashboard/MarksEntryModal';
import InterventionModal from '../../components/dashboard/InterventionModal';

// Services
import studentService from '../../services/studentService';
import classService from '../../services/classService';
import earlyAttentionService from '../../services/earlyAttentionService';
import attendanceService from '../../services/attendanceService';
import announcementService from '../../services/announcementService';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attentionData, setAttentionData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState(null);
  const [isStudentAttendanceModalOpen, setIsStudentAttendanceModalOpen] = useState(false);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState(null);
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

      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data || []);
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

  const openMarksModal = (student) => {
    setSelectedStudentForMarks(student);
    setIsMarksModalOpen(true);
  };

  const openStudentAttendanceModal = (student) => {
    setSelectedStudentForAttendance(student);
    setIsStudentAttendanceModalOpen(true);
  };

  const openInterventionModal = (student) => {
    setSelectedStudentForIntervention(student);
    setIsInterventionModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="blue" size="sm" dot>
                Faculty Classroom Workspace
              </Badge>
              <span className="text-xs text-blue-300 font-semibold bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800">
                Senior Academic Faculty
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Educator'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Record daily classroom attendance, track student academic performance, log early support interventions, and coordinate with parent guardians.
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
              icon={CheckCircle2}
              onClick={() => setIsAttendanceModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-700/20"
            >
              Take Daily Attendance
            </Button>
          </div>
        </div>
      </div>

      {/* Classroom Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Assigned</span>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{selectedClass?.name || 'Class 8-A'}</p>
          <p className="text-xs text-slate-500 mt-1">{students.length} Registered Students • Room 101</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Early Attention Flags</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-700 mt-2">
            {attentionData?.summary?.highAttentionCount || 1} Need Action
          </p>
          <p className="text-xs text-slate-500 mt-1">Rule-based attendance & marks triggers</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Classroom Attendance</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">92% Overall</p>
          <p className="text-xs text-slate-500 mt-1">Updated in real-time across terms</p>
        </Card>
      </div>

      {/* Classroom Student Roster & Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Class 8-A Student Performance & Welfare Roster</h2>
            <p className="text-xs text-slate-500">
              Click "Marks" to record or edit exam scores, "Attendance" to manage single-student session records, or "Support Action" for counseling.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={Award} onClick={() => { setSelectedStudentForMarks(null); setIsMarksModalOpen(true); }}>
              Enter Marks
            </Button>
            <Button size="sm" variant="primary" icon={CheckCircle2} onClick={() => setIsAttendanceModalOpen(true)}>
              Mark Daily Attendance
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Roll</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Attendance</th>
                <th className="p-3.5">Absence Streak</th>
                <th className="p-3.5">Academic Score</th>
                <th className="p-3.5">Support Level</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {students.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-bold text-slate-900">{s.rollNumber}</td>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="text-[10px] text-slate-500">Parent: {s.parentName} ({s.parentPhone || 'N/A'})</p>
                  </td>
                  <td className="p-3.5">
                    <span className={`font-bold ${s.currentAttendanceRate < 60 ? 'text-rose-700' : 'text-slate-900'}`}>
                      {s.currentAttendanceRate}%
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`font-bold ${s.consecutiveAbsences >= 3 ? 'text-rose-700' : 'text-slate-700'}`}>
                      {s.consecutiveAbsences} days
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`font-bold ${s.currentAcademicAverage < 40 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {s.currentAcademicAverage}% Avg
                    </span>
                  </td>
                  <td className="p-3.5">
                    <EarlyAttentionBadge level={s.attentionLevel} size="xs" />
                  </td>
                  <td className="p-3.5 text-right space-x-1.5">
                    <Button size="xs" variant="outline" icon={Award} onClick={() => openMarksModal(s)}>
                      Marks
                    </Button>
                    <Button size="xs" variant="outline" icon={Calendar} onClick={() => openStudentAttendanceModal(s)}>
                      Attendance
                    </Button>
                    <Button
                      size="xs"
                      variant={s.attentionLevel === 'HIGH_ATTENTION' ? 'primary' : 'outline'}
                      className={s.attentionLevel === 'HIGH_ATTENTION' ? 'bg-rose-700 hover:bg-rose-800 text-white' : ''}
                      onClick={() => openInterventionModal(s)}
                    >
                      Support
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notices */}
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

      {/* Modals */}
      <AttendanceMarkerModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        classData={selectedClass || classes[0]}
        students={students}
        onAttendanceRecorded={fetchTeacherData}
      />

      <MarksEntryModal
        isOpen={isMarksModalOpen}
        onClose={() => {
          setIsMarksModalOpen(false);
          setSelectedStudentForMarks(null);
        }}
        student={selectedStudentForMarks}
        students={students}
        classData={selectedClass || classes[0]}
        onMarksRecorded={fetchTeacherData}
      />

      {selectedStudentForAttendance && (
        <StudentAttendanceModal
          isOpen={isStudentAttendanceModalOpen}
          onClose={() => {
            setIsStudentAttendanceModalOpen(false);
            setSelectedStudentForAttendance(null);
          }}
          student={selectedStudentForAttendance}
          onAttendanceUpdated={fetchTeacherData}
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
          onInterventionAdded={fetchTeacherData}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
