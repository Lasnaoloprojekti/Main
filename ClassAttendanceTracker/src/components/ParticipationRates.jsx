// ParticipationRates.jsx
import React, { useState, useEffect } from "react";
import { fetchParticipationRates, allCourses } from "../Hooks/ApiHooks";

const userId = localStorage.getItem("userid");

export const ParticipationRates = () => {
  const [activeCourses, setActiveCourses] = useState([]);
  const [inactiveCourses, setInactiveCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [participationData, setParticipationData] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await allCourses(userId);
        console.log("haetaan kaikki kurssit ", response);
        const { active, inactive } = response;
        setActiveCourses(active);
        setInactiveCourses(inactive);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
    setParticipationData([]); // Clear previous participation data
  };

  const getParticipationRates = async () => {
    if (!selectedCourse) {
      alert("Please select a course");
      return;
    }

    try {
      const response = await fetchParticipationRates(selectedCourse);
      setParticipationData(response.data);
    } catch (error) {
      console.error("Error fetching participation rates:", error);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedCourse) {
      alert("Please select a course to download its report");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/download/attendance/pdf/${selectedCourse}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Create a Blob from the PDF Stream
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `attendance_report_${selectedCourse}.pdf`;
      link.click();
      window.URL.revokeObjectURL(downloadUrl); // Clean up the URL
    } catch (error) {
      console.error("Error downloading the PDF:", error);
      alert("Error downloading PDF");
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedCourse) {
      alert("Please select a course to download its report");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/download/attendance/excel/${selectedCourse}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Create a Blob from the PDF Stream
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `attendance_report_${selectedCourse}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(downloadUrl); // Clean up the URL
    } catch (error) {
      console.error("Error downloading the Excel:", error);
      alert("Error downloading Excel");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center text-xl mb-4 font-roboto-slab">
          Select a Course
        </div>
        <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
              Select a course:
            </label>
            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              className="border border-gray-300 p-3 rounded-lg block w-full mb-4 font-open-sans">
              {selectedCourse === "" && (
                <option value="" disabled>
                  Select Course
                </option>
              )}
              {activeCourses.length > 0 && (
                <optgroup label="Active Courses">
                  {activeCourses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name} / {course.groupName}{" "}
                      {/* Concatenating course name and group name */}
                    </option>
                  ))}
                </optgroup>
              )}
              {inactiveCourses.length > 0 && (
                <optgroup label="Unactive Courses">
                  {inactiveCourses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name} / {course.groupName}{" "}
                      {/* Concatenating course name and group name */}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={getParticipationRates}
              className="px-4 w-full p-3 bg-blue-900 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
              Get Participations
            </button>

            <button onClick={handleDownloadExcel}>Download Excel</button>
            <button onClick={handleDownloadPdf}>Download Pdf</button>
          </div>
        </div>
      </div>

      {participationData.length > 0 && (
        <div className="max-w-4xl w-full mt-6">
          <table className="w-full text-sm text-left text-gray-500 font-roboto-slab">
            <thead className="text-xs text-white uppercase bg-blue-900">
              <tr>
                <th scope="col" className="px-6 py-3 ">
                  Lastname
                </th>
                <th scope="col" className="px-6 py-3">
                  Firstname
                </th>
                {/* Dynamically add headers for topics */}
                {Object.keys(participationData[0].participation).map(
                  (topic) => (
                    <th key={topic} scope="col" className="px-6 py-3">
                      {topic}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {participationData.map((student, index) => (
                <tr key={index} className="bg-white border-b font-open-sans">
                  <td className="px-6 py-4">{student.lastName}</td>
                  <td className="px-6 py-4">{student.firstName}</td>
                  {Object.entries(student.participation).map(
                    ([topic, rate]) => (
                      <td key={topic} className="px-6 py-4">
                        {rate}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ParticipationRates;
