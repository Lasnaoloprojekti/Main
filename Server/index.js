require("dotenv").config();

const express = require("express");
const { createServer } = require("node:http");
const mongoose = require("mongoose");
const cors = require("cors");
const {
  UserDatabaseModel,
  CourseDatabaseModel,
  StudentDatabaseModel,
  AttendanceSessionDatabaseModel,
  AttendanceDatabaseModel,
  TopicDatabaseModel,
} = require("./models/collectionSchemas");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const fetch = require("node-fetch");
const multer = require("multer");
const xlsx = require("xlsx");
const upload = multer({ dest: "uploads/" });
const PDFDocument = require("pdfkit");
const Excel = require("exceljs");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);

mongoose.connect(
  "mongodb+srv://luovalauma:oGkSjaFCvC1Vgjzv@attendance.hhbm8a0.mongodb.net/Attendance"
);

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  socket.emit("students");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.get("/getstudents/:courseId", async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await CourseDatabaseModel.findById(courseId).populate(
      "students"
    );
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const studentCount = course.students.length;
    res.status(200).json({ studentCount });
  } catch (error) {
    console.error("Error fetching student count:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching student count" });
  }
});

app.post("/uploadstudents", upload.single("studentfile"), async (req, res) => {
  console.log("Upload students request received", req.file);
  const courseId = req.body.courseId;

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetNames = workbook.SheetNames;
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]], {
      header: 1,
    });

    const students = sheetData.slice(1).filter((row) => row && row.length > 0);
    let newStudentsAdded = 0;
    let existingStudents = 0;

    const studentPromises = students.map(async (row, index) => {
      const [lastName, firstName, , email, studentNumber] = row;

      if (
        lastName === "Sukunimi" ||
        firstName === "Etunimi" ||
        email === "Email" ||
        studentNumber === "Op.num" ||
        !lastName ||
        !firstName ||
        !email ||
        !studentNumber
      ) {
        console.log(`Skipping row ${index + 1}: Header or empty row detected.`);
        return null;
      }

      let student = await StudentDatabaseModel.findOne({ studentNumber });
      if (!student) {
        student = new StudentDatabaseModel({
          lastName,
          firstName,
          email,
          studentNumber,
          gdprConsent: false,
          courses: [{ course: courseId }],
        });
        newStudentsAdded++;
        await student.save();
      } else {
        if (!student.courses.find((c) => c.course.toString() === courseId)) {
          student.courses.push({ course: courseId });
          existingStudents++;
          await student.save();
        }
      }

      const course = await CourseDatabaseModel.findById(courseId);
      if (course && !course.students.includes(student._id)) {
        course.students.push(student._id);
        await course.save();
      }

      console.log(`Processed student #${index + 1}: ${firstName} ${lastName}`);
    });

    await Promise.allSettled(studentPromises.filter(Boolean));
    const message =
      newStudentsAdded > 0
        ? `${newStudentsAdded} new students added.`
        : "No new students added.";

    // Check if newStudentsAdded is 0, and send a 404 response if true
    if (newStudentsAdded === 0) {
      res.status(404).json({ message: message });
    } else {
      if (existingStudents > 0) {
        message += ` ${existingStudents} students were already enrolled in the course.`;
      }

      res
        .status(200)
        .json({ message: message, newStudentsAdded: newStudentsAdded > 0 });
    }
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send("Error processing file");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const apiResponse = await fetch("https://streams.metropolia.fi/2.0/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const apiData = await apiResponse.json();

    if (apiData.message === "invalid username or password") {
      return res.status(401).json({ error: "invalid username or password" });
    } else {
      let existingUser = await UserDatabaseModel.findOne({
        user: apiData.user,
      });

      if (!existingUser) {
        // User does not exist, create a new user
        const newUser = new UserDatabaseModel({
          user: apiData.user,
          firstName: apiData.firstname,
          lastName: apiData.lastname,
          email: apiData.email,
          staff: apiData.staff,
          courses: null,
        });

        await newUser.save();
        console.log("New user created:", newUser);
      }

      const accessToken = jwt.sign(
        apiData.user,
        process.env.ACCESS_TOKEN_SECRET
      );

      apiData.accessToken = accessToken;
      apiData.UserId = existingUser._id.toString();
      res.status(apiResponse.status).json({ apiData });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

app.get("/verify", (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  console.log("Token:", token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      console.error("Error during token verification:", err);
      return res.status(403).json({ error: "Invalid token" });
    }

    let existingUser = await UserDatabaseModel.findOne({
      user,
    });

    res.status(200).json(existingUser);
  });
});

