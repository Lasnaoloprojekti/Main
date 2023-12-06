const mongoose = require("mongoose");

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

const StudentDatabaseModel = mongoose.model("Student", StudentSchema);

module.exports = {
  StudentDatabaseModel,
};
