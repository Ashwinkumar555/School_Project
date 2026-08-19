import React, { useState, useEffect } from 'react';
import { BookOpen, Award, CheckCircle2, AlertCircle, Plus, Trash2, Edit3 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import academicService from '../../services/academicService';

export const MarksEntryModal = ({ isOpen, onClose, student, classData, onMarksRecorded, students = [] }) => {
  const [selectedStudentId, setSelectedStudentId] = useState(student?._id || student?.id || '');
  const [term, setTerm] = useState('Quarterly Exam');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [marks, setMarks] = useState([
    { subject: 'Mathematics', marksObtained: '', maxMarks: 100 },
    { subject: 'Science', marksObtained: '', maxMarks: 100 },
    { subject: 'English', marksObtained: '', maxMarks: 100 },
    { subject: 'Social Science', marksObtained: '', maxMarks: 100 },
    { subject: 'Regional Language', marksObtained: '', maxMarks: 100 },
  ]);
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentStudent = student || students.find((s) => (s._id || s.id) === selectedStudentId);

  // Load existing saved marks for this student and term
  useEffect(() => {
    const studentIdToLoad = student?._id || student?.id || selectedStudentId;
    if (!studentIdToLoad) return;

    setSelectedStudentId(studentIdToLoad);
    setIsLoadingExisting(true);
    setError('');
    setSuccessMsg('');

    const loadStudentExistingMarks = async () => {
      try {
        const res = await academicService.getStudentMarks(studentIdToLoad);
        const reportCards = res.data?.reportCards || [];
        const matchingRecord = reportCards.find(
          (rc) => rc.term === term && (!rc.academicYear || rc.academicYear === academicYear)
        );

        if (matchingRecord && matchingRecord.marks && matchingRecord.marks.length > 0) {
          setMarks(
            matchingRecord.marks.map((m) => ({
              subject: m.subject,
              marksObtained: m.marksObtained !== undefined ? m.marksObtained : '',
              maxMarks: m.maxMarks || 100,
            }))
          );
          setTeacherRemarks(matchingRecord.teacherRemarks || '');
          setExistingRecordId(matchingRecord._id);
        } else {
          // Fresh blank marks entry for this term
          setMarks([
            { subject: 'Mathematics', marksObtained: '', maxMarks: 100 },
            { subject: 'Science', marksObtained: '', maxMarks: 100 },
            { subject: 'English', marksObtained: '', maxMarks: 100 },
            { subject: 'Social Science', marksObtained: '', maxMarks: 100 },
            { subject: 'Regional Language', marksObtained: '', maxMarks: 100 },
          ]);
          setTeacherRemarks('');
          setExistingRecordId(null);
        }
      } catch (err) {
        console.warn('Could not load existing marks:', err.message);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    if (isOpen) {
      loadStudentExistingMarks();
    }
  }, [isOpen, student, selectedStudentId, term, academicYear]);

  const handleMarkChange = (index, value) => {
    const newMarks = [...marks];
    const numericVal = value === '' ? '' : Math.min(Number(newMarks[index].maxMarks) || 100, Math.max(0, Number(value)));
    newMarks[index].marksObtained = numericVal;
    setMarks(newMarks);
    if (error) setError('');
  };

  const handleSubjectNameChange = (index, name) => {
    const newMarks = [...marks];
    newMarks[index].subject = name;
    setMarks(newMarks);
  };

  const handleAddSubject = () => {
    setMarks([...marks, { subject: `Subject ${marks.length + 1}`, marksObtained: '', maxMarks: 100 }]);
  };

  const handleRemoveSubject = (index) => {
    if (marks.length <= 1) return;
    setMarks(marks.filter((_, idx) => idx !== index));
  };

  const totalObtained = marks.reduce((acc, curr) => acc + (Number(curr.marksObtained) || 0), 0);
  const totalMax = marks.reduce((acc, curr) => acc + (Number(curr.maxMarks) || 100), 0);
  const calculatedPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const studentIdToSave = currentStudent?._id || currentStudent?.id || selectedStudentId;

    if (!studentIdToSave) {
      setError('Please select a student');
      return;
    }

    // Validate that at least one subject mark has been entered
    const hasEnteredMark = marks.some((m) => m.marksObtained !== '');
    if (!hasEnteredMark) {
      setError('Please enter at least one subject mark before saving');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        studentId: studentIdToSave,
        classId: classData?._id || currentStudent?.class?._id,
        term,
        academicYear,
        recordId: existingRecordId,
        marks: marks.map((m) => ({
          subject: m.subject.trim(),
          marksObtained: Number(m.marksObtained) || 0,
          maxMarks: Number(m.maxMarks) || 100,
        })),
        teacherRemarks: teacherRemarks.trim() || 'Satisfactory academic progress.',
      };

      const res = await academicService.recordMarks(payload);
      setSuccessMsg(res.message || 'Marks recorded and saved successfully!');

      if (onMarksRecorded) {
        onMarksRecorded();
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record marks. Please check input values.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingRecordId ? `Edit / Update Exam Marks` : `Record Individual Student Marks`}
      size="lg"
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

        {/* Student Selector / Student Header Info */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          {students.length > 0 && !student ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Student to Enter Marks</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 font-semibold focus:outline-none focus:border-emerald-600"
              >
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    Roll #{s.rollNumber} — {s.name} ({s.class?.name || 'Class 8-A'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  {currentStudent?.name} (Roll #{currentStudent?.rollNumber})
                </span>
                <p className="text-xs text-slate-500">
                  {classData?.name || currentStudent?.class?.name || 'Class 8-A'} • Admission #{currentStudent?.admissionNumber || 'SCH-2024'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium block">Calculated Average:</span>
                <p className="text-sm font-extrabold text-emerald-700">
                  {totalObtained} / {totalMax} ({calculatedPercentage}%)
                </p>
              </div>
            </div>
          )}

          {/* Term and Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Examination / Term</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2 focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="Unit Test 1">Unit Test 1</option>
                <option value="Quarterly Exam">Quarterly Exam</option>
                <option value="Half Yearly Exam">Half Yearly Exam</option>
                <option value="Unit Test 2">Unit Test 2</option>
                <option value="Annual Exam">Annual Exam</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2 focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Subject Marks Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Subject-wise Marks (Manual Entry / Editing)
            </label>
            <button
              type="button"
              onClick={handleAddSubject}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Subject
            </button>
          </div>

          <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-white max-h-60 overflow-y-auto">
            {isLoadingExisting ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading student records...</div>
            ) : (
              marks.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs p-1.5 rounded-lg hover:bg-slate-50">
                  <input
                    type="text"
                    value={m.subject}
                    onChange={(e) => handleSubjectNameChange(idx, e.target.value)}
                    placeholder="Subject Name"
                    className="font-medium text-slate-800 w-1/2 p-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-emerald-600"
                  />
                  <div className="flex items-center gap-2 w-1/2 justify-end">
                    <input
                      type="number"
                      min="0"
                      max={m.maxMarks || 100}
                      value={m.marksObtained}
                      onChange={(e) => handleMarkChange(idx, e.target.value)}
                      placeholder="0"
                      className="w-20 rounded-lg border border-slate-300 p-1.5 text-center font-bold text-slate-900 text-xs focus:outline-none focus:border-emerald-600"
                    />
                    <span className="text-slate-400 font-semibold">/ {m.maxMarks || 100}</span>
                    {marks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Teacher Remarks */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Teacher Remarks & Academic Feedback</label>
          <input
            type="text"
            value={teacherRemarks}
            onChange={(e) => setTeacherRemarks(e.target.value)}
            placeholder="e.g. Demonstrates strong understanding in Algebra; regular homework completion needed."
            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 focus:outline-none focus:border-emerald-600 font-medium"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {existingRecordId ? 'Editing existing saved marks record' : 'Creating new student marks entry'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              icon={Award}
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
            >
              {existingRecordId ? 'Update Saved Marks' : 'Save Marks'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default MarksEntryModal;
