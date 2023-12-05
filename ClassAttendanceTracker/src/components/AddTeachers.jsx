// AddTeacherToCourse.jsx

import React, { useState, useEffect } from "react";
import {
  getUsers,
  addTeacherToCourse,
  selectActiveCourse,
} from "../Hooks/ApiHooks";

const userId = localStorage.getItem("userid");

const AddTeacherToCourse = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedUsers = await getUsers();
        const normalizedUsers = fetchedUsers.map((user) => ({
          ...user,
          firstName: user.firstName || user.firstname,
          lastName: user.lastName || user.lastname,
          _id: user._id,
        }));
        setUsers(normalizedUsers);
        console.log("Users fetched:", normalizedUsers);

        const userId = localStorage.getItem("userid");

        const fetchedCourses = await selectActiveCourse(userId);
        setCourses(fetchedCourses.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await addTeacherToCourse(selectedCourse, selectedUser);
      setSuccessMessage("Teacher added successfully to the course");
    } catch (error) {
      console.error("Error adding teacher:", error);
      setErrorMessage("Failed to add teacher. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full items-center flex flex-col px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center font-medium text-xl mb-4 font-roboto-slab">
          Add Teacher To Course
        </div>
        <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
                Select a Course:
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="border font-open-sans border-gray-300 p-3 rounded-lg block w-full mb-4">
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name} / {course.groupName}{" "}
                    {/* Concatenating course name and group name */}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
                Select a User:
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="border font-open-sans border-gray-300 p-3 rounded-lg block w-full mb-4">
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-4 w-full p-3 bg-blue-900 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
              Add Teacher to Course
            </button>
          </form>
          {successMessage && (
            <div className="mt-4 text-green-600">{successMessage}</div>
          )}
          {errorMessage && (
            <div className="mt-4 text-red-600">{errorMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTeacherToCourse;
