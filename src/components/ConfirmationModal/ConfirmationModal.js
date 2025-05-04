import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          <button className="modal-button confirm" onClick={onConfirm}>
            אישור
          </button>
          <button className="modal-button cancel" onClick={onCancel}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;