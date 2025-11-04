import React, { useState } from "react";
import { save } from "../../service/service";
import CTable from "../../components/CTable/Ctable";
import CTabs from "../../components/CTabs/CTabs";
import CBtn from "../../components/CBtn/CBtn";
import CInput from "../../components/CInput/CInput";

function CollectionPermissions({ collectionId = "" }) {
  const [count, setCount] = useState(0);
  const [actionTab, setActionTab] = useState("r");
  const [filter, setFilter] = useState({});
  const actionsList = ["c", "r", "u", "d"];

  const collectionName = "permissions";
  const collectionAssignedName = "collection_permissions";

  const calculateAssignedFilter = () => {
    let txtFilter = "";
    if (filter?.sta != null && filter?.sta != undefined)
      txtFilter = `and (permissions_id.name ilike '%${filter.sta}%' or permissions_id.description ilike '%${filter.sta}%')`;
    return `collections_id = '${collectionId}' and action = '${actionTab}' ${txtFilter}`;
  };
  const calculateUnassignedFilter = () => {
    let txtFilter = "";
    if (filter?.stu != null)
      txtFilter = `and (name ilike '%${filter.stu}%' or description ilike '%${filter.stu}%')`;
    return `id not in (select permissions_id from ${collectionAssignedName} where collections_id = '${collectionId}' and action = '${actionTab}') ${txtFilter}`;
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

  const assignedRolesComponent = () => {
    return (
      <section className="c-role-permissions-section" key={count}>
        <div className="c-item">
          <CInput
            state={filter}
            setState={setFilter}
            path="stu"
            label="Search"
          />
          <CTable
            collection={collectionName}
            columns={collectionsColumns}
            filter={calculateUnassignedFilter()}
          />
        </div>
        <div className="c-item">
          <CInput
            state={filter}
            setState={setFilter}
            path="sta"
            label="Search"
          />
          <CTable
            expand="permissions_id"
            collection={collectionAssignedName}
            columns={collectionsAssignedColumns}
            filter={calculateAssignedFilter()}
          />
        </div>
      </section>
    );
  };

  return (
    <div>
      <span className="c-collection-title">Permissions</span>
      <br />
      <br />
      {/* List {collectionId} */}
      <CTabs
        tabState={actionTab}
        setTabState={setActionTab}
        tabs={[
          {
            name: "c",
            slot: assignedRolesComponent(),
          },
          {
            name: "r",
            slot: assignedRolesComponent(),
          },
          {
            name: "u",
            slot: assignedRolesComponent(),
          },
          {
            name: "d",
            slot: assignedRolesComponent(),
          },
        ]}
      />
    </div>
  );
}

export default CollectionPermissions;
