import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import type { Job, CertificateItem } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { ErrorMessage } from '../components/ErrorMessage';
import {
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileSpreadsheet,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface Props {
  jobId: string;
  onNavigate: (path: string) => void;
}

export const JobDetailsPage: React.FC<Props> = ({ jobId, onNavigate }) => {
  const [job, setJob] = useState<Job | null>(null);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [copied, setCopied] = useState(false);

  // Polling ref
  const pollingRef = useRef<number | null>(null);

  const fetchJobData = async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    try {
      const [jobData, certsData] = await Promise.all([
        api.getJob(jobId),
        api.getJobCertificates(jobId),
      ]);
      setJob(jobData);
      setCertificates(certsData.certificates);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch job details.');
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData(true);

    // Setup polling every 2.5s while active
    pollingRef.current = window.setInterval(() => {
      fetchJobData(false);
    }, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobId]);

  // Stop polling once terminal state is reached
  useEffect(() => {
    if (
      job &&
      ['COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED'].includes(job.status) &&
      pollingRef.current
    ) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [job?.status]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(jobId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered recipients
  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert.certificate_code && cert.certificate_code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ? true : cert.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading && !job) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <p>Loading generation job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3 style={{ color: 'var(--accent-rose)' }}>Job Not Found</h3>
        <p style={{ color: 'var(--text-muted)', margin: '12px 0 20px' }}>
          Could not find job with ID: {jobId}
        </p>
        <button className="btn btn-secondary" onClick={() => onNavigate('/jobs')}>
          Back to History
        </button>
      </div>
    );
  }

  const isTerminal = ['COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED'].includes(job.status);

  return (
    <div>
      {/* Header bar */}
      <div
        className="glass-card"
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '22px' }}>{job.event_name}</h2>
            <StatusBadge status={job.status} />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Job ID: <code style={{ color: 'var(--text-main)' }}>{job.id}</code>
              <button
                onClick={handleCopyId}
                title="Copy Job ID"
                style={{ color: 'var(--accent-blue)', padding: '2px', cursor: 'pointer' }}
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              </button>
            </span>
            <span>·</span>
            <span>Issue Date: {job.issue_date}</span>
            {job.organization_name && (
              <>
                <span>·</span>
                <span>Org: {job.organization_name}</span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline btn-sm" onClick={() => fetchJobData(false)}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <a
            href={api.getJobReportUrl(job.id)}
            download
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noreferrer"
          >
            <FileSpreadsheet size={14} />
            Export Audit CSV
          </a>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Progress & Stat Metrics */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Overall Progress</span>
            <span style={{ fontSize: '14px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              {job.progress_percentage}% ({job.processed_count} of {job.total_count} processed)
            </span>
          </div>
          <ProgressBar percentage={job.progress_percentage} height={10} />
          {!isTerminal && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                fontSize: '12px',
                color: 'var(--accent-blue)',
              }}
            >
              <div className="pulse-dot" />
              <span>Live polling active — updating every 2.5 seconds</span>
            </div>
          )}
        </div>

        {/* 4 Metric Counters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '14px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Layers size={14} />
              <span>Total Submitted</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>
              {job.total_count}
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={14} />
              <span>Successful</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: 'var(--accent-emerald)' }}>
              {job.success_count}
            </div>
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-rose)' }}>
              <XCircle size={14} />
              <span>Failed</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: 'var(--accent-rose)' }}>
              {job.failed_count}
            </div>
          </div>

          <div style={{ background: 'rgba(148, 163, 184, 0.08)', padding: '12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Clock size={14} />
              <span>Pending</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>
              {job.pending_count}
            </div>
          </div>
        </div>
      </div>

      {/* Recipient Outcomes Table */}
      <div className="glass-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '18px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px' }}>Recipient Generation Results</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {filteredCertificates.length} of {certificates.length} records
            </span>
          </div>

          {/* Search and status filters */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '10px', top: '10px' }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search recipient / code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', width: '220px', padding: '7px 10px 7px 32px', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
              {(['ALL', 'SUCCESS', 'FAILED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    background: statusFilter === filter ? 'var(--accent-blue)' : 'transparent',
                    color: statusFilter === filter ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Status</th>
                <th>Certificate Code</th>
                <th>Details / Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No recipient records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cert.recipient_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{cert.recipient_email}</div>
                    </td>
                    <td>
                      <StatusBadge status={cert.status} />
                    </td>
                    <td>
                      {cert.certificate_code ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>
                            {cert.certificate_code}
                          </code>
                          <button
                            onClick={() => onNavigate(`/verify/${cert.certificate_code}`)}
                            title="Verify Authenticity"
                            style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}
                          >
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      {cert.status === 'SUCCESS' ? (
                        <span style={{ color: 'var(--accent-emerald)', fontSize: '12px' }}>
                          PDF ready with authenticity QR
                        </span>
                      ) : cert.status === 'FAILED' ? (
                        <span style={{ color: 'var(--accent-rose)', fontSize: '12px' }}>
                          {cert.error_message || 'Processing error'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          Queued for generation
                        </span>
                      )}
                    </td>
                    <td>
                      {cert.status === 'SUCCESS' && cert.download_url ? (
                        <a
                          href={api.getCertificateDownloadUrl(cert.id)}
                          download
                          className="btn btn-secondary btn-sm"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download size={13} />
                          Download PDF
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
