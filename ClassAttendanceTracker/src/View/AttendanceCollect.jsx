import React, { useContext, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import logo from "../assets/metropolia_s_orange.png";
import { useNavigate, useParams, Link } from "react-router-dom";
import { userContext } from "../context/userContext";
import io from "socket.io-client";
import { deleteSession } from "../Hooks/ApiHooks";
import { v4 as uuid } from 'uuid';


const socket = io("http://192.168.50.82:3001");

export const WaitingPage = () => {
  const navigate = useNavigate();
  const { sessionId, courseName, topic } = useParams();
  const { userInfo, setUserInfo } = useContext(userContext);
  const [attendingStudents, setAttendingStudents] = useState([]);
  const [serverMessage, setServerMessage] = useState("");
  const [sessionClosed, setSessionClosed] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [qrCodeIdentifier, setQrCodeIdentifier] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(5);


  const handleCloseModal = () => {
    setShowModal(false);
  };

  socket.emit('joinSessionRoom', { sessionId: sessionId });

  useEffect(() => {
    const interval = setInterval(() => {
      handleNewQrCode();
    }, refreshInterval * 60000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [sessionId, refreshInterval]);

  const handleNewQrCode = () => {
    const newQrCodeIdentifier = uuid();
    setQrCodeIdentifier(newQrCodeIdentifier);

    fetch("http://localhost:3001/newsessionidentifier", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: sessionId,
        qrIdentifier: newQrCodeIdentifier,
      }),
    })
      .then((response) => {
        if (response.ok) {
          console.log("QR code identifier updated successfully");
        } else {
          console.error("Failed to update QR code identifier");
        }
      })
      .catch((error) => {
        console.error("Error updating QR code identifier:", error);
      });
  };

  useEffect(() => {
    // Generate a new QR code identifier every 5 minutes
    const interval = setInterval(() => {
      const newQrCodeIdentifier = uuid(); // Generate a new UUID
      setQrCodeIdentifier(newQrCodeIdentifier);

      // Send the new QR code identifier to the backend
      fetch("http://localhost:3001/newsessionidentifier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          qrIdentifier: newQrCodeIdentifier,
        }),
      })
        .then((response) => {
          if (response.ok) {
            console.log("QR code identifier updated successfully");
          } else {
            console.error("Failed to update QR code identifier");
          }
        })
        .catch((error) => {
          console.error("Error updating QR code identifier:", error);
        });
    }, 3000000); // 5 minutes in milliseconds

    return () => {
      clearInterval(interval); // Clean up the interval on component unmount
    };
  }, [sessionId]);

  // Modal component
  const Modal = ({ children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-5 rounded">
        {children}
      </div>
    </div>
  );

  useEffect(() => {
    // Fetch student count from the backend
    async function fetchStudentCount() {
      try {
        const response = await fetch(`http://192.168.50.82:3001/coursestudentscount/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setStudentCount(data.studentCount);
        } else {
          console.error("Failed to fetch student count");
        }
      } catch (error) {
        console.error("Error fetching student count:", error);
      }
    }

    fetchStudentCount(); // Call the fetchStudentCount function when the component mounts
  }, [sessionId]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log(`Connected to server with ID: ${socket.id}`);
    });

    socket.on("studentAdded", (newStudent) => {
      console.log("Students from the server:", newStudent);
      setAttendingStudents((prev) => [...prev, newStudent]);  // Update state with received data
      setStudentCount((prevCount) => prevCount + 1);
    });

    return () => {
      socket.off("studentAdded"); // Clean up
    };
  }, []);

  useEffect(() => {
    // Fetch enrolled students from the backend for the specific session
    async function fetchEnrolledStudents() {
      try {
        const response = await fetch(`http://192.168.50.82:3001/enrolledstudents/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setAttendingStudents(data.enrolledStudents);
          setStudentCount(data.enrolledStudents.length);
        } else {
          console.error("Failed to fetch enrolled students");
        }
      } catch (error) {
        console.error("Error fetching enrolled students:", error);
      }
    }

    fetchEnrolledStudents(); // Call the fetchEnrolledStudents function when the component mounts
  }, [sessionId]);


  const handleCloseSession = async () => {
    // Display a confirmation dialog
    const confirmClose = window.confirm("Are you sure you want to stop collecting attendances and save the changes?");

    if (confirmClose) {
      try {
        const response = await fetch("http://192.168.50.82:3001/closesession", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId: sessionId }),
        });

        if (response.ok) {
          console.log("Session closed successfully");
          // Handle successful session closure
          setServerMessage("Session closed successfully");
          setSessionClosed(true);
        } else {
          console.error("Failed to close session");
          // Handle error
          setServerMessage("Failed to close session");
        }
      } catch (error) {
        console.error("Error closing session:", error);
        setServerMessage("Error closing session");
      }
    }
  };

  const handleDeleteSession = async () => {
    try {
      await deleteSession(sessionId, (message) => {
        console.log(message);
        setServerMessage(message);
        setSessionClosed(true);
        // Close the modal or perform any other necessary actions
      }, (errorMessage) => {
        console.error(errorMessage);
        setServerMessage(errorMessage);
        // Handle the error or display an error message in your UI
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      setServerMessage("Error deleting session");
      // Handle the error or display an error message in your UI
    }
    setTimeout(() => {
      navigate("/teacherhome");
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("UserId");
    setUserInfo({
      staff: false,
      firstname: "",
      lastname: "",
    });
    navigate("/login");
  };

  return (
    <>
      {showModal && (
        <Modal>
          <h2 className=" text-3xl mb-4">Are you sure you want to start collecting participations?</h2>

          <div className=" flex justify-center ">
            <button onClick={handleCloseModal} className=" bg-green-700 hover:bg-green-950 text-2xl text-white p-7 rounded mr-2">Yes 👍</button>
            <button onClick={handleDeleteSession} className=" bg-red-800 hover:bg-red-950 text-2xl text-white p-7 rounded">No 👎</button>
          </div>
          <p className=" text-red-600 text-center mt-4">Remember that this will effect course participation rates!</p>
        </Modal>
      )}
      {" "}
      <nav className="flex justify-between items-center">
        <Link to="/teacherhome">
          <img className="h-[18mm] m-4" src={logo} alt="Logo" />
        </Link>{" "}
        <ul className="flex items-center">
          <li className="text-2xl ml-2 font-roboto-slab">
            Welcome! {userInfo.firstname} {userInfo.lastname}
          </li>
          <button
            onClick={handleLogout}
            className="text-white bg-orange-600 rounded-lg p-4 mx-8 font-roboto-slab">
            Logout
          </button>
        </ul>
      </nav>

      <section className=" flex-row h-[80vh] mt-5 flex ">
        <div className=" w-1/2 flex items-center flex-col">
          <h1 className=" font-roboto-slab text-3xl mb-5 font-bold tracking-wide">
            {decodeURIComponent(courseName)}
          </h1>
          <h1 className=" font-roboto-slab text-xl mb-4 font-semibold tracking-wider">
            {decodeURIComponent(topic)}
          </h1>
          <QRCode className="" value={qrCodeIdentifier} />
          <div className=" flex-col flex gap-2 mt-5">
            <div>
              <label className="font-open-sans text-sm mt-5 mb-1">QR-Code refreshesh in minutes</label>
              <input
                type="number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg block "
                placeholder="Enter refresh interval (in minutes)"
              />
            </div>
            <button
              className=" text-sm text-blue-800"
              onClick={handleNewQrCode}>
              Click here update interval
            </button>
          </div>
          <button
            className=" py-2 px-6 bg-orange-600 rounded-md text-white font-roboto-slab mt-5 hover:bg-red-800 "
            onClick={handleCloseSession}>
            Deactive collecting attendances
          </button>
          <p className=" text-base mt-4 text-green-500">{serverMessage}</p>
        </div>
        <div className=" w-1/2 h-[80vh]  flex flex-col">
          <div className="flex gap-4 justify-center text-2xl font-bold">
            <h2 className="mb-10 font-roboto-slab tracking-wide">
              Students attending:
            </h2>
            <span className="font-roboto-slab">
              {attendingStudents.length}/{studentCount}
            </span>
          </div>
          <li className="flex justify-center font-open-sans">
            <ul className="flex flex-col gap-1 my-2">
              {attendingStudents.map((student, index) => (
                <p className=" " key={index}>
                  {student.firstName} {student.lastName}
                </p>
              ))}
              {sessionClosed && (
                <Link
                  to="/teacherhome"
                  className=" text-blue-500 text-lg underline hover:text-green-800">
                  Create new attendance registration
                </Link>
              )}
            </ul>
          </li>
        </div>
      </section>
    </>
  );
};
