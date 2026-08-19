import React, { useState } from 'react';
import { PlusCircle, School, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import schoolNeedService from '../../services/schoolNeedService';

export const CreateNeedModal = ({ isOpen, onClose, onNeedCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'IT & Computers',
    urgency: 'High',
    targetDepartment: 'Computer Lab',
    requiredQuantity: 2,
    unit: 'Units',
    estimatedCost: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'IT & Computers',
    'Laboratory Equipment',
    'Library & Books',
    'Sports Equipment',
    'Classroom Furniture',
    'Infrastructure & Sanitation',
    'Learning Kits & Stationery',
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.requiredQuantity) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await schoolNeedService.createSchoolNeed({
        ...formData,
        requiredQuantity: Number(formData.requiredQuantity),
        estimatedCost: formData.estimatedCost ? Number(formData.estimatedCost) : 0,
      });

      if (onNeedCreated) {
        onNeedCreated();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create school need');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Verified School Resource Need" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Need Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. 2 Laptops Needed for Computer Laboratory"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 focus:outline-none focus:border-emerald-600"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Urgency Level</label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 focus:outline-none focus:border-emerald-600"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Required Quantity"
            name="requiredQuantity"
            type="number"
            min="1"
            value={formData.requiredQuantity}
            onChange={handleChange}
            required
          />

          <Input
            label="Unit (e.g. Laptops, Kits)"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            placeholder="Units / Sets"
          />

          <Input
            label="Target Department / Room"
            name="targetDepartment"
            value={formData.targetDepartment}
            onChange={handleChange}
            placeholder="Computer Lab"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Detailed Educational Justification</label>
          <textarea
            rows={3}
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g. 2 Core i5 laptops required to train Class 8-10 students in Python and basic computing for state board practicals."
            required
            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 focus:outline-none focus:border-emerald-600 placeholder:text-slate-400"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            icon={PlusCircle}
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
          >
            Publish Verified Need
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateNeedModal;
