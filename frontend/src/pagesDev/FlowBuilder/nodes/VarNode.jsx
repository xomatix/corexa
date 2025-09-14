import React, { useState } from "react";
import { Handle, Position } from "reactflow";

export default function VarNode({ id, data }) {
  const [key, setKey] = useState(data.key || "");
  const [mode, setMode] = useState(data.mode || "read");

  const onKeyChange = (v) => {
    setKey(v);
    data.key = v;
  };
  const onModeChange = (v) => {
    setMode(v);
    data.mode = v;
  };

  const isRead = mode === "read";

  return (
    <div
      style={{
        padding: 8,
        border: "1px solid #999",
        borderRadius: 6,
        background: "#fff",
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: "bold" }}>
        Var ({isRead ? "read" : "write"})
      </div>
      <div style={{ marginTop: 6 }}>
        <label>Name: </label>
        <input
          value={key}
          onChange={(e) => onKeyChange(e.target.value)}
          style={{ width: 120 }}
        />
      </div>
      <div style={{ marginTop: 6 }}>
        <label>Mode: </label>
        <select value={mode} onChange={(e) => onModeChange(e.target.value)}>
          <option value="read">read</option>
          <option value="write">write</option>
        </select>
      </div>

      {isRead ? (
        <>
          <Handle type="source" id="out" position={Position.Right} />
        </>
      ) : (
        <>
          <Handle type="target" id="in" position={Position.Left} />
          <Handle type="source" id="out" position={Position.Right} />
        </>
      )}
    </div>
  );
}
