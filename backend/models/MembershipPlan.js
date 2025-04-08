import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    features: [
      {
        name: {
          type: String,
          required: [true, "Feature name is required"],
          trim: true,
        },
        included: {
          type: Boolean,
          default: true,
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    icon: {
      type: String,
      default: "star", // You can set a default icon
      trim: true,
    },
    color: {
      type: String,
      default: "#000000", // Default black color
      trim: true,
      validate: {
        validator: function(v) {
          return /^#([0-9a-f]{3}){1,2}$/i.test(v);
        },
        message: props => `${props.value} is not a valid hex color code!`
      }
    }
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field before saving
membershipPlanSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const MembershipPlan = mongoose.model("MembershipPlan", membershipPlanSchema);

export default MembershipPlan;
