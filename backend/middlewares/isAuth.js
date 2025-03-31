import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";

const isAuthenticated = async (req, res, next) => {
  try {
    //! Check if Authorization header exists
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
      throw new Error("No token provided, authorization denied");
    }

    //! Extract token from header
    const token = req.headers.authorization.split(" ")[1];

    //! Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultSecret");

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      throw new Error("User not found in database");
    }

    req.user = user; // Attach full user object
    next();

  } catch (error) {
    next(error);
  }
};

export default isAuthenticated;



