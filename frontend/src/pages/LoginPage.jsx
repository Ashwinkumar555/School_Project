import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Phone,
  CreditCard,
  School,
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    aadhaarNumber: '',
    schoolName: '',
    otp: '',
    role: 'village_head',
  });

  const [error, setError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [selectedRoleForDemo, setSelectedRoleForDemo] = useState(null);

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Strictly the 7 required platform roles in order
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
  ];

  // Quick-fill accounts strictly covering the 7 roles
  const demoAccounts = [
    {
      role: 'village_head',
      label: 'Village Local Head',
      name: 'Sarpanch Baldev Singh',
      phone: '+91 98765 00006',
      aadhaar: '123456789006',
      icon: Building,
    },
    {
      role: 'alumni',
      label: 'School Alumni',
      name: 'Vikram Seth',
      phone: '+91 98765 00007',
      aadhaar: '123456789007',
      icon: Award,
    },
    {
      role: 'ngo',
      label: 'NGO / Partner',
      name: 'Ananya Roy (Smile NGO)',
      phone: '+91 98765 00008',
      aadhaar: '123456789008',
      icon: Shield,
    },
    {
      role: 'headmaster_admin',
      label: 'Headmaster / Admin',
      name: 'Dr. Ramesh Sharma',
      phone: '+91 98765 00001',
      aadhaar: '123456789001',
      schoolName: 'Govt Model Higher Secondary School',
      icon: School,
    },
    {
      role: 'teacher',
      label: 'Teacher',
      name: 'Priya Sundaram',
      phone: '+91 98765 00002',
      aadhaar: '123456789002',
      icon: BookOpen,
    },
    {
      role: 'parent',
      label: 'Parent / Guardian',
      name: 'Meena Devi',
      phone: '+91 98765 00005',
      aadhaar: '123456789005',
      icon: Users,
    },
    {
      role: 'student',
      label: 'Student',
      name: 'Aarav Kumar',
      phone: '+91 98765 00010',
      aadhaar: '123456789010',
      icon: GraduationCap,
    },
  ];

  const handleDemoFill = (account) => {
    setSelectedRoleForDemo(account.role);
    setFormData({
      role: account.role,
      name: account.name,
      phone: account.phone,
      aadhaarNumber: account.aadhaar,
      schoolName: account.schoolName || '',
      otp: '123456',
    });
    setOtpSent(true);
    setOtpSuccessMessage(`Credentials populated for ${account.label} (OTP: 123456)`);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSendOtp = async () => {
    if (!formData.phone.trim()) {
      setError('Please enter your phone number to receive an OTP');
      return;
    }

    setIsSendingOtp(true);
    setError('');
    setOtpSuccessMessage('');

    try {
      const res = await authService.sendOtp(formData.phone.trim());
      setOtpSent(true);
      setOtpCountdown(60);
      const demoCode = res?.data?.otp ? ` (Verification Code: ${res.data.otp})` : '';
      setOtpSuccessMessage(`OTP sent successfully to ${formData.phone.trim()}${demoCode}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to send OTP. Please try again.';
      setError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!formData.aadhaarNumber.trim()) {
      setError('Please enter your Aadhaar number');
      return;
    }

    if (formData.role === 'headmaster_admin' && !formData.schoolName.trim()) {
      setError('Please enter your school name');
      return;
    }

    if (!formData.otp.trim()) {
      setError('Please enter the OTP received on your registered phone number');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await login({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      aadhaarNumber: formData.aadhaarNumber.trim(),
      otp: formData.otp.trim(),
      role: formData.role,
      schoolName: formData.role === 'headmaster_admin' ? formData.schoolName.trim() : 'Govt Model Higher Secondary School',
    });

    setIsSubmitting(false);

    if (res.success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      setError(res.error || 'Authentication failed. Please check your details.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50">
      {/* Background soft ambient blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Side: 7-Role Quick Demo Accounts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-2">
            <Badge variant="emerald" size="md">
              Phone & OTP Access
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to EduConnect
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Authenticate securely using your phone number, full name, Aadhaar number, and SMS OTP.
            </p>
          </div>

          {/* Demo account quick-pick */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                7 Official Demo Accounts
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Click to populate</span>
            </div>
            <div className="space-y-2">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                const isSelected = selectedRoleForDemo === account.role;
                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleDemoFill(account)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{account.label}</p>
                        <p className="text-[10px] text-slate-500">{account.name} • {account.phone}</p>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form with Role Selector and Required Fields */}
        <div className="lg:col-span-8">
          <Card className="shadow-lg border-slate-200 bg-white/95 backdrop-blur-md p-6 sm:p-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Role Authentication & Sign In
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select your role and enter your details to verify OTP and enter your role dashboard.
                </p>
              </div>

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

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 7-Role Selection Grid */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    Select Your Platform Role <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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

                {/* Form Fields: Full Name, Phone, Aadhaar, School Name (Admin only), OTP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* 1. Full Name */}
                  <Input
                    label="Full Name"
                    name="name"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={handleChange}
                    icon={User}
                    required
                  />

                  {/* 2. Phone Number with Send OTP */}
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
                      placeholder="+91 98765 00001"
                      value={formData.phone}
                      onChange={handleChange}
                      icon={Phone}
                      required
                    />
                  </div>

                  {/* 3. Aadhaar Number */}
                  <Input
                    label="Aadhaar Number"
                    name="aadhaarNumber"
                    placeholder="XXXX XXXX XXXX (12 Digits)"
                    value={formData.aadhaarNumber}
                    onChange={handleChange}
                    icon={CreditCard}
                    required
                  />

                  {/* 4. School Name (Headmaster / Admin ONLY) */}
                  {formData.role === 'headmaster_admin' && (
                    <Input
                      label="School Name"
                      name="schoolName"
                      placeholder="Govt Model Higher Secondary School"
                      value={formData.schoolName}
                      onChange={handleChange}
                      icon={School}
                      required
                    />
                  )}

                  {/* 5. OTP */}
                  <Input
                    label="OTP (Phone Verification)"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={handleChange}
                    icon={KeyRound}
                    required
                    maxLength={6}
                    className={formData.role === 'headmaster_admin' ? 'sm:col-span-2' : ''}
                  />
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
    </div>
  );
};

export default LoginPage;
