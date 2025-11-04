import React from "react";
import "./CModal.css";

function CModal({ isOpen, onClose, header, children }) {
  return (
    isOpen && (
      <div className="modal-overlay">
        {/* onClick={onClose} */}
        <div
          className="c-modal modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <span>{header}</span>
            <button className="close-button" onClick={onClose}>
              <img src="/icons/x.svg" />
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    )
  );
}

export default CModal;
