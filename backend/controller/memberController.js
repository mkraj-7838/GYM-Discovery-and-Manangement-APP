import asyncHandler from "express-async-handler";
import Member from "../models/Member.js";
import User from "../models/UserSchema.js";

// @route   POST /api/user/members
// @desc    Add a new member and link it to the user
// @access  Private
const addMember = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    age,
    weight,
    height,
    gender,
    batch,
    membershipPlan,
    status,
    photo,
    joiningDate, // Expecting DD-MM-YYYY format
    monthsOfSubscription,
  } = req.body;

  // Validate required fields
  if (
    !name ||
    !email ||
    !phone ||
    !age ||
    !weight ||
    !height ||
    !gender ||
    !batch ||
    !membershipPlan ||
    !status ||
    !joiningDate ||
    (status !== "trial" && !monthsOfSubscription) // Subscription months is required for non-trial members
  ) {
    res.status(400);
    throw new Error("Please provide all required fields.");
  }

  // Validate joining date format (DD-MM-YYYY)
  const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (!dateRegex.test(joiningDate)) {
    res.status(400);
    throw new Error("Joining date must be in the format DD-MM-YYYY.");
  }

  // Convert joiningDate to a valid Date object
  const [day, month, year] = joiningDate.split("-");
  const formattedJoiningDate = new Date(`${year}-${month}-${day}`);

  // Check if the date is valid
  if (isNaN(formattedJoiningDate.getTime())) {
    res.status(400);
    throw new Error("Invalid joining date.");
  }

  // Get the logged-in user ID from req.user (set by isAuthenticated middleware)
  const userId = req.user;
  if (!userId) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  // Create the new member
  const member = await Member.create({
    name,
    email,
    phone,
    address,
    age,
    weight,
    height,
    gender,
    batch,
    membershipPlan,
    status,
    photo,
    joiningDate: formattedJoiningDate,
    monthsOfSubscription: status === "trial" ? 0 : monthsOfSubscription, // Set to 0 for trial members
    createdBy: userId, // Link the member to the logged-in user
  });

  // Log the created member for debugging
  console.log("Created Member:", member);

  // Add the member to the user's `members` array
  await User.findByIdAndUpdate(userId, { $push: { members: member._id } });

  res.status(201).json(member);
});

// @route   GET /api/user/members
// @desc    Get all members added by logged-in user
// @access  Private
const getMembersByUser = asyncHandler(async (req, res) => {
  const userId = req.user;
  if (!userId) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  const members = await Member.find({ createdBy: userId }).populate("createdBy", "name email");
  res.json(members);
});

export { addMember, getMembersByUser };