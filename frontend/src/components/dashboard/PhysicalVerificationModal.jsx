import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Tag, MapPin, PackageCheck, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import contributionService from '../../services/contributionService';

export const PhysicalVerificationModal = ({ isOpen, onClose, contribution, onVerificationComplete }) => {
  const [assetTag, setAssetTag] = useState(
    `EDU-${contribution?.schoolNeed?.category === 'IT & Computers' ? 'IT' : 'RES'}-2025-${Math.floor(
      100 + Math.random() * 900
    )}`
  );
  const [location, setLocation] = useState(contribution?.schoolNeed?.targetDepartment || 'Computer Lab');
  const [condition, setCondition] = useState('New');
  const [verificationNotes, setVerificationNotes] = useState(
    'Physical asset unboxed, inspected, serial number cataloged, and placed in active student laboratory.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!assetTag.trim()) {
      setError('Please provide an asset tag for physical inventory tracking.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await contributionService.markAsReceived(contribution._id || contribution.id, {
        assetTag,
        location,
        condition,
        verificationNotes,
      });

      if (onVerificationComplete) {
        onVerificationComplete();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as received');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physical Receipt & Inventory Asset Verification"
      size="lg"
    >
      <form onSubmit={handleVerify} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs space-y-2 text-emerald-950">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
            <PackageCheck className="w-5 h-5 text-emerald-700" />
            <span>School Physical Resource Handover</span>
          </div>
          <p className="text-emerald-800 leading-relaxed">
            By marking this item as <span className="font-bold">RECEIVED</span>, the school inventory will automatically increment, the School Need received counter will update, and the Village Support Drive will reflect the fulfilled milestone.
          </p>
          <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap justify-between font-semibold">
            <span>Item: {contribution?.itemDetails}</span>
            <span>Quantity: {contribution?.quantity} {contribution?.schoolNeed?.unit || 'Unit(s)'}</span>
            <span>Donor: {contribution?.contributorName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="School Asset Tag / ID"
            name="assetTag"
            value={assetTag}
            onChange={(e) => setAssetTag(e.target.value)}
            placeholder="e.g. EDU-IT-2025-002"
            icon={Tag}
            required
          />

          <Input
            label="Deployed Location in School"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Computer Lab / Science Lab"
            icon={MapPin}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Verified Physical Condition</label>
          <div className="grid grid-cols-4 gap-2">
            {['New', 'Good', 'Fair', 'Needs Repair'].map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => setCondition(cond)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  condition === cond
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Physical Verification Inspection Notes</label>
          <textarea
            rows={2}
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="e.g. Unboxed, tested boot sequence, verified Wi-Fi and student educational software installed."
            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-2.5 focus:outline-none focus:border-emerald-600"
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
            icon={CheckCircle2}
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
          >
            Mark Physically Received & Add to Inventory
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PhysicalVerificationModal;
