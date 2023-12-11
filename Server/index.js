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
    origin: "http://localhost:5174",
    methods: ["GET", "POST", "PUT"],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5174",
    methods: ["GET", "POST", "DELETE", "PUT"],
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

    // Fetch the course to get its topics
    const course = await CourseDatabaseModel.findById(courseId);
    if (!course) {
      return res.status(404).send(`Course not found with ID: ${courseId}`);
    }

    // Extract topics from the course
    const courseTopics = course.topics;

    const uniqueStudentNumbers = new Set();
    const duplicateStudentNumbers = new Set();

    // Iterate through the rows to check for duplicate student numbers
    students.forEach((row, index) => {
      const [, , , , studentNumber] = row;

      if (uniqueStudentNumbers.has(studentNumber)) {
        console.log(`Duplicate student number detected for ${studentNumber}`);
        duplicateStudentNumbers.add(studentNumber);
      } else {
        uniqueStudentNumbers.add(studentNumber);
      }
    });

    // If there are duplicate student numbers, send an error response
    if (duplicateStudentNumbers.size > 0) {
      const duplicateMessage = `There are students with identical student numbers: ${Array.from(duplicateStudentNumbers).join(', ')}`;
      console.log(duplicateMessage);
      return res.status(400).json({ message: duplicateMessage });
    }

    let newStudentsAdded = 0;
    let existingStudents = 0;

    const studentPromises = students.map(async (row, index) => {
      const [lastName, firstName, , email, studentNumber] = row;

      let student = await StudentDatabaseModel.findOne({ studentNumber });
      if (!student) {
        student = new StudentDatabaseModel({
          lastName,
          firstName,
          email,
          studentNumber,
          gdprConsent: false,
          courses: [{
            course: courseId,
            topicsAttending: courseTopics, // Add topics to the student's course record
          }],
        });
        newStudentsAdded++;
        await student.save();
      } else {
        const courseEntry = student.courses.find(c => c.course.toString() === courseId);
        if (!courseEntry) {
          student.courses.push({
            course: courseId,
            topicsAttending: courseTopics, // Add topics to the student's course record
          });
          existingStudents++;
          await student.save();
        }
      }

      if (course && !course.students.includes(student._id)) {
        course.students.push(student._id);
        await course.save();
      }

      console.log(`Processed student #${index + 1}: ${firstName} ${lastName}`);
    });

    await Promise.allSettled(studentPromises);

    let message =
      newStudentsAdded > 0
        ? `${newStudentsAdded} new students added.`
        : "No new students added.";

    if (existingStudents > 0) {
      message += ` ${existingStudents} students were already enrolled in the course.`;
    }

    res.status(200).json({ message: message, newStudentsAdded: newStudentsAdded > 0 });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send("Error processing file");
  }
});




// DEPLOYMENT ONLY

