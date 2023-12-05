import React, { useState, useEffect } from "react";
import { selectActiveCourse, deactiveCourse } from "../Hooks/ApiHooks";

const userId = localStorage.getItem("userid");

const DeactiveCourse = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    isError: false,
  });

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

  const handleDeactivation = async () => {
    if (!window.confirm("Are you sure you want to make this course unactive?"))
      return;

    try {
      const response = await deactiveCourse(selectedCourse);
      console.log("Response from server:", response);

      if (response && response._id) {
        // Assuming that if the response contains _id, it was successful
        setCourses(courses.filter((course) => course._id !== selectedCourse));
        setSelectedCourse("");
        setAlert({
          show: true,
          message: "Course deactivated successfully.",
          isError: false,
        });
      } else {
        setAlert({
          show: true,
          message: "Failed to deactivate the course. Please try again.",
          isError: true,
        });
      }
    } catch (error) {
      console.error("Error deactivating course:", error);
      setAlert({
        show: true,
        message:
          "An error occurred while deactivating the course. Please try again.",
        isError: true,
      });
    }
  };

  return (
    <div className="min-h-screen w-full items-center flex flex-col px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center font-medium text-xl mb-4 font-roboto-slab">
          Course Deactivation
        </div>
        <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
              Select Course
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
          </div>

          <button
            onClick={handleDeactivation}
            disabled={!selectedCourse}
            className="w-full bg-blue-800 hover:bg-blue-700 text-white p-2 rounded-lg py-3 px-4 shadow-lg focus:outline-none focus:ring focus:border-red-700">
            Make this course unactive
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

export default DeactiveCourse;
