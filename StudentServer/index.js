require("dotenv").config();

const express = require("express");
const { createServer } = require("node:http");
const mongoose = require("mongoose");
const cors = require("cors");
const { StudentDatabaseModel } = require("./models/collectionSchemas");
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
    origin: ["http://localhost:5174"],
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

server.listen(3002, () => {
  console.log("Server is running in port 3002");
});
