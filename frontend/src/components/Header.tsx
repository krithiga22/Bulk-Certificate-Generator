import React from 'react';
import { PlusCircle, ShieldCheck } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  onNewJobClick?: () => void;
  onVerifyClick?: () => void;
}

export const Header: React.FC<Props> = ({
  title,
  subtitle,
  onNewJobClick,
  onVerifyClick,
}) => {
  return (
    <header className="top-bar">
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {onVerifyClick && (
          <button className="btn btn-secondary btn-sm" onClick={onVerifyClick}>
            <ShieldCheck size={15} />
            Verify Portal
          </button>
        )}
        {onNewJobClick && (
          <button className="btn btn-primary btn-sm" onClick={onNewJobClick}>
            <PlusCircle size={15} />
            Create Job
          </button>
        )}
      </div>
    </header>
  );
};
