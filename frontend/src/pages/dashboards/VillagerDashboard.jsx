import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Package,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Award,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ContributionPledgeModal from '../../components/dashboard/ContributionPledgeModal';

// Services
import communityDriveService from '../../services/communityDriveService';
import contributionService from '../../services/contributionService';
import impactService from '../../services/impactService';

export const VillagerDashboard = () => {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [myContributions, setMyContributions] = useState([]);
  const [impactStats, setImpactStats] = useState(null);
  const [selectedDriveForPledge, setSelectedDriveForPledge] = useState(null);
  const [isPledgeModalOpen, setIsPledgeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchVillagerData = async () => {
    setLoading(true);
    try {
      const [drivesRes, contribRes, impactRes] = await Promise.allSettled([
        communityDriveService.getCommunityDrives(),
        contributionService.getContributions(),
        impactService.getImpactStats(),
      ]);

      if (drivesRes.status === 'fulfilled') setDrives(drivesRes.value.data || []);
      if (contribRes.status === 'fulfilled') setMyContributions(contribRes.value.data || []);
      if (impactRes.status === 'fulfilled') setImpactStats(impactRes.value.data || null);
    } catch (e) {
      console.error('Error fetching villager community data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVillagerData();
  }, []);

  const openPledgeModal = (drive) => {
    setSelectedDriveForPledge(drive);
    setIsPledgeModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm" dot>
                Villager Community Support Hub
              </Badge>
              <span className="text-xs text-teal-300 font-semibold bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800">
                Community Resident
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Support Govt Model Higher Secondary School. Donate learning equipment, sponsor digital tools, or volunteer your time to empower our village children.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchVillagerData}
            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 self-start md:self-auto"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Community Impact Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Village Drives</span>
            <HeartHandshake className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{drives.length} Drives Open</p>
          <p className="text-xs text-slate-500 mt-1">Verified by School Headmaster</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Active Pledges</span>
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-700 mt-2">{myContributions.length} Contributions</p>
          <p className="text-xs text-slate-500 mt-1">Tracking physical verification</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Resources</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">
            {impactStats?.summary?.totalItemsVerified || 3} Deployed
          </p>
          <p className="text-xs text-slate-500 mt-1">In active student classroom use</p>
        </Card>
      </div>

      {/* Active Community Drives with "I CAN HELP" Buttons */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active School Support Drives</h2>
            <p className="text-xs text-slate-500">
              Browse current school equipment shortages and click <strong className="text-teal-700">"I CAN HELP"</strong> to pledge items or sponsorships.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {drives.map((drive) => {
            const progress = drive.targetQuantity > 0 ? Math.round((drive.fulfilledQuantity / drive.targetQuantity) * 100) : 0;
            return (
              <Card key={drive._id} className="border-slate-200 space-y-4 flex flex-col justify-between hover:border-teal-300 transition-all shadow-xs">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="teal" size="xs">
                      {drive.village || 'Sundarpur Panchayat'}
                    </Badge>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {drive.fulfilledQuantity} / {drive.targetQuantity} {drive.unit || 'Units'} Verified
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{drive.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{drive.description}</p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600 font-semibold">
                      <span>Drive Fulfillment Progress</span>
                      <span className="text-emerald-700 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Lead: {drive.organizerName}</span>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={HeartHandshake}
                    onClick={() => openPledgeModal(drive)}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-700/20"
                  >
                    I CAN HELP
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* My Pledges & Verification Status Tracker */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">My Contributions & Verification Status</h2>
        {myContributions.length > 0 ? (
          <div className="space-y-3">
            {myContributions.map((contrib) => (
              <Card key={contrib._id} className="border-slate-200 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{contrib.itemDetails}</h4>
                    <p className="text-slate-500">
                      Drive: {contrib.drive?.title} • Qty: {contrib.quantity}
                    </p>
                  </div>

                  <Badge
                    variant={
                      contrib.status === 'RECEIVED'
                        ? 'emerald'
                        : contrib.status === 'APPROVED'
                        ? 'blue'
                        : contrib.status === 'REJECTED'
                        ? 'rose'
                        : 'amber'
                    }
                    size="sm"
                  >
                    {contrib.status === 'PENDING'
                      ? 'PENDING (Under Review)'
                      : contrib.status === 'APPROVED'
                      ? 'APPROVED (Ready for Handover)'
                      : contrib.status === 'RECEIVED'
                      ? 'RECEIVED & IN STUDENT USE'
                      : 'REJECTED'}
                  </Badge>
                </div>

                {/* Progress Step Visualizer */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-2 border-t border-slate-100 font-semibold">
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                    ✓ 1. Pledge Submitted
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      contrib.status === 'APPROVED' || contrib.status === 'RECEIVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    {contrib.status === 'APPROVED' || contrib.status === 'RECEIVED' ? '✓ 2. Admin Approved' : '2. Admin Review'}
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      contrib.status === 'RECEIVED'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    {contrib.status === 'RECEIVED'
                      ? `✓ 3. Verified (${contrib.physicalVerification?.assetTag || 'Asset Tagged'})`
                      : '3. Physical Verification'}
                  </div>
                </div>

                {contrib.physicalVerification?.verificationNotes && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                    <strong>School Verification Note:</strong> {contrib.physicalVerification.verificationNotes}
                  </p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-6 text-slate-500 text-xs">
            You haven't submitted any contribution pledges yet. Click "I CAN HELP" on any drive above to support the school!
          </Card>
        )}
      </div>

      {/* Pledge Modal */}
      {selectedDriveForPledge && (
        <ContributionPledgeModal
          isOpen={isPledgeModalOpen}
          onClose={() => {
            setIsPledgeModalOpen(false);
            setSelectedDriveForPledge(null);
          }}
          drive={selectedDriveForPledge}
          onPledgeSubmitted={fetchVillagerData}
        />
      )}
    </div>
  );
};

export default VillagerDashboard;
