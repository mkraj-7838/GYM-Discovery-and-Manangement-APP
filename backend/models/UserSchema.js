import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String }, // Optional
    gymName: { type: String },
    photo: { type: String }, // Optional (store image URL)
    phone: { type: String },
    address: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Member" }], // Optional
    membershipPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: "MembershipPlan" }],
    certifications:[{type: mongoose.Schema.Types.ObjectId, ref: "Certification"}]
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);
export default User;
