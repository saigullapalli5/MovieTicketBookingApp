const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter using Gmail service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Do not fail on invalid certificates (for development only!)
    rejectUnauthorized: false
  }
});

// Verify the transporter connection
async function verifyTransporter() {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection successful (Gmail service mode)");
  } catch (error) {
    console.error("❌ SMTP transport verification failed:", error);
  }
}

// Run verification on startup
verifyTransporter();

async function sendMail({ to, subject, html, text, attachments }) {
  if (!to) throw new Error('sendMail: "to" is required');
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, html, text, attachments });
}

function bookingHtmlTemplate(data) {
  const {
    bookingId,
    userEmail,
    movieName,
    theatreName,
    showdate,
    showtime,
    ticketsData,
  } = data;

  // Create simple seats summary
  const sectionSummary = [];
  if (ticketsData) {
    const sections = ["balcony", "middle", "lower"];
    sections.forEach((sec) => {
      const val = ticketsData[sec];
      if (!val) return;
      // val can be an array or an object of seats
      let seats = [];
      if (Array.isArray(val)) seats = val;
      else if (typeof val === "object") seats = Object.keys(val);
      if (seats.length) sectionSummary.push(`${sec}: ${seats.join(", ")}`);
    });
  }

  const seatsLine = sectionSummary.length
    ? sectionSummary.join(" | ")
    : "Seat details not available";

  return `
    <div style="font-family: Arial, sans-serif; line-height:1.5;">
      <h2>Booking Confirmed</h2>
      <p>Hi ${userEmail},</p>
      <p>Your movie tickets have been booked successfully.</p>
      <table cellpadding="6" style="border-collapse: collapse;">
        <tr><td><b>Booking ID</b></td><td>${bookingId}</td></tr>
        <tr><td><b>Movie</b></td><td>${movieName || "N/A"}</td></tr>
        <tr><td><b>Theatre</b></td><td>${theatreName || "N/A"}</td></tr>
        <tr><td><b>Date</b></td><td>${showdate || "N/A"}</td></tr>
        <tr><td><b>Time</b></td><td>${showtime || "N/A"}</td></tr>
        <tr><td><b>Seats</b></td><td>${seatsLine}</td></tr>
      </table>
      <p>Bring this Booking ID to the theatre if needed.</p>
      <p>Enjoy your show!</p>
    </div>
  `;
}

async function sendBookingEmail(to, data, options = {}) {
  const subject = `Your Booking ${data.bookingId} is Confirmed`;
  const html = bookingHtmlTemplate(data);
  const text = `Booking Confirmed\n\nBooking ID: ${data.bookingId}\nMovie: ${
    data.movieName || "N/A"
  }\nTheatre: ${data.theatreName || "N/A"}\nDate: ${
    data.showdate || "N/A"
  }\nTime: ${data.showtime || "N/A"}`;
  const attachments = options.attachments || [];
  return sendMail({ to, subject, html, text, attachments });
}

module.exports = {
  transporter,
  sendMail,
  sendBookingEmail,
  verifyTransport: () => transporter.verify(),
};
