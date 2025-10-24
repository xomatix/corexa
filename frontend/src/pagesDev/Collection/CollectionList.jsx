import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CTable from "../../components/CTable/Ctable";
import CInput from "../../components/CInput/CInput";
import CBtn from "../../components/CBtn/CBtn";
import CModal from "../../components/CModal/CModal";
import { save } from "../../service/service";

// MOCK_DATA.js

function CollectionList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({});
  const [collection, setCollection] = useState(null);

  const clickAction = (row) => {
    navigate(`/collections/${row.id}`);
  };
  const insertCollection = async () => {
    const resp = await save("collections", "insert", {
      name: collection.name.toLowerCase(),
      label: collection.label,
    });

    console.log(resp);
    const id = resp.id;

    if (id != undefined) {
      navigate(`/collections/${id}`);
      return;
    }
  };

  const calculateFilter = () => {
    if (filter["colName"] == undefined) return "";
    return `name like '%${filter["colName"]}%' or label like '%${filter["colName"]}%'`;
  };

  const collectionsColumns = [
    {
      header: "Name",
      field: "name",
    },
    {
      header: "Label",
      field: "label",
    },
    {
      header: "Actions",
      slot: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            clickAction(row);
          }}
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div>
      CollectionList
      <CBtn key={"mfaevoijeanfo"} onClick={() => setCollection({})}>
        Add
      </CBtn>
      <CInput path="colName" state={filter} setState={setFilter} />
      <CTable
        filter={calculateFilter()}
        columns={collectionsColumns}
        collection={"collections"}
      />
      {collection && (
        <CModal
          header={"Add collection"}
          isOpen={collection != null}
          onClose={() => setCollection(null)}
        >
          <CInput
            label="Name"
            path="name"
            state={collection}
            setState={setCollection}
          />
          <br />
          <CInput
            label="Label"
            path="label"
            state={collection}
            setState={setCollection}
          />
          <br />
          <CBtn key={"mfaevoijeanfo"} onClick={() => setCollection({})}>
            Close
          </CBtn>{" "}
          <CBtn key={"mfaevoijeanfo"} onClick={() => insertCollection()}>
            Save
          </CBtn>
        </CModal>
      )}
    </div>
  );
}

export default CollectionList;
