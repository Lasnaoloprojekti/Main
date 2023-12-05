import React, { useState, useEffect } from "react";
import logo from "../assets/metropolia_s_orange.png";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export const Registration = () => {
  // State variables
  const [currentDay, setCurrentDay] = useState(
    new Date().toLocaleString("en-En", { weekday: "long" })
  );
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("fi-FI")
  );
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toLocaleString("en-En", { month: "long" })
  );
  const [studentNumber, setStudentNumber] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");

  useEffect(() => {
    // Update the time every second
    const interval = setInterval(() => {
      setCurrentDay(new Date().toLocaleString("en-En", { weekday: "long" }));
      setCurrentTime(new Date().toLocaleTimeString("fi-FI"));
      setCurrentMonth(new Date().toLocaleString("en-En", { month: "long" }));
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, []);

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

  return (
    <>
      <section className="flex flex-col w-100  items-center">
        <form
          className="flex flex-col h-[100vh] w-1/2 "
          onSubmit={handleRegistration}>
          <div className="  h-min mt-32 flex flex-col justify-center text-black p-2   ">
            <label className="block text-black text-sm  font-semibold mb-2 font-roboto-slab">
              Class registration
            </label>
            <input
              className="text-center p-5 rounded-md border-stone-900 w-full border text-orange-600 font-open-sans"
              type="text"
              placeholder="Enter your Student number here"
              onChange={(e) => setStudentNumber(e.target.value)}
            />

            <button className=" bg-orange-600 p-1 rounded-md text-white font-roboto-slab mt-3 hover:bg-red-800 ">
              Enroll
            </button>
            <label className="block text-black text-sm mt-3 mb-2 font-open-sans">
              if registration doesnt work ask your teacher to add you in class
            </label>
          </div>
          <p
            className={`self-center w-2/3 mt-6 underline ${registerMessage.includes("successful")
              ? "text-green-600"
              : "text-red-600"
              }`}>
            {registerMessage}
          </p>
        </form>
      </section>
    </>
  );
};
