import { select } from "./service";

var globalState = {};
var windowDefinitions = {};

function createBlankRecord(windowIdent, dataSetIdent) {
  if (!globalState[windowIdent]) {
    globalState[windowIdent] = {};
  }
  if (!globalState[windowIdent][dataSetIdent]) {
    globalState[windowIdent][dataSetIdent] = {};
  }
  if (!globalState[windowIdent][dataSetIdent]["filter"]) {
    globalState[windowIdent][dataSetIdent]["filter"] = "";
  }
}

async function fetchRows(windowIdent, dataSetIdent, filters = null) {
  createBlankRecord(windowIdent, dataSetIdent);
  const useAction = windowDefinitions[windowIdent] !== undefined;
  let data = [];
  try {
    if (useAction) {
      console.log("service", "fetchRows", "action not implemented");
    } else {
      const resp = await select(
        dataSetIdent,
        filters !== null
          ? filters
          : globalState[windowIdent][dataSetIdent]["filter"]
      );

      data = resp.data ? resp.data : [];
    }
  } catch (error) {
    console.log("state", "fetchData", error);
  }
  setRows(windowIdent, dataSetIdent, data);
}

function setRows(windowIdent, dataSetIdent, rows) {
  createBlankRecord(windowIdent, dataSetIdent);
  const uniqueRows = rows.flatMap((row) => {
    return {
      ...row,
      _uuid: crypto.randomUUID(),
    };
  });

  globalState[windowIdent][dataSetIdent]["rows"] = uniqueRows;
  globalState[windowIdent][dataSetIdent]["focusedRow"] =
    rows.length > 0 ? 0 : null;
}

function setActiveRow(windowIdent, dataSetIdent, index) {
  createBlankRecord(windowIdent, dataSetIdent);

  globalState[windowIdent][dataSetIdent]["focusedRow"] = index;
}

function getActiveRow(windowIdent, dataSetIdent) {
  const windowData = globalState?.[windowIdent]?.[dataSetIdent];
  if (!windowData) return null;

  const rows = windowData.rows;
  const focusedRowIndex = windowData.focusedRow;

  if (!rows || focusedRowIndex == null || !rows[focusedRowIndex]) {
    return null;
  }

  return rows[focusedRowIndex];
}

function setValue(windowIdent, dataSetIdent, source, field, value = null) {
  createBlankRecord(windowIdent, dataSetIdent);
  if (
    globalState[windowIdent][dataSetIdent]["focusedRow"] == null &&
    source == "rows"
  )
    return;

  if (source == "rows")
    globalState[windowIdent][dataSetIdent]["rows"][
      globalState[windowIdent][dataSetIdent]["focusedRow"]
    ][field] = value;

  if (source == "filter")
    globalState[windowIdent][dataSetIdent]["filter"] = field;
}

function getValue(windowIdent, dataSetIdent, source, field) {
  createBlankRecord(windowIdent, dataSetIdent);
  if (globalState[windowIdent][dataSetIdent]["focusedRow"] == null) return;

  if (source == "rows")
    return globalState[windowIdent][dataSetIdent]["rows"][
      globalState[windowIdent][dataSetIdent]["focusedRow"]
    ][field];

  if (source == "filter")
    return globalState[windowIdent][dataSetIdent]["filter"];

  return null;
}

function getRows(windowIdent, dataSetIdent) {
  createBlankRecord(windowIdent, dataSetIdent);
  return globalState[windowIdent][dataSetIdent]["rows"];
}

function printGlobalState() {
  console.log("globalState", globalState);
}

export {
  printGlobalState,
  setRows,
  setValue,
  getRows,
  getValue,
  fetchRows,
  setActiveRow,
  getActiveRow,
};
