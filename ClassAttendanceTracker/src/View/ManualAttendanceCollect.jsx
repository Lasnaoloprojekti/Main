import React, { useContext, useState, useEffect } from "react";
import logo from "../assets/metropolia_s_orange.png";
import { useNavigate, useParams, Link } from "react-router-dom";
import { userContext } from "../context/userContext";
import DeleteIcon from '@mui/icons-material/Delete';
import { deleteSession } from "../Hooks/ApiHooks";

export const ManualAttendanceCollect = () => {
    const { sessionId, courseName, topic } = useParams();
    const navigate = useNavigate();
    const { userInfo, setUserInfo } = useContext(userContext);
    const [sessionClosed, setSessionClosed] = useState(false);
    const [serverMessage, setServerMessage] = useState("");
    const [attendingStudents, setAttendingStudents] = useState([]);
    const [nonAttendingStudents, setNonAttendingStudents] = useState([]);
    const [showModal, setShowModal] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(5); // Default to 5 minutes


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

    const handleCloseModal = () => {
        setShowModal(false);
    };

    // Modal component
    const Modal = ({ children }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-5 rounded">
                {children}
            </div>
        </div>
    );

    useEffect(() => {
        // Fetch all students from the server when the component mounts
        const fetchStudents = async () => {
            const response = await fetch(`http://localhost:3001/getcoursestudents/${sessionId}`); // Replace with your actual API endpoint
            if (response.ok) {

                const { students } = await response.json();
                console.log("Students fetched successfully", students);
                setNonAttendingStudents(students);
            }
        };

        fetchStudents();
    }, [sessionId]);


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
        }, 500);
    };

    useEffect(() => {
        if (sessionClosed) {
            const timer = setTimeout(() => {
                navigate("/teacherhome");
            }, 1000); // Delay of 1000 milliseconds (1 second)

            return () => clearTimeout(timer); // Clean up the timer
        }
    }, [sessionClosed, navigate]);

    const handleStudentClick = async (student) => {
        try {
            const response = await fetch("http://localhost:3001/registration", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ studentNumber: student.studentNumber }),
            });

            if (response.ok) {
                // Student registered successfully, now move them to the attending list
                setNonAttendingStudents(nonAttendingStudents.filter(s => s.studentNumber !== student.studentNumber));
                setAttendingStudents([...attendingStudents, student]);
            } else {
                // Handle case where registration wasn't successful
                console.error("Failed to register student attendance");
            }
        } catch (error) {
            console.error("Error registering student attendance:", error);
        }
    };

    const handleUnregisterStudent = async (student) => {
        try {
            const response = await fetch("http://localhost:3001/unregister", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ studentNumber: student.studentNumber, sessionId: sessionId }),
            });

            if (response.ok) {
                // Update state to move student back to non-attending list
                setAttendingStudents(attendingStudents.filter(s => s.studentNumber !== student.studentNumber));
                setNonAttendingStudents([...nonAttendingStudents, student]);
            } else {
                // Handle case where unregistration wasn't successful
                console.error("Failed to unregister student attendance");
            }
        } catch (error) {
            console.error("Error unregistering student attendance:", error);
        }
    };

    const handleCloseSession = async () => {
        // Check if there are no students in the attendingStudents state
        if (attendingStudents.length === 0) {
            const confirmClose = window.confirm(
                "No attendances were saved. Are you sure you want to stop collecting attendances? THIS WILL HAVE EFFECT ON THE COURSES PARTICIPATION RATES!."
            );

            if (!confirmClose) {
                return; // Don't proceed if the user cancels the action
            }
        } else {
            // Display the default confirmation message
            const confirmClose = window.confirm(
                "Are you sure you want to stop collecting attendances and save the changes?"
            );

            if (!confirmClose) {
                return; // Don't proceed if the user cancels the action
            }
        }

        try {
            const response = await fetch("http://localhost:3001/closesession", {
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
            <nav className="flex justify-between items-center">
                <Link to="/teacherhome">
                    <img className="h-12 m-4" src={logo} alt="Logo" />
                </Link>

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

            <div className="flex flex-col justify-between">
                <div>
                    <section className="flex flex-col items-center mt-5">
                        <h1 className="font-roboto-slab text-3xl mb-5 font-bold tracking-wide">
                            {decodeURIComponent(courseName)}
                        </h1>
                        <h1 className="font-roboto-slab text-xl mb-1 font-semibold tracking-wider">
                            {decodeURIComponent(topic)}
                        </h1>
                    </section>

                    <section className="mt-4">
                        <div>
                            <h3 className="m-4">Students Not Attending:</h3>
                            <ul className="flex flex-wrap">
                                {nonAttendingStudents.map(student => (
                                    <li
                                        key={student.studentNumber}
                                        onClick={() => handleStudentClick(student)}
                                        className="bg-orange-500 text-white text-sm p-2 m-2 rounded cursor-pointer hover:bg-orange-600 transition-colors">
                                        {student.firstName} {student.lastName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="m-4">Students Attending:</h3>
                            <ul className="flex flex-wrap">
                                {attendingStudents.map(student => (
                                    <li key={student.studentNumber} className="bg-blue-500 text-white p-2 m-2 rounded cursor-pointer" onClick={() => handleUnregisterStudent(student)}>
                                        {student.firstName} {student.lastName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                </div>

                <section className="w-full flex justify-center pb-4">
                    <div className=" flex flex-col text-center gap-2 mt-4">
                        <p className="text-base text-green-500">{serverMessage}</p>
                    </div>
                    <button
                        disabled={showModal}
                        onClick={handleCloseSession}
                        className={`text-white text-xl flex items-center rounded-lg py-2 mb-5 px-6 font-roboto-slab absolute bottom-0 left-1/2 transform -translate-x-1/2 ${showModal ? ' hidden cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900'}`}
                    >
                        Stop collecting attendances
                    </button>
                </section>
            </div>

        </>
    );
};