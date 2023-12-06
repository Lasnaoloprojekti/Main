import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { StudentContextProvider } from "./Context/studentContext";
import StudentLogin from "./View/StudentLogin";
import StudentHome from "./View/Student";
import PrivateRoutes from "./Utils/privateRoute";
import GDPRConsentForm from "./View/GDPRConsentForm";

const App = () => {
  return (
    <StudentContextProvider>
      <Router>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route path="/studenthome" element={<StudentHome />} />
            <Route path="/gdprconsentform" element={<GDPRConsentForm />} />
          </Route>

          <Route path="/studentlogin" element={<StudentLogin />} />
          <Route path="*" element={<StudentLogin />} />
        </Routes>
      </Router>
    </StudentContextProvider>
  );
};

export default App;
