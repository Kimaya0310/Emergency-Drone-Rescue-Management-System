const API_BASE_URL = "http://127.0.0.1:5000";

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Something went wrong.");
  }

  return data;
}

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return handleResponse(response);
}

export async function generateFlightPath(boundary, rows = 6, columns = 8) {
  const response = await fetch(`${API_BASE_URL}/api/mission/generate-path`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ boundary, rows, columns }),
  });

  return handleResponse(response);
}

export async function detectSurvivors(image, latitude, longitude) {
  const formData = new FormData();

  formData.append("image", image);
  formData.append("latitude", latitude);
  formData.append("longitude", longitude);

  const response = await fetch(`${API_BASE_URL}/api/detection/detect`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}