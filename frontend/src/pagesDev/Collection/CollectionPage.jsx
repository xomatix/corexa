import React, { useEffect, useState } from "react";
import "./CollectionPage.css";
import { useNavigate, useParams } from "react-router-dom";
import CTable from "../../components/CTable/Ctable";
import { save, select } from "../../service/service";
import { setValue } from "../../service/state";
import FieldPage from "./FieldPage";
import CollectionPermissions from "./CollectionPermissions";
import CBtn from "../../components/CBtn/CBtn";
import CInput from "../../components/CInput/CInput";

function CollectionPage() {
  const { id } = useParams();
  const windowIdent = "collectionPage";
  const navigate = useNavigate();
  const [record, setRecord] = useState();
  const [field, setField] = useState();
  const [filtersSet, setFiltersSet] = useState(false);

  const isInsert = id == "insert";

  const fetchRecord = async () => {
    setValue(windowIdent, "fields", "filter", `collection_id = '${id}'`);
    setFiltersSet(true);

    let resp = await select("collections", `id = '${id}'`);

    if (resp.data && resp.data.length > 0) setRecord(resp.data[0]);
  };

  const calculateFieldsFilter = () => {
    return `collection_id = '${id}'`;
  };

  useEffect(() => {
    if (!isInsert) fetchRecord();
    else setRecord({});

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveAction = async () => {
    const resp = await save(
      "collections",
      isInsert ? "insert" : "update",
      record
    );
    alert(JSON.stringify(resp));
    if (isInsert) navigate(`/collections/${resp.id}`);
    else navigate(0);
  };
  const deleteAction = async () => {
    const resp = await save("collections", "delete", record);
    alert(JSON.stringify(resp));
    navigate(`/collections`);
  };
  const invokeNewField = () => {
    setField({
      collection_id: id,
      is_primary: false,
      is_nullable: true,
      is_unique: true,
    });
  };

  const fieldsColumns = [
    {
      header: "ID",
      field: "id",
    },
    {
      header: "Name",
      field: "name",
    },
    {
      header: "Type",
      field: "type",
    },
    {
      header: "Label",
      field: "label",
    },
    {
      header: "Is nullable",
      field: "is_nullable",
    },
    {
      header: "Is primary",
      field: "is_primary",
    },
    {
      header: "Is unique",
      field: "is_unique",
    },
    {
      header: "Foreign table",
      field: "foreign_table",
      slot: ({ row }) => (
        <a
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/collections/${row["foreign_table"]}`);
          }}
        >
          {row["foreign_table"]}
        </a>
      ),
    },
    {
      header: "Actions",
      slot: ({ row }) => (
        <CBtn
          onClick={() => {
            setField(row);
          }}
        >
          Edit
        </CBtn>
      ),
    },
  ];

  return (
    <section className="c-collection-page">
      <span className="c-collection-title">Collection edit page</span>
      {/* {isInsert ? <h3>Create collection</h3> : <h3>ID: {id}</h3>} */}
      <div className="c-btn-section">
        <CBtn onClick={saveAction}>Save</CBtn>

        <CBtn confirm={true} key={id} onClick={() => deleteAction()}>
          Delete
        </CBtn>
      </div>

      {record && (
        <>
          <CInput
            key={id + "name"}
            readOnly={true}
            label="Name"
            path="name"
            setState={setRecord}
            state={record}
          />
          <CInput
            label="Label"
            key={id + "label"}
            path="label"
            setState={setRecord}
            state={record}
          />

          {!isInsert && <CBtn onClick={invokeNewField}>Add field</CBtn>}
        </>
      )}
      {record && !isInsert && (
        <CTable
          key={"fieldsColumns" + id}
          columns={fieldsColumns}
          windowIdent={windowIdent}
          collection={"fields"}
          filter={calculateFieldsFilter()}
          expand="foreign_table"
          limit={30}
        />
      )}
      {field && (
        <FieldPage
          key={"FieldPage" + id}
          windowIdent={windowIdent}
          field={field}
          setField={setField}
        />
      )}
      <CollectionPermissions collectionId={id} />
    </section>
  );
}

export default CollectionPage;
