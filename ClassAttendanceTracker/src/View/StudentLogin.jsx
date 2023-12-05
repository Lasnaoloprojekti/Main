import "../login.css";
import StudentLoginForm from "../components/StudentLoginForm";
import { useContext, useEffect } from "react";
import { userContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const { userInfo } = useContext(userContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (userInfo && userInfo.firstname !== "" && userInfo.lastname !== "") {
            navigate(userInfo.staff ? "/teacherhome" : "/studenthome");
            // navigate("/teacherhome");
        }
    }, [userInfo, navigate]);

    return (
        <>
            <div className="fullscreen-bg">
                <video loop muted autoPlay className="fullscreen-bg__video">
                    <source src="autumnleafs.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
            <StudentLoginForm />
        </>
    );
};

export default Login;
