import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Phone,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  BookOpen,
  Users,
  GraduationCap,
  Building,
  Award,
  KeyRound,
  HeartHandshake,
  School,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

export const getDashboardRouteForRole = (role) => {
  switch (role) {
    case 'headmaster_admin':
    case 'admin':
      return '/dashboard/admin';
    case 'teacher':
      return '/dashboard/teacher';
    case 'student':
      return '/dashboard/student';
    case 'parent':
    case 'student_parent':
      return '/dashboard/parent';
    case 'village_head':
      return '/dashboard/local-head';
    case 'alumni':
      return '/dashboard/alumni';
    case 'ngo':
      return '/dashboard/ngo';
    case 'villager':
    case 'community_member':
      return '/dashboard/villager';
    default:
      return '/dashboard';
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    role: 'villager',
    phone: '',
    otp: '',
  });

  const [error, setError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // All 8 official platform roles
  const roleOptions = [
    {
      id: 'village_head',
      title: 'Village Local Head',
      desc: 'Panchayat leadership & community drive coordination',
      icon: Building,
    },
    {
      id: 'alumni',
      title: 'School Alumni',
      desc: 'Give back to your alma mater through resource drives',
      icon: Award,
    },
    {
      id: 'ngo',
      title: 'NGO / Partner',
      desc: 'Institutional partner sponsoring school development',
      icon: Shield,
    },
    {
      id: 'headmaster_admin',
      title: 'Headmaster / Admin',
      desc: 'School governance & verified resource requisitions',
      icon: School,
    },
    {
      id: 'teacher',
      title: 'Teacher',
      desc: 'Classroom attendance, grading & early attention actions',
      icon: BookOpen,
    },
    {
      id: 'parent',
      title: 'Parent / Guardian',
      desc: 'Monitor student progress, attendance alerts & teacher feedback',
      icon: Users,
    },
    {
      id: 'student',
      title: 'Student',
      desc: 'Track personal attendance, homework & term grades',
      icon: GraduationCap,
    },
    {
      id: 'villager',
      title: 'Villager',
      desc: 'Local village resident supporting school initiatives and welfare drives',
      icon: HeartHandshake,
    },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSendOtp = async () => {
    const input = formData.phone.trim();
    if (!input) {
      setError('Please enter your registered Phone Number to receive an OTP');
      return;
    }

    setIsSendingOtp(true);
    setError('');
    setOtpSuccessMessage('');

    try {
      const res = await authService.sendOtp(input);
      setOtpSent(true);
      setOtpCountdown(60);
      const codeNote = res?.data?.otp ? ` (OTP: ${res.data.otp})` : '';
      setOtpSuccessMessage(`${res.message || 'OTP sent successfully!'}${codeNote}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to send OTP. Please try again.';
      setError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.role) {
      setError('Please select your registered platform role');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Please enter your registered Phone Number');
      return;
    }

    if (!formData.otp.trim()) {
      setError('Please enter the OTP verification code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await login({
      role: formData.role,
      phone: formData.phone.trim(),
      identifier: formData.phone.trim(),
      otp: formData.otp.trim(),
    });

    setIsSubmitting(false);

    if (res.success && res.user) {
      const targetDashboard = getDashboardRouteForRole(res.user.role);
      navigate(targetDashboard, { replace: true });
    } else {
      setError(res.error || 'Authentication failed. Please check your details.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50">
      {/* Background soft ambient blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-4xl w-full relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="emerald" size="md">
            Role & OTP Authentication
          </Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to EduConnect
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Select your registered role and enter your Phone Number to authenticate via OTP.
          </p>
        </div>

        <Card className="shadow-lg border-slate-200 bg-white/95 backdrop-blur-md p-6 sm:p-10">
          <div className="space-y-6">
            {/* Error alert */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Authentication Error</p>
                  <p className="text-xs text-rose-700">{error}</p>
                </div>
              </div>
            )}

            {/* OTP Success Alert */}
            {otpSuccessMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{otpSuccessMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 8-Role Selection Grid */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Select Your Registered Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {roleOptions.map((role) => {
                    const Icon = role.icon;
                    const isSelected = formData.role === role.id;
                    return (
                      <div
                        key={role.id}
                        onClick={() => setFormData({ ...formData, role: role.id })}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600 text-slate-900 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-xs font-bold leading-tight">{role.title}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Fields: Phone Number and OTP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* 1. Phone Number with Send OTP Button */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || otpCountdown > 0}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                    >
                      {isSendingOtp
                        ? 'Sending...'
                        : otpCountdown > 0
                        ? `Resend in ${otpCountdown}s`
                        : otpSent
                        ? 'Resend OTP'
                        : 'Send OTP'}
                    </button>
                  </div>
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="Enter registered Phone Number (e.g. +91 98765 43210)"
                    value={formData.phone}
                    onChange={handleChange}
                    icon={Phone}
                    required
                  />
                </div>

                {/* 2. OTP */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="otp" className="block text-sm font-semibold text-slate-700">
                      OTP <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <Input
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={handleChange}
                    icon={KeyRound}
                    required
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full shadow-emerald-700/25"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Verify OTP & Sign In to Dashboard
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-sm text-slate-600">
              <span>Need to register a new platform account? </span>
              <Link
                to="/register"
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Go to Registration Page
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
