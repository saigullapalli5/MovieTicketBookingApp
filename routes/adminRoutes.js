const router = require("express").Router();
const fetchAdmin = require("../middlewares/fetchAdmin");

const { 
  adminRegister, 
  adminLogin,
  // Add other admin controller methods here as needed
} = require("../controllers/adminController");

// Public routes (no authentication required)
router.post("/register", adminRegister);
router.post("/login", adminLogin);

// Protected admin routes (require admin authentication)
// Example:
// router.get("/users", fetchAdmin, getAllUsers);
// router.delete("/user/:id", fetchAdmin, deleteUser);

module.exports = router;
