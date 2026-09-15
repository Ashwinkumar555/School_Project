import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Calendar,
  BookOpen,
  Sparkles,
  Heart,
  Package,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EarlyAttentionBadge from '../../components/common/EarlyAttentionBadge';

// Services
import studentService from '../../services/studentService';
import academicService from '../../services/academicService';
import attendanceService from '../../services/attendanceService';
import announcementService from '../../services/announcementService';
import programService from '../../services/programService';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [studentProfile, setStudentProfile] = useState(null);
  const [reportCards, setReportCards] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const studentsRes = await studentService.getStudents();
        const studentList = studentsRes.data || [];
        // Match student by user phone or name, or fallback to first student
        const std =
          studentList.find((s) => s.phone === user?.phone || s.name?.toLowerCase() === user?.name?.toLowerCase()) ||
          studentList[0];

        if (std) {
          setStudentProfile(std);
          const [marksRes, attRes] = await Promise.allSettled([
            academicService.getStudentMarks(std._id),
            attendanceService.getStudentAttendance(std._id),
          ]);

          if (marksRes.status === 'fulfilled' && marksRes.value.data) {
            setReportCards(marksRes.value.data.reportCards || []);
          }
          if (attRes.status === 'fulfilled' && attRes.value.data) {
            setAttendanceLogs(attRes.value.data.logs || []);
          }
        }

        const annRes = await announcementService.getAnnouncements();
        setAnnouncements(annRes.data || []);

        try {
          const progRes = await programService.getPrograms({ status: 'Active' });
          setPrograms(progRes.data || []);
        } catch (err) {
          console.warn('Could not load programs:', err);
        }
      } catch (e) {
        console.error('Error fetching student data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="blue" size="sm" dot>
                Student Academic Workspace
              </Badge>
              <span className="text-xs text-sky-300 font-semibold bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-800">
                {studentProfile?.rollNumber ? `Class 8-A • Roll #${studentProfile.rollNumber}` : 'Enrolled Student'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Govt Model Higher Secondary School. Track your daily attendance, term exam grades, homework, and government scheme entitlements.
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">
            {studentProfile?.currentAttendanceRate || 92}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Absence Streak: {studentProfile?.consecutiveAbsences || 0} Days</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Score</span>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-blue-700 mt-2">
            {studentProfile?.currentAcademicAverage || 78}% Avg
          </p>
          <p className="text-xs text-slate-500 mt-1">Quarterly Term Performance</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Support Track</span>
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-2">
            <EarlyAttentionBadge level={studentProfile?.attentionLevel || 'NORMAL'} size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-2">Routine encouragement & monitoring</p>
        </Card>
      </div>

      {/* Academic Marks & Report Card */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Term Examination Marks & Report Card</h2>
        {reportCards.length > 0 ? (
          reportCards.map((rc) => (
            <Card key={rc._id} className="border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{rc.term} ({rc.academicYear})</h3>
                  <p className="text-xs text-slate-500">{rc.teacherRemarks}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Overall Grade: {rc.overallGrade} ({rc.percentage}%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {rc.marks?.map((m) => (
                  <div key={m.subject} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <p className="text-slate-500 font-semibold truncate">{m.subject}</p>
                    <p className="text-base font-extrabold text-slate-900 mt-1">
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
          <Card className="text-center py-6 text-slate-500 text-xs">No exam term reports published yet.</Card>
        )}
      </div>

      {/* Attendance History Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Recorded Daily Attendance Logs</h2>
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
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="text-center py-6 text-slate-500 text-xs">No daily attendance logs recorded yet.</Card>
        )}
      </div>

      {/* Government Welfare Entitlements */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Government Student Welfare Entitlements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {studentProfile?.entitlements?.map((ent, idx) => (
            <Card key={idx} className="border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{ent.schemeName}</span>
                <Badge variant="emerald" size="xs">
                  {ent.status}
                </Badge>
              </div>
              <p className="text-slate-500 text-[11px]">
                {ent.notes || 'Disbursed for current academic term by State Education Dept.'}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Partner Scholarships & Educational Programs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Partner Scholarships & Educational Programs
          </h2>
          <p className="text-xs text-slate-500">
            Scholarship grants, free coaching workshops, and skill-development programs offered by verified NGO partners.
          </p>
        </div>

        {programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((prog) => (
              <Card key={prog._id} className="border-slate-200 hover:border-indigo-300 transition-all p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant={
                        prog.type === 'Scholarship'
                          ? 'emerald'
                          : prog.type === 'Workshop'
                          ? 'purple'
                          : prog.type === 'Skill Training'
                          ? 'blue'
                          : 'amber'
                      }
                      size="xs"
                    >
                      {prog.type}
                    </Badge>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {prog.organizationName}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{prog.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3">{prog.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  {prog.eligibility && (
                    <div className="flex items-start gap-1 text-[11px]">
                      <span className="font-semibold text-slate-700">Eligibility:</span>
                      <span className="text-slate-600 line-clamp-1">{prog.eligibility}</span>
                    </div>
                  )}
                  {prog.benefits && (
                    <div className="flex items-start gap-1 text-[11px]">
                      <span className="font-semibold text-slate-700">Benefit:</span>
                      <span className="text-emerald-700 font-semibold line-clamp-1">{prog.benefits}</span>
                    </div>
                  )}
                  {prog.deadline && (
                    <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400">
                      <span>Apply by: {new Date(prog.deadline).toLocaleDateString()}</span>
                      {prog.contactInfo && <span className="font-medium text-indigo-600 truncate max-w-[120px]">{prog.contactInfo}</span>}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-6 text-slate-500 text-xs border-dashed border-slate-300">
            No active partner scholarships or educational programs at this moment. Check back soon!
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
