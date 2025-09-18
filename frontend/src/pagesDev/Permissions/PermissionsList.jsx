import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CTable from "../../components/CTable/Ctable";
import CModal from "../../components/CModal/CModal";
import CInput from "../../components/CInput/CInput";
import CBtn from "../../components/CBtn/CBtn";
import { save } from "../../service/service";

// MOCK_DATA.js

function PermissionsList() {
  const navigate = useNavigate();

  const collectionName = "permissions";
  const [count, setCount] = useState(0);
  const [record, setRecord] = useState(null);

  const savePermission = async () => {
    await save(collectionName, "update", record);
    setCount(count + 1);
    setRecord(null);
  };
  const deletePermission = async () => {
    await save(collectionName, "delete", record);
    setCount(count + 1);
    setRecord(null);
  };

  const collectionsColumns = [
    {
      header: "Name",
      field: "name",
    },
    {
      header: "Actions",
      slot: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRecord(row);
          }}
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div>
      Permissions
      <CTable
        key={count}
        columns={collectionsColumns}
        collection={collectionName}
      ></CTable>
      <button
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        aaa {count}
      </button>
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
        <CBtn onClick={savePermission}>Save</CBtn>
        <CBtn onClick={deletePermission} confirm={true}>
          Delete
        </CBtn>
      </CModal>
    </div>
  );
}

export default PermissionsList;
