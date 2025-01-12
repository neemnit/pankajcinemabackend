const jwt = require("jsonwebtoken");
const UserSignup = require("../models/UserSignup");
const SECRET_KEY = process.env.JWT_SECRET;

async function Authenticate(req, res, next) {
  const { users } = req.body; // Extract users from the request body

  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      message: "No Authorization Header",
    });
  }

  try {
    const token = authorization.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid Token Format",
      });
    }

    const decode = jwt.verify(token, SECRET_KEY);

    const roleType = await UserSignup.findById(decode.id);
    

    if (!roleType) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (roleType.role == "admin") {
      req.user=roleType
      return next();
    }
    if (roleType.role=="user" ||   users?.includes(roleType?.id)) {
      req.user=roleType
      return next();
    }

    return res.status(401).json({
      message: "Unauthorized to access",
    });
  } catch (error) {
    // If the user is a "user" and included in the users array, grant access

    // Allow access for valid user role and ID

    // If the user is not an "admin", deny access

    // For admins or other allowed cases

    // Handle token expiration error
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Session Expired",
        error: error.message,
      });
    }

    // Handle invalid token error
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Invalid Token",
        error: error.message,
      });
    }

    // If it's another error, send a generic 500 error
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
      stack: error.stack,
    });
  }
}

module.exports = Authenticate;
