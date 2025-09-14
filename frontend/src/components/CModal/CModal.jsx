import React from "react";
import "./CModal.css";

function CModal({ isOpen, onClose, header, children }) {
  return (
    isOpen && (
      <div className="modal-overlay">
        {/* onClick={onClose} */}
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{header}</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    )
  );
}

export default CModal;
