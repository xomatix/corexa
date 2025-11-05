import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CTable from "../../components/CTable/Ctable";
import CModal from "../../components/CModal/CModal";
import CInput from "../../components/CInput/CInput";
import CBtn from "../../components/CBtn/CBtn";
import { invokeSelect, save } from "../../service/service";
import CTabs from "../../components/CTabs/CTabs";
import UserPermissionsList from "./UserPermissionsList";
import UserRolesList from "./UserRolesList";

function UsersList() {
  const collectionName = "users";
  const [count, setCount] = useState(0);
  const [focusedRow, setFocusedRow] = useState(null);
  const [activeTab, setActiveTab] = useState("Permissions");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserPassword, setSelectedUserPassword] = useState(null);
  const [filter, setFilter] = useState({});

  const isInsert =
    focusedRow == null || focusedRow.id == null || focusedRow.id == undefined;

  const saveAction = async () => {
    if (focusedRow.id != null && focusedRow.id != undefined) {
      // await invokeSelect("save_user", focusedRow);
      await save(collectionName, "update", focusedRow);
    } else {
      // await invokeSelect("save_user", focusedRow);
      await save(collectionName, "insert", focusedRow);
    }
    setCount(count + 1);
    setFocusedRow(null);
  };
  const savePasswordAction = async () => {
    const resp = await invokeSelect("save_user_password", selectedUserPassword);

    console.log(resp, resp.data);
    const data = resp.data;

    if (data.length > 0 && data[0].error != undefined) {
      alert(data[0].error);
    } else {
      setCount(count + 1);
      setSelectedUserPassword(null);
    }
  };
  const deleteAction = async () => {
    await save(collectionName, "delete", focusedRow);
    setCount(count + 1);
    setFocusedRow(null);
  };

  const calculateFilter = () => {
    if (filter["searchText"] == undefined) return "";
    return `username ilike '%${filter["searchText"]}%' or display_name ilike '%${filter["searchText"]}%' or email ilike '%${filter["searchText"]}%'`;
  };

  const collectionsColumns = [
    {
      header: "Username",
      field: "username",
    },
    {
      header: "Display name",
      field: "display_name",
    },
    {
      header: "EMail",
      field: "email",
    },
    {
      header: "Is Active",
      slot: ({ row }) => <span>{row.is_active ? "Active" : "Inactive"}</span>,
    },
    {
      header: "Is Superuser",
      slot: ({ row }) => <span>{row.is_superuser ? "SUPERUSER" : "-"}</span>,
    },
    {
      header: "Actions",
      slot: ({ row }) => (
        <CBtn
          onClick={() => {
            setFocusedRow(row);
          }}
        >
          Edit
        </CBtn>
      ),
    },
  ];

  return (
    <section className="c-users-list">
      <span className="c-users-title">Users</span>
      <div className="c-btn-section">
        <CInput setState={setFilter} state={filter} path="searchText" />
        <CBtn onClick={() => setFocusedRow({})}>Add</CBtn>
      </div>
      <CTable
        key={count}
        columns={collectionsColumns}
        collection={collectionName}
        onClick={(row) => setSelectedUser(row)}
        filter={calculateFilter()}
      />
      <CTabs
        tabState={activeTab}
        setTabState={setActiveTab}
        tabs={[
          {
            name: "Permissions",
            slot: (
              <>
                {selectedUser != null && (
                  <UserPermissionsList userId={selectedUser.id} />
                )}
              </>
            ),
          },
          {
            name: "Roles",
            slot: (
              <>
                {selectedUser != null && (
                  <UserRolesList userId={selectedUser.id} />
                )}
              </>
            ),
          },
        ]}
      />
      <CModal
        isOpen={focusedRow != null}
        onClose={() => setFocusedRow(null)}
        header={"Edit User"}
      >
        {/* {JSON.stringify(focusedRow)} */}
        <CInput
          setState={setFocusedRow}
          state={focusedRow}
          path="username"
          label="Username"
        />
        <CInput
          setState={setFocusedRow}
          state={focusedRow}
          path="display_name"
          label="Display name"
        />
        <CInput
          setState={setFocusedRow}
          state={focusedRow}
          path="email"
          label="Email"
        />
        <CInput
          setState={setFocusedRow}
          state={focusedRow}
          type="checkbox"
          path="is_active"
          label="Is Active"
        />
        <CInput
          setState={setFocusedRow}
          state={focusedRow}
          type="checkbox"
          path="is_superuser"
          label="Is SUPERUSER"
        />
        <div className="c-tools">
          <CBtn onClick={deleteAction} confirm={true}>
            Delete
          </CBtn>
          {focusedRow?.id != null && focusedRow?.id != undefined && (
            <CBtn onClick={() => setSelectedUserPassword(focusedRow)}>
              Change password
            </CBtn>
          )}
          <CBtn onClick={saveAction}>Save</CBtn>
        </div>
      </CModal>
      <CModal
        isOpen={selectedUserPassword != null}
        onClose={() => setSelectedUserPassword(null)}
        header={"Change password"}
      >
        {JSON.stringify(selectedUserPassword)}
        <CInput
          setState={setSelectedUserPassword}
          state={selectedUserPassword}
          type="password"
          path="password"
          label="Password"
        />
        <CInput
          setState={setSelectedUserPassword}
          state={selectedUserPassword}
          type="password"
          path="password2"
          label="Confirm password"
        />
        <div className="c-tools">
          <div />

          <CBtn onClick={savePasswordAction}>Change</CBtn>
        </div>
      </CModal>
    </section>
  );
}

export default UsersList;
