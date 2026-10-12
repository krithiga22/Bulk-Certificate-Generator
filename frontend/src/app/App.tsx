import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DashboardPage } from '../pages/DashboardPage';
import { CreateJobPage } from '../pages/CreateJobPage';
import { JobsPage } from '../pages/JobsPage';
import { JobDetailsPage } from '../pages/JobDetailsPage';
import { CertificatesPage } from '../pages/CertificatesPage';
import { VerifyPage } from '../pages/VerifyPage';

export const App: React.FC = () => {
  // Hash-based routing for robust SPA navigation without webserver rewrite rules
  const getInitialPath = () => {
    const hash = window.location.hash.slice(1);
    return hash || '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(getInitialPath());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  // Route matching
  const renderCurrentPage = () => {
    if (currentPath === '/' || currentPath === '') {
      return <DashboardPage onNavigate={navigate} />;
    }
    if (currentPath === '/jobs/new') {
      return <CreateJobPage onNavigate={navigate} />;
    }
    if (currentPath === '/jobs') {
      return <JobsPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/jobs/')) {
      const jobId = currentPath.replace('/jobs/', '');
      return <JobDetailsPage jobId={jobId} onNavigate={navigate} />;
    }
    if (currentPath === '/certificates') {
      return <CertificatesPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/verify')) {
      const code = currentPath.replace('/verify/', '').replace('/verify', '');
      return <VerifyPage initialCode={code} onNavigate={navigate} />;
    }
    return <DashboardPage onNavigate={navigate} />;
  };

  // Header metadata
  const getHeaderMeta = () => {
    if (currentPath === '/' || currentPath === '') {
      return {
        title: 'Operations Dashboard',
        subtitle: 'Monitor bulk generation throughput and recipient outcomes',
      };
    }
    if (currentPath === '/jobs/new') {
      return {
        title: 'New Generation Job',
        subtitle: 'Configure event details and submit recipient roster',
      };
    }
    if (currentPath === '/jobs') {
      return {
        title: 'Generation History',
        subtitle: 'Review past bulk jobs and download audit reports',
      };
    }
    if (currentPath.startsWith('/jobs/')) {
      return {
        title: 'Live Job Details',
        subtitle: 'Real-time recipient processing and certificate retrieval',
      };
    }
    if (currentPath === '/certificates') {
      return {
        title: 'Issued Certificates',
        subtitle: 'Search and download valid PDF certificates',
      };
    }
    if (currentPath.startsWith('/verify')) {
      return {
        title: 'Authenticity Verification',
        subtitle: 'Public validation against official credential records',
      };
    }
    return { title: 'CertiBatch', subtitle: '' };
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="app-container">
      <Sidebar currentPath={currentPath} onNavigate={navigate} />
      <main className="main-content">
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          onNewJobClick={currentPath !== '/jobs/new' ? () => navigate('/jobs/new') : undefined}
          onVerifyClick={!currentPath.startsWith('/verify') ? () => navigate('/verify') : undefined}
        />
        <div className="page-body">{renderCurrentPage()}</div>
      </main>
    </div>
  );
};
