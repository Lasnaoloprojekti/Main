import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./View/Login";
import CourseModification from "./View/CourseModification";
import TeacherHome from "./View/Teacher";
import PrivateRoutes from "./Utils/privateRoute";
import { UserContextProvider } from "./context/userContext";
import { WaitingPage } from "./View/AttendanceCollect";
import { ManualAttendanceCollect } from "./View/ManualAttendanceCollect";

const App = () => {
  return (
    <UserContextProvider>
      <Router>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route path="/teacherhome" element={<TeacherHome />} />
            <Route path="/coursemodify" element={<CourseModification />} />
          </Route>
          <Route
            path="/wait/:sessionId/:courseName/:topic"
            element={<WaitingPage />}
          />
          <Route
            path="/manual/:sessionId/:courseName/:topic"
            element={<ManualAttendanceCollect />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </UserContextProvider>
  );
};

export default App;
