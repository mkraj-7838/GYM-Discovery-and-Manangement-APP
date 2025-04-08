import express from "express";
import Member from "../models/Member.js";
import MemberForm from "../models/MemberForm.js"
import isAuthenticated from "../middlewares/isAuth.js";
import { addMember, getMembersByUser } from "../controller/memberController.js";
import { ObjectId } from 'mongodb';

const router = express.Router();

router.post("/", isAuthenticated, addMember); // Add a new member (linked to user)

router.get("/", isAuthenticated, getMembersByUser); // Get members added by logged-in user


router.post("/form-member", async (req, res) => {
  try {
      const memberData = req.body;
      
      // Convert joiningDate string to Date object
      memberData.joiningDate = new Date(memberData.joiningDate);
      
      // Create new member
      const member = new MemberForm(memberData);
      await member.save();
      
      res.status(201).json({ 
          success: true,
          message: 'Member added successfully',
          data: member
      });
  } catch (error) {
      console.error('Error adding member:', error);
      res.status(500).json({ 
          success: false,
          message: error.message || 'Error adding member'
      });
  }
});

router.post('/form-member/search', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required in the request body'
      });
    }

    const member = await MemberForm.findOne({ 
      phone: { $regex: new RegExp(`^${phone}$`, 'i') } 
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      data: member
    });

  } catch (error) {
    console.error('Error fetching member by phone:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching member'
    });
  }
});

router.get('/form-member', async (req, res) => {
  try {
      const members = await MemberForm.find().sort({ createdAt: -1 });
      res.json({ 
          success: true,
          data: members
      });
  } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ 
          success: false,
          message: 'Error fetching members'
      });
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
