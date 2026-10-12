import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface Props {
  message: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<Props> = ({ message, onDismiss }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: 'var(--radius-md)',
        color: '#fda4af',
        marginBottom: '20px',
        fontSize: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={18} color="#f43f5e" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ color: '#fda4af', padding: '4px', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
