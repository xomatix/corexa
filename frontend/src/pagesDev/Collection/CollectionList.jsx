import React from "react";
import { useNavigate } from "react-router-dom";
import CTable from "../../components/CTable/Ctable";

// MOCK_DATA.js

function CollectionList() {
  const navigate = useNavigate();

  const clickAction = (row) => {
    navigate(`/collections/${row.id}`);
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
      {/* {JSON.stringify(collections)} */}
      <CTable columns={collectionsColumns} collection={"collections"}></CTable>
    </div>
  );
}

export default CollectionList;
