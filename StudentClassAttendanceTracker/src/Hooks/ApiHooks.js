import axios from "axios";

const fetchParticipationRates = async (courseId) => {
  try {
    const response = await axios.get(
      `http://localhost:3002/participations/${courseId}`,
      {
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

const submitGdprConsent = async (studentNumber, gdprConsent, userId) => {
  try {
    const response = await axios.post(
      "http://localhost:3002/api/students/updategdpr",
      { studentNumber, gdprConsent, userId },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const searchRealization = async (codes) => {
  const body = JSON.stringify({ codes });
  const url = "/r1/realization/search";

  const apiKey = "uXIj6PjeH9oUHC6IQ7qG";
  const authString = btoa(apiKey + ":");

  try {
    const response = await axios.post(url, body, {
      headers: {
        Authorization: "Basic " + authString,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { fetchParticipationRates, submitGdprConsent, searchRealization };
