import express from "express";
import Attendance from "../models/Attendance.js";
import moment from "moment";

const router = express.Router();

// Mark attendance
router.post("/", async (req, res) => {
  try {
    const { memberId, date, attendanceStatus} = req.body;

    // Validate required fields
    if (!memberId || !date || !attendanceStatus) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingAttendance = await Attendance.findOne({ memberId, date });

    if (existingAttendance) {
      existingAttendance.attendanceStatus = attendanceStatus;
      if (checkInTime) existingAttendance.checkInTime = checkInTime;
      await existingAttendance.save();
      return res.status(200).json(existingAttendance);
    }

    const newAttendance = new Attendance({
      memberId,
      date,
      attendanceStatus,
    });

    await newAttendance.save();
    res.status(201).json(newAttendance);
  } catch (error) {
    console.error("Error submitting attendance:", error);
    res.status(500).json({ message: "Error submitting attendance", error: error.message });
  }
});

// Get attendance by date
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    const attendanceData = await Attendance.find({ date });
    res.status(200).json(attendanceData);
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ message: "Error fetching attendance data", error: error.message });
  }
});

router.get("/all", async (req, res) => {
    try {
      const allAttendanceData = await Attendance.find();
      res.status(200).json(allAttendanceData);
    } catch (error) {
      console.error("Error fetching all attendance data:", error);
      res.status(500).json({ message: "Error fetching all attendance data", error: error.message });
    }
  });

export default router;
