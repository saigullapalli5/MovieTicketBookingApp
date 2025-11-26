const router = require("express").Router();
const fetchUser = require("../middlewares/fetchUser");
const fetchAdmin = require("../middlewares/fetchAdmin");

const {
  addMovie,
  getMovies,
  getMovieDetails,
  editMovieDetails,
  deleteMovie,
} = require("../controllers/movieController");

// Public routes (no authentication required)
router.get("/getmovies", getMovies);
router.get("/getmoviedetails/:movieId", getMovieDetails);

// Admin protected routes (require admin authentication)
router.post("/addmovie", fetchAdmin, addMovie);
router.put("/editmovie/:movieId", fetchAdmin, editMovieDetails);
router.delete("/deletemovie/:movieId", fetchAdmin, deleteMovie);

module.exports = router;
