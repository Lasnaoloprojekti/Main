import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userContext } from "../context/userContext";
import logo from "../assets/metropolia_s_orange.png";
import StudentDashboard from "../components/StudentDashboard";

export const StudentHome = () => {
  const { userInfo, setUserInfo } = useContext(userContext);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userid");
    setUserInfo({ staff: false, firstname: "", lastname: "" });
    navigate("/studentlogin");
  };

  const handleMainButtonClick = (mainButton) => {
    if (activeMainButton === mainButton) {
      // Toggle off if the same button is clicked
      setActiveMainButton("");
      setActiveView("");
    } else {
      setActiveMainButton(mainButton);
      setActiveView("");
    }
  };

  const renderComponent = () => {
    switch (activeView) {
      case "createCourse":
        return <CreateCourse />;
      default:
        return null;
    }
  };

  return (
    <>
      <nav className="flex justify-between items-center">
        <Link to="/studenthome">
          <img className="h-10 m-4" src={logo} alt="Logo" />
        </Link>
        <ul className="flex items-center">
          <li className="text-md ml-2 font-roboto-slab">
            Welcome! {userInfo.firstname} {userInfo.lastname}
          </li>
          <button
            onClick={handleLogout}
            className="text-white bg-orange-600 rounded-lg p-4 mx-8 font-roboto-slab">
            Logout
          </button>
        </ul>
      </nav>
      <StudentDashboard />
    </>
  );
};

export default StudentHome;
