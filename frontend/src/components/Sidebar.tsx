import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Award,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface Props {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<Props> = ({ currentPath, onNavigate }) => {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Create Job', path: '/jobs/new', icon: PlusCircle },
    { label: 'Generation History', path: '/jobs', icon: History },
    { label: 'Certificates', path: '/certificates', icon: Award },
    { label: 'Verify Authenticity', path: '/verify', icon: ShieldCheck },
  ];

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <Award size={22} />
        </div>
        <div className="logo-text">
          <h1>CertiBatch</h1>
          <span>Bulk Issuance</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              className={`nav-link ${active ? 'active' : ''}`}
              onClick={() => onNavigate(item.path)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={14} color="#10b981" />
          <span>API Connected</span>
        </div>
        <span style={{ opacity: 0.6 }}>v1.0</span>
      </div>
    </aside>
  );
};
