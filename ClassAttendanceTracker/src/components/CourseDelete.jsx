import React, { useState, useEffect } from "react";
import { selectActiveCourse, useDeleteCourse } from "../Hooks/ApiHooks";

const userId = localStorage.getItem("userid");

const CourseDelete = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    isError: false,
  });
  const deleteCourse = useDeleteCourse();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await selectActiveCourse(userId);
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setAlert({
          show: true,
          message: "Failed to fetch courses",
          isError: true,
        });
      }
    };

    fetchCourses();
  }, []);

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await deleteCourse(selectedCourse);
      if (response.status === 200) {
        setCourses(courses.filter((course) => course._id !== selectedCourse));
        setSelectedCourse("");
        setAlert({
          show: true,
          message: "Course deleted successfully.",
          isError: false,
        });
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      setAlert({
        show: true,
        message: "Failed to delete the course. Please try again.",
        isError: true,
      });
    }
  };

  return (
    <div className="min-h-screen w-full items-center flex flex-col px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center font-medium text-xl mb-4 font-roboto-slab">
          Delete Course
        </div>
        <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
              Select Course
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

          <button
            onClick={handleDelete}
            disabled={!selectedCourse}
            className="w-full bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg py-3 px-4 shadow-lg focus:outline-none focus:ring focus:border-red-700">
            Delete Course
          </button>
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

// Author: Adam Ahmethanov
// Date: November 9, 2023

export default CourseDelete;
