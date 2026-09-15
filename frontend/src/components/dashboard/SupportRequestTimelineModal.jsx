import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building,
  HeartHandshake,
  User,
  ShieldCheck,
  Calendar,
  XCircle,
  Package,
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';

const getStatusBadge = (status) => {
  switch (status) {
    case 'Pending':
      return <Badge variant="amber" dot>Pending Review</Badge>;
    case 'Under Review':
      return <Badge variant="indigo" dot>Under Review</Badge>;
    case 'Approved':
      return <Badge variant="emerald" dot>Verified & Approved</Badge>;
    case 'Forwarded to NGO/Partner':
      return <Badge variant="purple" dot>Forwarded to Partner</Badge>;
    case 'Accepted':
      return <Badge variant="teal" dot>Partner Accepted</Badge>;
    case 'Rejected':
      return <Badge variant="rose" dot>Declined</Badge>;
    case 'Completed':
      return <Badge variant="green" dot>Completed & Disbursed</Badge>;
    default:
      return <Badge variant="slate">{status}</Badge>;
  }
};

const getRoleBadgeVariant = (role) => {
  switch (role) {
    case 'headmaster_admin':
    case 'admin':
      return 'emerald';
    case 'ngo':
      return 'rose';
    case 'village_head':
      return 'indigo';
    case 'parent':
      return 'amber';
    default:
      return 'slate';
  }
};

export const SupportRequestTimelineModal = ({ isOpen, onClose, request }) => {
  if (!request) return null;

  const steps = [
    {
      label: 'Submitted',
      status: 'Pending',
      done: true,
      desc: `Created by ${request.requesterName} (${request.requesterRole === 'village_head' ? 'Local Head' : 'Parent'})`,
    },
    {
      label: 'Head Master Review',
      status: 'Approved',
      done: ['Approved', 'Forwarded to NGO/Partner', 'Accepted', 'Completed'].includes(request.status),
      active: request.status === 'Under Review',
      rejected: request.status === 'Rejected' && !request.targetNgo,
      desc: request.headMasterReview?.reviewerName
        ? `Reviewed by ${request.headMasterReview.reviewerName}`
        : 'Awaiting institutional verification',
    },
    {
      label: 'Forwarded to NGO',
      status: 'Forwarded to NGO/Partner',
      done: ['Forwarded to NGO/Partner', 'Accepted', 'Completed'].includes(request.status),
      desc: request.targetNgoName ? `Assigned to ${request.targetNgoName}` : 'Forwarded for NGO sponsorship',
    },
    {
      label: 'NGO Provision',
      status: 'Accepted',
      done: ['Accepted', 'Completed'].includes(request.status),
      rejected: request.status === 'Rejected' && !!request.targetNgo,
      desc: request.ngoSupport?.ngoName
        ? `${request.ngoSupport.ngoName} pledged support`
        : 'Awaiting partner response',
    },
    {
      label: 'Completed',
      status: 'Completed',
      done: request.status === 'Completed',
      desc: request.status === 'Completed' ? 'Support materials disbursed' : 'Pending final handover',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Support Request Lifecycle & Audit Trail"
      subtitle={`Request ID: ${request._id?.slice(-8).toUpperCase()} • ${request.category}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-left pt-2">
        {/* Header Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {request.category}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{request.title}</h3>
            </div>
            <div>{getStatusBadge(request.status)}</div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80">
            {request.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <span className="text-slate-400 block">Student:</span>
              <span className="font-semibold text-slate-800">{request.studentName}</span>
              <span className="text-slate-500 block">
                {request.studentClass || 'Class 8-A'} (Roll {request.studentRoll || 'N/A'})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Requested By:</span>
              <span className="font-semibold text-slate-800">{request.requesterName}</span>
              <span className="text-slate-500 block">
                {request.requesterRole === 'village_head' ? 'Village Local Head' : 'Parent / Guardian'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Priority:</span>
              <span
                className={`font-bold ${
                  request.priority === 'Urgent'
                    ? 'text-rose-600'
                    : request.priority === 'High'
                    ? 'text-amber-600'
                    : 'text-slate-700'
                }`}
              >
                {request.priority} Priority
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Est. Value / Items:</span>
              <span className="font-semibold text-emerald-700">
                {request.estimatedAmount ? `₹${request.estimatedAmount}` : request.supportRequired || 'Essential Supplies'}
              </span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Pipeline Progress */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Workflow Progress
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-center transition-all ${
                  step.rejected
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : step.done
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
                    : step.active
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {step.rejected ? (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  ) : step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : step.active ? (
                    <Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="font-bold text-xs">{step.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5 line-clamp-2">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Support Details if Accepted/Completed */}
        {request.ngoSupport?.ngoName && (
          <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold uppercase text-rose-900 tracking-wider">
                NGO Partner Commitment ({request.ngoSupport.ngoName})
              </span>
            </div>
            <div className="text-xs sm:text-sm text-slate-800 space-y-1">
              <div>
                <strong>Support Type:</strong> {request.ngoSupport.supportType || 'In-Kind Educational Kit'}
              </div>
              {request.ngoSupport.supportDetails && (
                <div>
                  <strong>Support Details:</strong> {request.ngoSupport.supportDetails}
                </div>
              )}
              {request.ngoSupport.fulfillmentDate && (
                <div>
                  <strong>Fulfillment / Delivery Date:</strong>{' '}
                  {new Date(request.ngoSupport.fulfillmentDate).toLocaleDateString()}
                </div>
              )}
              {request.ngoSupport.completionNotes && (
                <div>
                  <strong>Handover Notes:</strong> {request.ngoSupport.completionNotes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Complete Status History / Audit Trail */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Audit History & Status Log
          </h4>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {(request.statusHistory || []).map((h, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-emerald-500 shadow-sm" />
                <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{h.status}</span>
                      <Badge variant={getRoleBadgeVariant(h.changerRole)} size="sm">
                        {h.changerRole}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{h.note}</p>
                  <div className="text-[10px] text-slate-400">Action recorded by: {h.changerName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SupportRequestTimelineModal;