app.get("/verify", (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  console.log("Token:", token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      console.error("Error during token verification:", err);
      return res.status(403).json({ error: "Invalid token" });
    }

    let existingUser = await UserDatabaseModel.findOne({
      user,
    });

    res.status(200).json(existingUser);
  });
});

app.post("/createcourse", async (req, res) => {
  const { courseName, groupName, topics, startDate, endDate, userId, teachers, studentsToAdd } = req.body;

  try {
    // Check if the course already exists
    const existingCourse = await CourseDatabaseModel.findOne({ name: courseName });
    if (existingCourse) {
      return res.status(409).json({ error: "Course already exists" });
    }

    // Include the creator's ID in the teacher list if not already present
    let teacherIds = Array.isArray(teachers) ? teachers : [];
    if (!teacherIds.includes(userId)) {
      teacherIds.push(userId);
    }

    // Create a new course
    const newCourse = new CourseDatabaseModel({
      name: courseName,
      groupName,
      startDate,
      endDate,
      isActive: true,
      topics,
      teachers: teacherIds,
      students: [],
    });

    // Save the course
    await newCourse.save();

    // If there are students to add, handle their addition
    if (studentsToAdd && studentsToAdd.length > 0) {
      for (const studentData of studentsToAdd) {
        const { firstName, lastName, studentNumber } = studentData;

        let student = await StudentDatabaseModel.findOne({ studentNumber });

        if (!student) {
          // Create a new student record
          student = new StudentDatabaseModel({
            firstName,
            lastName,
            studentNumber,
            courses: [newCourse._id],
          });
          await student.save();
        } else {
          // Add course to existing student's course list if not already present
          if (!student.courses.includes(newCourse._id)) {
            student.courses.push(newCourse._id);
            await student.save();
          }
        }

        // Add student to the course's student list if not already added
        if (!newCourse.students.includes(student._id)) {
          newCourse.students.push(student._id);
        }
      }

      // Save the course with the updated student list
      await newCourse.save();
    }

    // Send a success response
    res.status(200).json({ message: "Course created successfully", courseId: newCourse._id });

  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "An error occurred while creating the course" });
  }
});


app.post("/api/students/update", async (req, res) => {
  const { studentNumber, gdprConsent, userId } = req.body;

  try {
    const updatedStudent = await StudentDatabaseModel.findOneAndUpdate(
      { user: userId },
      { studentNumber, gdprConsent },
      { new: true }
    );

    if (!updatedStudent) {
      res.status(404).json({ message: "Student not found" });
    } else {
      res.status(200).json({ message: "Student updated successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not update student data." });
  }
});

app.post("/api/students/updategdpr", async (req, res) => {
  const { studentNumber, gdprConsent } = req.body;

  try {
    const updatedStudent = await StudentDatabaseModel.findOneAndUpdate(
      { studentNumber },
      { gdprConsent },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "GDPR consent updated successfully" });
  } catch (error) {
    console.error("Error updating GDPR consent:", error);
    res.status(500).json({ message: "Error updating GDPR consent" });
  }
});

