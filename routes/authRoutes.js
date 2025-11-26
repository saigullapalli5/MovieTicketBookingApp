const router = require("express").Router();
const fetchUser = require("../middlewares/fetchUser");

const {
  register,
  login,
  editProfile,
} = require("../controllers/authController");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected route - requires authentication
router.put("/editprofile", fetchUser, editProfile);

module.exports = router;
