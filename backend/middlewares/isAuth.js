import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    //! Check if Authorization header exists
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
      throw new Error("No token provided, authorization denied");
    }

    //! Extract token from header
    const token = req.headers.authorization.split(" ")[1];

    //! Verify token
    jwt.verify(token, process.env.JWT_SECRET || "defaultSecret", (err, decoded) => {
      if (err) {
        throw new Error("Invalid or expired token, please login again");
      }

      //! Save user ID in request object
      req.user = decoded.id;
      next();
    });
  } catch (error) {
    next(error);
  }
};

export default isAuthenticated;



