import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  HeartHandshake,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { getDashboardRouteForRole } from './LoginPage';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    aadhaarNumber: '',
    schoolName: '',
    studentIdentifier: '',
    otp: '',
    role: 'villager',
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
      setError('Please select your platform role');
      return;
    }

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

    const res = await register({
      role: formData.role,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      aadhaarNumber: formData.aadhaarNumber.trim(),
      schoolName: formData.role === 'headmaster_admin' ? formData.schoolName.trim() : '',
      otp: formData.otp.trim(),
    });

    setIsSubmitting(false);

    if (res.success && res.user) {
      const targetDashboard = getDashboardRouteForRole(res.user.role);
      navigate(targetDashboard, { replace: true });
    } else {
      setError(res.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      <div className="max-w-4xl w-full relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="emerald" size="md">
            Citizen & Institutional Enrollment
          </Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Join the EduConnect Platform
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Create your account to participate in government school governance, student welfare, or
            village community volunteer drives.
          </p>
        </div>

        <Card className="shadow-lg border-slate-200 bg-white/95 backdrop-blur-md p-6 sm:p-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Issue</p>
                <p className="text-xs text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {otpSuccessMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Phone Verification OTP</p>
                <p className="text-xs text-emerald-700">{otpSuccessMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 8-Role Selection Grid */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Select Your Platform Role <span className="text-rose-500">*</span>
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
                          ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 text-slate-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold leading-tight">{role.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{role.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Registration Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Full Name (All roles) */}
              <Input
                label="Full Name"
                name="name"
                placeholder="e.g. Meenakshi"
                value={formData.name}
                onChange={handleChange}
                icon={User}
                required
              />

              {/* 2. Phone Number with Send OTP (All roles) */}
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
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  icon={Phone}
                  required
                />
              </div>

              {/* 3. Aadhaar Number (All roles) */}
              <Input
                label="Aadhaar Number"
                name="aadhaarNumber"
                placeholder="XXXX XXXX XXXX (12 Digits)"
                value={formData.aadhaarNumber}
                onChange={handleChange}
                icon={CreditCard}
                required
              />

              {/* 4. OTP (All roles) */}
              <Input
                label="OTP"
                name="otp"
                placeholder="Enter 6-digit OTP"
                value={formData.otp}
                onChange={handleChange}
                icon={KeyRound}
                required
                maxLength={6}
              />

              {/* 5. School Name (Headmaster / Admin ONLY) */}
              {formData.role === 'headmaster_admin' && (
                <Input
                  label="School Name"
                  name="schoolName"
                  placeholder="Govt Model Higher Secondary School"
                  value={formData.schoolName}
                  onChange={handleChange}
                  icon={School}
                  required
                  className="sm:col-span-2"
                />
              )}

              {/* 6. Child Admission / Roll Number (Parent / Guardian) */}
              {formData.role === 'parent' && (
                <Input
                  label="Linked Child Admission No. / Roll No. (Optional)"
                  name="studentIdentifier"
                  placeholder="e.g. SCH-2024-006 or 06"
                  value={formData.studentIdentifier}
                  onChange={handleChange}
                  icon={GraduationCap}
                  className="sm:col-span-2"
                />
              )}
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
                Complete Registration & Enter Dashboard
              </Button>
            </div>
          </form>

          <div className="pt-6 mt-6 border-t border-slate-100 text-center text-sm text-slate-600">
            <span>Already registered on EduConnect? </span>
            <Link
              to="/login"
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Sign In to Portal
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
