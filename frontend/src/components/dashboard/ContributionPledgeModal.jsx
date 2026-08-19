import React, { useState } from 'react';
import { HeartHandshake, Package, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import contributionService from '../../services/contributionService';

export const ContributionPledgeModal = ({ isOpen, onClose, drive, onPledgeSubmitted }) => {
  const [contributionType, setContributionType] = useState('Donate Item');
  const [itemDetails, setItemDetails] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [volunteerSkills, setVolunteerSkills] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const types = [
    { id: 'Donate Item', label: 'Donate an Item', icon: Package, desc: 'Provide equipment, books, or physical materials' },
    { id: 'Sponsor Purchase', label: 'Sponsor Purchase', icon: DollarSign, desc: 'Fund the purchase of required school items' },
    { id: 'Volunteer Time', label: 'Volunteer Time', icon: Clock, desc: 'Tutor students, coach sports, or provide mentorship' },
    { id: 'Other Support', label: 'Other Support', icon: HeartHandshake, desc: 'Transport, infrastructure repair, or logistics' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemDetails.trim()) {
      setError('Please specify what item or support you are pledging.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await contributionService.submitContribution({
        driveId: drive._id || drive.id,
        contributionType,
        itemDetails,
        quantity: Number(quantity) || 1,
        estimatedValue: estimatedValue ? Number(estimatedValue) : 0,
        volunteerSkills,
        notes,
      });

      if (onPledgeSubmitted) {
        onPledgeSubmitted();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit contribution pledge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`"I CAN HELP" — Support ${drive?.title || 'School Drive'}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between font-bold text-slate-900">
            <span>Target Drive: {drive?.title}</span>
            <span className="text-emerald-700 font-semibold">{drive?.village || 'Sundarpur'}</span>
          </div>
          <p className="text-slate-600 leading-snug">{drive?.description}</p>
        </div>

        {/* Contribution Type Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">How would you like to help?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {types.map((t) => {
              const Icon = t.icon;
              const isSelected = contributionType === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setContributionType(t.id)}
                  className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 text-slate-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-bold">{t.label}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Item Details */}
        <Input
          label={contributionType === 'Volunteer Time' ? 'Volunteer Role / Teaching Subject' : 'Item / Contribution Description'}
          name="itemDetails"
          value={itemDetails}
          onChange={(e) => setItemDetails(e.target.value)}
          placeholder={
            contributionType === 'Donate Item'
              ? 'e.g. 1 Core i5 Laptop (Dell / HP / Lenovo)'
              : contributionType === 'Volunteer Time'
              ? 'e.g. Mathematics tutoring for Class 8 students on Saturday mornings'
              : 'e.g. Sponsoring 2 science microscopes for lab'
          }
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Quantity / Units"
            name="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <Input
            label="Estimated Value in ₹ (Optional)"
            name="estimatedValue"
            type="number"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            placeholder="e.g. 40000"
          />
        </div>

        {contributionType === 'Volunteer Time' && (
          <Input
            label="Special Skills / Availability"
            name="volunteerSkills"
            value={volunteerSkills}
            onChange={(e) => setVolunteerSkills(e.target.value)}
            placeholder="e.g. B.Sc Graduate, available weekends 9 AM - 12 PM"
          />
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Handover / Fulfillment Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Item is sealed in box with 1-year warranty. Can deliver to school office on Wednesday."
            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 focus:outline-none focus:border-emerald-600 placeholder:text-slate-400"
          />
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
          <p className="font-bold">Transparent Verification Notice:</p>
          <p>
            Your pledge will initially be <span className="font-semibold">PENDING</span> review. Once reviewed and physically delivered to the school, the administration will mark it as <span className="font-semibold">RECEIVED</span> and register it directly into the school asset inventory.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            icon={HeartHandshake}
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
          >
            Submit Pledge
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ContributionPledgeModal;
