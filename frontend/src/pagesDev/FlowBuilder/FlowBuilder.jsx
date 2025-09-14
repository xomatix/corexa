import React, { useState, useRef } from "react";
import FlowCanvas from "./FlowCanvas";

export default function FlowBuilder() {
  const [jsonText, setJsonText] = useState('{"a": 5, "b": 3}');
  const [store, setStore] = useState({ a: 5, b: 3 });
  const flowRef = useRef(null);

  const parseJson = () => {
    try {
      const obj = JSON.parse(jsonText);
      setStore(obj);
    } catch (e) {
      alert("Invalid JSON input", e);
    }
  };

  const executeGraph = async () => {
    if (flowRef.current) {
      const updated = await flowRef.current.execute(store);
      setStore(updated);
      setJsonText(JSON.stringify(updated, null, 2));
    }
  };

  const exportLogic = () => {
    if (!flowRef.current) return;
    const data = flowRef.current.exportLogic();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logic.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importLogic = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        flowRef.current?.importLogic(data);
      } catch {
        alert("Invalid logic file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        height: "100vh",
      }}
    >
      <div
        style={{ padding: 12, borderRight: "1px solid #ccc", overflow: "auto" }}
      >
        <h3>JSON Input</h3>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={12}
          style={{ width: "100%", fontFamily: "monospace" }}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={parseJson}>Load JSON Into Store</button>
        </div>

        <h3 style={{ marginTop: 24 }}>Actions</h3>
        <button onClick={executeGraph}>Execute Graph</button>

        <h3 style={{ marginTop: 24 }}>Logic</h3>
        <button onClick={exportLogic}>Export Logic</button>
        <div style={{ marginTop: 8 }}>
          <input type="file" accept="application/json" onChange={importLogic} />
        </div>

        <h3 style={{ marginTop: 24 }}>Store (Live)</h3>
        <pre style={{ background: "#f7f7f7", padding: 8 }}>
          {JSON.stringify(store, null, 2)}
        </pre>
      </div>

      <div>
        <FlowCanvas ref={flowRef} />
      </div>
    </div>
  );
}
