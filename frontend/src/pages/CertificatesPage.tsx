import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { CertificateItem } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorMessage } from '../components/ErrorMessage';
import {
  Search,
  Download,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

export const CertificatesPage: React.FC<Props> = ({ onNavigate }) => {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const data = await api.getAllCertificates(
        page,
        pageSize,
        search,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setCertificates(data.certificates);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCertificates();
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px' }}>Issued Certificates Directory</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Global roster of issued credentials and recipient outcomes ({total} records total)
        </p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div className="glass-card">
        {/* Search & Filter Toolbar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={15}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '11px' }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search name, email, or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
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
              {['ALL', 'SUCCESS', 'FAILED'].map((st) => (
                <button
                  type="button"
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

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={fetchCertificates}
              title="Refresh list"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Recipient Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Certificate Code</th>
                <th>Issued At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading certificates...
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No certificates found.
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cert.recipient_name}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {cert.recipient_email}
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
                            title="Verify on Public Registry"
                            style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}
                          >
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>
                          {cert.error_message || '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                      {cert.issued_at ? new Date(cert.issued_at).toLocaleString() : '—'}
                    </td>
                    <td>
                      {cert.status === 'SUCCESS' && (
                        <a
                          href={api.getCertificateDownloadUrl(cert.id)}
                          download
                          className="btn btn-secondary btn-sm"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download size={13} />
                          PDF
                        </a>
                      )}
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
            Page {page} of {totalPages}
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
