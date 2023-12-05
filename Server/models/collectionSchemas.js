const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//***Student Schema***
const StudentSchema = new mongoose.Schema({
  user: String,
  firstName: String,
  lastName: String,
  studentNumber: { type: String, unique: true },
  gdprConsent: Boolean,
  courses: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      attendance: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Attendance",
        },
      ],
      topicsAttending: [
        {
          type: String,
        },
      ],
    },
  ],
  // Other fields related to attendance...
});

//***Attendance Schema***

const AttendanceSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AttendanceSession",
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  topic: String,
  date: Date,
  timeOfDay: String, // "Morning" or "Afternoon"
  status: String, // "Present", "Absent", "Excused"
  gdprConsent: Boolean,
});

const AttendanceSessionSchema = new mongoose.Schema({
  qrCodeIdentifier: {
    type: String,
    default: ''
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  timeOfDay: {
    type: String,
    enum: ["Morning", "Afternoon"],
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
  studentsPresent: [
    {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
});

//***User Schema***

const UserSchema = new mongoose.Schema({
  user: String,
  firstName: String,
  lastName: String,
  email: String,
  staff: Boolean,
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
});

//***course Schema***

const CourseSchema = new mongoose.Schema({
  name: String,
  groupName: String,
  startDate: Date,
  endDate: Date,
  topics: [String],
  teachers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  isActive: Boolean,
});

//**Topics Schema */
const TopicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

//Setting the Schemas to models

const CourseDatabaseModel = mongoose.model("Course", CourseSchema);
const UserDatabaseModel = mongoose.model("User", UserSchema);
const AttendanceDatabaseModel = mongoose.model("Attendance", AttendanceSchema);
const AttendanceSessionDatabaseModel = mongoose.model(
  "AttendanceSession",
  AttendanceSessionSchema
);
const StudentDatabaseModel = mongoose.model("Student", StudentSchema);
const TopicDatabaseModel = mongoose.model("Topic", TopicSchema);

module.exports = {
  UserDatabaseModel,
  CourseDatabaseModel,
  StudentDatabaseModel,
  AttendanceDatabaseModel,
  AttendanceSessionDatabaseModel,
  TopicDatabaseModel,
};