/*
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
    }

    if (!apiData.staff) {
      return res
        .status(403)
        .json({ error: "Access denied. Only staff can login." });
    }

    let existingUser = await UserDatabaseModel.findOne({ user: apiData.user });

    if (!existingUser) {
      existingUser = new UserDatabaseModel({
        user: apiData.user,
        firstName: apiData.firstname,
        lastName: apiData.lastname,
        email: apiData.email,
        staff: apiData.staff,
        courses: [],
      });
      await existingUser.save();
    }

    const accessToken = jwt.sign(
      { userId: existingUser._id, staff: apiData.staff },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.status(200).json({
      accessToken,
      userId: existingUser._id.toString(),
      staff: apiData.staff,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});
*/
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

    console.log('no mitäs sielt tulee? ', apiData);

    if (apiData.message === "invalid username or password") {
      return res.status(401).json({ error: "invalid username or password" });
    }

    // Temporarily bypass the staff check for testing
    // if (!apiData.staff) {
    //   return res.status(403).json({ error: "Access denied. Only staff can login." });
    // }

    let existingUser = await UserDatabaseModel.findOne({ user: apiData.user });

    if (!existingUser) {
      existingUser = new UserDatabaseModel({
        user: apiData.user,
        firstName: apiData.firstname,
        lastName: apiData.lastname,
        email: apiData.email,
        staff: apiData.staff,
        courses: [],
      });
      await existingUser.save();
    }
    let redirectUrl;



    redirectUrl = existingUser ? "/teacherhome" : "/teacherhome";
    apiData.userId = existingUser._id.toString();

    console.log("testiiiiiiiiiiiiiii", apiData.userId);

    const accessToken = jwt.sign(
      { userId: existingUser._id, staff: apiData.staff },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.status(200).json({
      redirectUrl,
      accessToken,
      userId: existingUser._id.toString(),
      staff: apiData.staff,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

app.get("/verify", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    try {
      // Fetch user details using the userId from the decoded token
      let existingUser = await UserDatabaseModel.findById(decoded.userId);

      const responseData = {
        user: existingUser ? existingUser.toObject() : null,
        staff: decoded.staff,
      };

      res.status(200).json(responseData);
    } catch (error) {
      console.error("Error in /verify:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

//DEPLOYMENT ONLY
/*
app.get("/verify", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    try {
      let existingUser = await UserDatabaseModel.findById(decoded.userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!decoded.staff) {
        return res
          .status(403)
          .json({ error: "Access denied. Only staff can access." });
      }

      const responseData = {
        user: existingUser.toObject(),
        staff: decoded.staff,
      };

      res.status(200).json(responseData);
    } catch (error) {
      console.error("Error in /verify:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
});
*/
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
            gdprConsent: false,
            courses: [{ course: newCourse._id }], // Assign course ID to new student
          });
        } else {
          // Add course to existing student's course list if not already present
          if (!student.courses.some(c => c.course && c.course.equals(newCourse._id))) {
            student.courses.push({ course: newCourse._id });
          }
        }

        await student.save();

        // Add student ID to the course's student list
        newCourse.students.push(student._id);
      }

      // Save the course with the updated student list
      await newCourse.save();
    }

    res.status(200).json({ message: "Course created successfully", courseId: newCourse._id });

  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "An error occurred while creating the course" });
  }
});


