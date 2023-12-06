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
      const student = await axios.get("http://localhost:3002/studentverify");
      console.log("verifioinnista saatava data", student.data);
      if (student.data) {
        setStudentInfo({
          staff: student.data.staff,
          firstname: student.data.firstName,
          lastname: student.data.lastName,
          studentNumber: student.data.studentNumber,
        });
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
