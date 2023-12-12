require("dotenv").config();

const express = require("express");
const { createServer } = require("node:http");
const mongoose = require("mongoose");
const cors = require("cors");
const {
  StudentDatabaseModel,
  AttendanceSessionDatabaseModel,
  AttendanceDatabaseModel,
  CourseDatabaseModel,
} = require("./models/collectionSchemas");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const fetch = require("node-fetch");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5174",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
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
app.post("/studentlogin", async (req, res) => {
  const { username, password, studentNumber } = req.body;

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
      let existingStudent = await StudentDatabaseModel.findOne({
        studentNumber,
      });

      if (!existingStudent) {
        // Create a new user if staff
        existingStudent = new StudentDatabaseModel({
          student: apiData.student,
          studentNumber: studentNumber,
          gdprConsent: false,
          firstName: apiData.firstname,
          lastName: apiData.lastname,
          email: apiData.email,
        });
        await existingStudent.save();
      }
      let redirectUrl;

      redirectUrl = existingStudent.gdprConsent
        ? "/studenthome"
        : "/gdprconsentform";
      apiData.userId = existingStudent._id.toString();

      const accessToken = jwt.sign(
        {
          studentNumber: studentNumber,
          staff: apiData.staff,
        },
        process.env.ACCESS_TOKEN_SECRET
      );

      apiData.accessToken = accessToken;

      res.status(200).json({ apiData, redirectUrl });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

app.get("/studentverify", async (req, res) => {
  console.log("verify request received");
  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    try {
      let existingStudent = null;

      if (decoded.studentNumber) {
        existingStudent = await StudentDatabaseModel.findOne({
          studentNumber: decoded.studentNumber,
        });
      }

      console.log("verifying");

      const responseData = {
        student: existingStudent ? existingStudent.toObject() : null,
      };

      res.status(200).json(responseData);
    } catch (error) {
      console.error("Error in /verify:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

app.post("/qrcoderegistration", async (req, res) => {
  console.log("qrcode registration received");
  const { studentNumber, qrCodeIdentifier } = req.body;

  console.log(
    "new qr registration: ",
    qrCodeIdentifier,
    " studentnumber ",
    studentNumber
  );

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
    const isEnrolled = student.courses.some((courseEnrollment) =>
      courseEnrollment.course.equals(session.course._id)
    );
    if (!isEnrolled) {
      return res.status(403).send("Student not enrolled in this course");
    }

    // Check if student is already registered in the session
    if (session.studentsPresent.some((s) => s.equals(student._id))) {
      return res
        .status(400)
        .json({ message: "You have already enrolled to current session!" });
    }

    // Register the student in the found session
    session.studentsPresent.push(student._id);
    await session.save();

    io.emit("studentAdded", {
      firstName: student.firstName,
      lastName: student.lastName,
    });

    console.log(
      "Student Courses:",
      student.courses.map((course) => course.toString())
    );
    console.log("Session Course ID:", session.course._id.toString());

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

app.get("/api/participation/:studentNumber", async (req, res) => {
  const studentNumber = req.params.studentNumber;

  try {
    const existingStudent = await StudentDatabaseModel.findOne({
      studentNumber,
    }).exec();
    if (!existingStudent) {
      return res.status(404).send("Student not found");
    }

    const courses = existingStudent.courses.map((c) => c.course);

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

    res.json(participationData);
  } catch (error) {
    console.error("Error retrieving participation data:", error);
    res.status(500).send("Internal Server Error");
  }
});

server.listen(3002, () => {
  console.log("Server is running in port 3002");
});
