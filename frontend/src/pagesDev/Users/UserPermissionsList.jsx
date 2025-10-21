import React, { useState } from "react";
import CTable from "../../components/CTable/Ctable";
import CBtn from "../../components/CBtn/CBtn";
import "./UserList.css";
import { save } from "../../service/service";

function UserPermissionsList({ userId = null }) {
  const [count, setCount] = useState(0);

  const assignPermission = async (permission_id) => {
    await save(collectionAssignedName, "insert", {
      user_id: userId,
      permissions_id: permission_id,
    });
    setCount(count + 1);
  };
  const removePermission = async (permission_id) => {
    await save(collectionAssignedName, "delete", {
      user_id: userId,
      permissions_id: permission_id,
    });
    setCount(count + 1);
  };

  const collectionName = "permissions";
  const collectionAssignedName = "user_permissions";
  const collectionsColumns = [
    {
      header: "Name",
      field: "name",
    },
    {
      header: "Is Superuser",
      slot: ({ row }) => {
        return <span title={row.description}>{row.description}</span>;
      },
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
            removePermission(row.permissions_id);
          }}
        >
          Remove
        </CBtn>
      ),
    },
  ];

  const calculateAssignedFilter = () => {
    return `user_id = '${userId}'`;
  };
  const calculateUnassignedFilter = () => {
    return `id not in (select permissions_id from ${collectionAssignedName} where user_id = '${userId}')`;
  };

  return (
    <div>
      UsrPermList {userId}
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

export default UserPermissionsList;
