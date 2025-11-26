const jwt = require("jsonwebtoken");
const secretKey = "SSC";

const fetchAdmin = (req, res, next) => {
  // Get token from either auth-token header or Authorization header
  let token = req.header("auth-token");

  // If token is not in auth-token header, check Authorization header
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: false,
      msg: "Authentication required. Please log in.",
    });
  }

  try {
    // Verify and decode the JWT token
    const data = jwt.verify(token, secretKey);

    // Check if user has admin role (if your JWT includes role info)
    if (data.role !== "admin") {
      return res.status(403).json({
        status: false,
        msg: "Admin access required",
      });
    }

    // Attach user data to request object
    req.user = data;
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({
      status: false,
      msg: "Invalid or expired token. Please log in again.",
    });
  }
};

module.exports = fetchAdmin;
