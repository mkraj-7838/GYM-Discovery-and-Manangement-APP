import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, index: true }, 
    phone: { type: String, required: true },
    address: { type: String },
    age: { type: Number, required: true },
    weight: { type: Number, required: true },
    height: { type: Number, required: true },
    gender: { 
      type: String, 
      enum: ["male", "female", "other"], // Allowed values for gender
      required: true, 
    },
    batch: { 
      type: String, 
      enum: ["morning", "evening"], // Allowed values for batch
      required: true, 
    },
    membershipPlan: { 
      type: String, 
      enum: ["basic", "premium", "vip"], 
      required: true, 
      default: "basic" 
    },
    status: { 
      type: String, 
      enum: ["active", "inactive", "trial"], 
      default: "active" 
    },
    photo: { type: String }, // Store image URL
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    joiningDate: { 
      type: Date, 
      required: true, 
      default: Date.now 
    }, // Default to current date
    monthsOfSubscription: { 
      type: Number, 
    }, // Must be provided
  },
  {
    timestamps: true,
  }
);

const Member = mongoose.model("Member", memberSchema);
export default Member;