import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  Activity,
  Menu,
  X,
  User,
  LogOut,
  ChevronRight,
  HeartHandshake,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import healthService from '../../services/healthService';
import Badge from '../common/Badge';
import Button from '../common/Button';

const Navbar = () => {
  const { user, isAuthenticated, logout, getRoleDisplayName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState({
    status: 'checking',
    dbConnected: false,
    checkedAt: null,
  });

  // Check health on mount and every 30s
  useEffect(() => {
    let isMounted = true;

    const checkApiHealth = async () => {
      try {
        const data = await healthService.checkHealth();
        if (isMounted) {
          setHealthStatus({
            status: data.status || 'healthy',
            dbConnected: data.services?.database?.connected || false,
            checkedAt: new Date(),
          });
        }
      } catch (err) {
        if (isMounted) {
          setHealthStatus({
            status: 'offline',
            dbConnected: false,
            checkedAt: new Date(),
          });
        }
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Key Pillars', path: '/#pillars' },
    { label: 'Welfare Schemes', path: '/#schemes' },
    { label: 'Community Hub', path: '/#community' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                  Edu<span className="text-emerald-600">Connect</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Gov
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Smart School & Village Welfare Platform
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.path}
                className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Actions & Health Status */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Live API Health Indicator */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs font-medium text-slate-600"
              title={`API: ${healthStatus.status.toUpperCase()} | DB: ${
                healthStatus.dbConnected ? 'CONNECTED' : 'DISCONNECTED / STANDBY'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus.status === 'healthy'
                    ? 'bg-emerald-500 animate-pulse'
                    : healthStatus.status === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px]">
                {healthStatus.status === 'healthy' ? 'API Online' : 'API Standby'}
              </span>
            </div>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {getRoleDisplayName(user?.role)}
                    </p>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  icon={LogOut}
                  title="Logout"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" icon={ChevronRight} iconPosition="right">
                    Join Platform
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-xl">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>System: {healthStatus.status}</span>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="pt-2 space-y-2">
              <div className="px-3 py-2 bg-slate-50 rounded-xl">
                <p className="font-semibold text-sm text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{getRoleDisplayName(user?.role)}</p>
              </div>
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full mb-2">
                  Go to Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="md" className="w-full" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" size="md" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
