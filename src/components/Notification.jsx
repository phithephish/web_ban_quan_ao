import React, { useEffect } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

export default function Notification({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-notification ${type} animate-slide-in`}>
      <div className="toast-content">
        {type === 'success' ? (
          <CheckCircle2 size={18} className="toast-icon" />
        ) : (
          <Info size={18} className="toast-icon" />
        )}
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close-btn" onClick={onClose} aria-label="Đóng thông báo">
        <X size={14} />
      </button>
    </div>
  );
}