app.get("/api/student/:studentId/gdpr-consent", async (req, res) => {
  // Extract studentId from request parameters
  const { studentId } = req.params;

  try {
    const student = await StudentDatabaseModel.findOne({ _id: studentId });
    if (student) {
      res.json({ gdprConsent: student.gdprConsent });
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching student data" });
  }
});

app.post("/addstudents", async (req, res) => {
  const { studentsToAdd, courseId } = req.body;

  console.log("Add students request received", studentsToAdd);

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const course = await CourseDatabaseModel.findById(courseId).session(
      session
    );
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send(`Course not found with ID: ${courseId}`);
    }

    let addedStudents = [];

    for (const studentData of studentsToAdd) {
      const { firstName, lastName, studentNumber } = studentData;

      console.log("Adding student:", firstName, lastName, studentNumber);

      // Check if the student already exists in the database
      let student = await StudentDatabaseModel.findOne({
        studentNumber,
      }).session(session);

      if (!student) {
        // Create a new student record if not exists
        student = new StudentDatabaseModel({
          firstName,
          lastName,
          studentNumber,
          gdprConsent, // Default to false or adjust as needed
          courses: [{ course: courseId }],
        });
        await student.save({ session });
      } else {
        // If the student exists, send a response to the client indicating the conflict
        // You can customize the response message as needed
        return res.status(409).json({
          message: `Student with student number ${studentNumber} already exists.`,
          student: student,
        });
      }

      // Add the student to the course's students list if not already added
      if (!course.students.includes(student._id)) {
        course.students.push(student);
      }

      addedStudents.push(student);
    }

    await course.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Student added successfully",
      students: addedStudents,
    });
  } catch (error) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.error("An error occurred while adding students:", error);
    res.status(500).send("An error occurred: " + error.message);
  }
});

app.get("/selectactivecourse", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const selectCourse = await CourseDatabaseModel.find({
      teachers: userId,
      isActive: true, // Add this condition to fetch only active courses
    });
    res.status(200).json(selectCourse);
  } catch (error) {
    console.error("Error fetching active courses:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching active courses" });
  }
});

app.get("/allcourses", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const activeCourses = await CourseDatabaseModel.find({
      teachers: userId,
      isActive: true, // Fetch only active courses
    });

    const inactiveCourses = await CourseDatabaseModel.find({
      teachers: userId,
      isActive: false, // Fetch only inactive courses
    });

    const coursesData = {
      active: activeCourses,
      inactive: inactiveCourses,
    };

    res.status(200).json(coursesData);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "An error occurred while fetching courses" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await UserDatabaseModel.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "An error occurred while fetching users" });
  }
});

//course delete/students
app.delete("/api/courses/:id", async (req, res) => {
  console.log("Delete course request received");
  const courseId = req.params.id;

  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete all students associated with the course
    await StudentDatabaseModel.deleteMany({
      "courses.course": courseId,
    }).session(session);

    // Now delete the course itself
    const course = await CourseDatabaseModel.findByIdAndDelete(courseId, {
      session: session,
    });
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({ message: "Course not found" });
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.send({
      message: "Course and associated students deleted successfully",
    });
  } catch (error) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();

    console.error("Error deleting course and associated students:", error);
    res
      .status(500)
      .send({ message: "Internal Server Error", error: error.toString() });
  }
});

