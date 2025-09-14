import React, { useState } from "react";
import "./CInput.css";
import { select } from "../../service/service";

const getNestedValue = (obj, path) => {
  return path.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object") return acc[part];
    return undefined;
  }, obj);
};

const setNestedValue = (oldState, path, value) => {
  const pathParts = path.split(".");
  const newState = { ...oldState };

  let current = newState;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    current[part] = current[part] !== undefined ? { ...current[part] } : {};
    current = current[part];
  }

  current[pathParts[pathParts.length - 1]] = value;
  return newState;
};

function CInput({
  state,
  setState,
  path,
  label = "",
  type = "text",
  readOnly = false,
  collection = "",
  expand = "",
  setFieldMap = {},
}) {
  const value = getNestedValue(state, path) || "";
  const [isLookupExp, setIsLookupExp] = useState(false);
  const [lookupList, setLookupList] = useState([]);

  const handleChange = (e) => {
    if (readOnly) return;

    const rawValue = e.target.value;
    const finalValue = parseValue(rawValue);

    const newState = setNestedValue(state, path, finalValue);
    setState(newState);
  };

  const parseValue = (rawValue) => {
    let finalValue = null;

    switch (type) {
      case "number":
        finalValue = rawValue !== "" ? Number(rawValue) : null;
        break;

      case "checkbox":
        finalValue = e.target.checked;
        break;

      default:
        finalValue = rawValue;
    }
    return finalValue;
  };

  const handleOnFocus = () => {
    if (type !== "lookup") return;

    if (!isLookupExp) {
      setIsLookupExp(true);
      handleLookupLoadData();
    }
  };

  const handleLookupLoadData = async () => {
    if (collection == "") return;

    const data = (await select(collection, "", expand)).data;

    if (data !== null && data !== undefined) {
      setLookupList(data);
    } else {
      setLookupList([]);
    }
  };

  const handleLookupSelect = (e, item) => {
    e.preventDefault();
    let newState = state;
    for (const key of Object.keys(setFieldMap)) {
      const rawValue = item[key];
      const finalValue = parseValue(rawValue);
      console.log(
        Object.keys(setFieldMap),
        "item",
        item,
        "rawVal",
        rawValue,
        "finalValue",
        finalValue,
        "path",
        setFieldMap[key]
      );
      newState = setNestedValue(newState, setFieldMap[key], finalValue);
    }

    setState(newState);
  };

  const handleOnBlur = () => {
    if (type !== "lookup") return;
    setIsLookupExp(false);
  };

  return (
    <div
      className={`c-input ${readOnly && "c-readonly"} ${
        type == "lookup" && "c-lookup"
      } `}
    >
      {label && <label htmlFor={path + label}>{label}</label>}
      <input
        onBlur={handleOnBlur}
        id={path + label}
        type={type == "lookup" ? "text" : type}
        value={value}
        onChange={handleChange}
        onFocus={handleOnFocus}
        readOnly={readOnly}
        disabled={readOnly && type === "checkbox"}
      />
      {isLookupExp && (
        <ul className="c-lookup-list" onMouseDown={(e) => e.preventDefault()}>
          {lookupList.map((item, idx) => (
            <li
              key={idx}
              className="c-lookup-item"
              onClick={(e) => handleLookupSelect(e, item)}
            >
              {JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CInput;
