import { useState } from "react";

export const StudentsOwnParticipations = () => {
  const [studentNumber, setStudentNumber] = useState("");
  const [participationData, setParticipationData] = useState(null);

  const fetchParticipationData = async () => {
    try {
      const response = await fetch(
        `http://localhost:3002/api/participations/${studentNumber}`
      );
      const data = await response.json();
      setParticipationData(data);
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
    <>
      <div className="flex flex-col justify-center mt-8">
        <div className="max-w-4xl w-full place-self-center">
          <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
                Enter your student number:
              </label>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="Enter Student Number"
                className="border border-gray-300 p-3 rounded-lg block w-full mb-4 font-open-sans"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={fetchParticipationData}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-700 text-white rounded-lg  transition-colors font-roboto-slab">
                Show Participation Rates
              </button>
            </div>
          </div>
        </div>
        {participationData && <ParticipationTable data={participationData} />}
      </div>
    </>
  );
};

export default StudentsOwnParticipations;