app.post("/createsession", async (req, res) => {
  const { courseId, topic, date, timeOfDay } = req.body;

  try {
    // Correctly using new to create an instance of ObjectId
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    const newSession = new AttendanceSessionDatabaseModel({
      course: courseObjectId,
      topic: topic,
      date: date,
      timeOfDay: timeOfDay,
      isOpen: true,
      studentsPresent: [],
    });

    await newSession.save();
    res.status(201).json({ sessionId: newSession._id.toString() });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.delete("/deletesession", async (req, res) => {
  const { sessionId } = req.body;

  try {
    // Find the session by its ID and delete it
    const deletedSession =
      await AttendanceSessionDatabaseModel.findByIdAndDelete(sessionId);

    if (!deletedSession) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Emit an event to notify clients that the session has been deleted
    io.emit("sessionDeleted", { sessionId: deletedSession._id });

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the session" });
  }
});

app.post("/registration", async (req, res) => {
  const { studentNumber } = req.body;
  console.log("Registration request received", req.body);

  try {
    // Find student based on student number
    const student = await StudentDatabaseModel.findOne({ studentNumber });
    if (!student) {
      return res.status(404).send("Student not found");
    }

    let registered = false;

    for (let courseEnrollment of student.courses) {
      const openSessions = await AttendanceSessionDatabaseModel.find({
        course: courseEnrollment.course,
        isOpen: true,
      }).populate("studentsPresent");

      for (let session of openSessions) {
        if (!session.studentsPresent.some((s) => s._id.equals(student._id))) {
          // Register the student in this session
          session.studentsPresent.push(student._id);
          await session.save();

          // Create a new attendance record
          const newAttendance = new AttendanceDatabaseModel({
            session: session._id,
            student: student._id,
            course: session.course,
            topic: session.topic,
            date: session.date,
            timeOfDay: session.timeOfDay,
            status: "Present",
            gdprConsent: student.gdprConsent,
          });

          await newAttendance.save();
          registered = true;
          break; // Break out of the loop once the student is registered in a session
        }
      }

      if (registered) break; // Break out of the outer loop once registered
    }

    if (!registered) {
      return res.status(404).send("No suitable session found for registration");
    }

    io.emit("studentAdded", {
      firstName: student.firstName,
      lastName: student.lastName,
    });

    res.status(200).json({ message: "Student registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/unregister", async (req, res) => {
  const { studentNumber, sessionId } = req.body;
  console.log("Unregister request received", req.body);

  try {
    // Find the student's ID based on their student number
    const student = await StudentDatabaseModel.findOne({ studentNumber });
    if (!student) {
      return res.status(404).send("Student not found");
    }

    // Find and delete the specific attendance record
    const result = await AttendanceDatabaseModel.deleteOne({
      student: student._id,
      session: sessionId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).send("Attendance record not found");
    }

    // Optionally, update the session's studentsPresent array
    const session = await AttendanceSessionDatabaseModel.findById(sessionId);
    if (session) {
      session.studentsPresent = session.studentsPresent.filter(
        (s) => !s.equals(student._id)
      );
      await session.save();
    }

    // Optionally emit an event for real-time updates
    io.emit("studentRemoved", {
      firstName: student.firstName,
      lastName: student.lastName,
      sessionId: sessionId,
    });

    res.status(200).send("Student unregistered successfully");
  } catch (error) {
    console.error("Error during unregistration:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/closesession", async (req, res) => {
  const { sessionId } = req.body;

  try {
    const session = await AttendanceSessionDatabaseModel.findById(sessionId);

    if (!session) {
      return res.status(404).send("Session not found");
    }

    session.isOpen = false;
    await session.save();

    io.emit("sessionClosed", { sessionId: session._id });

    res.status(200).send("Session closed successfully");
  } catch (error) {
    console.error("Error closing session:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/participations/:id", async (req, res) => {
  console.log("Participation request received");

  const courseId = req.params.id;

  try {
    const course = await CourseDatabaseModel.findById(courseId)
      .populate({
        path: "students",
      })
      .exec();

    if (!course) {
      return res.status(404).send("Course not found");
    }

    let participationData = [];

    for (const student of course.students) {
      let studentParticipation = {
        lastName: student.lastName,
        firstName: student.firstName,
        participation: {},
      };

      for (const topic of course.topics) {
        // Count the total number of sessions conducted for this topic
        const totalSessions =
          await AttendanceSessionDatabaseModel.countDocuments({
            course: courseId,
            topic: topic,
          });

        // Count how many sessions this student attended for this topic
        const attendedSessions = await AttendanceDatabaseModel.countDocuments({
          student: student._id,
          course: courseId,
          topic: topic,
          status: "Present",
        });

        // Calculate participation percentage
        studentParticipation.participation[topic] =
          totalSessions > 0
            ? ((attendedSessions / totalSessions) * 100).toFixed(2) + "%"
            : "na";
      }

      participationData.push(studentParticipation);
    }

    res.json(participationData);
  } catch (error) {
    console.error("Error retrieving participation data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/participation/:studentNumber", async (req, res) => {
  const studentNumber = req.params.studentNumber;

  try {
    const student = await StudentDatabaseModel.findOne({
      studentNumber,
    }).exec();
    if (!student) {
      return res.status(404).send("Student not found");
    }

    const courses = student.courses.map((c) => c.course);

    let participationData = [];

    for (const courseId of courses) {
      const course = await CourseDatabaseModel.findById(courseId)
        .populate("topics")
        .exec();

      if (!course) {
        continue; // Skip if course not found
      }

      let studentParticipation = {
        courseName: course.name,
        participation: {},
      };

      for (const topic of course.topics) {
        const totalSessions =
          await AttendanceSessionDatabaseModel.countDocuments({
            course: courseId,
            topic: topic,
          });

        const attendedSessions = await AttendanceDatabaseModel.countDocuments({
          student: student._id,
          course: courseId,
          topic: topic,
          status: "Present",
        });

        studentParticipation.participation[topic] =
          totalSessions > 0
            ? ((attendedSessions / totalSessions) * 100).toFixed(2) + "%"
            : "N/A";
      }

      participationData.push(studentParticipation);
    }

    res.json(participationData);
  } catch (error) {
    console.error("Error retrieving participation data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/addtopic", async (req, res) => {
  try {
    const { name } = req.body;

    // Check if topic already exists
    const existingTopic = await TopicDatabaseModel.findOne({ name });
    if (existingTopic) {
      return res.status(409).json({ error: "Topic already exists" });
    }

    // Create new topic
    const newTopic = new TopicDatabaseModel({ name });
    await newTopic.save();

    res
      .status(201)
      .json({ message: "Topic created successfully", topicId: newTopic._id });
  } catch (error) {
    console.error("Error adding topic:", error);
    res.status(500).json({ error: "An error occurred while adding the topic" });
  }
});

app.get("/api/topics", async (req, res) => {
  try {
    const topics = await TopicDatabaseModel.find(); // Fetch all topics from the database
    res.status(200).json(topics); // Send the topics back in the response
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ error: "An error occurred while fetching topics" });
  }
});

app.delete("/api/topics/:id", async (req, res) => {
  try {
    const topicId = req.params.id;
    const topic = await TopicDatabaseModel.findByIdAndDelete(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    res.status(200).json({ message: "Topic deleted successfully" });
  } catch (error) {
    console.error("Error deleting topic:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the topic" });
  }
});

app.post("/addTeacherToCourse", async (req, res) => {
  const { courseId, userId } = req.body;

  try {
    const course = await CourseDatabaseModel.findById(courseId);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    if (!course.teachers.includes(userId)) {
      course.teachers.push(userId);
      await course.save();
    }

    res
      .status(200)
      .json({ message: "Teacher added successfully to the course" });
  } catch (error) {
    console.error("Error adding teacher to course:", error);
    res.status(500).json({
      error: "An error occurred while adding the teacher to the course",
    });
  }
});

app.get("/coursestudentscount/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Find the session document by its ID
    const session = await AttendanceSessionDatabaseModel.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Retrieve the course ID from the session document
    const courseId = session.course;

    // Find the course document by its ID
    const course = await CourseDatabaseModel.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Get the number of students in the course
    const studentCount = course.students.length;

    res.status(200).json({ studentCount });
  } catch (error) {
    console.error("Error fetching student count:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching student count" });
  }
});

app.post("/api/courses/:courseId/topics", async (req, res) => {
  const courseId = req.params.courseId;
  const { topicName } = req.body;

  try {
    const course = await CourseDatabaseModel.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!course.topics.includes(topicName)) {
      course.topics.push(topicName);
      await course.save();
      res
        .status(200)
        .json({ message: "Topic added successfully to the course" });
    } else {
      res.status(409).json({ message: "Topic already exists in this course" });
    }
  } catch (error) {
    console.error("Error adding topic to course:", error);
    res.status(500).json({
      error: "An error occurred while adding the topic to the course",
    });
  }
});

app.delete("/api/courses/:courseId/topics", async (req, res) => {
  const courseId = req.params.courseId;
  const { topicName } = req.body;

  try {
    const course = await CourseDatabaseModel.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const topicIndex = course.topics.indexOf(topicName);
    if (topicIndex > -1) {
      course.topics.splice(topicIndex, 1);
      await course.save();
      res
        .status(200)
        .json({ message: "Topic removed successfully from the course" });
    } else {
      res.status(404).json({ message: "Topic not found in this course" });
    }
  } catch (error) {
    console.error("Error removing topic from course:", error);
    res.status(500).json({
      error: "An error occurred while removing the topic from the course",
    });
  }
});

app.get("/enrolledstudents/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Find all attendance records with the matching session ID
    const attendanceRecords = await AttendanceDatabaseModel.find({
      session: sessionId,
    });

    // Extract the unique student IDs from the attendance records
    const studentIds = [
      ...new Set(attendanceRecords.map((record) => record.student)),
    ];

    // Fetch the student details based on the extracted student IDs
    const enrolledStudents = await StudentDatabaseModel.find({
      _id: { $in: studentIds },
    });

    res.status(200).json({ enrolledStudents });
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching enrolled students" });
  }
});

app.delete("/api/courses/:courseId/topics", async (req, res) => {
  const courseId = req.params.courseId;
  const { topicName } = req.body;

  try {
    const course = await CourseDatabaseModel.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const topicIndex = course.topics.indexOf(topicName);
    if (topicIndex > -1) {
      course.topics.splice(topicIndex, 1);
      await course.save();
      res
        .status(200)
        .json({ message: "Topic removed successfully from the course" });
    } else {
      res.status(404).json({ message: "Topic not found in this course" });
    }
  } catch (error) {
    console.error("Error removing topic from course:", error);
    res.status(500).json({
      error: "An error occurred while removing the topic from the course",
    });
  }
});

app.get("/download/attendance/pdf/:courseId", async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const course = await CourseDatabaseModel.findById(courseId)
      .populate({ path: "students" })
      .exec();

    if (!course) {
      return res.status(404).send("Course not found");
    }

    let participationData = [];

    for (const student of course.students) {
      let studentParticipation = {
        lastName: student.lastName,
        firstName: student.firstName,
        studentNumber: student.studentNumber, // Assuming you have studentNumber on student object
        participation: {},
      };

      for (const topic of course.topics) {
        const totalSessions =
          await AttendanceSessionDatabaseModel.countDocuments({
            course: courseId,
            topic: topic,
          });
        const attendedSessions = await AttendanceDatabaseModel.countDocuments({
          student: student._id,
          course: courseId,
          topic: topic,
          status: "Present",
        });

        studentParticipation.participation[topic] =
          totalSessions > 0
            ? ((attendedSessions / totalSessions) * 100).toFixed(2) + "%"
            : "N/A";
      }

      participationData.push(studentParticipation);
    }

    const doc = new PDFDocument();
    res.setHeader(
      "Content-disposition",
      'attachment; filename="attendance.pdf"'
    );
    res.setHeader("Content-type", "application/pdf");

    doc.fontSize(16).text(`Attendance Report for Course: ${course.name}`, {
      align: "center",
    });
    doc.moveDown(2);

    const tableColumns = [
      "Lastname",
      "Firstname",
      "Studentnumber",
      ...course.topics,
    ];
    const columnWidths = 100; // Modify this if you need wider columns
    const startX = 50;
    let startY = doc.y;

    // Headers
    tableColumns.forEach((header, i) => {
      doc.fontSize(12).text(header, startX + i * columnWidths, startY, {
        width: columnWidths,
        align: "center",
      });
    });

    startY += 20; // Space for header

    // Rows
    participationData.forEach((student) => {
      let xPosition = startX;
      doc.fontSize(10).text(student.lastName, xPosition, startY, {
        width: columnWidths,
        align: "center",
      });
      xPosition += columnWidths;
      doc.text(student.firstName, xPosition, startY, {
        width: columnWidths,
        align: "center",
      });
      xPosition += columnWidths;
      doc.text(student.studentNumber, xPosition, startY, {
        width: columnWidths,
        align: "center",
      });

      course.topics.forEach((topic) => {
        xPosition += columnWidths;
        doc.text(student.participation[topic], xPosition, startY, {
          width: columnWidths,
          align: "center",
        });
      });

      startY += 20; // Move down for next student row

      if (startY >= 700) {
        // Check for page end and add new page
        doc.addPage();
        startY = 50; // Reset startY for new page
      }
    });

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Error generating attendance report:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/download/attendance/excel/:courseId", async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const course = await CourseDatabaseModel.findById(courseId)
      .populate({ path: "students" })
      .exec();

    if (!course) {
      return res.status(404).send("Course not found");
    }

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    // Add headers to the Excel sheet
    const titleRow = worksheet.addRow([
      `Attendance Report for Course: ${course.name}`,
    ]);
    // Adjust the range according to the number of columns (topics + 3 for Lastname, Firstname, and Studentnumber)
    worksheet.mergeCells(1, 1, 1, course.topics.length + 3);
    titleRow.font = { size: 10, bold: true };
    titleRow.alignment = { horizontal: "center" };

    // Add headers to the Excel sheet
    const headers = [
      "Lastname",
      "Firstname",
      "Studentnumber",
      ...course.topics,
    ];
    worksheet.addRow(headers);

    for (const student of course.students) {
      let studentData = [
        student.lastName,
        student.firstName,
        student.studentNumber,
      ];

      for (const topic of course.topics) {
        const totalSessions =
          await AttendanceSessionDatabaseModel.countDocuments({
            course: courseId,
            topic: topic,
          });
        const attendedSessions = await AttendanceDatabaseModel.countDocuments({
          student: student._id,
          course: courseId,
          topic: topic,
          status: "Present",
        });

        const participation =
          totalSessions > 0
            ? ((attendedSessions / totalSessions) * 100).toFixed(2) + "%"
            : "N/A";
        studentData.push(participation);
      }

      // Add student data to the Excel sheet
      worksheet.addRow(studentData);
    }

    // Set content type and disposition for the response
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Send the Excel workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating attendance report:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/deactivatecourse", async (req, res) => {
  console.log("Deactivate course request received", req.body);
  try {
    const courseId = req.body.courseId;
    const updatedCourse = await CourseDatabaseModel.findByIdAndUpdate(
      courseId,
      { isActive: false },
      { new: true } // This option returns the updated document
    );

    if (!updatedCourse) {
      // If the course with the given ID is not found, return an error
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json(updatedCourse);
  } catch (error) {
    console.error("Error deactivating course:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deactivating the course" });
  }
});

app.get("/getcoursestudents/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Find the session document by its ID
    const session = await AttendanceSessionDatabaseModel.findById(
      sessionId
    ).populate("course");

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Assuming session.course now contains the full course document after population
    const courseId = session.course._id;

    // Find students enrolled in the course
    const students = await StudentDatabaseModel.find({
      courses: { $elemMatch: { course: courseId } },
    });

    // Map through the students to return only the required fields
    const studentData = students.map((student) => ({
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber: student.studentNumber,
    }));

    res.status(200).json({ students: studentData });
  } catch (error) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching students" });
  }
});

server.listen(3001, () => {
  console.log("Server is running in port 3001");
});
