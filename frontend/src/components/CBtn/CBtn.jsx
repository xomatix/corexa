import { useState } from "react";
import "./CBtn.css";
import CModal from "../CModal/CModal";

function CBtn({ children, onClick = async () => {}, confirm = false }) {
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const callBeforeOnClickAction = async () => {
    setLoading(true);
    if (confirm) {
      setIsConfirmOpen(true);
      return;
    }

    callOnClickAction();
    setLoading(false);
  };
  const callCloseConfirm = () => {
    setLoading(false);
    setIsConfirmOpen(false);
  };
  const callOnClickAction = async () => {
    try {
      await onClick();
    } catch (error) {
      alert(JSON.stringify(error));
    }
    setLoading(false);
    setIsConfirmOpen(false);
  };

  return (
    <>
      <button className="c-btn" onClick={callBeforeOnClickAction}>
        {loading && <div class="c-spinner" aria-hidden="true"></div>}
        {!loading && children}
      </button>
      <CModal
        header={"Confirm"}
        isOpen={isConfirmOpen}
        onClose={() => callCloseConfirm()}
      >
        Are you sure you want to perform the {children} action?
        <button onClick={callOnClickAction}>Yes</button>
        <button onClick={callCloseConfirm}>No</button>
      </CModal>
    </>
  );
}

export default CBtn;
