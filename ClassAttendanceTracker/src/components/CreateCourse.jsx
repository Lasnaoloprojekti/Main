//Course creating through excel with student adding through excel
import React, { useState, useEffect } from "react";
import {
  createCourse,
  getTopics,
  createTopic,
  searchRealization,
  getUsers,
} from "../Hooks/ApiHooks";
import * as XLSX from "xlsx";

const CreateCourse = () => {
  const [courseData, setCourseData] = useState({
    courseName: "",
    groupName: "",
    topics: [],
    startDate: "",
    endDate: "",
  });
  const [newTopic, setNewTopic] = useState("");
  const [availableTopics, setAvailableTopics] = useState([]);
  const [newTeacher, setNewTeacher] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [studentData, setStudentData] = useState(""); //
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    isError: false,
  });

  // Fetch topics from the server
  const fetchTopics = async () => {
    try {
      const topics = await getTopics();
      setAvailableTopics(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const fetchedTeachers = await getUsers();
        setAllTeachers(fetchedTeachers);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    };

    fetchTeachers();
  }, []);

  // Fetch topics when the component mounts
  useEffect(() => {
    fetchTopics();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Map teacher names to IDs
    const teacherIds = selectedTeachers
      .map((name) => {
        const teacher = allTeachers.find(
          (teacher) => `${teacher.firstName} ${teacher.lastName}` === name
        );
        return teacher?._id;
      })
      .filter((id) => id != null); // Filter out any undefined IDs

    const studentsToAdd = studentData
      .split("\n")
      .map((line) => {
        const [lastName, firstName, studentNumber] = line.split(";");
        return { lastName, firstName, studentNumber };
      })
      .filter(
        (student) =>
          student.lastName && student.firstName && student.studentNumber
      );

    if (window.confirm("Are you sure you want to create this course?")) {
      try {
        const userId = localStorage.getItem("userid"); // Retrieve the teacher's ID
        const requestData = {
          courseName: courseData.courseName,
          groupName: courseData.groupName,
          topics: courseData.topics,
          startDate: courseData.startDate,
          endDate: courseData.endDate,
          userId, // Include the creator's ID in the request
          teachers: teacherIds, // Array of teacher IDs
          studentsToAdd,
        };

        await createCourse(requestData);
        setAlert({
          show: true,
          message: "Course created successfully!",
          isError: false,
        });
        setTimeout(
          () => setAlert({ show: false, message: "", isError: false }),
          5000
        );

        setCourseData({
          courseName: "",
          groupName: "",
          topics: [],
          startDate: "",
          endDate: "",
        });
      } catch (error) {
        console.error("Error creating course:", error);
        setAlert({
          show: true,
          message: "Failed to create course. Please try again.",
          isError: true,
        });
        setTimeout(
          () => setAlert({ show: false, message: "", isError: false }),
          5000
        );
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleTopicChange = (e) => {
    setNewTopic(e.target.value);
  };

  const handleAddTopic = async () => {
    if (newTopic && !courseData.topics.includes(newTopic)) {
      if (!availableTopics.some((topic) => topic.name === newTopic)) {
        try {
          await createTopic({ name: newTopic });
          await fetchTopics(); // Refresh the list of available topics
        } catch (error) {
          console.error("Error creating new topic:", error);
        }
      }
      setCourseData((prevData) => ({
        ...prevData,
        topics: [...prevData.topics, newTopic],
      }));
      setNewTopic("");
    }
  };

  const handleTopicKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const handleRemoveTopic = (topicToRemove) => {
    setCourseData((prevData) => ({
      ...prevData,
      topics: prevData.topics.filter((topic) => topic !== topicToRemove),
    }));
  };

  const handleAddTeacher = () => {
    if (newTeacher && !selectedTeachers.includes(newTeacher)) {
      setSelectedTeachers((prevTeachers) => [...prevTeachers, newTeacher]);
      setNewTeacher("");
    }
  };

  const handleTeacherKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTeacher();
    }
  };

  const handleRemoveTeacher = (teacherToRemove) => {
    setSelectedTeachers(
      selectedTeachers.filter((teacher) => teacher !== teacherToRemove)
    );
  };

  const handleToggleStudentForm = () => {
    setShowStudentForm(!showStudentForm); // Toggle the visibility of the student form
  };

  const handleFileUpload = async (e) => {
    // Check if any file is selected
    if (e.target.files.length === 0) {
      console.error("No file selected.");
      return;
    }

    const file = e.target.files[0];
    // Check if the file is a valid Blob
    if (!file) {
      console.error("Invalid file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const studentsData = data
        .slice(2)
        .map((row) => {
          return {
            lastName: row[0],
            firstName: row[1],
            studentNumber: row[4],
          };
        })
        .filter((student) => {
          return student.lastName && student.firstName && student.studentNumber;
        });

      const studentsText = studentsData
        .map(
          (student) =>
            `${student.lastName};${student.firstName};${student.studentNumber};`
        )
        .join("\n");

      setStudentData(studentsText);

      const firstCell = data[0][0];
      const regex = /\(([^)]+)\)/;
      const matches = regex.exec(firstCell);

      if (matches && matches[1]) {
        const extractedGroupCode = matches[1]; // Extracted group code from Excel
        // Set the extracted group code as the group name
        setCourseData((prevData) => ({
          ...prevData,
          groupName: extractedGroupCode,
        }));

        try {
          const response = await searchRealization([extractedGroupCode]);
          if (
            response &&
            response.realizations &&
            response.realizations.length > 0
          ) {
            const courseInfo = response.realizations[0];

            // Set the course data
            setCourseData({
              courseName: courseInfo.name,
              startDate: courseInfo.startDate.split("T")[0],
              endDate: courseInfo.endDate.split("T")[0],
              topics: [], // Reset topics or set them as needed
              groupName: extractedGroupCode,
            });
          }
        } catch (error) {
          console.error("Error in realization search:", error);
        }
      } else {
        console.log("No text found in parentheses.");
      }
    };

    reader.onerror = (err) => {
      console.error("Error reading file:", err);
    };

    try {
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  return (
    <div className="min-h-screen w-full items-center flex flex-col px-6">
      <div className="max-w-4xl w-full">
        <form
          className="bg-white p-8 border border-gray-300 rounded-lg shadow-lg"
          onSubmit={handleSubmit}
        >
          {/* Course Name Input */}
          <div className="mb-4">
            <label className="block text-black text-sm font-semibold mb-2">
              Course Name
            </label>
            <input
              required
              className="w-full p-2 border rounded"
              type="text"
              placeholder="Enter course name"
              name="courseName"
              value={courseData.courseName}
              onChange={handleChange}
            />
          </div>

          {/* Group Name Input */}
          <div className="mb-4">
            <label className="block text-black text-sm font-semibold mb-2">
              Group Name
            </label>
            <input
              required
              className="w-full p-2 border rounded"
              type="text"
              placeholder="Enter group name"
              name="groupName"
              value={courseData.groupName}
              onChange={handleChange}
            />
          </div>

          {/* Topics Input with Suggestions */}
          <div className="mb-4 flex flex-col">
            <label className="block text-black text-sm font-semibold mb-2">
              Topics
            </label>
            <div className="flex items-center">
              <input
                className="w-full p-2 border rounded"
                type="text"
                placeholder="Add a topic"
                value={newTopic}
                onChange={handleTopicChange}
                onKeyPress={handleTopicKeyPress}
                list="topic-list"
              />
            </div>
            <datalist id="topic-list">
              {availableTopics.map((topic, index) => (
                <option key={index} value={topic.name} />
              ))}
            </datalist>
            <div className="flex flex-wrap mt-2">
              {courseData.topics.map((topic, index) => (
                <div
                  key={index}
                  className="flex mr-2 mb-2 p-1 bg-gray-200 rounded items-center"
                >
                  <span>{topic}</span>
                  <button
                    onClick={() => handleRemoveTopic(topic)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Start Date Input */}
          <div className="mb-4">
            <label className="block text-black text-sm font-semibold mb-2">
              Start Date
            </label>
            <input
              className="w-full p-2 border rounded"
              type="date"
              name="startDate"
              value={courseData.startDate}
              onChange={handleChange}
            />
          </div>

          {/* Teacher Input with Suggestions */}
          <div className="mb-4 flex flex-col">
            <label className="block text-black text-sm font-semibold mb-2">
              Teachers
            </label>
            <div className="flex items-center">
              <input
                className="w-full p-2 border rounded"
                type="text"
                placeholder="Add a teacher"
                value={newTeacher}
                onChange={(e) => setNewTeacher(e.target.value)}
                onKeyPress={handleTeacherKeyPress}
                list="teacher-list"
              />
              <datalist id="teacher-list">
                {allTeachers.map((teacher, index) => (
                  <option
                    key={index}
                    value={`${teacher.firstName} ${teacher.lastName}`}
                  />
                ))}
              </datalist>
            </div>

            {/* Display selected teachers with a delete button */}
            <div className="flex flex-wrap mt-2">
              {selectedTeachers.map((teacher, index) => (
                <div
                  key={index}
                  className="flex mr-2 mb-2 p-1 bg-gray-200 rounded items-center"
                >
                  <span>{teacher}</span>
                  <button
                    onClick={() => handleRemoveTeacher(teacher)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* End Date Input */}
          <div className="mb-4">
            <label className="block text-black text-sm font-semibold mb-2">
              End Date
            </label>
            <input
              className="w-full p-2 border rounded"
              type="date"
              name="endDate"
              value={courseData.endDate}
              onChange={handleChange}
            />
          </div>

          {/* Button to toggle student input form visibility */}
          <button
            type="button"
            className="mt-4 mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleToggleStudentForm}
          >
            {showStudentForm ? "Hide Student Form" : "Add Students"}
          </button>

          {/* Conditional rendering of the student input form */}
          {showStudentForm && (
            <div className="mb-4">
              <label className="block text-black text-sm font-semibold mb-2">
                Students (LastName;FirstName;StudentNumber; format):
              </label>
              <textarea
                rows="6"
                className="w-full p-2 border rounded"
                value={studentData}
                onChange={(e) => setStudentData(e.target.value)}
                placeholder="Doe;John;123456;"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-black text-sm font-semibold mb-2">
              Load Course Data Through Excel
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Submit Button */}
          <button
            className="px-4 w-full p-3 bg-blue-900 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            type="submit"
          >
            Create Course
          </button>
        </form>

        {/* Alert Message */}
        {alert.show && (
          <div
            className={`mt-4 p-4 rounded-md transition-all ${
              alert.isError
                ? "bg-red-100 border border-red-400 text-red-800"
                : "bg-green-100 border border-green-400 text-green-800"
            }`}
          >
            <p>{alert.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateCourse;
