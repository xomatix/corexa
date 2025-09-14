import React, { useEffect, useState } from "react";
import CModal from "../../components/CModal/CModal";
import { save, select } from "../../service/service";
import { useNavigate } from "react-router-dom";
import { setValue } from "../../service/state";
import "./FieldPage.css";
import CInput from "../../components/CInput/CInput";

function FieldPage({ windowIdent, field, setField = () => {} }) {
  const navigate = useNavigate();
  const dataSetIdent = "fields";
  const isInsert = field.id === null || field.id === undefined;
  const id = field.id ? field.id : "insert_field";
  const saveAction = async () => {
    const resp = await save("fields", isInsert ? "insert" : "update", field);
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

  const onChange = (e, fieldName, setFieldMap = null, selectedRow = null) => {
    let newVal = e.target.value;
    if (["is_primary"].includes(fieldName)) {
      console.log(field[fieldName]);
      newVal = !field[fieldName];
    }
    if (setFieldMap == null || (selectedRow == null && setFieldMap !== null)) {
      setField((prev) => ({ ...prev, [fieldName]: newVal }));
      setValue(windowIdent, dataSetIdent, "rows", fieldName, newVal);
    }
    console.log(Object.keys(setFieldMap), selectedRow);
    if (
      setFieldMap !== null &&
      Object.keys(setFieldMap).length > 0 &&
      selectedRow !== null
    ) {
      for (let key of Object.keys(setFieldMap)) {
        const value = setFieldMap[key];
        console.log(key, value);
        const rowValue = selectedRow[key];
        setField((prev) => ({ ...prev, [value]: rowValue }));
        setValue(windowIdent, dataSetIdent, "rows", value, rowValue);
      }
    }
  };

  //#region FIeldInput
  // const FieldInput = ({
  //   id,
  //   fieldName,
  //   value,
  //   onChange,
  //   label,
  //   type = "text",
  //   readOnly = false,
  //   checked,
  //   filter = null,
  //   expand = "",
  //   collection,
  //   setFieldMap = {},
  // }) => {
  //   const inputId = `${id}_${fieldName}`;

  //   const [lookupOptions, setLookupOptions] = useState([]);
  //   const [isLoading, setIsLoading] = useState(false);
  //   const [isListVisible, setListVisible] = useState(false);

  //   useEffect(() => {
  //     if (type === "lookup" && isListVisible) {
  //       setIsLoading(true);
  //       const fetchData = async () => {
  //         try {
  //           const data = await select(collection, filter, expand);
  //           setLookupOptions(data.data);
  //         } catch (error) {
  //           console.error("Failed to fetch lookup data:", error);
  //         } finally {
  //           setIsLoading(false);
  //         }
  //       };

  //       const timer = setTimeout(() => {
  //         fetchData();
  //       }, 300);

  //       return () => clearTimeout(timer);
  //     }
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [value, isListVisible]);

  //   const handleLookupSelect = (selectedValue) => {
  //     // Create a synthetic event to pass to the parent's onChange handler
  //     const event = {
  //       target: {
  //         value: selectedValue,
  //       },
  //     };
  //     onChange(event, fieldName, setFieldMap, selectedValue);
  //     setListVisible(false);
  //   };

  //   if (type === "checkbox") {
  //     return (
  //       <>
  //         <input
  //           type="checkbox"
  //           key={inputId}
  //           id={inputId}
  //           name={inputId}
  //           onChange={(e) => onChange(e, fieldName)}
  //           checked={checked || false}
  //         />
  //         <label htmlFor={inputId}>{label}</label>
  //         <br />
  //       </>
  //     );
  //   }

  //   if (type === "lookup") {
  //     return (
  //       <div className="lookup-container">
  //         <input
  //           type="text"
  //           id={inputId}
  //           readOnly={readOnly}
  //           className="c-input"
  //           value={value || ""}
  //           onChange={(e) => {
  //             onChange(e, fieldName, setFieldMap);
  //             if (!isListVisible) setListVisible(true);
  //           }}
  //           onFocus={() => setListVisible(true)}
  //           onBlur={() => setTimeout(() => setListVisible(false), 200)}
  //           placeholder={label}
  //         />
  //         <label htmlFor={inputId}>{label}</label>

  //         {isListVisible && (
  //           <ul className="lookup-list">
  //             {isLoading && lookupOptions === null ? (
  //               <li className="lookup-item-loading">Loading...</li>
  //             ) : (
  //               lookupOptions.map((option) => (
  //                 <li
  //                   key={option.id}
  //                   className="lookup-item"
  //                   onMouseDown={() => handleLookupSelect(option)}
  //                 >
  //                   {option.name}
  //                 </li>
  //               ))
  //             )}
  //             {!isLoading && lookupOptions.length === 0 && value && (
  //               <li className="lookup-item-no-results">No results found</li>
  //             )}
  //           </ul>
  //         )}
  //       </div>
  //     );
  //   }

  //   return (
  //     <>
  //       <label htmlFor={inputId}>{label}</label>:&nbsp;
  //       <input
  //         key={inputId}
  //         type={type}
  //         readOnly={readOnly}
  //         className="c-input"
  //         value={value || ""}
  //         onChange={(e) => onChange(e, fieldName)}
  //         placeholder={label}
  //       />
  //       <br />
  //     </>
  //   );
  // };
  //#endregion

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
          type="text"
          readOnly={true}
        />
        <CInput
          state={field}
          setState={setField}
          path="foreign_table"
          label="Foreign Table"
          type="lookup"
          collection="collections"
          setFieldMap={{
            name: "foreign_table_name",
            id: "foreign_table",
          }}
        />
      </>
      <div>
        <button onClick={() => setField(null)}>Close</button>
        {!isInsert && <button onClick={deleteAction}>Delete</button>}
        <button onClick={saveAction}>{isInsert ? "Add" : "Save"}</button>
      </div>
    </CModal>
  );
}

export default FieldPage;
