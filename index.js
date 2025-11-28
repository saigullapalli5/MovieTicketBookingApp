const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const showRoutes = require("./routes/showRoutes");
const theatreRoutes = require("./routes/theatreRoutes");
const movieRoutes = require("./routes/movieRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
require("dotenv").config({ path: "./.env" });
// Prefer IPv4 results to avoid ::1 (IPv6) connections when providers expect IPv4
const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
const { verifyTransport } = require("./utils/mailer");
const cron = require("node-cron");
const { sendReminderEmails } = require("./utils/reminderService");
const { cleanupOldBookings } = require("./utils/cleanupService");

const app = express();
const cors = require("cors");

// Configure CORS - More permissive for development
const allowedOrigins = [
  "https://movie-ticket-booking-app-frontend-iota.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://movieticketbookingapp-pw6b.onrender.com",
];

// Enable pre-flight requests
app.options("*", cors());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        console.warn("CORS blocked request from origin:", origin);
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: true, message: 'Backend is working!' });
});

app.listen(3000, () => {
  console.log("Server is running on 3000 port");
});

app.use("/api/auth", authRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/theatre", theatreRoutes);
app.use("/api/movie", movieRoutes);
app.use("/api/favorite", favoriteRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/auth/admin", adminRoutes);
app.use("/api/review", reviewRoutes);

const mongoUri = process.env.MONGODB_CONNECTION_LINK;

const connectToMongo = async () => {
  try {
    await mongoose.connect(mongoUri, {
      // Remove deprecated options as they're no longer needed in MongoDB Driver v4.0.0+
      // The new Node.js driver handles these configurations internally
    });
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    // Exit process with failure if database connection fails
    process.exit(1);
  }

  // Handle connection events
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected. Attempting to reconnect...");
    // Attempt to reconnect
    setTimeout(connectToMongo, 5000);
  });
};

connectToMongo();

// Verify mail transport on startup (logs only)
(async () => {
  try {
    await verifyTransport();
    console.log("SMTP transport verified. Ready to send emails.");

    // Schedule reminder emails to run every 10 minutes
    const cron = require("node-cron");
    const { sendReminderEmails } = require("./utils/reminderService");

    cron.schedule("*/10 * * * *", () => {
      console.log("Running reminder email service...");
      sendReminderEmails();
    });

    console.log("Reminder service scheduled to run every 10 minutes");

    // Schedule cleanup of old bookings to run daily at 3 AM
    cron.schedule("0 3 * * *", async () => {
      console.log("Running cleanup of old bookings...");
      try {
        const result = await cleanupOldBookings();
        console.log(
          `Cleanup completed. Removed ${result.deletedCount} old bookings.`
        );
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    });
    console.log("Cleanup service scheduled to run daily at 3 AM");
  } catch (e) {
    console.log("SMTP transport verification failed:", e?.message);
  }
})();
