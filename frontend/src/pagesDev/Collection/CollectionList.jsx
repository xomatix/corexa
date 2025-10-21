import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CTable from "../../components/CTable/Ctable";
import CInput from "../../components/CInput/CInput";

// MOCK_DATA.js

function CollectionList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({});

  const clickAction = (row) => {
    navigate(`/collections/${row.id}`);
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
      {JSON.stringify(filter)}
      {calculateFilter}
      <CInput path="colName" state={filter} setState={setFilter} />
      <CTable
        filter={calculateFilter()}
        columns={collectionsColumns}
        collection={"collections"}
      />
    </div>
  );
}

export default CollectionList;
