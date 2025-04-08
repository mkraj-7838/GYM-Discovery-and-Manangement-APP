import express from "express";
import userCtrl from "../controller/user.js";
import isAuthenticated from "../middlewares/isAuth.js";
import Maintenance from "../models/Maintenance.js";

const router = express.Router();

//!Register
router.post("/register", userCtrl.register);
router.post("/login", userCtrl.login);
router.get("/profile", isAuthenticated, userCtrl.profile);
router.patch("/profile", isAuthenticated, userCtrl.updateProfile);


router.post

router.post("/maintenance", async (req, res) => {
    try {
        const maintenance = new Maintenance({
          ...req.body,
          // createdAt will be automatically added by Mongoose timestamps
        });
        await maintenance.save();
        res.status(201).json(maintenance);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
});

router.get("/maintenance", async (req, res) => {
  try {
    const reports = await Maintenance.find().sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    console.error("Error fetching maintenance:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/maintenance/:id", isAuthenticated, async (req, res) => {
    try {
        await Maintenance.findByIdAndDelete(req.params.id);
        res.json({ message: 'Report deleted successfully' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
  });

export default router;
