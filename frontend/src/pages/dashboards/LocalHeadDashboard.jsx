import React, { useState, useEffect } from 'react';
import {
  Building,
  HeartHandshake,
  Rocket,
  CheckCircle2,
  Users,
  Package,
  PlusCircle,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import CreateDriveModal from '../../components/dashboard/CreateDriveModal';
import CreateSupportRequestModal from '../../components/dashboard/CreateSupportRequestModal';
import SupportRequestTimelineModal from '../../components/dashboard/SupportRequestTimelineModal';

// Services
import schoolNeedService from '../../services/schoolNeedService';
import communityDriveService from '../../services/communityDriveService';
import contributionService from '../../services/contributionService';
import impactService from '../../services/impactService';
import supportRequestService from '../../services/supportRequestService';

export const LocalHeadDashboard = () => {
  const { user } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [drives, setDrives] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [impactStats, setImpactStats] = useState(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Support Requests State
  const [supportRequests, setSupportRequests] = useState([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequestForTimeline, setSelectedRequestForTimeline] = useState(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  const fetchLocalHeadData = async () => {
    setLoading(true);
    try {
      const [needsRes, drivesRes, contribRes, impactRes, requestsRes] = await Promise.allSettled([
        schoolNeedService.getSchoolNeeds(),
        communityDriveService.getCommunityDrives(),
        contributionService.getContributions(),
        impactService.getImpactStats(),
        supportRequestService.getSupportRequests(),
      ]);

      if (needsRes.status === 'fulfilled') setNeeds(needsRes.value.data || []);
      if (drivesRes.status === 'fulfilled') setDrives(drivesRes.value.data || []);
      if (contribRes.status === 'fulfilled') setContributions(contribRes.value.data || []);
      if (impactRes.status === 'fulfilled') setImpactStats(impactRes.value.data || null);
      if (requestsRes.status === 'fulfilled') setSupportRequests(requestsRes.value.data || []);
    } catch (e) {
      console.error('Error fetching local head data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalHeadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="indigo" size="sm" dot>
                Village Leadership Workspace
              </Badge>
              <span className="text-xs text-indigo-300 font-semibold bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800">
                Sundarpur Gram Panchayat
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user?.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Village Education Committee Leadership. Coordinate community support campaigns, rally local residents, alumni, and NGOs to meet verified school resource needs and support village students.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchLocalHeadData}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={HeartHandshake}
              onClick={() => setIsRequestModalOpen(true)}
              className="border-indigo-400/50 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-800"
            >
              + Student Support Request
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Rocket}
              onClick={() => setIsDriveModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-700/20 text-white"
            >
              Launch Support Drive
            </Button>
          </div>
        </div>
      </div>

      {/* Visual Flow Header (Core Flow 2) */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Village & School Collaboration Flow
          </span>
          <span className="text-xs text-slate-400 font-medium">100% Transparent Governance</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          {[
            { step: '1. School', sub: 'Identifies Need' },
            { step: '2. Need', sub: 'Admin Verified' },
            { step: '3. Local Head', sub: 'Launches Drive' },
            { step: '4. Village', sub: 'Pledges Help' },
            { step: '5. School', sub: 'Physical Verification' },
            { step: '6. Inventory', sub: 'Asset Registered' },
            { step: '7. Students', sub: 'Direct Benefit' },
          ].map((s, idx) => (
            <div key={idx} className="bg-slate-800/70 p-2 rounded-xl border border-slate-700/50">
              <p className="font-bold text-indigo-300 text-xs">{s.step}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Village Drives</span>
            <Rocket className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{drives.length} Drives Active</p>
          <p className="text-xs text-slate-500 mt-1">Organized with school administration</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Resources</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">
            {impactStats?.summary?.totalItemsVerified || 3} Items Deployed
          </p>
          <p className="text-xs text-slate-500 mt-1">Verified with physical asset tags</p>
        </Card>

        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Community Donors</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-700 mt-2">
            {impactStats?.summary?.totalActiveContributors || 3} Villagers & Alumni
          </p>
          <p className="text-xs text-slate-500 mt-1">Participating in school drives</p>
        </Card>
      </div>

      {/* Active Community Drives */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Panchayat Community Support Drives</h2>
            <p className="text-xs text-slate-500">Live drives launched to fulfill verified school equipment requisitions.</p>
          </div>
          <Button size="sm" variant="primary" icon={Rocket} onClick={() => setIsDriveModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            New Drive
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {drives.map((drive) => {
            const progress = drive.targetQuantity > 0 ? Math.round((drive.fulfilledQuantity / drive.targetQuantity) * 100) : 0;
            return (
              <Card key={drive._id} className="border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <Badge variant={drive.status === 'Active' ? 'indigo' : 'emerald'} size="xs">
                      {drive.status} Drive
                    </Badge>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {drive.fulfilledQuantity} / {drive.targetQuantity} {drive.unit || 'Units'} Verified
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{drive.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{drive.description}</p>

                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-xs text-slate-500 font-semibold">
                      <span>Drive Fulfillment</span>
                      <span className="text-emerald-700 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>Organizer: {drive.organizerName}</span>
                  <span className="font-semibold text-slate-800">{drive.contributionsCount || 0} Pledges</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Verified School Needs Waiting for Drives */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Verified School Needs from Headmaster</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {needs.map((need) => (
            <Card key={need._id} className="border-slate-200 space-y-2">
              <Badge variant="blue" size="xs">
                {need.category}
              </Badge>
              <h4 className="font-bold text-slate-900 text-sm">{need.title}</h4>
              <p className="text-slate-600 line-clamp-2">{need.description}</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between font-semibold">
                <span>Required: {need.requiredQuantity}</span>
                <span className="text-emerald-700">Received: {need.receivedQuantity}</span>
                <span className="text-rose-700">Remaining: {need.remainingQuantity}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Village Student Support Requests Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              Village Student Support Requests
            </h2>
            <p className="text-xs text-slate-500">
              Sponsor educational materials and welfare assistance for students in {user?.village || 'Sundarpur Gram Panchayat'}. Requests are verified by the Head Master and routed to partner NGOs.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => setIsRequestModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white self-start sm:self-auto"
          >
            Create Support Request
          </Button>
        </div>

        {supportRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportRequests.map((req) => (
              <Card key={req._id} className="border-slate-200 hover:border-indigo-300 transition-all p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      {req.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{req.title}</h4>
                    <p className="text-xs text-slate-500">
                      Student: <strong className="text-slate-700">{req.studentName}</strong> • {req.studentClass} (Village: {req.village})
                    </p>
                  </div>
                  <div>
                    {req.status === 'Pending' && <Badge variant="amber" dot>Pending</Badge>}
                    {req.status === 'Under Review' && <Badge variant="indigo" dot>Under Review</Badge>}
                    {req.status === 'Approved' && <Badge variant="emerald" dot>Approved</Badge>}
                    {req.status === 'Forwarded to NGO/Partner' && <Badge variant="purple" dot>Forwarded</Badge>}
                    {req.status === 'Accepted' && <Badge variant="teal" dot>Accepted</Badge>}
                    {req.status === 'Rejected' && <Badge variant="rose" dot>Declined</Badge>}
                    {req.status === 'Completed' && <Badge variant="green" dot>Completed</Badge>}
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {req.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${req.priority === 'Urgent' ? 'text-rose-600' : 'text-slate-600'}`}>
                      {req.priority} Priority
                    </span>
                    {req.estimatedAmount > 0 && <span>• ₹{req.estimatedAmount}</span>}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRequestForTimeline(req);
                      setIsTimelineModalOpen(true);
                    }}
                    className="text-indigo-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Track Status
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8 border-dashed border-slate-300">
            <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No village student requests active</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Know a child in your village needing uniforms, stationery, bag, or scholarship assistance? Rally support through our verified Head Master & NGO pipeline.
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={PlusCircle}
              onClick={() => setIsRequestModalOpen(true)}
              className="border-indigo-300 text-indigo-800 hover:bg-indigo-50"
            >
              Submit Student Request
            </Button>
          </Card>
        )}
      </div>

      {/* Drive Modal */}
      <CreateDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        needs={needs}
        onDriveCreated={fetchLocalHeadData}
      />

      {/* Support Request Modals */}
      <CreateSupportRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={fetchLocalHeadData}
        role="village_head"
      />

      <SupportRequestTimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => {
          setIsTimelineModalOpen(false);
          setSelectedRequestForTimeline(null);
        }}
        request={selectedRequestForTimeline}
      />
    </div>
  );
};

export default LocalHeadDashboard;