app.post("/api/students/updategdpr", async (req, res) => {
  const { studentNumber, gdprConsent } = req.body;

  try {
    const updatedStudent = await StudentDatabaseModel.findOneAndUpdate(
      { studentNumber }, // Find by a unique identifier
      { gdprConsent }, // Update the gdprConsent field
      { new: true } // Return the updated document
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

app.post("/addstudents", async (req, res) => {
  const { studentsToAdd, courseId } = req.body;

  console.log("Add students request received", studentsToAdd);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const course = await CourseDatabaseModel.findById(courseId).session(session);
    console.log("Course topics:", course.topics);
    if (!course) {
      await session.abortTransaction();
      console.log("Course topics:", course.topics);
      session.endSession();
      return res.status(404).send(`Course not found with ID: ${courseId}`);

    }
    console.log("Course topics:", course);
    // Extract topics from the course
    const courseTopics = course.topics;

    console.log("Course topics:", course.topics);

    let addedStudents = [];

    for (const studentData of studentsToAdd) {
      const { firstName, lastName, studentNumber } = studentData;

      console.log("Processing student:", firstName, lastName, studentNumber);

      let existingStudent = await StudentDatabaseModel.findOne({ studentNumber }).session(session);

      if (!existingStudent) {
        existingStudent = new StudentDatabaseModel({
          firstName,
          lastName,
          studentNumber,
          gdprConsent: false,
          courses: [{
            course: courseId,
            topicsAttending: courseTopics, // Add topics to the student's course record
          }],
        });

        await existingStudent.save({ session });
        addedStudents.push(existingStudent);
      } else {
        const courseEntry = existingStudent.courses.find(c => c.course.toString() === courseId);
        if (!courseEntry) {
          existingStudent.courses.push({
            course: courseId,
            topicsAttending: courseTopics, // Add topics to the student's course record
          });
          await existingStudent.save({ session });
          addedStudents.push(existingStudent);
        }
      }

      if (!course.students.includes(existingStudent._id)) {
        course.students.push(existingStudent._id);
      }
    }

    await course.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: `${addedStudents.length} student(s) added/updated successfully.`,
      addedStudents,
    });
  } catch (error) {
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

app.post("/unregister", async (req, res) => {
  const { studentNumber, sessionId } = req.body;
  console.log("Unregister request received", req.body);

  try {
    // Find the student's ID based on their student number
    const existingStudent = await StudentDatabaseModel.findOne({
      studentNumber,
    });
    if (!existingStudent) {
      return res.status(404).send("Student not found");
    }

    // Find and delete the specific attendance record
    const result = await AttendanceDatabaseModel.deleteOne({
      student: existingStudent._id,
      session: sessionId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).send("Attendance record not found");
    }

    // Optionally, update the session's studentsPresent array
    const session = await AttendanceSessionDatabaseModel.findById(sessionId);
    if (session) {
      session.studentsPresent = session.studentsPresent.filter(
        (s) => !s.equals(existingStudent._id)
      );
      await session.save();
    }

    // Optionally emit an event for real-time updates
    io.emit("studentRemoved", {
      firstName: existingStudent.firstName,
      lastName: existingStudent.lastName,
      sessionId: sessionId,
    });

    res.status(200).send("Student unregistered successfully");
  } catch (error) {
    console.error("Error during unregistration:", error);
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

app.post("/newsessionidentifier", async (req, res) => {
  console.log("New session identifier request received", req.body);
  const { sessionId, qrIdentifier } = req.body;

  try {
    // Find the session by its ID
    const session = await AttendanceSessionDatabaseModel.findById(sessionId);

    if (!session) {
      return res.status(404).send("Session not found");
    }

    // Update the qrCodeIdentifier
    session.qrCodeIdentifier = qrIdentifier;
    await session.save();

    res.status(200).send("Session QR code identifier updated successfully");
  } catch (error) {
    console.error("Error updating session QR code identifier:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/qrcoderegistration", async (req, res) => {
  console.log("qrcode registration received");
  const { studentNumber, qrCodeIdentifier } = req.body;

  console.log('new qr registration: ', qrCodeIdentifier, " studentnumber ", studentNumber);

  try {
    // Find student based on student number
    const student = await StudentDatabaseModel.findOne({ studentNumber });
    if (!student) {
      return res.status(404).send("Student not found");
    }

    // Find session based on QR code identifier
    const session = await AttendanceSessionDatabaseModel.findOne({
      qrCodeIdentifier: qrCodeIdentifier,
      isOpen: true,
    }).populate("course");

    if (!session) {
      return res.status(404).send("Session not found or closed");
    }

    // Check if student is enrolled in the course related to the session
    const isEnrolled = student.courses.some(courseEnrollment => courseEnrollment.course.equals(session.course._id));
    if (!isEnrolled) {
      return res.status(403).send("Student not enrolled in this course");
    }

    // Check if student is already registered in the session
    if (session.studentsPresent.some(s => s.equals(student._id))) {
      return res.status(400).json({ message: "You have already enrolled to current session!" });
    }

    // Register the student in the found session
    session.studentsPresent.push(student._id);
    await session.save();

    io.emit("studentAdded", {
      firstName: student.firstName,
      lastName: student.lastName,
    });

    console.log('Student Courses:', student.courses.map(course => course.toString()));
    console.log('Session Course ID:', session.course._id.toString());

    const newAttendance = new AttendanceDatabaseModel({
      session: session._id,
      student: student._id,
      course: session.course._id,
      topic: session.topic,
      date: session.date,
      timeOfDay: session.timeOfDay,
      status: "Present",
      gdprConsent: student.gdprConsent,
    });

    console.log("newAttendance", newAttendance);

    await newAttendance.save();

    return res.status(200).json({
      message: "Great! You are now registered to current session",
      sessionId: session._id,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/registration", async (req, res) => {
  const { studentNumber } = req.body;

  try {
    // Find student based on student number
    const existingStudent = await StudentDatabaseModel.findOne({
      studentNumber,
    });
    if (!existingStudent) {
      return res.status(404).send("Student not found");
    }

    // Iterate through student's courses to find open sessions
    for (let courseEnrollment of existingStudent.courses) {
      const openSessions = await AttendanceSessionDatabaseModel.find({
        course: courseEnrollment.course,
        isOpen: true,
      }).populate("studentsPresent");

      for (let session of openSessions) {
        // Check if student is already registered in the session
        if (
          session.studentsPresent.some((s) => s._id.equals(existingStudent._id))
        ) {
          return res
            .status(400)
            .send("Student already registered in this session");
        }
      }

      // If student is not registered in any open session, register them in the first one
      if (openSessions.length > 0) {
        const sessionToUpdate = openSessions[0]; // Assuming we take the first open session
        sessionToUpdate.studentsPresent.push(existingStudent._id);
        await sessionToUpdate.save();

        io.emit("studentAdded", {
          firstName: existingStudent.firstName,
          lastName: existingStudent.lastName,
        });

        const newAttendance = new AttendanceDatabaseModel({
          session: sessionToUpdate._id,
          student: existingStudent._id,
          course: courseEnrollment.course,
          topic: sessionToUpdate.topic,
          date: sessionToUpdate.date,
          timeOfDay: sessionToUpdate.timeOfDay,
          status: "Present",
          gdprConsent: existingStudent.gdprConsent,
        });

        console.log("newAttendance", newAttendance);

        await newAttendance.save();

        return res.status(200).json({
          message: "Student registered for session",
          sessionId: sessionToUpdate._id,
        });
      }
    }

    // If no open sessions found for any of the student's courses
    return res.status(404).send("No open sessions available for your courses");
  } catch (error) {
    console.error("Error during registration:", error);
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

    // Close the session
    session.isOpen = false;
    await session.save();

    // Fetch all students in the course
    const course = await CourseDatabaseModel.findById(session.course);
    if (!course) {
      return res.status(404).send("Course not found");
    }

    // Fetch all attendance records for this session
    const attendances = await AttendanceDatabaseModel.find({ session: sessionId });

    // Get student IDs who have already enrolled in the session
    const enrolledStudentIds = attendances.map(attendance => attendance.student.toString());

    // Identify students who have not enrolled and mark them as absent
    for (let student of course.students) {
      if (!enrolledStudentIds.includes(student.toString())) {
        const newAttendance = new AttendanceDatabaseModel({
          session: sessionId,
          student: student,
          course: session.course,
          topic: session.topic,
          date: session.date,
          timeOfDay: session.timeOfDay,
          status: "Absent",
          gdprConsent: false // Set this according to your application's logic
        });
        await newAttendance.save();
      }
    }

    io.emit("sessionClosed", { sessionId: session._id });
    res.status(200).send("Session closed successfully and absentees marked");
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
        populate: { path: "courses.course" }
      })
      .exec();

    if (!course) {
      return res.status(404).send("Course not found");
    }

    let participationData = [];

    for (const existingStudent of course.students) {
      let studentParticipation = {
        lastName: existingStudent.lastName,
        firstName: existingStudent.firstName,
        participation: {},
      };

      // Retrieve the student's topics attending for this course
      const studentCourseData = existingStudent.courses.find(c => c.course._id.toString() === courseId);
      const topicsAttending = studentCourseData ? studentCourseData.topicsAttending : [];

      for (const topic of course.topics) {
        // If the student is not attending the topic, mark as "NA"
        if (!topicsAttending.includes(topic)) {
          studentParticipation.participation[topic] = "NA";
          continue;
        }

        // Count the total number of sessions conducted for this topic
        const totalSessions = await AttendanceSessionDatabaseModel.countDocuments({
          course: courseId,
          topic: topic,
        });

        // Count how many sessions this student attended for this topic
        const attendedSessions = await AttendanceDatabaseModel.countDocuments({
          student: existingStudent._id,
          course: courseId,
          topic: topic,
          status: "Present",
        });

        // Calculate participation percentage
        studentParticipation.participation[topic] = totalSessions > 0
          ? ((attendedSessions / totalSessions) * 100).toFixed(2) + "%"
          : "NA"; // Changed from "na" to "NA" to match your requirement
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
    const existingStudent = await StudentDatabaseModel.findOne({
      studentNumber,
    })
      .populate({
        path: 'courses.course',
        populate: { path: 'topics' }
      })
      .exec();

    if (!existingStudent) {
      return res.status(404).send("Student not found");
    }

    let participationData = [];

    for (const courseEnrollment of existingStudent.courses) {
      const course = courseEnrollment.course;

      if (!course) {
        continue; // Skip if course not found
      }

      let studentParticipation = {
        courseName: course.name,
        participation: {},
      };

      for (const topic of course.topics) {
        // Check if the student is participating in the topic
        if (!courseEnrollment.topicsAttending.includes(topic.name)) {
          studentParticipation.participation[topic.name] = "N/A";
          continue;
        }

        const totalSessions = await AttendanceSessionDatabaseModel.countDocuments({
          course: course._id,
          topic: topic.name,
        });

        const attendedSessions = await AttendanceDatabaseModel.countDocuments({
          student: existingStudent._id,
          course: course._id,
          topic: topic.name,
          status: "Present",
        });

        studentParticipation.participation[topic.name] = totalSessions > 0
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

app.get("/enrolledstudents/:sessionId", async (req, res) => {
  console.log('Received a request for enrolled students');
  const { sessionId } = req.params;
  console.log('Session id:', sessionId);

  try {
    console.log('Trying to fetch enrolled students for session:', sessionId);
    // Find all attendance records with the matching session ID
    const attendanceRecords = await AttendanceDatabaseModel.find({
      session: sessionId,
    });
    console.log('attendancerecords ');

    // Extract the unique student IDs from the attendance records
    const studentIds = [
      ...new Set(attendanceRecords.map((record) => record.student)),
    ];

    console.log('Fetched attendance records:', attendanceRecords);
    console.log('Extracted student IDs:', studentIds);

    // Fetch the student details based on the extracted student IDs
    const enrolledStudents = await StudentDatabaseModel.find({
      _id: { $in: studentIds },
    });

    console.log('Fetched enrolled students:', enrolledStudents);

    res.status(200).json({ enrolledStudents });
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    res.status(500).json({ error: "An error occurred while fetching enrolled students" });
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

    for (const existingStudent of course.students) {
      let studentParticipation = {
        lastName: existingStudent.lastName,
        firstName: existingStudent.firstName,
        studentNumber: existingStudent.studentNumber, // Assuming you have studentNumber on student object
        participation: {},
      };

      for (const topic of course.topics) {
        const totalSessions =
          await AttendanceSessionDatabaseModel.countDocuments({
            course: courseId,
            topic: topic,
          });
        const attendedSessions = await AttendanceDatabaseModel.countDocuments({
          student: existingStudent._id,
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
    participationData.forEach((existingStudent) => {
      let xPosition = startX;
      doc.fontSize(10).text(existingStudent.lastName, xPosition, startY, {
        width: columnWidths,
        align: "center",
      });
      xPosition += columnWidths;
      doc.text(existingStudent.firstName, xPosition, startY, {
        width: columnWidths,
        align: "center",
      });
      xPosition += columnWidths;
      doc.text(existingStudent.studentNumber, xPosition, startY, {
        width: columnWidths,
        align: "center",
      });

      course.topics.forEach((topic) => {
        xPosition += columnWidths;
        doc.text(existingStudent.participation[topic], xPosition, startY, {
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
    // Fetch the course and populate the students
    const course = await CourseDatabaseModel.findById(courseId)
      .populate({
        path: "students",
        populate: { path: "courses.course" } // Assuming this is the correct path for your schema
      })
      .exec();

    if (!course) {
      return res.status(404).send("Course not found");
    }

    // Create a new Excel workbook and a worksheet
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    // Set up the header row in the worksheet
    const titleRow = worksheet.addRow([`Attendance Report for Course: ${course.name}`]);
    worksheet.mergeCells(1, 1, 1, course.topics.length + 3);
    titleRow.font = { size: 10, bold: true };
    titleRow.alignment = { horizontal: "center" };

    // Add headers for student details and topics
    const headers = ["Lastname", "Firstname", "Studentnumber", ...course.topics];
    worksheet.addRow(headers);

    // Iterate over each student to calculate their attendance
    for (const existingStudent of course.students) {
      let studentData = [
        existingStudent.lastName,
        existingStudent.firstName,
        existingStudent.studentNumber,
      ];

      // Find the student's course enrollment
      const studentCourseData = existingStudent.courses.find(c => c.course._id.toString() === courseId);
      const topicsAttending = studentCourseData ? studentCourseData.topicsAttending : [];

      // Iterate over each topic to calculate participation
      for (const topic of course.topics) {
        // If the student is not attending the topic, mark as "N/A"
        if (!topicsAttending.includes(topic)) {
          studentData.push("N/A");
          continue;
        }

        // Count total and attended sessions for each topic
        const totalSessions = await AttendanceSessionDatabaseModel.countDocuments({ course: courseId, topic: topic });
        const attendedSessions = await AttendanceDatabaseModel.countDocuments({
          student: existingStudent._id,
          course: courseId,
          topic: topic,
          status: "Present",
        });

        // Calculate participation percentage or mark as "N/A"
        const participation = totalSessions > 0
          ? ((attendedSessions / totalSessions) * 100).toFixed(2) + "%"
          : "N/A";
        studentData.push(participation);
      }

      // Add the student's data row to the worksheet
      worksheet.addRow(studentData);
    }

    // Set headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="attendance.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // Write the workbook to the response
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
    const studentData = students.map((existingStudent) => ({
      firstName: existingStudent.firstName,
      lastName: existingStudent.lastName,
      studentNumber: existingStudent.studentNumber,
    }));

    res.status(200).json({ students: studentData });
  } catch (error) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching students" });
  }
});

app.get("/getstudentsbycourse/:courseId", async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await CourseDatabaseModel.findById(courseId).populate("students");
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json({ students: course.students });
  } catch (error) {
    console.error("Error fetching students for course:", error);
    res.status(500).json({ error: "An error occurred while fetching students for the course" });
  }
});

app.get('/api/studenttopics/:studentId/:courseId', async (req, res) => {
  const { studentId, courseId } = req.params;

  try {
    // Find the course to get its topics
    const course = await CourseDatabaseModel.findById(courseId).select('topics');
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Find the student and get the topics they are attending in the specified course
    const student = await StudentDatabaseModel.findOne({ _id: studentId, 'courses.course': courseId });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Extracting topics attending for this specific course
    const courseData = student.courses.find(c => c.course.toString() === courseId);
    const attendingTopics = courseData ? courseData.topicsAttending : [];

    res.status(200).json({
      courseTopics: course.topics, // All topics from the course
      attendingTopics: attendingTopics // Topics the student is attending
    });
  } catch (error) {
    console.error("Error fetching student topics:", error);
    res.status(500).json({ error: "An error occurred while fetching topics" });
  }
});

app.put('/api/updatestudenttopics/:studentId/:courseId', async (req, res) => {
  const { studentId, courseId } = req.params;
  const { topicsAttending } = req.body; // Expecting an array of topic names

  try {
    // Find the student and the specific course enrollment
    const student = await StudentDatabaseModel.findOne({
      _id: studentId,
      'courses.course': courseId
    });

    if (!student) {
      return res.status(404).send('Student or course not found');
    }

    // Locate the course enrollment and update the topicsAttending
    const courseEnrollment = student.courses.find(enrollment => enrollment.course.toString() === courseId);
    if (!courseEnrollment) {
      return res.status(404).send('Course enrollment not found for student');
    }

    // Update the topicsAttending array for the found course enrollment
    courseEnrollment.topicsAttending = topicsAttending;

    await student.save(); // Save the updated student document
    res.status(200).json({ message: 'Student topics updated successfully', student });
  } catch (error) {
    console.error('Error updating student topics:', error);
    res.status(500).send('Internal Server Error');
  }
});

//uudet endpointit

app.get('/api/coursestudents/:courseId', async (req, res) => {

  const courseId = req.params.courseId;
  try {

    const course = await CourseDatabaseModel.findById(courseId).populate('students');
    if (!course) {
      console.error("Course not found with ID:", courseId);
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json({ students: course.students });
  } catch (error) {
    console.error("Error fetching course students:", error);
    res.status(500).json({ error: "An error occurred while fetching students", details: error.message });
  }
});

app.get('/api/studentattendance/:studentId/:courseId', async (req, res) => {
  console.log('studentId request received', req.params);
  const { studentId, courseId } = req.params;
  console.log('studentId request received', studentId);
  try {

    const attendances = await AttendanceDatabaseModel.find({
      student: studentId,
      course: courseId
    });
    res.status(200).json({ attendances });
  } catch (error) {
    console.error("Error fetching student attendances:", error);
    res.status(500).json({ error: "An error occurred while fetching attendances" });
  }
});

app.post('/api/updateattendancestatus', async (req, res) => {
  const { attendanceId, newStatus } = req.body;

  try {
    const attendance = await AttendanceDatabaseModel.findByIdAndUpdate(attendanceId, { status: newStatus }, { new: true }).populate('session');
    if (!attendance) return res.status(404).json({ error: "Attendance not found" });

    const session = await AttendanceSessionDatabaseModel.findById(attendance.session._id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (newStatus === "Present" || newStatus === "Accept absence") {
      if (!session.studentsPresent.includes(attendance.student._id)) {
        session.studentsPresent.push(attendance.student._id);
      }
    } else if (newStatus === "Absent") {
      session.studentsPresent = session.studentsPresent.filter(studentId => !studentId.equals(attendance.student._id));
    }

    await session.save();
    res.status(200).json({ message: "Attendance status updated successfully" });
  } catch (error) {
    console.error("Error updating attendance status:", error);
    res.status(500).json({ error: "An error occurred while updating attendance status" });
  }
});

//topic things here

app.get('/api/studenttopics/:studentId/:courseId', async (req, res) => {
  const { studentId, courseId } = req.params;

  try {
    // Find the course to get its topics
    const course = await CourseDatabaseModel.findById(courseId).select('topics');
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Find the student and get the topics they are attending in the specified course
    const student = await StudentDatabaseModel.findOne({ _id: studentId, 'courses.course': courseId });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Extracting topics attending for this specific course
    const courseData = student.courses.find(c => c.course.toString() === courseId);
    const attendingTopics = courseData ? courseData.topicsAttending : [];

    res.status(200).json({
      courseTopics: course.topics, // All topics from the course
      attendingTopics: attendingTopics // Topics the student is attending
    });
  } catch (error) {
    console.error("Error fetching student topics:", error);
    res.status(500).json({ error: "An error occurred while fetching topics" });
  }
});

app.put('/api/updatestudenttopics/:studentId/:courseId', async (req, res) => {
  const { studentId, courseId } = req.params;
  const { topicsAttending } = req.body; // Expecting an array of topic names
  console.log("PYYNTT");

  try {
    // Find the student and the specific course enrollment
    const student = await StudentDatabaseModel.findOne({
      _id: studentId,
      'courses.course': courseId
    });

    if (!student) {
      return res.status(404).send('Student or course not found');
    }

    // Locate the course enrollment and update the topicsAttending
    const courseEnrollment = student.courses.find(enrollment => enrollment.course.toString() === courseId);
    if (!courseEnrollment) {
      return res.status(404).send('Course enrollment not found for student');
    }

    // Update the topicsAttending array for the found course enrollment
    courseEnrollment.topicsAttending = topicsAttending;

    await student.save(); // Save the updated student document
    res.status(200).json({ message: 'Student topics updated successfully', student });
  } catch (error) {
    console.error('Error updating student topics:', error);
    res.status(500).send('Internal Server Error');
  }
});

server.listen(3001, () => {
  console.log("Server is running in port 3001");
});
