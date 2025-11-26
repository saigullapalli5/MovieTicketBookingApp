const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// Set your timezone here
const TIMEZONE = 'Asia/Kolkata';

async function cleanupOldBookings() {
  try {
    const now = dayjs().tz(TIMEZONE);
    
    // Find all shows that have already happened
    const pastShows = await Show.find({
      $or: [
        { showdate: { $lt: now.format('YYYY-MM-DD') } },
        { 
          showdate: now.format('YYYY-MM-DD'),
          showtime: { $lt: now.format('HH:mm') }
        }
      ]
    });

    if (pastShows.length === 0) {
      console.log('No past shows found for cleanup');
      return { deletedCount: 0 };
    }

    // Get all showIds from past shows
    const showIds = pastShows.map(show => show.showId);

    // Delete all bookings for these shows
    const result = await Booking.deleteMany({ showId: { $in: showIds } });
    
    console.log(`Cleaned up ${result.deletedCount} old bookings`);
    return result;
  } catch (error) {
    console.error('Error in cleanupOldBookings:', error);
    throw error;
  }
}

module.exports = { cleanupOldBookings };
