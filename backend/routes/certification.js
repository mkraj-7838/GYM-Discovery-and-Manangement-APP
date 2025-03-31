import express from "express";
import Certification from "../models/Certification.js";
import isAuthenticated from "../middlewares/isAuth.js";

const router = express.Router();

// @route   POST api/user/certifications
// @desc    Add a new certification
// @access  Private
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { title, description, certificatePhoto, issuedBy, issueDate } = req.body;

    const newCertification = new Certification({
      title,
      description,
      certificatePhoto,
      issuedBy,
      issueDate,
      user: req.user.id, // Assuming verifyToken middleware adds user to req
    });

    const certification = await newCertification.save();
    res.status(201).json(certification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/user/certifications
// @desc    Get all certifications for the authenticated user
// @access  Private
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const certifications = await Certification.find({ user: req.user.id });
    res.json(certifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/user/certifications/:id
// @desc    Get single certification by ID
// @access  Private
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const certification = await Certification.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!certification) {
      return res.status(404).json({ msg: "Certification not found" });
    }

    res.json(certification);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Certification not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/user/certifications/:id
// @desc    Update certification
// @access  Private
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { title, description, certificatePhoto, issuedBy, issueDate } = req.body;

    const certificationFields = {
      title,
      description,
      certificatePhoto,
      issuedBy,
      issueDate,
    };

    let certification = await Certification.findById(req.params.id);

    if (!certification) {
      return res.status(404).json({ msg: "Certification not found" });
    }

    // Make sure user owns the certification
    if (certification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    certification = await Certification.findByIdAndUpdate(
      req.params.id,
      { $set: certificationFields },
      { new: true }
    );

    res.json(certification);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Certification not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   DELETE api/user/certifications/:id
// @desc    Delete certification
// @access  Private
router.delete("/:id", isAuthenticated, async (req, res) => {
    try {
      console.log(`Attempting to delete certification ${req.params.id} for user ${req.user.id}`);
      
      const certification = await Certification.findById(req.params.id).select('user');
      
      if (!certification) {
        console.log('Certification not found');
        return res.status(404).json({ msg: "Certification not found" });
      }
  
      // Debug ownership check
      console.log(`Certification user: ${certification.user}, Request user: ${req.user.id}`);
      
      if (certification.user.toString() !== req.user.id) {
        console.log('User not authorized to delete this certification');
        return res.status(401).json({ msg: "Not authorized" });
      }
  
      // Modern Mongoose deletion
      const result = await Certification.deleteOne({ _id: req.params.id });
      
      if (result.deletedCount === 0) {
        console.log('Delete operation failed - no document was deleted');
        return res.status(404).json({ msg: "Certification not found" });
      }
  
      console.log('Certification successfully deleted');
      res.json({ msg: "Certification removed" });
      
    } catch (err) {
      console.error('DELETE Error:', {
        error: err,
        message: err.message,
        stack: err.stack,
        params: req.params,
        user: req.user
      });
  
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(400).json({ msg: "Invalid certification ID format" });
      }
      
      res.status(500).json({ 
        msg: "Server Error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });
export default router;