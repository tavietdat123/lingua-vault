import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div key={t.id} className="toast" style={{
            borderLeft: `4px solid ${isSuccess ? 'var(--accent-success)' : isError ? 'var(--accent-danger)' : 'var(--accent-primary)'}`
          }}>
            {isSuccess && <CheckCircle2 size={18} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />}
            {isError && <AlertCircle size={18} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />}
            {!isSuccess && !isError && <Info size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}

            <span style={{ flex: 1 }}>{t.message}</span>

            <button onClick={() => onDismiss(t.id)} className="btn-icon" style={{ padding: '0.15rem' }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
