import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  HeartHandshake,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EarlyAttentionBadge from '../../components/common/EarlyAttentionBadge';

// Services
import studentService from '../../services/studentService';
import academicService from '../../services/academicService';
import earlyAttentionService from '../../services/earlyAttentionService';

export const ParentDashboard = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [reportCards, setReportCards] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attentionProfile, setAttentionProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadChildData = async (child) => {
    if (!child) return;
    setSelectedChild(child);
    try {
      const [marksRes, attentionRes, attRes] = await Promise.allSettled([
        academicService.getStudentMarks(child._id),
        earlyAttentionService.getStudentProfile(child._id),
        attendanceService.getStudentAttendance(child._id),
      ]);

      if (marksRes.status === 'fulfilled' && marksRes.value.data) {
        setReportCards(marksRes.value.data.reportCards || []);
      } else {
        setReportCards([]);
      }

      if (attentionRes.status === 'fulfilled' && attentionRes.value.data) {
        setAttentionProfile(attentionRes.value.data);
      }

      if (attRes.status === 'fulfilled' && attRes.value.data) {
        setAttendanceLogs(attRes.value.data.logs || []);
      }
    } catch (e) {
      console.error('Error fetching child data:', e);
    }
  };

  const fetchParentData = async () => {
    setLoading(true);
    try {
      const res = await studentService.getStudents();
      const allStudents = res.data || [];
      // Filter by parent phone if available, or show students
      const matchedChildren = allStudents.filter(
        (s) => s.parentPhone === user?.phone || s.parentName?.toLowerCase() === user?.name?.toLowerCase()
      );
      const childList = matchedChildren.length > 0 ? matchedChildren : allStudents;
      setChildren(childList);
      if (childList.length > 0) {
        await loadChildData(childList[0]);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="amber" size="sm" dot>
                Parent Guardian Portal
              </Badge>
              <span className="text-xs text-amber-300 font-semibold bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800">
                Sundarpur Community Education
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Parent Guardian'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Monitor your child's daily school attendance, academic progress, teacher communications, and welfare schemes in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Child Switcher if multiple children */}
      {children.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Select Child:</span>
          {children.map((c) => (
            <button
              key={c._id}
              onClick={() => loadChildData(c)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                selectedChild?._id === c._id
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {c.name} (Roll #{c.rollNumber})
            </button>
          ))}
        </div>
      )}

      {/* Child Summary Profile Card */}
      {selectedChild && (
        <Card className="border-slate-200 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base">
                {selectedChild.name?.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{selectedChild.name}</h3>
                  <EarlyAttentionBadge level={selectedChild.attentionLevel} size="xs" />
                </div>
                <p className="text-xs text-slate-500">
                  {selectedChild.class?.name || 'Class 8-A'} • Roll #{selectedChild.rollNumber} • Admission #{selectedChild.admissionNumber}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Attendance Rate</span>
                <span className={`font-bold text-sm ${selectedChild.currentAttendanceRate < 60 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {selectedChild.currentAttendanceRate}%
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Academic Average</span>
                <span className={`font-bold text-sm ${selectedChild.currentAcademicAverage < 40 ? 'text-rose-700' : 'text-blue-700'}`}>
                  {selectedChild.currentAcademicAverage}%
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Absence Streak</span>
                <span className={`font-bold text-sm ${selectedChild.consecutiveAbsences >= 3 ? 'text-rose-700' : 'text-slate-700'}`}>
                  {selectedChild.consecutiveAbsences} Days
                </span>
              </div>
            </div>
          </div>

          {/* Teacher Interventions & Support Notes */}
          {attentionProfile?.interventions && attentionProfile.interventions.length > 0 && (
            <div className="pt-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                Teacher Support & Parent Communication Log:
              </h4>
              <div className="space-y-2">
                {attentionProfile.interventions.map((inv, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{inv.actionType}</span>
                      <Badge variant={inv.status === 'Resolved' ? 'emerald' : 'amber'} size="xs">
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-slate-600">{inv.notes}</p>
                    {inv.parentResponse && (
                      <p className="text-emerald-700 font-medium">Your Feedback: "{inv.parentResponse}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Term Examination Marks */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Academic Examination Marks & Subject Report</h2>
        {reportCards.length > 0 ? (
          reportCards.map((rc) => (
            <Card key={rc._id} className="border-slate-200 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{rc.term} ({rc.academicYear})</span>
                  <p className="text-slate-500">{rc.teacherRemarks}</p>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  Grade: {rc.overallGrade} ({rc.percentage}%)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {rc.marks?.map((m) => (
                  <div key={m.subject} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                    <p className="text-slate-500 font-medium truncate">{m.subject}</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{m.marksObtained} / {m.maxMarks}</p>
                    <Badge variant={m.marksObtained >= 75 ? 'emerald' : m.marksObtained >= 50 ? 'blue' : 'rose'} size="xs" className="mt-1">
                      Grade {m.grade}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <Card className="text-center py-6 text-slate-500 text-xs">No exam reports published yet for this student.</Card>
        )}
      </div>

      {/* Attendance History Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Daily Attendance History Logs</h2>
        {attendanceLogs.length > 0 ? (
          <Card className="border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
              {attendanceLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium block">{log.date}</span>
                  <Badge
                    variant={
                      log.status === 'Present'
                        ? 'emerald'
                        : log.status === 'Absent'
                        ? 'rose'
                        : log.status === 'Late'
                        ? 'amber'
                        : 'blue'
                    }
                    size="xs"
                  >
                    {log.status}
                  </Badge>
                  {log.remarks && <p className="text-[10px] text-slate-400 truncate">{log.remarks}</p>}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="text-center py-6 text-slate-500 text-xs">No attendance records logged yet for this student.</Card>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
