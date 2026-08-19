import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  School,
  Utensils,
  HeartHandshake,
  Users,
  ShieldCheck,
  Award,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Sparkles,
  TrendingUp,
  Building,
  Heart,
  ChevronRight,
  Layers,
  FileCheck,
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const LandingPage = () => {
  const [activeRoleTab, setActiveRoleTab] = useState('headmaster');

  const roleDetails = {
    headmaster: {
      title: 'School Headmaster & Administration',
      badge: 'Administrative Lead',
      description:
        'Oversee school infrastructure, manage classroom allocations, monitor faculty attendance, and submit government development requisitions in real time.',
      features: [
        'Real-time student & staff attendance dashboard',
        'Direct infrastructure repair & facility fund requests',
        'Automated academic term and performance reporting',
        'Official government scheme compliance logs',
      ],
      color: 'emerald',
      cta: 'Explore School Admin',
    },
    teacher: {
      title: 'Teachers & Educators',
      badge: 'Academic Delivery',
      description:
        'Deliver smart classroom learning, record student daily attendance, monitor learning outcomes, and flag students in need of academic or nutritional support.',
      features: [
        'One-tap mobile & desktop classroom attendance',
        'Early learning drop-out warning triggers',
        'Digital homework & student welfare alerts',
        'Direct liaison with parents and village mentors',
      ],
      color: 'blue',
      cta: 'Enter Faculty Portal',
    },
    welfare: {
      title: 'Welfare & Education Officers',
      badge: 'Government Oversight',
      description:
        'Ensure transparent distribution of mid-day meals, uniforms, textbooks, and state scholarships directly to eligible village students without leakage.',
      features: [
        'Mid-day meal nutritional tracking & stock audit',
        'Direct scholarship fund status validation',
        'Village health & immunization camp scheduling',
        'District-wide school comparison analytics',
      ],
      color: 'purple',
      cta: 'Access Welfare Suite',
    },
    volunteer: {
      title: 'Village Community, Donors & Volunteers',
      badge: 'Community Power',
      description:
        'Empower local villages to participate in school governance, donate educational kits, conduct weekend remedial classes, and support children.',
      features: [
        'Volunteer teaching and mentorship registration',
        'Transparent school crowdfunding & resource donation',
        'Village Education Committee (VEC) resolutions',
        'Community library and sports gear drives',
      ],
      color: 'teal',
      cta: 'Join as a Volunteer',
    },
  };

  const currentRole = roleDetails[activeRoleTab];

  const platformStats = [
    { label: 'Government Schools Connected', value: '2,400+', icon: School, color: 'text-emerald-600' },
    { label: 'Students Supported', value: '180,000+', icon: Users, color: 'text-sky-600' },
    { label: 'Mid-Day Meals Monitored', value: '1.2M+', icon: Utensils, color: 'text-amber-600' },
    { label: 'Village Volunteers Active', value: '8,500+', icon: HeartHandshake, color: 'text-purple-600' },
  ];

  const pillars = [
    {
      title: 'Smart School Infrastructure',
      description:
        'Digital attendance tracking, classroom resource inventory, and rapid government infrastructure grant coordination.',
      icon: School,
      badge: 'Infrastructure',
      badgeColor: 'emerald',
    },
    {
      title: 'Nutritional & Health Welfare',
      description:
        'Daily Mid-Day Meal (MDM) quality reporting, student nutritional metrics, and scheduled rural healthcare checkups.',
      icon: Utensils,
      badge: 'Nutrition & Health',
      badgeColor: 'amber',
    },
    {
      title: 'Direct Scholarship Governance',
      description:
        'Transparent verification of student entitlement schemes, stationery kit distributions, and fee waivers.',
      icon: Award,
      badge: 'Welfare Schemes',
      badgeColor: 'purple',
    },
    {
      title: 'Village Community & Alumni Network',
      description:
        'Connecting village panchayats, local donors, and volunteer tutors to support rural schools with mentorship.',
      icon: HeartHandshake,
      badge: 'Community Action',
      badgeColor: 'teal',
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-20 pb-24 lg:pt-28 lg:pb-32">
        {/* Background ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 opacity-20 blur-3xl pointer-events-none bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Next-Gen Smart Public Education Ecosystem</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Bridging <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">Government Schools</span>, Student Welfare & Village Communities
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                EduConnect is a unified governance platform streamlining rural school administration,
                tracking nutritional student schemes, and mobilizing grassroots village volunteers to ensure
                no child is left behind.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Get Started as Citizen / Faculty
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
                  >
                    Enter Role Portal
                  </Button>
                </Link>
              </div>

              {/* Trust markers */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Real-Time Scheme Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Multi-Tier Role Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Village Community Verified</span>
                </div>
              </div>
            </div>

            {/* Right Hero Graphic Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl p-1 bg-gradient-to-b from-emerald-500/30 via-slate-700/20 to-transparent shadow-2xl">
                <div className="rounded-[22px] bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>
                    <Badge variant="emerald" size="sm" dot>
                      Live Network Active
                    </Badge>
                  </div>

                  {/* Mock live dashboard card snippet */}
                  <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Government Primary School • Ward #4</span>
                      <span className="text-emerald-400 font-semibold">98.4% Attendance</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-200">
                        <span>Mid-Day Meal Nutritional Distribution</span>
                        <span className="text-emerald-400">Verified Today</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[94%]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                        <p className="text-[11px] text-slate-400">Volunteer Mentors</p>
                        <p className="text-lg font-bold text-white mt-0.5">14 Enrolled</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                        <p className="text-[11px] text-slate-400">Scholarship Sync</p>
                        <p className="text-lg font-bold text-teal-400 mt-0.5">100% Disbursed</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick role highlight banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-900/60 text-xs text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>Role-Based Access Control Enabled</span>
                    </div>
                    <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                      Login &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {platformStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 flex items-center gap-4 transition-transform hover:-translate-y-1"
              >
                <div className={`p-3.5 rounded-2xl bg-slate-50 border border-slate-100 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section id="pillars" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <Badge variant="emerald" size="md">
            Holistic Ecosystem
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Four Pillars of Smart Public School Empowerment
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            EduConnect links every stakeholder in rural education through transparent data,
            nutritional verification, direct welfare access, and community mobilization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <Card
                key={idx}
                hoverable
                className="flex flex-col justify-between border-slate-200/90 hover:border-emerald-300 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant={pillar.badgeColor} size="sm">
                      {pillar.badge}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-slate-100">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>View Role Capabilities</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Interactive Role Switcher & Capabilities Showcase */}
      <section id="schemes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl border border-slate-800">
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Tailored Experiences
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Designed for Every Pillar of Rural Education
              </h2>
              <p className="text-sm text-slate-400">
                Choose a role to preview the custom capabilities engineered for school admins,
                educators, welfare inspectors, and village volunteers.
              </p>
            </div>

            {/* Role Tab Buttons */}
            <div className="flex flex-wrap gap-2.5 pb-2 border-b border-slate-800">
              {[
                { key: 'headmaster', label: 'Headmaster & Admin', icon: School },
                { key: 'teacher', label: 'Teacher & Educator', icon: BookOpen },
                { key: 'welfare', label: 'Welfare Officer', icon: ShieldCheck },
                { key: 'volunteer', label: 'Village Volunteer / Donor', icon: HeartHandshake },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeRoleTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveRoleTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-medium">
                  {currentRole.badge}
                </div>
                <h3 className="text-2xl font-bold text-white">{currentRole.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentRole.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentRole.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3">
                  <Link to="/login">
                    <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                      Sign In to Access Portal
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Role preview visual */}
              <div className="lg:col-span-5">
                <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-400">Portal Preview</span>
                    <span className="text-[10px] bg-emerald-900/80 text-emerald-300 font-bold px-2 py-0.5 rounded">
                      Authorized Mode
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                      <span className="text-slate-300 font-medium">Student Welfare Verification</span>
                      <span className="text-emerald-400 font-bold">100% Synced</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                      <span className="text-slate-300 font-medium">Nutrition & Mid-Day Meal</span>
                      <span className="text-amber-400 font-bold">Active Today</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                      <span className="text-slate-300 font-medium">Community Fund Transparency</span>
                      <span className="text-teal-400 font-bold">Audit Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Volunteer Callout */}
      <section id="community" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-800 text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Are you a Village Resident, Volunteer or Donor?
            </h3>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Support local government schools by tutoring, donating books and sports equipment,
              or participating in village education committee decisions.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                variant="accent"
                size="lg"
                className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-900 font-bold"
              >
                Register as Volunteer
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-emerald-300/40 text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
