import axios from "axios";

const createCourse = async (courseData) => {
  try {
    const response = await axios.post(
      "http://localhost:3001/createcourse",
      courseData,
      { withCredentials: true }
    );
    return response.data; // Return the response data from the API call
  } catch (error) {
    throw error; // Throw the error if the API call fails
  }
};

const useDeleteCourse = () => {
  const deleteCourse = async (courseId) => {
    try {
      const response = await axios.delete(
        `http://localhost:3001/api/courses/${courseId}`,
        {
          withCredentials: true,
        }
      );
      return response; // This will be an HTTP response object
    } catch (error) {
      throw error; // Rethrow the error to be handled by the caller
    }
  };

  return deleteCourse;
};

const selectActiveCourse = async (userId) => {
  try {
    const response = await axios.get(
      "http://localhost:3001/selectactivecourse",
      {
        headers: {
          userId: userId,
        },
        withCredentials: true,
      }
    );
    console.log("response from active courses api", response);
    return response;
  } catch (error) {
    throw error;
  }
};

const allCourses = async (userId) => {
  try {
    const response = await axios.get(`http://localhost:3001/allcourses`, {
      headers: {
        userId: userId,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createSession = async (sessionData) => {
  try {
    const response = await axios.post(
      "http://localhost:3001/createsession",
      sessionData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteSession = async (sessionId, onSuccess, onError) => {
  try {
    const response = await fetch("http://localhost:3001/deletesession", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: sessionId }),
    });

    if (response.ok) {
      console.log("Session deleted successfully");
      onSuccess("Session deleted successfully");
    } else {
      console.error("Failed to delete session");
      onError("Failed to delete session");
    }
  } catch (error) {
    console.error("Error deleting session:", error);
    onError("Error deleting session");
  }
};

const fetchParticipationRates = async (courseId) => {
  try {
    const response = await axios.get(
      `http://localhost:3001/participations/${courseId}`,
      {
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

const createTopic = async (topicData) => {
  try {
    const response = await axios.post(
      "http://localhost:3001/addtopic",
      topicData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getTopics = async () => {
  try {
    const response = await axios.get("http://localhost:3001/api/topics", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteTopic = async (topicId) => {
  try {
    const response = await axios.delete(
      `http://localhost:3001/api/topics/${topicId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const useAddStudentsToCourse = () => {
  const addStudents = async (courseId, studentsData) => {
    try {
      const response = await axios.post("http://localhost:3001/addstudents", {
        courseId,
        studentsToAdd: studentsData,
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  return addStudents;
};

const getUsers = async () => {
  try {
    const response = await axios.get("http://localhost:3001/api/users", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const addTeacherToCourse = async (courseId, userId) => {
  try {
    const response = await axios.post(
      "http://localhost:3001/addTeacherToCourse",
      {
        courseId,
        userId,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const uploadStudentsFile = async (courseId, file) => {
  const formData = new FormData();
  formData.append("studentfile", file);
  formData.append("courseId", courseId);

  try {
    const response = await axios.post(
      "http://localhost:3001/uploadstudents",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      }
    );

    // Use the detailed message from the backend response
    return {
      success: response.data.newStudentsAdded,
      message: response.data.message,
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      "Failed to upload students. Please try again.";
    throw new Error(errorMessage);
  }
};

// Add a topic to a course
const addTopicToCourse = async (courseId, topicName) => {
  try {
    const response = await axios.post(
      `http://localhost:3001/api/courses/${courseId}/topics`,
      { topicName },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a topic from a course
const deleteTopicFromCourse = async (courseId, topicName) => {
  try {
    const response = await axios.delete(
      `http://localhost:3001/api/courses/${courseId}/topics`,
      { data: { topicName } }, // Axios DELETE with body
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const submitGdprConsent = async (studentNumber, gdprConsent, userId) => {
  try {
    const response = await axios.post(
      "http://localhost:3001/api/students/updategdpr",
      { studentNumber, gdprConsent, userId },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deactiveCourse = async (courseId) => {
  try {
    const response = await axios.post(
      "http://localhost:3001/deactivatecourse",
      { courseId },
      { withCredentials: true }
    );

    console.log("vastaus hookissa ", response.data);
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

export {
  createCourse,
  useDeleteCourse,
  selectActiveCourse,
  useAddStudentsToCourse,
  createSession,
  fetchParticipationRates,
  createTopic,
  getTopics,
  addTopicToCourse,
  deleteTopicFromCourse,
  submitGdprConsent,
  deleteTopic,
  getUsers,
  addTeacherToCourse,
  uploadStudentsFile,
  deleteSession,
  deactiveCourse,
  allCourses,
  searchRealization,
};
