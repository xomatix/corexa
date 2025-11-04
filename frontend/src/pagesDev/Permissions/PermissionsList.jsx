import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CTable from "../../components/CTable/Ctable";
import CModal from "../../components/CModal/CModal";
import CInput from "../../components/CInput/CInput";
import CBtn from "../../components/CBtn/CBtn";
import { save } from "../../service/service";
import "./PermissionsList.css";

function PermissionsList() {
  const navigate = useNavigate();

  const collectionName = "permissions";
  const [count, setCount] = useState(0);
  const [record, setRecord] = useState(null);
  const [filter, setFilter] = useState({});

  const savePermission = async () => {
    if (record.id != null) {
      await save(collectionName, "update", record);
    } else {
      await save(collectionName, "insert", record);
    }
    setCount(count + 1);
    setRecord(null);
  };
  const deletePermission = async () => {
    await save(collectionName, "delete", record);
    setCount(count + 1);
    setRecord(null);
  };
  const calculateFilter = () => {
    if (filter["searchText"] == undefined) return "";
    return `name ilike '%${filter["searchText"]}%' or description ilike '%${filter["searchText"]}%'`;
  };

  const collectionsColumns = [
    {
      header: "Name",
      field: "name",
    },
    {
      header: "Actions",
      slot: ({ row }) => (
        <CBtn
          onClick={() => {
            setRecord(row);
          }}
        >
          Edit
        </CBtn>
      ),
    },
  ];

  return (
    <section className="c-permissions-list">
      <span className="c-permissions-title"> Permissions</span>
      <div className="c-btn-section">
        <CInput setState={setFilter} state={filter} path="searchText" />
        <CBtn onClick={() => setRecord({})}>Add</CBtn>
      </div>
      <CTable
        key={count}
        columns={collectionsColumns}
        collection={collectionName}
        filter={calculateFilter()}
      ></CTable>
      <CModal
        isOpen={record != null}
        onClose={() => setRecord(null)}
        header={"Edit Permission"}
      >
        <CInput setState={setRecord} state={record} path="name" label="Name" />
        <CInput
          setState={setRecord}
          state={record}
          path="description"
          label="Description"
        />
        <div className="c-tools">
          {record?.id != null && (
            <CBtn confirm={true} onClick={deletePermission}>
              Delete
            </CBtn>
          )}
          <CBtn onClick={savePermission}>Save</CBtn>
        </div>
      </CModal>
    </section>
  );
}

export default PermissionsList;
