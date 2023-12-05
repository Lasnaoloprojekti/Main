import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createSession, selectActiveCourse } from "../Hooks/ApiHooks";
import {
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import axios from "axios";

const userId = localStorage.getItem("userid");

const OpenattendanceCollect = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [setSelectedDate] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState("");
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [manualAttendanceClicked, setManualAttendanceClicked] = useState(false);

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setDate(formattedDate);

    const hour = today.getHours();
    const minute = today.getMinutes();
    if (hour > 12 || (hour === 12 && minute > 30)) {
      setTimeOfDay("Afternoon");
    } else {
      setTimeOfDay("Morning");
    }
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await selectActiveCourse(userId);
        console.log("Courses fetched:", response);
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const selectedCourseData = courses.find(
        (course) => course._id === selectedCourse
      );
      setTopics(selectedCourseData ? selectedCourseData.topics : []);
    } else {
      setTopics([]);
    }
  }, [selectedCourse, courses]);

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  const handleTopicChange = (event) => {
    setSelectedTopic(event.target.value);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleTimeOfDayChange = (event) => {
    setTimeOfDay(event.target.value);
  };

  const checkStudentsAndNavigate = async (
    sessionId,
    courseName,
    topic,
    path
  ) => {
    try {
      console.log("Checking student count for course:", selectedCourse);
      const response = await axios.get(
        `http://localhost:3001/getstudents/${selectedCourse}`
      );
      const { studentCount } = response.data;
      console.log("Student count:", studentCount);

      if (studentCount > 0) {
        // If there are students, navigate to the next page
        navigate(
          `/${path}/${sessionId}/${encodeURIComponent(
            courseName
          )}/${encodeURIComponent(topic)}`
        );
      } else {
        // If there are no students, display a message
        alert(
          "This course does not have any students currently, please add them first."
        );
      }
    } catch (error) {
      console.error("Error checking student count:", error);
      // Optionally set an error message in the state to display in the UI
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const sessionData = {
      courseId: selectedCourse,
      topic: selectedTopic,
      date: date, // Use the date state here
      timeOfDay,
    };

    const response = await createSession(sessionData);
    console.log("Session created:", response);

    // Extracting session ID from the response
    const sessionId = response.sessionId;

    // Get the selected course name
    const selectedCourseName = courses.find(
      (course) => course._id === selectedCourse
    )?.name;

    await checkStudentsAndNavigate(
      sessionId,
      selectedCourseName,
      selectedTopic,
      "wait"
    );
  };

  const HandleManualAttendanceCollect = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const sessionData = {
      courseId: selectedCourse,
      topic: selectedTopic,
      date: date, // Use the date state here
      timeOfDay,
    };

    const response = await createSession(sessionData);
    console.log("Session created:", response);

    // Extracting session ID from the response
    const sessionId = response.sessionId;

    // Get the selected course name
    const selectedCourseName = courses.find(
      (course) => course._id === selectedCourse
    )?.name;

    await checkStudentsAndNavigate(
      sessionId,
      selectedCourseName,
      selectedTopic,
      "manual"
    );
  };

  const validateForm = () => {
    if (!selectedCourse || !selectedTopic || !date || !timeOfDay) {
      alert("Please fill all the fields in the form.");
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen w-full items-center flex flex-col px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center font-medium text-xl mb-4 font-roboto-slab">
          Fill in to open attendace collection
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
              Select Course
            </label>
            <Select
              required
              className="border border-gray-300 p-3 h-14 block w-full font-open-sans"
              style={{ borderRadius: "8px" }}
              value={selectedCourse}
              onChange={handleCourseChange}
              displayEmpty>
              <MenuItem value="" disabled>
                Select Course
              </MenuItem>
              {courses.map((course) => (
                <MenuItem key={course._id} value={course._id}>
                  {course.name} / {course.groupName}{" "}
                  {/* Concatenating course name and group name */}
                </MenuItem>
              ))}
            </Select>
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
              Select Topic
            </label>
            <Select
              required
              className="border border-gray-300 p-3 h-14 block w-full font-open-sans"
              style={{ borderRadius: "8px" }}
              value={selectedTopic}
              onChange={handleTopicChange}
              displayEmpty
              disabled={!selectedCourse}>
              <MenuItem value="" disabled>
                Topic
              </MenuItem>
              {topics.map((topic, index) => (
                <MenuItem key={index} value={topic}>
                  {topic}
                </MenuItem>
              ))}
            </Select>
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
              Select Day
            </label>
            <input
              required
              className="border font-open-sans border-gray-300 p-3 rounded-lg block w-full"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <FormControl component="fieldset">
            <label className="block mb-2 text-sm font-medium text-gray-600 font-roboto-slab">
              Select Time of Day
            </label>
            <RadioGroup
              row
              name="timeOfDay"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}>
              <FormControlLabel
                value="Morning"
                control={<Radio />}
                label="Morning"
              />
              <FormControlLabel
                value="Afternoon"
                control={<Radio />}
                label="Afternoon"
              />
            </RadioGroup>
          </FormControl>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-4 w-full p-3 bg-blue-900 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
              Collect Attendances
            </button>
          </div>
          <div className=" text-center mt-2">
            <Link
              className="text-blue-500"
              onClick={HandleManualAttendanceCollect}>
              Take attendances manually
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpenattendanceCollect;
