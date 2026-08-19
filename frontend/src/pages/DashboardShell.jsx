import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import LocalHeadDashboard from './dashboards/LocalHeadDashboard';
import AlumniDashboard from './dashboards/AlumniDashboard';
import NgoDashboard from './dashboards/NgoDashboard';
import CommunityDashboard from './dashboards/CommunityDashboard';

export const DashboardShell = () => {
  const { user } = useAuth();
  const role = user?.role;

  switch (role) {
    case 'headmaster_admin':
    case 'admin':
      return <AdminDashboard />;

    case 'teacher':
      return <TeacherDashboard />;

    case 'student':
      return <StudentDashboard />;

    case 'parent':
    case 'student_parent':
      return <ParentDashboard />;

    case 'village_head':
      return <LocalHeadDashboard />;

    case 'alumni':
      return <AlumniDashboard />;

    case 'ngo':
      return <NgoDashboard />;

    case 'community_member':
    case 'community_volunteer':
    case 'welfare_officer':
    default:
      return <CommunityDashboard />;
  }
};

export default DashboardShell;
