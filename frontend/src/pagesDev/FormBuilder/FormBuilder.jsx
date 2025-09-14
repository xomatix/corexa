import React, { useState } from "react";

function FormBuilder() {
  const [fields, setFields] = useState([]);
  const [newFieldType, setNewFieldType] = useState("text");

  const addField = () => {
    setFields([
      ...fields,
      { type: newFieldType, name: `field_${fields.length}` },
    ]);
  };

  const renderField = (field, index) => {
    const id = `${field.name}_${index}`;
    switch (field.type) {
      case "textarea":
        return (
          <>
            <label htmlFor={id}>{field.name}</label>
            <textarea id={id} name={field.name} />
          </>
        );
      default:
        return (
          <>
            <label htmlFor={id}>{field.name}</label>
            <input id={id} type={field.type} name={field.name} />
          </>
        );
    }
  };

  return (
    <div>
      <h2>FormBuilder</h2>
      <div>
        <select
          value={newFieldType}
          onChange={(e) => setNewFieldType(e.target.value)}
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="email">Email</option>
          <option value="password">Password</option>
          <option value="checkbox">Checkbox</option>
          <option value="textarea">Textarea</option>
        </select>
        <button type="button" onClick={addField}>
          Add +
        </button>
      </div>
      <form>
        {fields.map((field, index) => {
          return (
            <div className="c-field" key={index}>
              {renderField(field, index)}
            </div>
          );
        })}
      </form>
    </div>
  );
}

export default FormBuilder;
