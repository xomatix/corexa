import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CTable from "../../components/CTable/Ctable";
import CModal from "../../components/CModal/CModal";
import CInput from "../../components/CInput/CInput";
import CBtn from "../../components/CBtn/CBtn";
import { save } from "../../service/service";
import "./RolesList.css";

// MOCK_DATA.js

function RolesList() {
  const navigate = useNavigate();

  const collectionName = "roles";
  const subCollectionName = "role_permissions";
  const permissionsTableName = "permissions";
  const [count, setCount] = useState(0);
  const [record, setRecord] = useState(null);
  const [focusedRow, setFocusedRow] = useState(null);
  const [filter, setFilter] = useState({});

  const saveAction = async () => {
    if (record.id != null && record.id != undefined) {
      await save(collectionName, "update", record);
    } else {
      await save(collectionName, "insert", record);
    }
    setCount(count + 1);
    setRecord(null);
  };
  const addPermissionToRole = async (row) => {
    await save(subCollectionName, "insert", {
      permissions_id: row.id,
      role_id: focusedRow.id,
    });

    setCount(count + 1);
  };
  const deleteRolePermissionAction = async (row) => {
    await save(subCollectionName, "delete", row);
    setCount(count + 1);
  };
  const deleteAction = async () => {
    await save(collectionName, "delete", record);
    setCount(count + 1);
    setRecord(null);
  };

  const calculateFilter = () => {
    if (filter["searchText"] == undefined) return "";
    return `name ilike '%${filter["searchText"]}%' or description ilike '%${filter["searchText"]}%'`;
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
  const calculateUnassignedPermissionsFilter = () => {
    let filters = [];
    if (
      focusedRow != null &&
      focusedRow.id != undefined &&
      focusedRow.id != null
    )
      filters = [
        ...filters,
        `id not in (select permissions_id from ${subCollectionName} where role_id = '${focusedRow.id}')`,
      ];
    if (
      focusedRow != null &&
      focusedRow.stu != undefined &&
      focusedRow.stu != null
    )
      filters = [...filters, `name like '%${focusedRow.stu}%'`];

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
  const assignedCollectionColumns = [
    {
      header: "Name",
      field: "permissions_id.name",
    },
    {
      header: "",
      slot: ({ row }) => (
        <CBtn
          confirm={true}
          onClick={async () => {
            await deleteRolePermissionAction(row);
          }}
        >
          Remove
        </CBtn>
      ),
    },
  ];
  const unassignedPermissionsTableColumns = [
    {
      header: "Name",
      field: "name",
    },
    {
      header: "",
      slot: ({ row }) => (
        <CBtn
          confirm={true}
          onClick={async () => {
            await addPermissionToRole(row);
          }}
        >
          Assign
        </CBtn>
      ),
    },
  ];

  return (
    <section className="c-roles-list">
      <span className="c-roles-title">Roles</span>
      <div className="c-btn-section">
        <CInput setState={setFilter} state={filter} path="searchText" />
        <CBtn onClick={() => setRecord({})}>Add</CBtn>
      </div>
      <CTable
        key={count}
        columns={collectionsColumns}
        collection={collectionName}
        onClick={(row) => {
          setFocusedRow(row);
        }}
        filter={calculateFilter()}
      />
      {/* {JSON.stringify(focusedRow)} */}
      {focusedRow != null && focusedRow.id != null && (
        <section className="c-role-permissions-section">
          <div className="c-item">
            <CInput
              setState={setFocusedRow}
              state={focusedRow}
              path="stu"
              label="Search"
            />
            <CTable
              key={count}
              columns={unassignedPermissionsTableColumns}
              filter={calculateUnassignedPermissionsFilter()}
              collection={permissionsTableName}
            />
          </div>
          <div className="c-item">
            <CInput
              setState={setFocusedRow}
              state={focusedRow}
              path="st"
              label="Search"
            />
            <CTable
              key={count}
              columns={assignedCollectionColumns}
              expand="permissions_id"
              filter={calculateSubFilter()}
              collection={subCollectionName}
            />
          </div>
        </section>
      )}
      <CModal
        isOpen={record != null}
        onClose={() => setRecord(null)}
        header={"Edit Permission"}
      >
        {/* {JSON.stringify(record)} */}
        <CInput setState={setRecord} state={record} path="name" label="Name" />
        <CInput
          setState={setRecord}
          state={record}
          path="description"
          label="Description"
        />
        <div className="c-tools">
          {record?.id != undefined && (
            <CBtn onClick={deleteAction} confirm={true}>
              Delete
            </CBtn>
          )}
          <CBtn onClick={saveAction}>Save</CBtn>
        </div>
      </CModal>
    </section>
  );
}

export default RolesList;
