import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CTable from "../../components/CTable/Ctable";
import CInput from "../../components/CInput/CInput";
import CBtn from "../../components/CBtn/CBtn";
import CModal from "../../components/CModal/CModal";
import { save } from "../../service/service";
import "./AuditLogsList.css";

function AuditLogs() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({});
  const [fieldFilter, setFieldFilter] = useState({});
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [singleLog, setSingleLog] = useState(null);

  const calculateFilter = () => {
    let filter_parts = [];
    if (filter["collection_id"] !== undefined)
      filter_parts.push(`collection_id = '${filter["collection_id"]}'`);
    if (filter["user_id"] !== undefined)
      filter_parts.push(`changed_user_id = '${filter["user_id"]}'`);
    if (filter["dateFrom"] !== undefined)
      filter_parts.push(`changed_at >= '${filter["dateFrom"]}'`);
    if (filter["dateTo"] !== undefined)
      filter_parts.push(`changed_at <= '${filter["dateTo"]}'`);
    if (filter["action"] !== undefined && filter["action"] !== "")
      filter_parts.push(`action = '${filter["action"]}'`);

    if (selectedFilters.length > 0) {
      selectedFilters.forEach((f) => {
        const val =
          f.comparator == "ilike" || f.comparator == "not ilike"
            ? "%" + f.comparatorValue + "%"
            : f.comparatorValue;

        filter_parts.push(`record->>'${f.fieldName}' ${f.comparator} '${val}'`);
      });
    }

    return filter_parts.join(" AND ");
  };
  const calculateCollectionFilter = () => {
    if (filter["collectionName"] == undefined) return "";
    return `name like '%${filter["collectionName"]}%' or label like '%${filter["collectionName"]}%'`;
  };
  const calculateFieldFilter = () => {
    if (filter["collection_id"] == undefined) return "";
    if (filter["fieldName"] == undefined)
      setFilter({ ...filter, fieldName: "" });
    return `collection_id = '${filter["collection_id"]}' and (name like '%${filter["fieldName"]}%' or label like '%${filter["fieldName"]}%')`;
  };
  const calculateUserFilter = () => {
    if (filter["username"] == undefined) return "";
    return `username like '%${filter["username"]}%' or email like '%${filter["username"]}%' or display_name like '%${filter["username"]}%'`;
  };
  const applyFilter = () => {
    if (
      fieldFilter["fieldName"] == undefined ||
      fieldFilter["fieldName"] == "" ||
      fieldFilter["comparator"] == undefined ||
      fieldFilter["comparator"] == "" ||
      fieldFilter["comparatorValue"] == undefined ||
      fieldFilter["comparatorValue"] == ""
    )
      return;
    setSelectedFilters([
      ...selectedFilters,
      {
        fieldName: fieldFilter["fieldName"],
        comparator: fieldFilter["comparator"],
        comparatorValue: fieldFilter["comparatorValue"],
      },
    ]);
    setFieldFilter({});
  };
  const deleteSelectedFilter = (index) => {
    const updatedFilters = selectedFilters.filter((_, i) => i !== index);

    setSelectedFilters(updatedFilters);
  };

  const colors = { c: "Create", u: "Update", d: "Delete" };

  const auditLogsColumns = [
    {
      header: "Action",
      slot: ({ row }) => (
        <div>
          <span>{colors[row.action]}</span>
        </div>
      ),
    },
    {
      header: "Collection",
      field: "collection_id.name",
    },
    {
      header: "Changed by",
      field: "changed_user_id.username",
    },
    {
      header: "Changed At",
      slot: ({ row }) => (
        <span>{row.changed_at.replace("T", " ").split(".")[0]}</span>
      ),
    },
    {
      header: "Record ID",
      field: "record_id",
    },
    {
      header: "Actions",
      slot: ({ row }) => (
        <CBtn
          onClick={() => {
            setSingleLog(row);
          }}
        >
          Details
        </CBtn>
      ),
    },
  ];

  return (
    <section className="c-audit-logs-list">
      <span className="c-audit-logs-title">Audit Logs</span>
      {JSON.stringify(filter)} <div></div>
      {JSON.stringify(selectedFilters)}
      <div className="c-filters-bar">
        <CInput
          state={filter}
          setState={setFilter}
          path="collectionName"
          label="Collection"
          type="lookup"
          filter={calculateCollectionFilter()}
          collection="collections"
          setFieldMap={{
            name: "collectionName",
            id: "collection_id",
          }}
        >
          {(row) => (
            <>
              <span>{row.name}</span>
              <br />
              <span>{row.label}</span>
            </>
          )}
        </CInput>
        <CInput
          state={filter}
          setState={setFilter}
          path="username"
          label="Changed by"
          type="lookup"
          filter={calculateUserFilter()}
          collection="users"
          setFieldMap={{
            id: "user_id",
            username: "username",
          }}
        >
          {(row) => (
            <>
              <span>
                <b>{row.username}</b>
              </span>
              <br />
              <span>
                {row.display_name} {row.email}
              </span>
            </>
          )}
        </CInput>
        <CInput
          state={filter}
          setState={setFilter}
          path="actionName"
          label="Action"
          type="lookup"
          options={[
            { name: "Create", v: "c" },
            { name: "Update", v: "u" },
            { name: "Delete", v: "d" },
          ]}
          setFieldMap={{
            name: "actionName",
            v: "action",
          }}
        >
          {(row) => (
            <>
              <div>{row.name}</div>
            </>
          )}
        </CInput>
        <CInput
          state={filter}
          setState={setFilter}
          path="dateFrom"
          label="Date from"
          type="date"
        />
        <CInput
          state={filter}
          setState={setFilter}
          path="dateTo"
          label="Date to"
          type="date"
        />
      </div>
      {filter["collectionName"] !== undefined &&
        filter["collection_id"] !== undefined && (
          <div className="c-filters-bar">
            <CInput
              state={fieldFilter}
              setState={setFieldFilter}
              path="fieldName"
              label="Field"
              type="lookup"
              filter={calculateFieldFilter()}
              collection="fields"
              setFieldMap={{
                name: "fieldName",
              }}
            >
              {(row) => (
                <>
                  <span>{row.name}</span>
                  <br />
                  <span>{row.label}</span>
                </>
              )}
            </CInput>

            <CInput
              state={fieldFilter}
              setState={setFieldFilter}
              path="comparator"
              label="Comparator"
              type="lookup"
              options={[
                { name: "ilike", label: "Contains (case-insensitive)" },
                { name: "not ilike", label: "Does not contain" },
                { name: "=", label: "Equals" },
                { name: "!=", label: "Not Equals" },

                { name: ">", label: "Greater than" },
                { name: "<", label: "Less than" },
                { name: ">=", label: "Greater or Equal" },
                { name: "<=", label: "Less or Equal" },

                { name: "in", label: "One of (comma separated)" },
                { name: "not in", label: "Not in list" },

                { name: "is null", label: "Is Empty" },
                { name: "is not null", label: "Is Not Empty" },
              ]}
              setFieldMap={{
                name: "comparator",
              }}
            >
              {(row) => (
                <>
                  <div>
                    <b>{row.name}</b>
                  </div>
                  <span>{row.label}</span>
                </>
              )}
            </CInput>

            <CInput
              state={fieldFilter}
              setState={setFieldFilter}
              path="comparatorValue"
              label="Value"
              type="text"
            />
            <CBtn
              onClick={() => {
                applyFilter();
              }}
            >
              Apply filter
            </CBtn>
            {selectedFilters.flatMap((o, idx) => {
              return (
                <div className="c-filter-chip" key={idx}>
                  {o.fieldName} {o.comparator} {o.comparatorValue}{" "}
                  <img
                    onClick={() => deleteSelectedFilter(idx)}
                    src="/icons/x.svg"
                  />
                </div>
              );
            })}
          </div>
        )}
      <CTable
        expand="collection_id,changed_user_id"
        filter={calculateFilter()}
        columns={auditLogsColumns}
        collection={"audit_logs"}
      />
      {singleLog && (
        <CModal
          header={"Audit log details"}
          isOpen={singleLog != null}
          onClose={() => setSingleLog(null)}
        >
          <div className="c-audit-log-info">
            <div className="c-audit-log-label">Collection</div>
            <div className="c-audit-log-value">
              {singleLog.expand.collection_id.name}
            </div>
          </div>
          <div className="c-audit-log-info">
            <div className="c-audit-log-label">Changed by</div>
            <div className="c-audit-log-value">
              {singleLog.expand.changed_user_id.username}
            </div>
          </div>
          <div className="c-audit-log-info">
            <div className="c-audit-log-label">Changed date</div>
            <div className="c-audit-log-value">
              {singleLog.changed_at.replace("T", " ").split(".")[0]}
            </div>
          </div>
          <div className="c-audit-log-info">
            <div className="c-audit-log-label">Action</div>
            <div className="c-audit-log-value">{colors[singleLog.action]}</div>
          </div>

          {Object.entries(JSON.parse(singleLog.record)).map(([key, value]) => (
            <div key={key} className="c-audit-log-info">
              <div className="c-audit-log-label">{key}</div>
              <div className="c-audit-log-value">{String(value)}</div>
            </div>
          ))}
          <div className="c-tools">
            <CBtn onClick={() => setSingleLog(null)}>Close</CBtn>
          </div>
        </CModal>
      )}
    </section>
  );
}

export default AuditLogs;
