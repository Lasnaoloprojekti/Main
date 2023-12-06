import { createContext, useState, useEffect } from "react";
import axios from "axios";

const userContext = createContext();

const UserContextProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState({
    staff: false,
    firstname: "",
    lastname: "",
    userId: "",
  });

  const accessToken = localStorage.getItem("token");

  const verify = async () => {
    if (accessToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      const user = await axios.get("http://localhost:3001/verify");
      console.log("verifioinnista saatava data", user.data);
      if (user.data) {
        setUserInfo({
          staff: user.data.staff,
          firstname: user.data.firstName,
          lastname: user.data.lastName,
        });
      }
      console.log("User data from verification:", user.data); // Log the user data
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
