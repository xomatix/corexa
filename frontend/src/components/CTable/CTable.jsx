import React, { useEffect, useState } from "react";
import { fetchRows, getRows, setActiveRow } from "../../service/state";

function CTable({
  windowIdent,
  dataSetIdent,
  columns = [],
  onClick = () => {},
}) {
  const [rows, setRows] = useState(null);

  const callForData = async () => {
    await fetchRows(windowIdent, dataSetIdent);

    let data = getRows(windowIdent, dataSetIdent);
    setRows(data);
  };

  useEffect(() => {
    callForData();
  }, []);

  const onRowClick = (row, index) => {
    // console.log("test", row);
    setActiveRow(index);
    onClick(row);
  };

  if (!rows) {
    return <div>Loading...</div>;
  }

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
              onRowClick(row, index);
            }}
          >
            {JSON.stringify(row)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.header}
              style={{
                border: "1px solid #ddd",
                padding: "8px",
                textAlign: "left",
                backgroundColor: "lightgray",
              }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr
            key={row._uuid + "_" + index}
            onClick={() => onRowClick(row, index)}
            style={{ border: "1px solid #ddd" }}
          >
            {columns.map((col, idcol) => (
              <td
                key={`${row._uuid}_${col.Header}_${idcol}`}
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                }}
              >
                {col.slot ? col.slot({ row }) : row[col.field]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default CTable;
