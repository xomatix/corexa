import React, { useState } from "react";
import { save } from "../../service/service";
import CTable from "../../components/CTable/Ctable";
import CBtn from "../../components/CBtn/CBtn";

function UserRolesList({ userId }) {
  const [count, setCount] = useState(0);

  const collectionName = "roles";
  const collectionAssignedName = "user_roles";
  const assignRole = async (role_id) => {
    await save(collectionAssignedName, "insert", {
      user_id: userId,
      role_id: role_id,
    });
    setCount(count + 1);
  };
  const removeRole = async (role_id) => {
    await save(collectionAssignedName, "delete", {
      user_id: userId,
      role_id: role_id,
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
            assignRole(row.id);
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
      field: "role_id.name",
    },
    {
      header: "Description",
      field: "role_id.description",
    },
    {
      header: "Actions",
      slot: ({ row }) => (
        <CBtn
          onClick={() => {
            removeRole(row.role_id);
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
    return `id not in (select role_id from user_roles where user_id = '${userId}')`;
  };

  return (
    <div>
      Roles {userId}
      <div className="c-2-lists" key={count}>
        <CTable
          collection={collectionName}
          columns={collectionsColumns}
          filter={calculateUnassignedFilter()}
        />
        <CTable
          collection={collectionAssignedName}
          columns={collectionsAssignedColumns}
          expand="role_id"
          filter={calculateAssignedFilter()}
        />
      </div>
    </div>
  );
}

export default UserRolesList;
