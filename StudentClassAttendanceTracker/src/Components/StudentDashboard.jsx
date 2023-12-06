import React, { useState, useEffect } from "react";
import QRscanner from "react-qr-scanner";
import SuccessGif from "../assets/registering.gif";

export const StudentDashboard = () => {
  const [studentNumber, setStudentNumber] = useState(
    localStorage.getItem("studentnumber")
  );
  const [registerMessage, setRegisterMessage] = useState("");
  const [participationData, setParticipationData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [showSuccessGif, setShowSuccessGif] = useState(false);

  const handleScanQrCode = async (data) => {
    if (data && !isProcessingScan) {
      setIsProcessingScan(true);

      try {
        const qrCodeText = data.text;
        console.log("teksti qr koodista ", qrCodeText);
        const response = await fetch(
          "http://localhost:3002/qrcoderegistration",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              studentNumber,
              qrCodeIdentifier: qrCodeText,
            }),
          }
        );

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || response.statusText);
        }

        const result = await response.json();
        setRegisterMessage(result.message);
        setShowSuccessGif(true);
        setShowScanner(false); // Close the scanner as the registration is successful
      } catch (error) {
        console.error(error);
        setRegisterMessage(error.message || "Error during registration");
      } finally {
        setIsProcessingScan(false);
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

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
    <div className="flex flex-col justify-center mt-8">
      <div className="max-w-4xl w-full place-self-center bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-600">
            Enter your student number:
          </label>
          <input
            type="text"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            placeholder="Enter Student Number"
            className="border border-gray-300 p-3 rounded-lg block w-full mb-4"
          />
        </div>
        <div className="flex flex-col justify-between items-center">
          <button
            onClick={fetchParticipationData}
            className="px-4 mb-4 py-2 bg-blue-900 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Show Participation Rates
          </button>
          <button
            className="px-4 mb-4 py-2 bg-blue-900 hover:bg-blue-700 text-white rounded-lg transition-colors"
            onClick={() => setShowScanner(!showScanner)}>
            {showScanner ? "Hide Scanner" : "Scan QR Code"}
          </button>
        </div>
        {showScanner && (
          <QRscanner
            delay={300}
            style={{ width: "100%" }}
            onError={handleError}
            onScan={handleScanQrCode}
          />
        )}
        <p
          className={`mt-6 text-center text-xl ${
            registerMessage.includes("registered")
              ? "text-green-600"
              : "text-red-600"
          }`}>
          {registerMessage}
        </p>
        {showSuccessGif && registerMessage.includes("registered") && (
          <div className="text-center mt-4 flex justify-center">
            <img
              className="justify-center h-[8rem] rounded-lg"
              src={SuccessGif}
              alt="Registration Successful"
            />
          </div>
        )}
      </div>
      {participationData && <ParticipationTable data={participationData} />}
    </div>
  );
};
export default StudentDashboard;
