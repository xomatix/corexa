import { baseApiUrl } from "./service";

export async function saveCollection(data) {
  const payload = {
    action: "insert",
    collection: "collections",
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
    console.error("Failed to create collection:", error);

    throw error;
  }
}
export async function updateCollection(data) {
  const payload = {
    action: "update",
    collection: "collections",
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
    console.error("Failed to create collection:", error);

    throw error;
  }
}
export async function deleteCollection(data) {
  const payload = {
    action: "delete",
    collection: "collections",
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
    console.error("Failed to create collection:", error);

    throw error;
  }
}

export async function getCollections() {
  const API_ENDPOINT = baseApiUrl();

  // console.log("Sending payload to API:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(API_ENDPOINT + "/api/config", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await response.json();
    }

    const result = await response.json();
    console.log("API Success:", result);
    return result;
  } catch (error) {
    console.error("Failed to retrieve collections:", error);

    throw error;
  }
}
