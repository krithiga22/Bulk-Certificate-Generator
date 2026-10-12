import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { CertificateVerifyResult } from '../types/api';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Award,
  Loader2,
} from 'lucide-react';

interface Props {
  initialCode?: string;
  onNavigate?: (path: string) => void;
}

export const VerifyPage: React.FC<Props> = ({ initialCode = '' }) => {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateVerifyResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runVerification = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.verifyCertificate(codeToVerify.trim());
      setResult(data);
    } catch {
      setResult({
        valid: false,
        status: 'ERROR',
        message: 'Could not connect to the verification registry. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      setCode(initialCode);
      runVerification(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runVerification(code);
  };

  return (
    <div style={{ maxWidth: '780px', margin: '20px auto 60px' }}>
      {/* Hero Badge */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(59, 130, 246, 0.2))',
            border: '2px solid var(--accent-gold)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-gold)',
            boxShadow: '0 0 30px rgba(245, 158, 11, 0.25)',
            marginBottom: '16px',
          }}
        >
          <ShieldCheck size={32} />
        </div>
        <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>
          Official Credential Verification
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '520px', margin: '0 auto' }}>
          Verify the authenticity, issuance legitimacy, and integrity of certificates issued by
          CertiBatch.
        </p>
      </div>

      {/* Input Box */}
      <div className="glass-card" style={{ marginBottom: '28px' }}>
        <form onSubmit={handleSubmit}>
          <label className="form-label" style={{ fontSize: '14px', marginBottom: '10px' }}>
            Enter Certificate Code or Verification ID
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CERT-20261011-B8E7223D"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '15px',
                  letterSpacing: '0.05em',
                  padding: '12px 14px',
                }}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !code.trim()}
              style={{ minWidth: '130px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Verify
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Verification Result Card */}
      {hasSearched && result && (
        <div
          className="glass-card"
          style={{
            border: result.valid
              ? '1px solid rgba(16, 185, 129, 0.5)'
              : '1px solid rgba(244, 63, 94, 0.4)',
            boxShadow: result.valid
              ? '0 10px 30px -5px rgba(16, 185, 129, 0.2)'
              : '0 10px 30px -5px rgba(244, 63, 94, 0.15)',
            background: result.valid
              ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.06) 0%, var(--bg-card) 100%)'
              : 'linear-gradient(180deg, rgba(244, 63, 94, 0.06) 0%, var(--bg-card) 100%)',
          }}
        >
          {result.valid ? (
            <div>
              {/* Valid Certificate Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--accent-emerald)',
                      fontWeight: 700,
                    }}
                  >
                    Verified Credential
                  </div>
                  <h3 style={{ fontSize: '20px', color: '#f8fafc' }}>
                    Authentic Certificate Record
                  </h3>
                </div>
              </div>

              {/* Certificate Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '20px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Recipient Name
                  </span>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      marginTop: '4px',
                      color: 'var(--text-main)',
                    }}
                  >
                    {result.recipient_name}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Course / Program
                  </span>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      marginTop: '4px',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    {result.event_name}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Certificate Code
                  </span>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      fontWeight: 700,
                      marginTop: '4px',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    {result.certificate_code}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Official Issue Date
                  </span>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      marginTop: '4px',
                      color: 'var(--text-main)',
                    }}
                  >
                    {result.issue_date}
                  </div>
                </div>

                {result.organization_name && (
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Issuing Organization
                    </span>
                    <div style={{ fontSize: '14px', marginTop: '4px', color: 'var(--text-main)' }}>
                      {result.organization_name}
                    </div>
                  </div>
                )}

                {result.signatory_name && (
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Authorized Signatory
                    </span>
                    <div style={{ fontSize: '14px', marginTop: '4px', color: 'var(--text-main)' }}>
                      {result.signatory_name}
                    </div>
                  </div>
                )}
              </div>

              {/* Legitimacy Seal Footer */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Award size={20} color="var(--accent-gold)" />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {result.message} Issued under CertiBatch tamper-evident generation protocols.
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-rose)',
                  marginBottom: '14px',
                }}
              >
                <XCircle size={28} />
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
                Certificate Not Found or Not Valid
              </h3>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  maxWidth: '480px',
                  margin: '0 auto',
                }}
              >
                The certificate code you entered does not match any officially issued credential in
                our database. Please ensure the code is formatted correctly or consult the issuer.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
