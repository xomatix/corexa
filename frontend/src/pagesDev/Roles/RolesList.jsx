import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CTable from "../../components/CTable/Ctable";
import CModal from "../../components/CModal/CModal";
import CInput from "../../components/CInput/CInput";
import CBtn from "../../components/CBtn/CBtn";
import { save } from "../../service/service";

// MOCK_DATA.js

function RolesList() {
  const navigate = useNavigate();

  const collectionName = "roles";
  const subCollectionName = "role_permissions";
  const [count, setCount] = useState(0);
  const [record, setRecord] = useState(null);
  const [focusedRow, setFocusedRow] = useState(null);
  const [subRecord, setSubRecord] = useState(null);

  const saveAction = async () => {
    if (record.id != null && record.id != undefined) {
      await save(collectionName, "update", record);
    } else {
      await save(collectionName, "insert", record);
    }
    setCount(count + 1);
    setRecord(null);
  };
  const saveRolePermission = async () => {
    await save(subCollectionName, "insert", subRecord);

    setSubRecord(null);
    setCount(count + 1);
  };
  const deleteRolePermissionAction = async (row) => {
    await save(subCollectionName, "delete", row);
    setCount(count + 1);
    setSubRecord(null);
  };
  const deleteAction = async () => {
    await save(collectionName, "delete", record);
    setCount(count + 1);
    setRecord(null);
  };
  const calculateSubFilter = () => {
    let filters = [];
    if (focusedRow != null)
      filters = [...filters, `role_id = '${focusedRow.id}'`];
    if (
      focusedRow != null &&
      focusedRow.st != undefined &&
      focusedRow.st != null
    )
      filters = [...filters, `permissions_id.name like '%${focusedRow.st}%'`];

    return filters.join(" and ");
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
  const subCollectionsColumns = [
    {
      header: "Name",
      field: "permissions_id.name",
    },
    {
      header: "Actions",
      slot: ({ row }) => (
        <CBtn
          confirm={true}
          onClick={async () => {
            await deleteRolePermissionAction(row);
          }}
        >
          Delete
        </CBtn>
      ),
    },
  ];

  return (
    <div>
      Roles
      <CBtn onClick={() => setRecord({})}>Insert Role</CBtn>
      <CTable
        key={count}
        columns={collectionsColumns}
        collection={collectionName}
        onClick={(row) => {
          setFocusedRow(row);
        }}
      ></CTable>
      {JSON.stringify(focusedRow)}
      {focusedRow != null && (
        <>
          <CInput
            setState={setFocusedRow}
            state={focusedRow}
            path="st"
            label="Search"
          />
          <CBtn onClick={() => setSubRecord({ role_id: focusedRow.id })}>
            Insert Permission
          </CBtn>
          <CTable
            key={count}
            columns={subCollectionsColumns}
            expand="permissions_id"
            filter={calculateSubFilter()}
            collection={subCollectionName}
          />
        </>
      )}
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
        {JSON.stringify(record)}
        <CInput setState={setRecord} state={record} path="name" label="Name" />
        <CInput
          setState={setRecord}
          state={record}
          path="description"
          label="Description"
        />
        <CBtn onClick={saveAction}>Save</CBtn>
        <CBtn onClick={deleteAction} confirm={true}>
          Delete
        </CBtn>
      </CModal>
      <CModal
        isOpen={subRecord != null}
        onClose={() => setSubRecord(null)}
        header={"Add Permission to role"}
      >
        <CInput
          setState={setSubRecord}
          state={subRecord}
          path="name"
          type="lookup"
          label="Name"
          collection="permissions"
          filter={`name like '%${
            subRecord != undefined && subRecord.name != undefined
              ? subRecord.name
              : ""
          }%'`}
          setFieldMap={{
            id: "permissions_id",
            name: "name",
          }}
        >
          {(row) => <span>{row.name}</span>}
        </CInput>
        <CBtn onClick={saveRolePermission}>Add</CBtn>
      </CModal>
    </div>
  );
}

export default RolesList;
