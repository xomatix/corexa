import React, { useEffect, useState } from "react";
import "./CInput.css";
import { select } from "../../service/service";

const getNestedValue = (obj, path) => {
  console.log("g nest val");
  const finalPath = path.includes(".") ? `expand.${path}` : path;
  console.log("g nest path", finalPath);

  finalPath.split(".").reduce((acc, part) => {
    console.log("reduce ", acc, part);
  }, obj);

  return finalPath.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return acc[part];
    }
    return undefined;
  }, obj);
};

const setNestedValue = (oldState, path, value) => {
  const finalPath = path.includes(".") ? `expand.${path}` : path;

  const pathParts = finalPath.split(".");
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

/**
 * CInput - controlled input component supporting text, number, checkbox and lookup behaviors.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.state - Current application/form state object.
 * @param {(nextState: Object) => void} props.setState - State updater function.
 * @param {string} props.path - Path (dot/array style) inside state where this input's value is stored.
 * @param {string} [props.label=""] - Optional label text for the input.
 * @param {string} [props.type="text"] - Input type: "text" | "number" | "checkbox" | "lookup".
 * @param {boolean} [props.readOnly=false] - When true, prevents editing and disables checkbox interaction.
 * @param {string} [props.collection=""] - (lookup only) collection name used to load lookup items.
 * @param {string} [props.expand=""] - (lookup only) expand/query parameter passed to the select helper.
 * @param {Object} [props.setFieldMap={}] - (lookup only) map of item keys to state paths to set on selection.
 *
 * Description:
 * - Reads and writes the value at `props.path` using helper functions (getNestedValue / setNestedValue).
 * - parseValue coerces raw input into the appropriate JS type for "number" and "checkbox".
 * - For type === "lookup": on focus it loads data from the specified collection, displays a dropdown,
 *   and on selecting an item writes mapped fields into state according to `setFieldMap`.
 * - Honors `readOnly` by blocking changes and disabling checkbox interaction when set.
 *
 * @returns {JSX.Element} The rendered input element (with optional lookup dropdown).
 */
function CInput({
  state,
  setState,
  path,
  label = "",
  type = "text",
  readOnly = false,
  collection = "",
  expand = "",
  filter = "",
  setFieldMap = {},
  children,
}) {
  const [isLookupExp, setIsLookupExp] = useState(false);
  const [lookupList, setLookupList] = useState([]);
  const value = getNestedValue(state, path) || "";

  const handleChange = (e) => {
    if (readOnly) return;

    const finalValue = parseValue(e);

    const newState = setNestedValue(state, path, finalValue);

    setState(newState);
  };

  useEffect(() => {
    handleLookupLoadData();
  }, [filter]);

  const parseValue = (e) => {
    const rawValue = e.target.value;
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

    const data = (await select(collection, filter, expand)).data;

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
      const finalValue = key == path ? parseValue(rawValue) : rawValue;
      // console.log(
      //   Object.keys(setFieldMap),
      //   "item",
      //   item,
      //   "rawVal",
      //   rawValue,
      //   "finalValue",
      //   finalValue,
      //   "path",
      //   setFieldMap[key]
      // );
      newState = setNestedValue(newState, setFieldMap[key], finalValue);
    }

    setState(newState);
    setIsLookupExp(false);
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
      {type === "checkbox" && (
        <input
          onBlur={handleOnBlur}
          id={path + label}
          type={type}
          checked={Boolean(getNestedValue(state, path))}
          onChange={handleChange}
          onFocus={handleOnFocus}
          readOnly={readOnly}
          disabled={readOnly && type === "checkbox"}
        />
      )}
      {type !== "checkbox" && (
        <input
          onBlur={handleOnBlur}
          id={path + label}
          type={type == "lookup" ? "text" : type}
          value={value}
          onChange={handleChange}
          onFocus={handleOnFocus}
          readOnly={readOnly}
          disabled={readOnly}
        />
      )}
      {isLookupExp && (
        <ul
          key={filter}
          className="c-lookup-list"
          onMouseDown={(e) => e.preventDefault()}
        >
          {lookupList.map((item, idx) => (
            <li
              key={idx}
              className="c-lookup-item"
              onClick={(e) => handleLookupSelect(e, item)}
            >
              {typeof children === "function"
                ? children(item)
                : children ?? JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CInput;
