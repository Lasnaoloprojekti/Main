import React, { useState, useEffect } from "react";

export const StudentDashboard = () => {
  const [studentNumber] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [participationData, setParticipationData] = useState(null);

  // Combine the useEffect for time update from Registration

  const handleRegistration = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    try {
      const response = await fetch("http://localhost:3001/registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentNumber }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Registration successful:", data);

        setRegisterMessage("Registration successful");
      } else {
        console.error("Registration failed:", data);
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setRegisterMessage(
        "This student number is either not in the course or you may have already enrolled. Ask help from your teacher."
      );
    }
  };
  const fetchParticipationData = async (studentNumber) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/participation/${studentNumber}`
      );
      setParticipationData(response.data);
    } catch (error) {
      console.error("Error fetching participation data:", error);
      // Handle error
    }
  };

  const ParticipationTable = ({ data }) => {
    return (
      <table className="max-w-4xl w-full table-auto mt-7 place-self-center">
        <thead className="bg-blue-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-open-sans">
              Course
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-open-sans">
              Topic
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider font-open-sans">
              Your Participation Rate
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-700">
          {data.map((courseData, courseIndex) =>
            Object.entries(courseData.participation).map(
              ([topic, rate], topicIndex) => (
                <tr key={courseIndex + "-" + topicIndex}>
                  {topicIndex === 0 && (
                    <td
                      className="px-6 py-4 whitespace-nowrap font-roboto-slab"
                      rowSpan={Object.keys(courseData.participation).length}>
                      {courseData.courseName}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap font-roboto-slab">
                    {topic}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{rate}</td>
                </tr>
              )
            )
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div className="flex flex-col justify-center mt-8">
      <div className="max-w-4xl w-full place-self-center bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-600">
            Enter your student number:
          </label>
        </div>
        <div className="flex flex-col justify-between">
          <button
            onClick={fetchParticipationData}
            className="px-4 mb-4 py-2 bg-blue-900 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Show Participation Rates
          </button>
          <button
            onClick={handleRegistration}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Enroll
          </button>
        </div>
        <p
          className={`mt-6 underline ${
            registerMessage.includes("successful")
              ? "text-green-600"
              : "text-red-600"
          }`}>
          {registerMessage}
        </p>
      </div>
      {participationData && <ParticipationTable data={participationData} />}
    </div>
  );
};

export default StudentDashboard;
