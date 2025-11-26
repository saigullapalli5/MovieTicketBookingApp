const router = require("express").Router();
const fetchUser = require("../middlewares/fetchUser");
const fetchAdmin = require("../middlewares/fetchAdmin");
const {
  addBooking,
  getBookings,
  getAllBookings,
  cancelBooking,
} = require("../controllers/bookingController");

// User routes - require authentication
router.post("/addbooking", fetchUser, addBooking);
router.get("/getbookings", fetchUser, getBookings);
router.put("/cancelbooking/:bookingId", fetchUser, cancelBooking);

// Admin routes - require admin authentication
router.get("/getallbookings", fetchAdmin, getAllBookings);

module.exports = router;
