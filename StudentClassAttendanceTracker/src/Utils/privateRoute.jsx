import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { studentContext } from "../Context/studentContext";

const PrivateRoutes = () => {
  console.log("private routes");
  const { studentInfo } = useContext(studentContext);

  const isAuthenticated =
    studentInfo.firstname !== "" && studentInfo.lastname !== "";
  console.log("isAuthenticated", isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/studentlogin" />;
};

export default PrivateRoutes;
