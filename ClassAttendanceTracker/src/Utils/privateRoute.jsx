import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { userContext } from "../context/userContext";

const PrivateRoutes = () => {
  console.log("private routes");
  const { userInfo } = useContext(userContext);

  const isAuthenticated = userInfo.firstname !== "" && userInfo.lastname !== "";
  console.log("isAuthenticated", isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoutes;
