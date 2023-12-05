import React, { useState, useEffect } from "react";
import {
  selectActiveCourse,
  useAddStudentsToCourse,
  uploadStudentsFile,
} from "../Hooks/ApiHooks";

const userId = localStorage.getItem("userid");

const AddStudents = () => {
  const [file, setFile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [studentData, setStudentData] = useState("");
  const [isAdding, setIsAdding] = useState(false); // New state to track adding process
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    isError: false,
  });

  const addStudents = useAddStudentsToCourse();

  useEffect(() => {
    // Fetch courses on component mount
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

  const handleInputChange = (event) => {
    setStudentData(event.target.value);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const validateStudentData = (data) => {
    const validFormatRegex = /^[A-Za-z]+;[A-Za-z]+;\d+;$/;
    return data.split("\n").every((line) => validFormatRegex.test(line));
  };

  const setFileNull = () => {
    setFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsAdding(true);
    setAlert({ show: false, message: "", isError: false });

    if (!selectedCourse) {
      setAlert({
        show: true,
        message: "Please select a course.",
        isError: true,
      });
      setIsAdding(false);
      return;
    }

    // Handle text area data submission
    if (studentData && validateStudentData(studentData)) {
      try {
        const studentDataArray = studentData.split("\n").map((line) => {
          const [lastName, firstName, studentNumber] = line.split(";");
          return { lastName, firstName, studentNumber };
        });

        const addResult = await addStudents(selectedCourse, studentDataArray);
        setAlert({
          show: true,
          message: addResult.data.message,
          isError: false,
        });
      } catch (error) {
        setAlert({
          show: true,
          message: "Student with provided student number already exists!",
          isError: true,
        });
      }
    }

    // Handle file upload submission
    if (file) {
      try {
        const uploadResult = await uploadStudentsFile(selectedCourse, file);

        console.log(uploadResult);

        setAlert({ show: true, message: uploadResult.message, isError: false });
      } catch (error) {
        setAlert({ show: true, message: error.message, isError: true });
      }
      setFileNull();
    }

    setIsAdding(false);
  };

  return (
    <div className="min-h-screen w-full items-center flex flex-col px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center font-medium text-xl mb-4 font-roboto-slab">
          Add Students to course
        </div>
        <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="courseSelector"
                className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
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
            </div>
            <div className="mb-5">
              <label
                htmlFor="studentData"
                className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
                Enter student (LastName;FirstName;StudentNumber; format):
              </label>
              <textarea
                id="studentData"
                rows="6"
                className="border border-gray-300 p-3 rounded-lg block w-full font-open-sans"
                value={studentData}
                onChange={handleInputChange}
                placeholder="Doe;John;123456;"
              />
              <label
                htmlFor="studentData"
                className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
                Upload a file with student data
              </label>
              <input
                id="studentData"
                type="file"
                className="border border-gray-300 p-3 rounded-lg block w-full font-open-sans cursor-pointer file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
              "
                onChange={handleFileChange}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="submit"
                className="px-4 w-full p-3 bg-blue-900 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                Add Students
              </button>
            </div>
          </form>
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

export default AddStudents;

// Author: Adam Ahmethanov
// Date: November 7, 2023
