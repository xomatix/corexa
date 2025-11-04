import React, { useState } from "react";
import CTable from "../../components/CTable/Ctable";
import CBtn from "../../components/CBtn/CBtn";
import "./UserList.css";
import { save } from "../../service/service";
import CInput from "../../components/CInput/CInput";

function UserPermissionsList({ userId = null }) {
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState({});

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
    let txtFilter = "";
    if (filter?.sta != null)
      txtFilter = `and (permissions_id.name ilike '%${filter.sta}%' or permissions_id.description ilike '%${filter.sta}%')`;
    return `user_id = '${userId}' ${txtFilter}`;
  };
  const calculateUnassignedFilter = () => {
    let txtFilter = "";
    if (filter?.stu != null)
      txtFilter = `and (name ilike '%${filter.stu}%' or description ilike '%${filter.stu}%')`;
    return `id not in (select permissions_id from ${collectionAssignedName} where user_id = '${userId}') ${txtFilter}`;
  };

  return (
    <section className="c-role-permissions-section" key={count}>
      {/* UsrPermList {userId} */}
      <div className="c-item">
        <CInput state={filter} setState={setFilter} path="stu" />
        <CTable
          collection={collectionName}
          columns={collectionsColumns}
          filter={calculateUnassignedFilter()}
        />
      </div>
      <div className="c-item">
        <CInput state={filter} setState={setFilter} path="sta" />
        <CTable
          expand="permissions_id"
          collection={collectionAssignedName}
          columns={collectionsAssignedColumns}
          filter={calculateAssignedFilter()}
        />
      </div>
    </section>
  );
}

export default UserPermissionsList;
