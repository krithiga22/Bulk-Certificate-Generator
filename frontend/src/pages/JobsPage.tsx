import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Job } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { ErrorMessage } from '../components/ErrorMessage';
import {
  Calendar,
  Search,
  RefreshCw,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

export const JobsPage: React.FC<Props> = ({ onNavigate }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getJobs(page, pageSize, statusFilter === 'ALL' ? undefined : statusFilter);
      setJobs(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  const filteredJobs = jobs.filter((job) =>
    job.event_name.toLowerCase().includes(search.toLowerCase()) ||
    job.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px' }}>Generation History</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Browse and inspect all historical bulk certificate issuance jobs ({total} total)
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('/jobs/new')}>
          <PlusCircle size={15} />
          Create New Job
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div className="glass-card">
        {/* Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '11px' }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Filter by event name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                background: 'var(--bg-input)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {['ALL', 'COMPLETED', 'PROCESSING', 'FAILED'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    background: statusFilter === st ? 'var(--accent-blue)' : 'transparent',
                    color: statusFilter === st ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <button className="btn btn-outline btn-sm" onClick={fetchJobs} title="Refresh list">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event / Program</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Outcomes</th>
                <th>Issue Date</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading generation jobs...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No generation jobs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{job.event_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{job.id}</div>
                    </td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td style={{ minWidth: '140px' }}>
                      <ProgressBar percentage={job.progress_percentage} showLabel />
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        {job.success_count} ok
                      </span>
                      {job.failed_count > 0 && (
                        <span style={{ color: 'var(--accent-rose)', marginLeft: '6px' }}>
                          · {job.failed_count} err
                        </span>
                      )}
                      <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                        / {job.total_count}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <Calendar size={13} />
                        {job.issue_date}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigate(`/jobs/${job.id}`)}
                      >
                        Inspect
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            Showing Page {page} of {totalPages}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
