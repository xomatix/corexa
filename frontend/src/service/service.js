import globals from '../../globals.json' with { type: 'json' };

export function baseApiUrl() {
    return globals["baseApiUrl"]
}

export async function select(collection, filter, expand) {
  const payload = {
    action: "select",
    session_id: sessionStorage.getItem("sessionId"),
    collection: collection,
    filter: filter,
    expand:expand
  };

  const API_ENDPOINT = baseApiUrl();

  console.log("Sending payload to API:", JSON.stringify(payload, null, 2));

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
    console.log("API Success:", result);
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
    session_id: sessionStorage.getItem("sessionId"),
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