import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/UserSchema.js";

// User Controller
const userCtrl = {
  //! Register
  register: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    console.log({ email, password });

    //! Validations
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    //! Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error("User already exists");
    }

    //! Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //! Create the user (other fields are optional)
    const userCreated = await User.create({
      email,
      password: hashedPassword,
    });

    res.json({
      id: userCreated._id,
      email: userCreated.email,
      message: "User registered successfully!",
    });
  }),

  //! Login
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    //! Check if user email exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    //! Check if user password is valid
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    //! Generate the token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "defaultSecret", // Use env variable
      { expiresIn: "30d" }
    );

    //! Send the response
    res.json({
      message: "Login successful",
      token,
      id: user._id,
      email: user.email,
    });
  }),

  //! Profile
  profile: asyncHandler(async (req, res) => {
    // Find the user and exclude password
    const user = await User.findById(req.user).populate("members");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json(user);
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const {
      name,
      gymName,
      photo,
      phone,
      address,
      membershipPlans,
      certifications,
    } = req.body;

    // Find the user by ID from the authenticated request
    const user = await User.findById(req.user); // No ._id needed

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Update only the fields that are provided in the request
    if (name) user.name = name;
    if (gymName) user.gymName = gymName;
    if (photo) user.photo = photo;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (membershipPlans) user.membershipPlans = membershipPlans;
    if (certifications) user.certifications = certifications;

    // Save the updated user
    const updatedUser = await user.save();

    // Return the updated user (excluding password)
    res.json({
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      gymName: updatedUser.gymName,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      address: updatedUser.address,
      membershipPlans: updatedUser.membershipPlans,
      certifications: updatedUser.certifications,
      message: "Profile updated successfully",
    });
  }),
};

export default userCtrl;
