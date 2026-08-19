import React, { useState } from 'react';
import { HeartPulse, CheckCircle2, Phone, Users, BookOpen, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import earlyAttentionService from '../../services/earlyAttentionService';

export const InterventionModal = ({ isOpen, onClose, student, onInterventionAdded }) => {
  const [actionType, setActionType] = useState('Contact Parent / Phone Call');
  const [notes, setNotes] = useState('');
  const [parentResponse, setParentResponse] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const actionOptions = [
    'Contact Parent / Phone Call',
    'In-Person Parent Teacher Meeting',
    'Remedial Academic Coaching',
    'Attendance Daily Monitoring',
    'Mid-Day Meal & Nutrition Check',
    'Counseling Session',
    'Welfare Scheme Followup',
    'Other Support',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please provide intervention notes describing the action taken.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await earlyAttentionService.addIntervention({
        studentId: student._id || student.id,
        actionType,
        notes,
        parentResponse,
        status,
      });

      if (onInterventionAdded) {
        onInterventionAdded();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record intervention');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Student Support Intervention — ${student?.name || 'Student'}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between font-semibold text-slate-800">
            <span>Student: {student?.name} (Roll #{student?.rollNumber})</span>
            <span className="text-emerald-700">{student?.class?.name || student?.className || 'Class 8-A'}</span>
          </div>
          <p className="text-slate-500">
            Parent: {student?.parentName || 'Parent Guardian'} • Phone: {student?.parentPhone || '+91 98765 00000'}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Support Action Type <span className="text-rose-500">*</span>
          </label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 focus:outline-none focus:border-emerald-600"
          >
            {actionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Intervention Details / Action Notes <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Conducted phone counseling with parent regarding 8 days absence streak. Parent cited farm harvesting season; agreed to resume daily attendance."
            required
            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 focus:outline-none focus:border-emerald-600 placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Parent / Guardian Feedback (Optional)</label>
          <input
            type="text"
            value={parentResponse}
            onChange={(e) => setParentResponse(e.target.value)}
            placeholder="e.g. Father confirmed attendance resumption starting Monday morning."
            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 focus:outline-none focus:border-emerald-600 placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Intervention Status</label>
          <div className="grid grid-cols-3 gap-2">
            {['Open', 'In Progress', 'Resolved'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  status === st
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Save Support Action
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InterventionModal;
