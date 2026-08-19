import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, AlertCircle, Clock, Plus, Edit3 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import attendanceService from '../../services/attendanceService';

export const StudentAttendanceModal = ({ isOpen, onClose, student, onAttendanceUpdated }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('Present');
  const [remarks, setRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const studentId = student?._id || student?.id;

  const fetchStudentAttendanceLogs = async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await attendanceService.getStudentAttendance(studentId);
      setAttendanceData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentAttendanceLogs();
      setSuccessMsg('');
    }
  }, [isOpen, studentId]);

  const handleRecordIndividual = async (e) => {
    e.preventDefault();
    if (!studentId) return;

    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await attendanceService.updateStudentAttendance(studentId, {
        date: selectedDate,
        status: selectedStatus,
        remarks,
      });

      setSuccessMsg(res.message || 'Attendance record saved successfully!');
      await fetchStudentAttendanceLogs();

      if (onAttendanceUpdated) {
        onAttendanceUpdated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Individual Attendance History & Entry — ${student?.name || 'Student'}`}
      size="lg"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Student Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Student Info</span>
            <p className="font-bold text-slate-900 text-sm">{student?.name}</p>
            <p className="text-[11px] text-slate-500">Roll #{student?.rollNumber} • {student?.class?.name || 'Class 8-A'}</p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Live Attendance Rate</span>
            <p className={`font-extrabold text-base ${attendanceData?.attendanceRate < 60 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {attendanceData?.attendanceRate !== undefined ? `${attendanceData.attendanceRate}%` : `${student?.currentAttendanceRate || 100}%`}
            </p>
            <p className="text-[11px] text-slate-500">{attendanceData?.attendedClasses || 0} / {attendanceData?.totalClassesHeld || 0} Sessions</p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Consecutive Absences</span>
            <p className={`font-extrabold text-base ${attendanceData?.consecutiveAbsences >= 3 ? 'text-rose-700' : 'text-slate-800'}`}>
              {attendanceData?.consecutiveAbsences || 0} Days
            </p>
            <p className="text-[11px] text-slate-500">Consecutive unexcused</p>
          </div>
        </div>

        {/* Manual Individual Attendance Entry Form */}
        <form onSubmit={handleRecordIndividual} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Record / Edit Single Date Attendance
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">Overwrites selected date</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Session Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Attendance Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="Present">Present (Attended)</option>
                <option value="Absent">Absent (Not Present)</option>
                <option value="Late">Late (Tardy)</option>
                <option value="Excused">Excused Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Remarks (Optional)</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Doctor note"
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              icon={CheckCircle2}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save Attendance Record
            </Button>
          </div>
        </form>

        {/* Attendance Logs List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Recorded Attendance History Logs ({attendanceData?.logs?.length || 0} Records)
          </h4>

          <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-white">
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading student attendance history...</div>
            ) : attendanceData?.logs && attendanceData.logs.length > 0 ? (
              attendanceData.logs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="font-bold text-slate-800">{log.date}</span>
                      {log.remarks && <span className="text-[11px] text-slate-500 ml-2">({log.remarks})</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(log.date);
                        setSelectedStatus(log.status);
                        setRemarks(log.remarks || '');
                      }}
                      className="text-xs text-slate-400 hover:text-emerald-700 font-semibold p-1"
                      title="Edit this date record"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No attendance logs recorded for this student yet.
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StudentAttendanceModal;
