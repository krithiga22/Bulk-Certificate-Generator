import React from 'react';

interface Props {
  percentage: number;
  height?: number;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<Props> = ({
  percentage,
  height = 8,
  showLabel = false,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            marginBottom: '6px',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          <span>Progress</span>
          <span>{clamped.toFixed(1)}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: '#1e293b',
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background:
              clamped >= 100
                ? 'linear-gradient(90deg, #10b981, #059669)'
                : 'linear-gradient(90deg, #3b82f6, #06b6d4)',
            borderRadius: `${height / 2}px`,
            transition: 'width 0.4s ease-in-out',
          }}
        />
      </div>
    </div>
  );
};
