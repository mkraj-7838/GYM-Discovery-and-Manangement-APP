import mongoose from "mongoose";

const CertificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Certification title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    certificatePhoto: {
      type: String, // URL to the image (stored in Cloudinary/S3)
      required: [true, "Certificate photo is required"],
    },
    issuedBy: {
      type: String,
      required: [true, "Issuing organization is required"],
      trim: true,
    },
    issueDate: {
      type: Date,
      required: [true, "Issue date is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Certification = mongoose.model("Certification", CertificationSchema);
export default Certification;