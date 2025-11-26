const Movie = require("../models/movieModel");
const { v4 } = require("uuid");

module.exports.addMovie = async (req, res, next) => {
  try {
    const {
      name,
      description,
      genres,
      releaseDate,
      runtime,
      certification,
      media,
      crew = [],
      trailerUrl,
      movieId,
    } = req.body;

    //check is movie is already added into db
    const lowerCaseName = name.toLowerCase();
    const movie = await Movie.findOne({ movieName: lowerCaseName });

    if (movie)
      return res.json({ status: false, msg: "Movie is already Saved:)" });

    if (!movie) {
      const movieData = {
        movieName: lowerCaseName,
        description,
        genres,
        releaseDate,
        runtime,
        certification,
        media,
        crew,
        trailerUrl,
        shows: [],
        theatres: [],
        movieId,
      };
      await Movie.create(movieData);

      return res.json({ status: true, msg: "Movie Saved successfully :)" });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: false, msg: "Server issue :(" });
  }
};

module.exports.getMovies = async (req, res, next) => {
  try {
    const { query } = req.query || "";
    let movies;
    
    if (query && query.trim() !== "") {
      // Use regex search to avoid index conflicts
      movies = await Movie.find({ 
        movieName: { $regex: query, $options: 'i' } 
      });
    } else {
      // If no search query, return all movies
      movies = await Movie.find();
    }
    
    return res.status(200).json({ status: true, movies });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, msg: "Server issue :(" });
  }
};

module.exports.getMovieDetails = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findOne({ movieId });

    return res.json({ status: true, movie });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, msg: "Server issue :)" });
  }
};

module.exports.deleteMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    if (!movieId) {
      return res.status(400).json({
        status: false,
        msg: "Movie ID is required",
        code: "MISSING_MOVIE_ID"
      });
    }

    // Find and delete the movie
    const deletedMovie = await Movie.findOneAndDelete({ movieId });
    
    if (!deletedMovie) {
      return res.status(404).json({
        status: false,
        msg: "Movie not found",
        code: "MOVIE_NOT_FOUND"
      });
    }

    return res.json({
      status: true,
      msg: "Movie deleted successfully",
      movie: deletedMovie
    });
  } catch (error) {
    console.error("Error deleting movie:", error);
    return res.status(500).json({
      status: false,
      msg: "Server error while deleting movie",
      error: error.message
    });
  }
};

module.exports.editMovieDetails = async (req, res) => {
  try {
    console.log("=== EDIT MOVIE REQUEST ===");
    console.log("Request headers:", req.headers);
    console.log("Request params:", req.params);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Auth user:", req.user);

    const { movieId } = req.params;
    if (!movieId) {
      console.error("❌ No movie ID provided in request parameters");
      return res.status(400).json({
        status: false,
        msg: "Movie ID is required",
        code: "MISSING_MOVIE_ID",
      });
    }

    // Validate authentication
    if (!req.user || !req.user.id) {
      console.error("❌ Unauthorized: No user in request");
      return res.status(401).json({
        status: false,
        msg: "Unauthorized: Please log in again",
        code: "UNAUTHORIZED",
      });
    }

    console.log(`🔍 Finding movie with ID: ${movieId}`);
    const findMovie = await Movie.findOne({ movieId });

    if (!findMovie) {
      console.error(`❌ Movie not found with ID: ${movieId}`);
      return res.status(404).json({
        status: false,
        msg: `Movie with ID ${movieId} not found!`,
        code: "MOVIE_NOT_FOUND",
      });
    }

    console.log(`🔄 Updating movie: ${findMovie.movieName} (ID: ${movieId})`);

    // Prepare update data with validation and type checking
    const updateData = {
      movieName: req.body.name
        ? String(req.body.name).trim()
        : findMovie.movieName,
      description: req.body.description
        ? String(req.body.description).trim()
        : findMovie.description,
      genres: Array.isArray(req.body.genres)
        ? req.body.genres
        : req.body.genres
        ? String(req.body.genres)
            .split(",")
            .map((g) => g.trim())
        : findMovie.genres,
      releaseDate: req.body.releaseDate || findMovie.releaseDate,
      runtime: !isNaN(Number(req.body.runtime))
        ? Number(req.body.runtime)
        : findMovie.runtime,
      certification: req.body.certification || findMovie.certification,
      media: req.body.media || findMovie.media,
      trailerUrl: req.body.trailerUrl || findMovie.trailerUrl || "",
      crew: Array.isArray(req.body.crew)
        ? req.body.crew
        : req.body.crew
        ? [req.body.crew]
        : findMovie.crew || [],
      updatedAt: new Date(),
    };

    console.log(
      "📝 Update data prepared:",
      JSON.stringify(updateData, null, 2)
    );

    // Perform the update with error handling for validation
    let result;
    try {
      result = await Movie.findOneAndUpdate(
        { movieId },
        { $set: updateData },
        {
          new: true,
          runValidators: true,
          context: "query",
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {
      console.error("❌ Validation/Update error:", error.message);
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          status: false,
          msg: "Validation failed",
          errors,
          code: "VALIDATION_ERROR",
        });
      }
      throw error; // Re-throw for the outer catch block
    }

    if (!result) {
      console.error("❌ Failed to update movie in database:", movieId);
      return res.status(500).json({
        status: false,
        msg: "Failed to update movie in database",
        code: "UPDATE_FAILED",
      });
    }

    console.log("✅ Successfully updated movie:", {
      id: movieId,
      name: result.movieName,
      updatedAt: new Date(),
    });

    return res.json({
      status: true,
      msg: "Movie updated successfully",
      movie: {
        id: result.movieId,
        name: result.movieName,
        updated: true,
      },
    });
  } catch (error) {
    console.error("❌ Error updating movie:", error);
    return res.status(500).json({
      status: false,
      msg: "Server error while updating movie",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
