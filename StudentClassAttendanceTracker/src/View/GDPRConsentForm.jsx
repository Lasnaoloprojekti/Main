import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentContext } from "../Context/studentContext.jsx";
import { submitGdprConsent } from "../Hooks/ApiHooks.js"; // Import the function

const GDPRConsentForm = () => {
  const [gdprConsent, setGdprConsent] = useState(false);
  const navigate = useNavigate();
  const { studentContext } = useContext(studentContext);
  const userId = localStorage.getItem("userid");

  useEffect(() => {
    // Check if GDPR consent has already been given and redirect if true
    if (studentInfo.gdprConsent === true) {
      navigate("/studenthome");
    }
  }, [studentInfo.gdprConsent, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!gdprConsent) {
      alert("You must consent to the data policy to continue.");
      return;
    }

    try {
      // Submit the GDPR consent
      await submitGdprConsent(studentInfo.studentNumber, gdprConsent, userId);
      navigate("/studenthome");
    } catch (error) {
      console.error("Failed to save GDPR consent:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl text-center mb-4">GDPR Consent Form</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="mb-6">
          <label
            htmlFor="gdprConsent"
            className="block text-gray-700 text-sm font-bold mb-2">
            I consent to Metropolia collecting and storing my personal data:
          </label>
          <input
            id="gdprConsent"
            type="checkbox"
            className="mr-2 leading-tight"
            checked={gdprConsent}
            onChange={(e) => setGdprConsent(e.target.checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default GDPRConsentForm;
