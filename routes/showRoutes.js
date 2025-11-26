const router = require("express").Router();
const fetchAdmin = require("../middlewares/fetchAdmin");
const fetchUser = require("../middlewares/fetchUser");

const {
  addShow,
  getMovieShows,
  updateShowTickets,
  getShow,
  deleteShow,
  getAdminShows,
} = require("../controllers/showController");

// Public routes (no authentication required)
router.get("/getmovieshows/:movieId", getMovieShows);
router.get("/getshow/:showId", getShow);

// Protected route - requires user authentication
router.put("/updateshowtickets/:showId", fetchUser, updateShowTickets);

// Admin protected routes (require admin authentication)
router.post("/addshow", fetchAdmin, addShow);
router.get("/getadminshows", fetchAdmin, getAdminShows);
router.delete("/deleteshow/:movieId/:showId", fetchAdmin, deleteShow);

module.exports = router;
