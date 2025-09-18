import React, { useEffect, useState } from "react";
import { select } from "../../service/service";
import "./CTable.css";

function CTable({
  collection,
  columns = [],
  filter = "",
  expand = "",
  onClick = () => {},
}) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const callForData = async () => {
    setLoading(true);
    setError(null);

    try {
      const resp = await select(collection, filter, expand);
      const data = resp?.data || [];

      // add internal unique id for rendering
      const withUUID = data.map((row) => ({
        ...row,
        _uuid: crypto.randomUUID(),
      }));

      setRows(withUUID);
    } catch (err) {
      console.error("CTable fetch error:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    callForData();
  }, [collection, filter, expand]);

  const onRowClick = (row) => {
    onClick(row);
  };

  const resolveFieldValue = (row, path) => {
    const parts = path.split(".");
    if (parts.length == 1) return row[path];
    const expandPath = parts.slice(0, -1).join(".");
    const lastKey = parts[parts.length - 1];
    return row.expand[expandPath][lastKey];
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!rows || rows.length === 0) return <div>No rows found</div>;

  if (columns.length == 0) {
    return (
      <div>
        rows.length: {rows && rows.length}
        {rows.map((row, index) => (
          <div
            key={row._uuid + "_" + index}
            style={{
              border: "1px solid brown",
              padding: "4px 8px",
            }}
            onClick={() => {
              onRowClick(row);
            }}
          >
            {JSON.stringify(row)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <table className="c-table">
      <thead className="c-th">
        <tr>
          {columns.map((col) => (
            <th key={col.header} className="c-th-cell">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row._uuid + "_" + index}
            onClick={() => onRowClick(row)}
            className="c-tr"
          >
            {columns.map((col, idcol) => (
              <td
                key={`${row._uuid}_${col.Header}_${idcol}`}
                className="c-tr-cell"
              >
                {col.slot
                  ? col.slot({ row })
                  : resolveFieldValue(row, col.field)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default CTable;
