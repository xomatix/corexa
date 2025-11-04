import globals from '../../globals.json' with { type: 'json' };

export function baseApiUrl() {
    return globals["baseApiUrl"]
}

export async function select(collection, filter, expand, order = "", limit = 10, offset = 0) {
  const payload = {
    action: "select",
    session_id: getSessionToken(),
    collection: collection,
    filter: filter,
    expand:expand,
    order: order,
    pagination: {
      limit: limit,
      offset: offset,
    }
  };

  const API_ENDPOINT = baseApiUrl();

  // console.log("Sending payload to API:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(API_ENDPOINT + "/api/select", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await response.json();
    }

    const result = await response.json();
    // console.log("API Success:", result);
    if (result.data === null) 
      result.data = [];
    
    return result;
  } catch (error) {
    console.error("Failed to fetch collection:", error);

    throw error;
  }
}

/**
 * Saves data to a specified collection by performing an action via API.
 *
 * @function
 * @param {string} collection - The name of the collection to operate on.
 * @param {"insert"|"update"|"delete"} action - The action to perform on the collection. 
 * @param {Object} data - The data to be sent with the action.
 * @returns {Promise<Object>} The result returned from the API.
 * @throws {Object} Throws an error object if the API request fails.
 * @docs
 */
export async function save(collection, action, data) {
  const payload = {
    action: action,
    session_id: getSessionToken(),
    collection: collection,
    data: data,
  };

  const API_ENDPOINT = baseApiUrl();

  console.log("Sending payload to API:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(API_ENDPOINT + "/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await response.json();
    }

    const result = await response.json();
    console.log("API Success:", result);
    return result;
  } catch (error) {
    console.error("Failed to fetch collection:", error);

    throw error;
  }
}

/**
 * Saves data to a specified collection by performing an action via API.
 *
 * @function
 * @param {string} selector - The name of the selector to operate on.
 * @param {Object} data - The data to be sent with the action.
 * @param {Number} limit - The amount of data on page.
 * @param {Number} offset - Page number starting from 0.
 * @param {string} order - Order of query data.
 * @returns {Promise<Object>} The result returned from the API.
 * @throws {Object} Throws an error object if the API request fails.
 * @docs
 */
export async function invokeSelect(selector, data = {}, limit = 10, offset = 0, order = "") {
  const payload = {
    selector: selector,
    session_id: getSessionToken(),
    order: order,
    data: data,
    pagination: {
      limit: limit,
      offset: offset
    }
  };

  

  const API_ENDPOINT = baseApiUrl();

  console.log("Sending payload to API:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(API_ENDPOINT + "/api/invokeSelect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await response.json();
    }

    const result = await response.json();
    console.log("API Success:", result);
    return result;
  } catch (error) {
    console.error("Failed to fetch collection:", error);

    throw error;
  }
}

/**
 * Saves data to a specified collection by performing an action via API.
 *
 * @function
 * @param {string} username - The username or email of the user.
 * @param {string} password - The password of the user. 
 * @returns {Promise<Object>} The result returned from the API.
 * @throws {Object} Throws an error object if the API request fails.
 * @docs
 */
export async function login(username, password) {
  const payload = {
    username: username,
    password: password
  };

  const API_ENDPOINT = baseApiUrl();

  try {
    const response = await fetch(API_ENDPOINT + "/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await response.json();
    }

    const result = await response.json();
    
    setSessionToken(result.session_id);
    return result;
  } catch (error) {
    console.error("Failed to fetch collection:", error);

    throw error;
  }
}

const sessionPermissions = {}
async function usrPermissions() {
  const session_id = getSessionToken();
  const payload = {
    session_id:session_id
  };

  const API_ENDPOINT = baseApiUrl();

  try {
    const response = await fetch(API_ENDPOINT + "/api/usrpermissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await response.json();
    }

    const result = await response.json();
    
    const sessionPermItem = {}
    result.data.forEach(element => {
      sessionPermItem[element.name] = true;
    });
    sessionPermissions[session_id] = sessionPermItem;
    
    return result;
  } catch (error) {
    console.error("Failed to fetch collection:", error);

    throw error;
  }
}

export function getSessionToken() {
  return sessionStorage.getItem("sessionId")
}
export function setSessionToken(token) {
  if (token == null) 
    sessionStorage.clear()
  
  else sessionStorage.setItem("sessionId", token)
}

/**
 * Saves data to a specified collection by performing an action via API.
 *
 * @function
 * @param {string} permissionName - The username or email of the user.
 * @returns {Promise<Boolean>} returns if user has permission.
 * @throws {Object} Throws an error object if the API request fails.
 * @docs
 */
export async function usrPermission(permissionName) {
  const session_id = getSessionToken()
  if (sessionPermissions[session_id] == null || sessionPermissions[session_id] == undefined)
    await usrPermissions();    
  
  return sessionPermissions[session_id][permissionName] || false
}