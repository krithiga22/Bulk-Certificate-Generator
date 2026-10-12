import React from 'react';
import type { JobStatus, CertificateStatus } from '../types/api';
import { Clock, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  status: JobStatus | CertificateStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="badge badge-pending">
          <Clock size={13} />
          Pending
        </span>
      );
    case 'PROCESSING':
      return (
        <span className="badge badge-processing">
          <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          Processing
        </span>
      );
    case 'COMPLETED':
    case 'SUCCESS':
      return (
        <span className="badge badge-completed">
          <CheckCircle2 size={13} />
          {status === 'COMPLETED' ? 'Completed' : 'Success'}
        </span>
      );
    case 'COMPLETED_WITH_ERRORS':
      return (
        <span className="badge badge-warning">
          <AlertTriangle size={13} />
          Completed with Errors
        </span>
      );
    case 'FAILED':
      return (
        <span className="badge badge-failed">
          <XCircle size={13} />
          Failed
        </span>
      );
    default:
      return <span className="badge badge-pending">{status}</span>;
  }
};
