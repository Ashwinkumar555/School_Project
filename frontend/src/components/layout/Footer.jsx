import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Heart, Shield, Landmark, PhoneCall, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-bold text-2xl text-white tracking-tight">
                Edu<span className="text-emerald-400">Connect</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Empowering smart government schools, monitoring student welfare schemes, and
              activating village community volunteer networks for equitable public education.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-emerald-400">
              <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full">
                <Shield className="w-3.5 h-3.5" />
                Government Initiative Ready
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300">
                <Landmark className="w-3.5 h-3.5" />
                Public Welfare
              </span>
            </div>
          </div>

          {/* Pillars Column */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Core Pillars
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#pillars" className="hover:text-emerald-400 transition-colors">
                  Smart School Admin
                </a>
              </li>
              <li>
                <a href="#schemes" className="hover:text-emerald-400 transition-colors">
                  Mid-Day Meal & Health
                </a>
              </li>
              <li>
                <a href="#schemes" className="hover:text-emerald-400 transition-colors">
                  Scholarship Disbursal
                </a>
              </li>
              <li>
                <a href="#community" className="hover:text-emerald-400 transition-colors">
                  Village Education Network
                </a>
              </li>
            </ul>
          </div>

          {/* Roles & Access */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Role Portals
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Headmaster Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Teacher Attendance & Grades
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Welfare Officer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Village Volunteer Registry
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Helpdesk */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Citizen Support
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@educonnect.gov</span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Toll-Free: 1800-EDU-VILL</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>District Education & Welfare Department</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} EduConnect Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Accessibility Statement</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
