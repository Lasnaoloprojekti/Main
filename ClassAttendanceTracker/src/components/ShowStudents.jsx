import React, { useState, useEffect } from "react";
import axios from "axios";

const ShowStudents = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState([]);
  const userId = localStorage.getItem("userid");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/selectactivecourse`, 
          { headers: { userId: userId } }
        );
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseChange = async (event) => {
    setSelectedCourse(event.target.value);
    const courseId = event.target.value;
    try {
      const response = await axios.get(`http://localhost:3001/getstudentsbycourse/${courseId}`);
      setStudents(response.data.students);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center font-medium text-xl mb-4 font-roboto-slab">
          Show Students
        </div>
        <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              className="border border-gray-300 p-3 rounded-lg block w-full mb-4">
              <option value="" disabled>
                Select Course
              </option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            {students.map((student, index) => (
              <div key={index} className="mb-2">
                {student.firstName} {student.lastName} ({student.studentNumber})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowStudents;
