import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, XCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import attendanceService from '../../services/attendanceService';

export const AttendanceMarkerModal = ({ isOpen, onClose, classData, students = [], onAttendanceRecorded }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initialize or fetch attendance for the selected date
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingDate(true);
    setError('');
    setSuccessMsg('');

    const loadDateAttendance = async () => {
      try {
        const classId = classData?._id || classData?.id || (students[0]?.class?._id || students[0]?.class);
        const res = await attendanceService.getClassAttendance(classId, date);

        if (isMounted) {
          if (res?.data?.students && res.data.students.length > 0) {
            setRecords(
              res.data.students.map((s) => ({
                student: s.studentId || s._id || s.id,
                name: s.name,
                rollNumber: s.rollNumber,
                status: s.status || 'Present',
                remarks: s.remarks || '',
              }))
            );
          } else {
            // Fallback to students list
            setRecords(
              students.map((s) => ({
                student: s._id || s.id,
                name: s.name,
                rollNumber: s.rollNumber,
                status: s.consecutiveAbsences > 0 ? 'Absent' : 'Present',
                remarks: '',
              }))
            );
          }
        }
      } catch (err) {
        if (isMounted) {
          setRecords(
            students.map((s) => ({
              student: s._id || s.id,
              name: s.name,
              rollNumber: s.rollNumber,
              status: s.consecutiveAbsences > 0 ? 'Absent' : 'Present',
              remarks: '',
            }))
          );
        }
      } finally {
        if (isMounted) setIsLoadingDate(false);
      }
    };

    loadDateAttendance();

    return () => {
      isMounted = false;
    };
  }, [isOpen, date, classData, students]);

  // Update status for a student
  const handleStatusChange = (studentId, status) => {
    setRecords((prev) =>
      prev.map((r) => (r.student === studentId ? { ...r, status } : r))
    );
    if (error) setError('');
  };

  const handleRemarkChange = (studentId, remarks) => {
    setRecords((prev) =>
      prev.map((r) => (r.student === studentId ? { ...r, remarks } : r))
    );
  };

  const handleMarkAll = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const classId = classData?._id || classData?.id || (students[0]?.class?._id || students[0]?.class);
      const res = await attendanceService.recordAttendance({
        classId,
        date,
        records: records.map((r) => ({
          student: r.student,
          status: r.status,
          remarks: r.remarks,
        })),
      });

      setSuccessMsg(res.message || 'Daily attendance saved and student metrics updated!');

      if (onAttendanceRecorded) {
        onAttendanceRecorded();
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record attendance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Daily Attendance Register — ${classData?.name || 'Class 8-A'}`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Date Selector and Summary Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Attendance Date:
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              Present: <strong className="text-emerald-700">{presentCount}</strong> | Absent:{' '}
              <strong className="text-rose-700">{absentCount}</strong>
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-2.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-[11px] font-bold hover:bg-emerald-200 transition-colors cursor-pointer"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-2.5 py-1.5 bg-rose-100 text-rose-800 rounded-xl text-[11px] font-bold hover:bg-rose-200 transition-colors cursor-pointer"
              >
                Mark All Absent
              </button>
            </div>
          </div>
        </div>

        {/* Student list */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Student Individual Attendance Status (Click to toggle)
          </label>
          <div className="max-h-80 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-3 bg-white">
            {isLoadingDate ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading date attendance roster...</div>
            ) : records.length > 0 ? (
              records.map((rec) => (
                <div
                  key={rec.student}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition-colors text-xs gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-[11px] shrink-0">
                      {rec.rollNumber}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{rec.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'Present', label: 'Present', color: 'bg-emerald-600 text-white shadow-xs' },
                        { id: 'Absent', label: 'Absent', color: 'bg-rose-600 text-white shadow-xs' },
                        { id: 'Late', label: 'Late', color: 'bg-amber-500 text-white shadow-xs' },
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => handleStatusChange(rec.student, btn.id)}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            rec.status === btn.id
                              ? btn.color
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">No students registered in this class.</div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Selected Date: <strong>{date}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              icon={CheckCircle2}
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
            >
              Save Attendance & Update Metrics
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AttendanceMarkerModal;
