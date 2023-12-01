import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userContext } from "../context/userContext";
import AddStudents from "../components/AddStudents";
import CreateCourse from "../components/CreateCourse";
import SelectCourse from "../components/SelectCourse";
import CourseDelete from "../components/CourseDelete";
import OpenattendanceCollect from "../components/OpenattendanceCollect";
import ParticipationRates from "../components/ParticipationRates";
import logo from "../assets/metropolia_s_orange.png";
import AddTopics from "../components/AddTopics";
import AddTeacherToCourse from "../components/AddTeachers";
import DeactiveCourse from "../components/DeactiveCourse";

const TeacherHome = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useContext(userContext);
  const [activeView, setActiveView] = useState("openAttendanceCollect");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userid");
    setUserInfo({ staff: "", firstname: "", lastname: "" });
    navigate("/login");
  };

  const renderComponent = () => {
    switch (activeView) {
      case "createCourse":
        return <CreateCourse />;
      case "addStudents":
        return <AddStudents />;
      case "selectCourse":
        return <SelectCourse />;
      case "deleteCourse":
        return <CourseDelete />;
      case "openAttendanceCollect":
        return <OpenattendanceCollect />;
      case "participationRates":
        return <ParticipationRates />;
      case "addTopic":
        return <AddTopics />;
      case "addTeacherToCourse":
        return <AddTeacherToCourse />;
      case "deactiveCourse":
        return <DeactiveCourse />;
      default:
        return null;
    }
  };

  return (
    <>
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

      <div className="flex">
        <div className="w-1/4 border-r-2 p-4">
          <div className="mb-10">
            <h2 className="font-bold text-lg rounded-sm text-center mb-3">
              Course Management
            </h2>
            <button
              onClick={() => setActiveView("createCourse")}
              className="block w-full bg-orange-600 text-white px-4 py-2 rounded mb-2 hover:bg-gray-700">
              Create a new course
            </button>
            <button
              onClick={() => setActiveView("addStudents")}
              className="block w-full bg-orange-600 text-white px-4 py-2 rounded mb-2 hover:bg-gray-700">
              Add students
            </button>
            <button
              onClick={() => setActiveView("addTeacherToCourse")}
              className="block w-full bg-orange-600 text-white px-4 py-2 rounded mb-2 hover:bg-gray-700">
              Add teacher to course
            </button>
            <button
              onClick={() => setActiveView("addTopic")}
              className="block w-full bg-orange-600 text-white px-4 py-2 rounded mb-2 hover:bg-gray-700">
              Modify Topics{" "}
            </button>
            <button
              onClick={() => setActiveView("deleteCourse")}
              className="block w-full bg-orange-600 text-white px-4 py-2 rounded mb-2 hover:bg-gray-700">
              Delete course
            </button>
            <button
              onClick={() => setActiveView("deactiveCourse")}
              className="block w-full bg-orange-600 text-white px-4 py-2 rounded mb-2 hover:bg-gray-700">
              Deactive course
            </button>
          </div>

          <div>
            <h2 className="font-bold text-lg  rounded-sm text-center mb-3">
              Attendance
            </h2>
            <button
              onClick={() => setActiveView("openAttendanceCollect")}
              className="block w-full bg-orange-600 text-white px-4 py-2 rounded mb-2 hover:bg-gray-700">
              Collect attendances
            </button>
            <button
              onClick={() => setActiveView("participationRates")}
              className="block w-full bg-orange-600 text-white px-4 py-2 rounded mb-2 hover:bg-gray-700">
              View participations
            </button>
          </div>
        </div>

        <div className="flex-grow p-4">{renderComponent()}</div>
      </div>
    </>
  );
};

export default TeacherHome;
