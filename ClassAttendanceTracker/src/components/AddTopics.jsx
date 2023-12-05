import React, { useState, useEffect } from "react";
import {
  createTopic,
  deleteTopic,
  getTopics,
  selectActiveCourse,
  addTopicToCourse,
  deleteTopicFromCourse,
} from "../Hooks/ApiHooks";

const AddTopics = () => {
  const [topics, setTopics] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    isError: false,
  });

  useEffect(() => {
    fetchTopicsAndCourses();
  }, []);

  const fetchTopicsAndCourses = async () => {
    try {
      const fetchedTopics = await getTopics();
      setTopics(fetchedTopics);
      const coursesResponse = await selectActiveCourse(
        localStorage.getItem("userid")
      );
      setCourses(coursesResponse.data);
    } catch (error) {
      console.error("Error fetching topics and courses:", error);
      setAlert({
        show: true,
        message: "Failed to fetch topics or courses",
        isError: true,
      });
    }
  };

  const handleNewTopicChange = (e) => {
    setNewTopicName(e.target.value);
  };

  const handleTopicSelectChange = (e) => {
    setSelectedTopic(e.target.value);
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };

  const handleAddTopicToCourse = async () => {
    if (!selectedCourse || !selectedTopic) {
      setAlert({
        show: true,
        message: "Please select both a course and a topic.",
        isError: true,
      });
      return;
    }
    const course = courses.find((c) => c._id === selectedCourse);
    if (course.topics.includes(selectedTopic)) {
      setAlert({
        show: true,
        message: "Topic already exists in the course.",
        isError: true,
      });
      return;
    }
    try {
      await addTopicToCourse(selectedCourse, selectedTopic);
      fetchTopicsAndCourses();
      setAlert({
        show: true,
        message: "Topic added to course successfully!",
        isError: false,
      });
    } catch (error) {
      console.error("Error adding topic to course:", error);
      setAlert({
        show: true,
        message: "Failed to add topic to course. Please try again.",
        isError: true,
      });
    }
  };

  const handleDeleteTopicFromCourse = async () => {
    if (!selectedCourse || !selectedTopic) {
      setAlert({
        show: true,
        message: "Please select both a course and a topic.",
        isError: true,
      });
      return;
    }
    const course = courses.find((c) => c._id === selectedCourse);
    if (!course.topics.includes(selectedTopic)) {
      setAlert({
        show: true,
        message: "This topic is not in the selected course.",
        isError: true,
      });
      return;
    }
    try {
      await deleteTopicFromCourse(selectedCourse, selectedTopic);
      // Update the local state to reflect the change
      setCourses((prevCourses) =>
        prevCourses.map((c) =>
          c._id === selectedCourse
            ? { ...c, topics: c.topics.filter((t) => t !== selectedTopic) }
            : c
        )
      );
      setSelectedTopic(""); // Reset selected topic
      setAlert({
        show: true,
        message: "Topic deleted from course successfully!",
        isError: false,
      });
    } catch (error) {
      console.error("Error deleting topic from course:", error);
      setAlert({
        show: true,
        message: "Failed to delete topic from course. Please try again.",
        isError: true,
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!newTopicName) {
      setAlert({
        show: true,
        message: "Please enter a topic name.",
        isError: true,
      });
      return;
    }
    try {
      await createTopic({ name: newTopicName });
      fetchTopicsAndCourses();
      setNewTopicName("");
      setAlert({
        show: true,
        message: "Topic added successfully!",
        isError: false,
      });
    } catch (error) {
      console.error("Error adding topic:", error);
      setAlert({
        show: true,
        message: "Failed to add topic. Please try again.",
        isError: true,
      });
    }
  };

  const handleDeleteTopic = async () => {
    if (!selectedTopic) {
      setAlert({
        show: true,
        message: "Please select a topic to delete.",
        isError: true,
      });
      return;
    }
    try {
      await deleteTopic(selectedTopic);
      fetchTopicsAndCourses();
      setSelectedTopic("");
      setAlert({
        show: true,
        message: "Topic deleted successfully!",
        isError: false,
      });
    } catch (error) {
      console.error("Error deleting topic:", error);
      setAlert({
        show: true,
        message: "Failed to delete topic. Please try again.",
        isError: true,
      });
    }
  };

  return (
    <div className="min-h-screen w-full items-center flex flex-col px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center font-medium text-xl mb-4">
          Topic Management
        </div>
        <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="newTopicName"
                className="block mb-2 text-sm font-medium text-gray-600">
                New Topic Name:
              </label>
              <input
                type="text"
                id="newTopicName"
                value={newTopicName}
                onChange={handleNewTopicChange}
                className="border border-gray-300 p-3 rounded-lg block w-full"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
              Add Topic
            </button>
          </form>

          <div className="mt-5">
            <label
              htmlFor="courseSelector"
              className="block mb-2 text-sm font-medium text-gray-600">
              Select a course:
            </label>
            <select
              id="courseSelector"
              value={selectedCourse}
              onChange={handleCourseChange}
              className="border font-open-sans border-gray-300 p-3 rounded-lg block w-full mb-4">
              <option value="" disabled>
                Select Course
              </option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name} / {course.groupName}{" "}
                  {/* Concatenating name and groupName */}
                </option>
              ))}
            </select>

            <label
              htmlFor="topicSelect"
              className="block mb-2 text-sm font-medium text-gray-600">
              Select a Topic to Add/Delete:
            </label>
            <select
              id="topicSelect"
              value={selectedTopic}
              onChange={handleTopicSelectChange}
              className="border border-gray-300 p-3 rounded-lg block w-full mb-4">
              <option value="">Select Topic</option>
              {topics.map((topic) => (
                <option key={topic._id} value={topic.name}>
                  {topic.name}
                </option>
              ))}
            </select>
            <div className="flex space-x-2">
              <button
                onClick={handleAddTopicToCourse}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">
                Add to Course
              </button>
              <button
                onClick={handleDeleteTopicFromCourse}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors">
                Delete from Course
              </button>
            </div>
          </div>

          {alert.show && (
            <div
              className={`mt-4 p-4 rounded-md transition-all ${
                alert.isError
                  ? "bg-red-100 border border-red-400 text-red-800"
                  : "bg-green-100 border border-green-400 text-green-800"
              }`}>
              <p>{alert.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTopics;
