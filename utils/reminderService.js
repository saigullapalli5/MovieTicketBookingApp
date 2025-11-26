const { sendMail } = require('./mailer');
const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// Set your timezone here
const TIMEZONE = 'Asia/Kolkata';

async function sendReminderEmails() {
  try {
    const now = dayjs().tz(TIMEZONE);
    const twoHoursLater = now.add(2, 'hour');
    
    // Format for query
    const targetDate = twoHoursLater.format('YYYY-MM-DD');
    const targetTime = twoHoursLater.format('HH:mm');

    // Find shows starting in 2 hours
    const upcomingShows = await Show.find({
      showdate: targetDate,
      showtime: targetTime
    });

    if (upcomingShows.length === 0) {
      console.log('No shows found starting in 2 hours');
      return;
    }

    // Process each show
    for (const show of upcomingShows) {
      // Find all bookings for this show
      const bookings = await Booking.find({ showId: show.showId });
      
      if (bookings.length === 0) continue;

      // Get movie details
      const movie = await Movie.findOne({ movieId: show.movieId });
      if (!movie) continue;

      // Send reminder to each user
      for (const booking of bookings) {
        try {
          const userEmail = booking.userEmail;
          const seats = [];
          
          // Extract seat information
          Object.entries(booking.ticketsData).forEach(([section, seatsData]) => {
            if (section !== 'total') {
              Object.keys(seatsData).forEach(seat => {
                if (seat !== 'total') {
                  seats.push(`${section.toUpperCase()}${seat}`);
                }
              });
            }
          });

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="background: #4a6fa5; padding: 20px; color: white; text-align: center; border-radius: 5px 5px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">🎬 Movie Reminder!</h1>
              </div>
              
              <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
                <h2 style="color: #2c3e50; margin-top: 0;">${movie.movieName}</h2>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                  <p style="margin: 5px 0;"><strong>Showtime:</strong> ${show.showtime}</p>
                  <p style="margin: 5px 0;"><strong>Date:</strong> ${show.showdate}</p>
                  <p style="margin: 5px 0;"><strong>Theater:</strong> ${show.theatreName}</p>
                  <p style="margin: 5px 0;"><strong>Seats:</strong> ${seats.join(', ')}</p>
                </div>
                
                <p>Your movie starts in 2 hours! Please arrive at least 20 minutes early.</p>
                <p>Don't forget to bring your booking confirmation and ID.</p>
                
                <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                  <p>This is an automated reminder. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          `;

          const mailOptions = {
            from: process.env.MAIL_FROM,
            to: userEmail,
            subject: `⏰ Reminder: ${movie.movieName} starts in 2 hours!`,
            html: emailHtml,
            text: `Reminder: Your movie ${movie.movieName} starts at ${show.showtime} (in 2 hours). Seats: ${seats.join(', ')}`
          };

          await sendMail(mailOptions);
          console.log(`Reminder sent to ${userEmail} for ${movie.movieName}`);
          
        } catch (error) {
          console.error(`Error sending reminder for booking ${booking.bookingId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendReminderEmails:', error);
  }
}

module.exports = { sendReminderEmails };
