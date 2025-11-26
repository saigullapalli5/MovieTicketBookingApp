const router = require("express").Router();
const fetchUser = require("../middlewares/fetchUser");
const fetchAdmin = require("../middlewares/fetchAdmin");

const {
  addTheatre,
  getTheatre,
  getTheatres,
  editTheatre,
  getTheatreById,
} = require("../controllers/theatreController");

// Public routes (no authentication required)
router.get("/gettheatre/:theatreName", getTheatre);
router.get("/gettheatres", getTheatres);
router.get("/gettheatrebyid/:theatreId", getTheatreById);

// Protected routes (require authentication)
router.post("/addtheatre", fetchUser, addTheatre);
router.put("/edittheatre/:theatreId", fetchUser, editTheatre);

module.exports = router;
