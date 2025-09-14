import React from "react";
import { Handle, Position } from "reactflow";

export default function MathNode({ id, data }) {
  const setOp = (op) => (data.op = op);
  const setA = (v) => (data.a = Number(v));
  const setB = (v) => (data.b = Number(v));

  return (
    <div
      style={{
        padding: 8,
        border: "1px solid #999",
        borderRadius: 6,
        background: "#fff",
        minWidth: 160,
      }}
    >
      <div style={{ fontWeight: "bold" }}>Math</div>
      <div
        style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 6 }}
      >
        <label>Op:</label>
        <select defaultValue={data.op} onChange={(e) => setOp(e.target.value)}>
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">*</option>
          <option value="/">/</option>
        </select>
      </div>
      <div style={{ marginTop: 6 }}>
        <label>A (fallback): </label>
        <input
          type="number"
          defaultValue={data.a}
          onChange={(e) => setA(e.target.value)}
          style={{ width: 80 }}
        />
      </div>
      <div style={{ marginTop: 6 }}>
        <label>B (fallback): </label>
        <input
          type="number"
          defaultValue={data.b}
          onChange={(e) => setB(e.target.value)}
          style={{ width: 80 }}
        />
      </div>

      <Handle
        type="target"
        id="a"
        position={Position.Left}
        style={{ top: "50%" }}
      />
      <Handle
        type="target"
        id="b"
        position={Position.Left}
        style={{ top: "75%" }}
      />
      <Handle type="source" id="out" position={Position.Right} />
    </div>
  );
}
