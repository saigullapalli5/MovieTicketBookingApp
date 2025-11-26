const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  movieName: {
    type: String,
    required: [true, "Movie name is required"],
    trim: true,
    minlength: [2, "Movie name must be at least 2 characters long"],
    maxlength: [200, "Movie name cannot exceed 200 characters"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    minlength: [10, "Description must be at least 10 characters long"],
  },
  genres: {
    type: [String],
    required: [true, "At least one genre is required"],
    validate: {
      validator: function (genres) {
        return Array.isArray(genres) && genres.length > 0;
      },
      message: "At least one genre is required",
    },
  },
  releaseDate: {
    type: Date,
    required: [true, "Release date is required"],
    validate: {
      validator: function (date) {
        // Allow any valid date, including future dates
        return date instanceof Date && !isNaN(date);
      },
      message: "Invalid release date",
    },
  },
  runtime: {
    type: Number,
    required: [true, "Runtime is required"],
    min: [1, "Runtime must be at least 1 minute"],
    max: [600, "Runtime cannot exceed 600 minutes (10 hours)"],
  },
  certification: {
    type: String,
    required: [true, "Certification is required"],
    enum: {
      values: ["U", "UA", "A", "PG-13", "R", "NC-17"],
      message: "Invalid certification value",
    },
  },
  media: {
    type: String,
    required: [true, "Media URL is required"],
    validate: {
      validator: function (v) {
        // Simple URL validation
        return /^https?:\/\//.test(v);
      },
      message: (props) => `${props.value} is not a valid URL`,
    },
  },
  trailerUrl: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Optional field
        return /^https?:\/\//.test(v);
      },
      message: (props) => `${props.value} is not a valid URL`,
    },
  },
  crew: [
    new mongoose.Schema(
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        role: {
          type: String,
          required: true,
          trim: true,
        },
        image: {
          type: String,
          validate: {
            validator: function (v) {
              if (!v) return true; // Optional field
              return /^https?:\/\//.test(v);
            },
            message: (props) => `${props.value} is not a valid URL`,
          },
        },
      },
      { _id: false }
    ),
  ],
  movieId: {
    type: String,
    required: [true, "Movie ID is required"],
    unique: true,
    index: true,
  },
  shows: [
    {
      type: String,
      ref: "Show",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
movieSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Add text index for search
movieSchema.index({
  movieName: "text",
  description: "text",
  "crew.name": "text",
});

module.exports = mongoose.model("Movie", movieSchema);
