import { createContext, useState, useEffect } from "react";
import axios from "axios";

const studentContext = createContext();

const StudentContextProvider = ({ children }) => {
  const [studentInfo, setStudentInfo] = useState({
    firstname: "",
    lastname: "",
    userId: "",
    studentNumber: "", // Add studentNumber to the state
  });

  const accessToken = localStorage.getItem("token");

  const verify = async () => {
    if (accessToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      try {
        const response = await axios.get("http://localhost:3002/studentverify");
        const studentData = response.data;
        const studentInfo = studentData.student;
        console.log("API response data: ", studentInfo);

        if (studentInfo) {
          setStudentInfo({
            staff: studentInfo.staff, // Assuming staff is a direct field of studentInfo
            firstname: studentInfo.firstName, // Corrected to studentInfo.firstName
            lastname: studentInfo.lastName, // Corrected to studentInfo.lastName
            studentNumber: studentInfo.studentNumber, // Corrected to studentInfo.studentNumber
          });
        }
      } catch (error) {
        console.error("Verification failed:", error);
      }
    }
  };

  useEffect(() => {
    verify();
  }, [accessToken]);

  console.log(studentInfo.firstname !== "" && studentInfo.lastname !== "");

  console.log(studentInfo, "student info");

  return (
    <studentContext.Provider value={{ studentInfo, setStudentInfo }}>
      {children}
    </studentContext.Provider>
  );
};

export { studentContext, StudentContextProvider };
