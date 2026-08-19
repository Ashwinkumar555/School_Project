import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  Package,
  CheckCircle2,
  HeartHandshake,
  Sparkles,
  RefreshCw,
  School,
  FileCheck,
  TrendingUp,
  Award,
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

export const NgoDashboard = () => {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [myContributions, setMyContributions] = useState([]);
  const [impactStats, setImpactStats] = useState(null);
  const [selectedDriveForPledge, setSelectedDriveForPledge] = useState(null);
  const [isPledgeModalOpen, setIsPledgeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNgoData = async () => {
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
      console.error('Error fetching NGO data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNgoData();
  }, []);

  const openPledgeModal = (drive) => {
    setSelectedDriveForPledge(drive);
    setIsPledgeModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="rose" size="sm" dot>
                NGO / Partner Dashboard
              </Badge>
              <span className="text-xs text-rose-300 font-semibold bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800">
                {user?.organizationName || 'Institutional Partner Foundation'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Partner Representative'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Collaborate on rural education development. Sponsor school infrastructure needs, fund educational materials, monitor grant distributions, and audit verified asset handovers.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchNgoData}
            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 self-start md:self-auto"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* NGO Impact Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Partner Drives</span>
            <Building className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{drives.length} Drives Open</p>
          <p className="text-xs text-slate-500 mt-1">Verified with School Administration</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institutional Pledges</span>
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-700 mt-2">{myContributions.length} Grants / Pledges</p>
          <p className="text-xs text-slate-500 mt-1">Direct institutional sponsorships</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Resource Deployments</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">
            {impactStats?.summary?.totalItemsVerified || 3} Deployed
          </p>
          <p className="text-xs text-slate-500 mt-1">Audited asset tags in classrooms</p>
        </Card>
      </div>

      {/* Institutional School Support Drives with "SPONSOR / PLEDGE" Buttons */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Verified School Infrastructure & Material Drives</h2>
            <p className="text-xs text-slate-500">
              Review certified government school resource requirements and click <strong className="text-rose-700">"SPONSOR / PLEDGE"</strong> to allocate foundation grants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {drives.map((drive) => {
            const progress = drive.targetQuantity > 0 ? Math.round((drive.fulfilledQuantity / drive.targetQuantity) * 100) : 0;
            return (
              <Card key={drive._id} className="border-slate-200 space-y-4 flex flex-col justify-between hover:border-rose-300 transition-all shadow-xs">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="rose" size="xs">
                      {drive.village || 'Institutional Development Need'}
                    </Badge>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      {drive.fulfilledQuantity} / {drive.targetQuantity} {drive.unit || 'Units'} Verified
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{drive.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{drive.description}</p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600 font-semibold">
                      <span>Grant Fulfillment Progress</span>
                      <span className="text-rose-700 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">School Admin: {drive.organizerName}</span>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={HeartHandshake}
                    onClick={() => openPledgeModal(drive)}
                    className="bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-700/20"
                  >
                    SPONSOR / PLEDGE
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* My NGO Pledges & Verification Audit Tracker */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Institutional Grants & Asset Verification Audit</h2>
        {myContributions.length > 0 ? (
          <div className="space-y-3">
            {myContributions.map((contrib) => (
              <Card key={contrib._id} className="border-slate-200 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{contrib.itemDetails}</h4>
                    <p className="text-slate-500">
                      Drive: {contrib.drive?.title} • Allocated Quantity: {contrib.quantity}
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
                    ✓ 1. Grant Pledged
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      contrib.status === 'APPROVED' || contrib.status === 'RECEIVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    {contrib.status === 'APPROVED' || contrib.status === 'RECEIVED' ? '✓ 2. Admin Certified' : '2. Certification Review'}
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
                      : '3. Physical Asset Audited'}
                  </div>
                </div>

                {contrib.physicalVerification?.verificationNotes && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                    <strong>School Verification Audit:</strong> {contrib.physicalVerification.verificationNotes}
                  </p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-6 text-slate-500 text-xs">
            No institutional grants or pledges recorded yet. Click "SPONSOR / PLEDGE" on any open drive above to partner with the school!
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
          onPledgeSubmitted={fetchNgoData}
        />
      )}
    </div>
  );
};

export default NgoDashboard;
