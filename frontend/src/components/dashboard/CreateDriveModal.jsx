import React, { useState } from 'react';
import { Rocket, Building, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import communityDriveService from '../../services/communityDriveService';

export const CreateDriveModal = ({ isOpen, onClose, needs = [], onDriveCreated }) => {
  const [selectedNeedId, setSelectedNeedId] = useState(needs[0]?._id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetQuantity, setTargetQuantity] = useState(2);
  const [impactMessage, setImpactMessage] = useState(
    'Rallying village community, parents, and alumni to empower our rural students.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleNeedChange = (e) => {
    const id = e.target.value;
    setSelectedNeedId(id);
    const need = needs.find((n) => n._id === id);
    if (need) {
      setTitle(`Sundarpur Community Support: ${need.title}`);
      setDescription(`Village drive to fulfill ${need.requiredQuantity} ${need.unit || 'units'} for ${need.targetDepartment || 'school'}.`);
      setTargetQuantity(need.remainingQuantity || need.requiredQuantity || 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNeedId || !title.trim() || !targetQuantity) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await communityDriveService.createCommunityDrive({
        schoolNeedId: selectedNeedId,
        title,
        description,
        targetQuantity: Number(targetQuantity),
        impactMessage,
      });

      if (onDriveCreated) {
        onDriveCreated();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create community drive');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Launch Village Community Support Drive" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Select Verified School Need <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedNeedId}
            onChange={handleNeedChange}
            required
            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 focus:outline-none focus:border-emerald-600"
          >
            <option value="">-- Choose a School Need --</option>
            {needs.map((n) => (
              <option key={n._id} value={n._id}>
                {n.title} (Needed: {n.requiredQuantity} | Remaining: {n.remainingQuantity})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Drive Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Sundarpur Digital Lab: 2 Laptops Community Drive"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Quantity to Mobilize"
            name="targetQuantity"
            type="number"
            min="1"
            value={targetQuantity}
            onChange={(e) => setTargetQuantity(e.target.value)}
            required
          />

          <Input
            label="Community Vision / Impact Summary"
            name="impactMessage"
            value={impactMessage}
            onChange={(e) => setImpactMessage(e.target.value)}
            placeholder="e.g. Empowering 180 rural children with computer education"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Community Appeal & Drive Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe how villagers, alumni, and local organizations can participate."
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
            icon={Rocket}
            isLoading={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-700/20 text-white"
          >
            Launch Community Drive
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDriveModal;
