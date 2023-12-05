import { createContext, useState, useEffect } from "react";
import axios from "axios";

const userContext = createContext();

const UserContextProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState({
    staff: false,
    firstname: "",
    lastname: "",
    userId: "",
    studentNumber: "",
  });

  const accessToken = localStorage.getItem("token");

  const verify = async () => {
    if (accessToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      try {
        const response = await axios.get("http://localhost:3001/verify");
        if (response.data) {
          const { user, student } = response.data;
          setUserInfo({
            staff: user.staff,
            firstname: user.firstName,
            lastname: user.lastName,
            userId: user._id,
            studentNumber: student ? student.studentNumber : "",
          });
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        // Handle error
      }
    }
  };

  useEffect(() => {
    verify();
  }, [accessToken]);

  console.log(userInfo.firstname !== "" && userInfo.lastname !== "");

  console.log(userInfo, "user info");

  return (
    <userContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </userContext.Provider>
  );
};

export { userContext, UserContextProvider };
