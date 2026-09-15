import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  User,
  Layers,
  FileText,
  AlertCircle,
  IndianRupee,
  Package,
  Sparkles,
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import supportRequestService from '../../services/supportRequestService';

const CATEGORIES = [
  'Books & Notebooks',
  'School Uniform',
  'School Bag & Stationery',
  'Scholarship / Financial Assistance',
  'Laptop / Tablet / Digital Device',
  'Transport Support / Bicycle',
  'Other Educational Needs',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const CreateSupportRequestModal = ({
  isOpen,
  onClose,
  onSuccess,
  role = 'parent',
  defaultStudentId = null,
}) => {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    studentId: '',
    category: 'Books & Notebooks',
    title: '',
    description: '',
    priority: 'Medium',
    estimatedAmount: '',
    supportRequired: '',
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      loadStudents();
    }
  }, [isOpen]);

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await supportRequestService.getEligibleStudents();
      const list = res.data || [];
      setStudents(list);
      if (defaultStudentId) {
        setForm((prev) => ({ ...prev, studentId: defaultStudentId }));
      } else if (list.length > 0 && !form.studentId) {
        setForm((prev) => ({ ...prev, studentId: list[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load eligible students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId) {
      setError('Please select a student.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please describe the educational support needed.');
      return;
    }

    setSubmitting(true);
    setError('');

    const finalTitle = form.title.trim() || `${form.category} Support`;

    try {
      await supportRequestService.createSupportRequest({
        ...form,
        title: finalTitle,
        estimatedAmount: form.estimatedAmount ? Number(form.estimatedAmount) : 0,
      });
      if (onSuccess) onSuccess();
      onClose();
      // Reset
      setForm({
        studentId: '',
        category: 'Books & Notebooks',
        title: '',
        description: '',
        priority: 'Medium',
        estimatedAmount: '',
        supportRequired: '',
      });
    } catch (err) {
      console.error('Error submitting support request:', err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      setError(
        serverMsg || 'Failed to submit support request. Please check permissions.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Student Support Request"
      subtitle={
        role === 'village_head'
          ? 'Request educational assistance for a student in your village to be reviewed by the Head Master.'
          : 'Request educational essentials or scholarship assistance for your child.'
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-left pt-2">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Student Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Student <span className="text-rose-500">*</span>
          </label>
          {loadingStudents ? (
            <div className="py-2 text-xs text-slate-500 animate-pulse">Loading eligible students...</div>
          ) : students.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              No linked students found. Please verify your profile phone number matches your student records.
            </div>
          ) : (
            <select
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              required
            >
              <option value="">-- Select a student --</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} (Roll: {s.rollNumber || 'N/A'}, Class: {s.class}, Village: {s.village})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Support Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Urgency / Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Request Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Request Title / Summary <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., 2 Sets of School Uniform & Winter Cardigan (Size 32)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            maxLength={150}
          />
        </div>

        {/* Support Items Required & Estimated Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Support Items Required (Optional)
            </label>
            <input
              type="text"
              value={form.supportRequired}
              onChange={(e) => setForm({ ...form, supportRequired: e.target.value })}
              placeholder="e.g., 5 Notebooks, Geometry Box, School Bag"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Estimated Amount (₹ Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                ₹
              </div>
              <input
                type="number"
                value={form.estimatedAmount}
                onChange={(e) => setForm({ ...form, estimatedAmount: e.target.value })}
                placeholder="e.g., 1800"
                min="0"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Detailed Description & Justification <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Please explain the student's need, current situation, and how this educational support will help keep them attending school..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            required
          />
        </div>

        {/* Workflow Info Alert */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Support Request Lifecycle:
          </div>
          <p>
            Your request will be submitted as <strong>Pending</strong>. The Head Master will review, verify, and forward it to suitable <strong>NGO / Partner organizations</strong> for sponsorship and distribution.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={HeartHandshake}
            loading={submitting}
            disabled={submitting || students.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Submit Support Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSupportRequestModal;
