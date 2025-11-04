import React, { useState } from "react";
import { save } from "../../service/service";
import CTable from "../../components/CTable/Ctable";
import CBtn from "../../components/CBtn/CBtn";
import CInput from "../../components/CInput/CInput";

function UserRolesList({ userId }) {
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState({});

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
    let txtFilter = "";
    if (filter?.sta != null)
      txtFilter = `and (role_id.name ilike '%${filter.sta}%' or role_id.description ilike '%${filter.sta}%')`;
    return `user_id = '${userId}' ${txtFilter}`;
  };
  const calculateUnassignedFilter = () => {
    let txtFilter = "";
    if (filter?.stu != null)
      txtFilter = `and (name ilike '%${filter.stu}%' or description ilike '%${filter.stu}%')`;
    return `id not in (select role_id from user_roles where user_id = '${userId}') ${txtFilter}`;
  };

  return (
    <section className="c-role-permissions-section" key={count}>
      {/* Roles {userId} */}
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
          collection={collectionAssignedName}
          columns={collectionsAssignedColumns}
          expand="role_id"
          filter={calculateAssignedFilter()}
        />
      </div>
    </section>
  );
}

export default UserRolesList;
