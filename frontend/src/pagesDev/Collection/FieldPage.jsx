import React, { useEffect, useState } from "react";
import CModal from "../../components/CModal/CModal";
import { save } from "../../service/service";
import { useNavigate } from "react-router-dom";

import "./FieldPage.css";
import CInput from "../../components/CInput/CInput";
import CBtn from "../../components/CBtn/CBtn";

function FieldPage({ windowIdent, field, setField = () => {} }) {
  const navigate = useNavigate();
  const isInsert = field.id === null || field.id === undefined;
  // const id = field.id ? field.id : "insert_field";
  const saveAction = async () => {
    const resp = await save("fields", isInsert ? "insert" : "update", {
      ...field,
      name: field.name.toLowerCase(),
    });
    alert(JSON.stringify(resp));
    setField(null);
    navigate(0);
  };
  const deleteAction = async () => {
    const resp = await save("fields", "delete", field);
    alert(JSON.stringify(resp));
    setField(null);
    navigate(0);
  };

  const calculateTypeFilter = () => {
    if (field["type"] == undefined) return "";
    return `name like '%${field["type"]}%' or label like '%${field["type"]}%'`;
  };
  const calculateFkFilter = () => {
    if (field["foreign_table_name"] == undefined) return "";
    return `name ilike '%${field["foreign_table_name"]}%' or label ilike '%${field["foreign_table_name"]}%'`;
  };

  return (
    <CModal
      header={"Field edit"}
      isOpen={field != null}
      onClose={() => setField(null)}
    >
      <div style={{ marginBottom: "16px" }}>{JSON.stringify(field)}</div>
      <>
        <CInput
          state={field}
          setState={setField}
          path="name"
          label="Field Name"
          type="text"
          readOnly={!isInsert}
        />
        <CInput
          state={field}
          setState={setField}
          path="label"
          label="Label"
          type="text"
        />
        <CInput
          state={field}
          setState={setField}
          path="type"
          label="Type"
          type="lookup"
          filter={calculateTypeFilter()}
          readOnly={!isInsert}
          collection="data_types"
          setFieldMap={{
            name: "type",
          }}
        />
        <CInput
          state={field}
          setState={setField}
          path="is_primary"
          label="Is primary"
          type="checkbox"
          readOnly={!isInsert}
        />
        <CInput
          state={field}
          setState={setField}
          path="is_nullable"
          label="Is nullable"
          type="checkbox"
          readOnly={!isInsert}
        />
        <CInput
          state={field}
          setState={setField}
          path="is_unique"
          label="Is unique"
          type="checkbox"
          readOnly={!isInsert}
        />
        <CInput
          state={field}
          setState={setField}
          path="foreign_table_name"
          label="Foreign Table"
          type="lookup"
          filter={calculateFkFilter()}
          collection="collections"
          readOnly={!isInsert}
          setFieldMap={{
            name: "foreign_table_name",
            id: "foreign_table",
          }}
        />
      </>
      <div>
        <button onClick={() => setField(null)}>Close</button>
        {!isInsert && (
          <CBtn onClick={() => deleteAction()} confirm={true}>
            Delete
          </CBtn>
        )}
        <button onClick={saveAction}>{isInsert ? "Add" : "Save"}</button>
      </div>
    </CModal>
  );
}

export default FieldPage;
