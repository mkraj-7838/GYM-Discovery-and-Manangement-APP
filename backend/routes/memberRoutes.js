import express from "express";
import Member from "../models/Member.js";
import isAuthenticated from "../middlewares/isAuth.js";
import { addMember, getMembersByUser } from "../controller/memberController.js";
import { ObjectId } from 'mongodb';

const router = express.Router();

router.post("/", isAuthenticated, addMember); // Add a new member (linked to user)
router.get("/", isAuthenticated, getMembersByUser); // Get members added by logged-in user

router.get("/member-stats", async (req, res) => {
  try {
    const activeCount = await Member.countDocuments({ status: "active" });
    const inactiveCount = await Member.countDocuments({ status: "inactive" });
    const trialCount = await Member.countDocuments({ status: "trial" });
    
    const basicCount = await Member.countDocuments({ membershipPlan: "basic" });
    const premiumCount = await Member.countDocuments({
      membershipPlan: "premium",
    });
    const vipCount = await Member.countDocuments({ membershipPlan: "vip" });

    const stats = {
      memberStatus: {
        active: activeCount,
        inactive: inactiveCount,
        trial: trialCount,
      },
      membershipPlans: {
        basic: basicCount,
        premium: premiumCount,
        vip: vipCount,
      },
    };

    console.log("✅ Member Stats Fetched:", stats); // ✅ Debugging log
    res.json(stats);
  } catch (err) {
    console.error("❌ Error Fetching Member Stats:", err);
    res.status(500).json({ error: "Failed to fetch member stats" });
  }
});

// ✅ Get Member by ID
router.get("/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      console.warn("⚠️ Member Not Found:", req.params.id); // ✅ Log missing ID warning
      return res.status(404).json({ error: "Member not found" });
    }
    res.json(member);
  } catch (err) {
    console.error("❌ Error Fetching Member:", err); // ✅ Log error
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const memberId = req.params.id; // Get the member ID from the request parameters

    // Check if the memberId is a valid ObjectId
    if (!ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid member ID" });
    }

    // Convert the memberId to an ObjectId
    const objectId = new ObjectId(memberId);

    // Check if the member exists
    const member = await Member.findById(objectId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Delete the member
    await Member.findByIdAndDelete(objectId);

    // Send success response
    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    res.status(500).json({ message: "An error occurred while deleting the member" });
  }
});


router.patch("/:id", async (req, res) => {
  try {
    const memberId = req.params.id; // Get member ID from request parameters
    const updateData = req.body; // Get update data from request body

    // Check if the memberId is a valid ObjectId
    if (!ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid member ID" });
    }

    // Convert the memberId to an ObjectId
    const objectId = new ObjectId(memberId);

    // Check if the member exists before updating
    const member = await Member.findById(objectId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Update the member
    const updatedMember = await Member.findByIdAndUpdate(
      objectId,
      { $set: updateData }, // Update only provided fields
      { new: true, runValidators: true } // Return updated document & validate schema
    );

    // Send success response
    res.status(200).json({ message: "Member updated successfully", updatedMember });
  } catch (error) {
    console.error("Error updating member:", error);
    res.status(500).json({ message: "An error occurred while updating the member" });
  }
});

export default router;
