import asyncHandler from "express-async-handler";
import Member from "../models/Member.js";
import User from "../models/UserSchema.js";

// Utility function to check if subscription is expired
const checkSubscriptionStatus = (member) => {
  if (member.status === "inactive") return member; // Already inactive
  
  // For trial members, we might want different logic
  if (member.status === "trial") return member;
  
  if (!member.joiningDate || !member.monthsOfSubscription) {
    return member; // Missing required fields
  }

  const joinDate = new Date(member.joiningDate);
  const endDate = new Date(joinDate);
  endDate.setMonth(joinDate.getMonth() + member.monthsOfSubscription);
  
  const today = new Date();
  
  if (today > endDate) {
    member.status = "inactive";
  }
  
  return member;
};

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

  // Find all members and check their subscription status
  const members = await Member.find({ createdBy: userId }).populate("createdBy", "name email");
  
  // Check and update expired subscriptions
  const updatedMembers = await Promise.all(
    members.map(async (member) => {
      const checkedMember = checkSubscriptionStatus(member);
      
      // If status changed to Inactive, save to database
      if (checkedMember.isModified && checkedMember.isModified('status')) {
        await Member.findByIdAndUpdate(member._id, { status: "inactive" });
        return { ...member.toObject(), status: "inactive" };
      }
      
      return member;
    })
  );

  res.json(updatedMembers);
});

export { addMember, getMembersByUser };