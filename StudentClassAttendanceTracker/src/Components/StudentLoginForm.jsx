import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { studentContext } from "../Context/studentContext";
import logo from "../assets/metropolia_s_orange.png";
import { Box } from "@mui/material";

const StudentLoginForm = () => {
  const { setStudentInfo } = useContext(studentContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  const isStudentNumberValid = (number) => {
    return number.length === 7 && /^\d+$/.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password || !studentNumber) {
      setLoginError("All fields are required.");
      return;
    }

    if (!isStudentNumberValid(studentNumber)) {
      setLoginError("Invalid student number");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3002/studentlogin", {
        username,
        password,
        studentNumber,
      });

      const responseData = response.data.apiData;

      if (
        !responseData.message ||
        responseData.message !== "invalid username or password"
      ) {
        setStudentInfo({
          staff: responseData.staff,
          firstname: responseData.firstname,
          lastname: responseData.lastname,
          userId: responseData.userId,
          studentNumber: studentNumber,
        });

        localStorage.setItem("userid", responseData.userId);
        localStorage.setItem("token", responseData.accessToken);
        localStorage.setItem("studentnumber", studentNumber);

        navigate(responseData.redirectUrl);
      } else {
        setLoginError("Invalid username or password");
      }
    } catch (error) {
      setLoginError("Error logging in. Check your credentials and connection.");
    }
  };

  return (
    <Box className="min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded shadow-lg text-center">
        <img className="mx-auto h-[18mm] mb-6" src={logo} alt="Logo" />
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-black text-sm font-semibold mb-2 font-roboto-slab">
              Username
            </label>
            <input
              className="w-full text-black p-2 border rounded font-open-sans"
              type="text"
              placeholder="Enter your username"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-black text-sm font-semibold mb-2 font-roboto-slab">
              Password
            </label>
            <input
              className="w-full p-2 text-black border rounded font-open-sans"
              type="password"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-black text-sm font-semibold mb-2 font-roboto-slab">
              Student Number
            </label>
            <input
              className="w-full p-2 text-black border rounded font-open-sans"
              type="text"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="Enter your student number"
            />
          </div>
          <h3 className="text-red-600">{loginError}</h3>
          <button
            className="w-full bg-orange-600 text-white p-2 rounded hover:bg-orange-600 focus:outline-none focus:ring focus:border-orange-700 font-roboto-slab"
            type="submit">
            Login
          </button>
        </form>
      </div>
    </Box>
  );
};

export default StudentLoginForm;
