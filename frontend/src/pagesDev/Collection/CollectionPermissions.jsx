import React, { useState } from "react";
import { save } from "../../service/service";
import CTable from "../../components/CTable/Ctable";
import CBtn from "../../components/CBtn/CBtn";

function CollectionPermissions({ collectionId = "" }) {
  const [count, setCount] = useState(0);
  const [actionTab, setActionTab] = useState("r");
  const actionsList = ["c", "r", "u", "d"];

  const collectionName = "permissions";
  const collectionAssignedName = "collection_permissions";

  const calculateAssignedFilter = () => {
    return `collections_id = '${collectionId}' and action = '${actionTab}'`;
  };
  const calculateUnassignedFilter = () => {
    return `id not in (select permissions_id from ${collectionAssignedName} where collections_id = '${collectionId}' and action = '${actionTab}')`;
  };

  const assignPermission = async (permission_id) => {
    await save(collectionAssignedName, "insert", {
      collections_id: collectionId,
      permissions_id: permission_id,
      action: actionTab,
    });
    setCount(count + 1);
  };
  const removePermission = async (permission_id, action) => {
    await save(collectionAssignedName, "delete", {
      collections_id: collectionId,
      permissions_id: permission_id,
      action: action,
    });
    setCount(count + 1);
  };

  const collectionsColumns = [
    {
      header: "Name",
      field: "name",
    },
    {
      header: "Description",
      field: "description",
    },
    {
      header: "Actions",
      slot: ({ row }) => (
        <CBtn
          onClick={() => {
            assignPermission(row.id);
          }}
        >
          Assign
        </CBtn>
      ),
    },
  ];
  const collectionsAssignedColumns = [
    {
      header: "Action",
      field: "action",
    },
    {
      header: "Name",
      field: "permissions_id.name",
    },
    {
      header: "Description",
      field: "permissions_id.description",
    },
    {
      header: "Actions",
      slot: ({ row }) => (
        <CBtn
          onClick={() => {
            removePermission(row.permissions_id, row.action);
          }}
        >
          Remove
        </CBtn>
      ),
    },
  ];

  return (
    <div>
      Collection Permission List {collectionId}
      <div className="c-options-container">
        {actionsList.map((opt) => {
          return (
            <div
              key={opt}
              className={`c-option ${opt == actionTab && "c-active"}`}
              onClick={() => {
                setActionTab(opt);
              }}
            >
              {opt}
            </div>
          );
        })}
      </div>
      <div className="c-2-lists" key={count}>
        <CTable
          collection={collectionName}
          columns={collectionsColumns}
          filter={calculateUnassignedFilter()}
        />
        <CTable
          expand="permissions_id"
          collection={collectionAssignedName}
          columns={collectionsAssignedColumns}
          filter={calculateAssignedFilter()}
        />
      </div>
    </div>
  );
}

export default CollectionPermissions;
