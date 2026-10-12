import React, { useState } from 'react';
import { api } from '../services/api';
import type { RecipientInput } from '../types/api';
import { ErrorMessage } from '../components/ErrorMessage';
import {
  Upload,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  FileText,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

export const CreateJobPage: React.FC<Props> = ({ onNavigate }) => {
  // Form State
  const [eventName, setEventName] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [organizationName, setOrganizationName] = useState('CertiBatch Authority');
  const [signatoryName, setSignatoryName] = useState('Dr. Alan Turing, Director');

  const [recipients, setRecipients] = useState<RecipientInput[]>([
    { name: 'Arun Kumar', email: 'arun@example.com' },
    { name: 'Priya Sharma', email: 'priya@example.com' },
  ]);

  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recipient table operations
  const addRecipientRow = () => {
    setRecipients([...recipients, { name: '', email: '' }]);
  };

  const removeRecipientRow = (index: number) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: keyof RecipientInput, val: string) => {
    const updated = [...recipients];
    updated[index][field] = val;
    setRecipients(updated);
  };

  // Pre-fill demo data with 4 sample recipients (including 1 invalid email to demonstrate failure isolation!)
  const loadDemoRecipients = () => {
    setEventName('Full-Stack Cloud Architecture Workshop');
    setRecipients([
      { name: 'Arun Kumar', email: 'arun@example.com' },
      { name: 'Priya Sharma', email: 'priya-invalid-email-domain' }, // Deliberate invalid email
      { name: 'Meena Raj', email: 'meena@example.com' },
      { name: 'David Miller', email: 'david@example.com' },
    ]);
  };

  // CSV parsing
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        setError('CSV must contain at least a header and one recipient row.');
        return;
      }

      // Check header
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const nameIdx = headers.indexOf('name');
      const emailIdx = headers.indexOf('email');

      if (nameIdx === -1 || emailIdx === -1) {
        setError("CSV header must contain 'name' and 'email' columns.");
        return;
      }

      const parsed: RecipientInput[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length > Math.max(nameIdx, emailIdx)) {
          parsed.push({
            name: parts[nameIdx] || '',
            email: parts[emailIdx] || '',
          });
        }
      }

      if (parsed.length > 0) {
        setRecipients(parsed);
        setError(null);
      } else {
        setError('No valid rows found in the CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!eventName.trim()) {
      setError('Event/Course name is required.');
      return;
    }

    if (!issueDate) {
      setError('Issue date is required.');
      return;
    }

    if (recipients.length === 0) {
      setError('Please add at least one recipient.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createJob({
        event_name: eventName.trim(),
        issue_date: issueDate,
        organization_name: organizationName.trim() || undefined,
        signatory_name: signatoryName.trim() || undefined,
        recipients: recipients.map((r) => ({
          name: r.name.trim(),
          email: r.email.trim(),
        })),
      });

      // Navigate to the live Job Details page
      onNavigate(`/jobs/${res.job_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit certificate generation job.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px' }}>Create Generation Job</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Configure certificate event metadata, enter or import recipient rosters, and dispatch
          the generation batch.
        </p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <form onSubmit={handleSubmit}>
        {/* Section A: Event Information */}
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <FileText size={20} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '16px' }}>Section A — Event & Template Information</h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            <div className="form-group">
              <label className="form-label">Event / Course Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Advanced Python Programming"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Issue Date *</label>
              <input
                type="date"
                className="form-input"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organization Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CertiBatch Global Academy"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Authorized Signatory Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dr. Alan Turing, Program Chair"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section B: Recipient Input */}
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Upload size={20} color="var(--accent-gold)" />
              <div>
                <h3 style={{ fontSize: '16px' }}>Section B — Recipient Roster ({recipients.length})</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Enter manually or upload a CSV file
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={loadDemoRecipients}
                title="Populate test recipients with mixed validity"
              >
                <Sparkles size={14} color="var(--accent-gold)" />
                Load Sample Batch
              </button>

              <label
                className="btn btn-outline btn-sm"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={14} />
                <span>Upload CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {csvFileName && (
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--accent-blue)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle size={14} />
              Imported from CSV: {csvFileName} ({recipients.length} entries parsed)
            </div>
          )}

          {/* Editable Table */}
          <div className="data-table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Recipient Full Name *</th>
                  <th style={{ width: '45%' }}>Email Address *</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Arun Kumar"
                        value={r.name}
                        onChange={(e) => updateRecipient(idx, 'name', e.target.value)}
                        style={{ padding: '8px 10px', fontSize: '13px' }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. arun@example.com"
                        value={r.email}
                        onChange={(e) => updateRecipient(idx, 'email', e.target.value)}
                        style={{ padding: '8px 10px', fontSize: '13px' }}
                        required
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeRecipientRow(idx)}
                        disabled={recipients.length <= 1}
                        style={{
                          color: recipients.length <= 1 ? 'var(--text-faint)' : 'var(--accent-rose)',
                          cursor: recipients.length <= 1 ? 'not-allowed' : 'pointer',
                          padding: '6px',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={addRecipientRow}
            >
              <Plus size={14} />
              Add Recipient Row
            </button>
          </div>
        </div>

        {/* Section C: Review and Submit */}
        <div
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '16px' }}>Section C — Validation & Submission Guarantee</h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            CertiBatch isolates recipient validation independently. If any recipient has an
            invalid email format or empty name, their individual failure is captured with reason in
            the audit log without halting generation for all valid participants.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Ready to Dispatch:</span>{' '}
              <strong style={{ color: 'var(--text-main)', fontSize: '15px' }}>
                {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
              </strong>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: '180px' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Dispatching Job...
                </>
              ) : (
                <>
                  Submit Bulk Job
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
