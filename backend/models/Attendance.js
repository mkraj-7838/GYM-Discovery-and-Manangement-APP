import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  attendanceStatus: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
