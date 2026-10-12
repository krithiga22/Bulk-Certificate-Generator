import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { DashboardStats, Job } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { ErrorMessage } from '../components/ErrorMessage';
import {
  Layers,
  Award,
  Loader2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Calendar,
} from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 seconds if there are jobs actively processing
    const interval = setInterval(() => {
      if (stats?.jobs_processing && stats.jobs_processing > 0) {
        fetchStats();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [stats?.jobs_processing]);

  return (
    <div>
      {/* Top Banner / Welcome */}
      <div
        className="glass-card"
        style={{
          marginBottom: '28px',
          background:
            'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--accent-blue)',
              fontWeight: 700,
            }}
          >
            Certificate Workspace
          </span>
          <h2 style={{ fontSize: '24px', marginTop: '4px', marginBottom: '8px' }}>
            Bulk Certificate Generation & Verification
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '600px' }}>
            Submit participant batches, generate cryptographic-stamped PDF certificates, track
            live job outcomes, and verify authenticity via QR codes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={fetchStats} title="Refresh Stats">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('/jobs/new')}>
            <PlusCircle size={16} />
            Create Generation Job
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* 4 Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Total Jobs */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Total Jobs
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <Layers size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '12px' }}>
            {loading ? '-' : stats?.total_jobs ?? 0}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Bulk requests processed</span>
        </div>

        {/* Certificates Issued */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Certificates Issued
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)',
              }}
            >
              <Award size={20} />
            </div>
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              marginTop: '12px',
              color: 'var(--accent-emerald)',
            }}
          >
            {loading ? '-' : stats?.certificates_issued ?? 0}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            Successfully minted & signed
          </span>
        </div>

        {/* Jobs Processing */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Jobs Processing
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-gold)',
              }}
            >
              <Loader2 size={20} className={stats?.jobs_processing ? 'spin' : ''} />
            </div>
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              marginTop: '12px',
              color: 'var(--accent-gold)',
            }}
          >
            {loading ? '-' : stats?.jobs_processing ?? 0}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            Active background tasks
          </span>
        </div>

        {/* Failed Recipients */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Failed Recipients
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)',
              }}
            >
              <AlertCircle size={20} />
            </div>
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              marginTop: '12px',
              color: 'var(--accent-rose)',
            }}
          >
            {loading ? '-' : stats?.failed_recipients ?? 0}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            Isolated recipient errors
          </span>
        </div>
      </div>

      {/* Recent Jobs Section */}
      <div className="glass-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px' }}>Recent Generation Jobs</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Real-time progress and outcomes from recent bulk batches
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate('/jobs')}>
            View All Jobs
            <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading recent jobs...</p>
          </div>
        ) : !stats?.recent_jobs || stats.recent_jobs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              background: 'rgba(255, 255, 255, 0.01)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <Award size={36} color="var(--text-faint)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '16px', marginBottom: '6px' }}>No Generation Jobs Yet</h4>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '13px',
                maxWidth: '400px',
                margin: '0 auto 16px',
              }}
            >
              Start by creating your first bulk certificate job with participant names and emails.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('/jobs/new')}>
              <PlusCircle size={15} />
              Create First Job
            </button>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Breakdown</th>
                  <th>Issue Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_jobs.map((job: Job) => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{job.event_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>ID: {job.id}</div>
                    </td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td style={{ minWidth: '160px' }}>
                      <ProgressBar percentage={job.progress_percentage} showLabel />
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        {job.success_count} success
                      </span>
                      {job.failed_count > 0 && (
                        <span style={{ color: 'var(--accent-rose)', marginLeft: '8px' }}>
                          · {job.failed_count} failed
                        </span>
                      )}
                      <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                        / {job.total_count} total
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--text-muted)',
                          fontSize: '13px',
                        }}
                      >
                        <Calendar size={13} />
                        {job.issue_date}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigate(`/jobs/${job.id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
