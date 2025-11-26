const Booking = require("../models/bookingModel");
const Show = require("../models/showModel");
const Movie = require("../models/movieModel");
const { sendMail } = require("../utils/mailer");
const { generateTicketPdfBuffer } = require("../utils/ticketPdf");

module.exports.addBooking = async (req, res) => {
  try {
    const { bookingId, showId, ticketsData } = req.body;
    console.log(ticketsData);
    const userEmail = req.user.userDetails.email;
    // Create the booking
    const booking = await Booking.create({
      bookingId,
      userEmail,
      showId,
      ticketsData,
    });

    // Send success response immediately
    res.json({ status: true, msg: "Booking created successfully" });

    // Log seat booking information
    console.log(`\n=== Booking Details (${bookingId}) ===`);
    console.log(`User: ${userEmail}`);
    console.log(`Show ID: ${showId}`);
    console.log('Seats booked:');
    
    if (ticketsData && typeof ticketsData === 'object') {
      Object.entries(ticketsData).forEach(([section, seats]) => {
        if (seats && typeof seats === 'object') {
          Object.entries(seats).forEach(([seatNumber, booking]) => {
            if (seatNumber !== 'total' && booking && booking.userEmail) {
              console.log(`- Section: ${section}, Seat: ${seatNumber}, User: ${booking.userEmail}`);
            }
          });
        }
      });
    }
    console.log('=========================\n');

      // Prepare and send confirmation email (non-blocking)
      const show = await Show.findOne({ showId });
      let movie = null;
      if (show) {
        movie = await Movie.findOne({ movieId: show.movieId });
      }

      const emailData = {
        bookingId,
        userEmail,
        ticketsData,
        theatreName: show?.theatreName,
        showdate: show?.showdate,
        showtime: show?.showtime,
        movieName: movie?.movieName,
      };

      try {
        // Convert ticketsData object to array of seat numbers
        const seatNumbers = Object.entries(ticketsData)
          .filter(([key]) => key !== 'total')
          .flatMap(([section, seats]) => 
            Object.entries(seats)
              .filter(([seat]) => seat !== 'total')
              .map(([seat]) => `${section.toUpperCase()}${seat}`)
          );

        const pdfBuffer = await generateTicketPdfBuffer({
          bookingId,
          userEmail,
          seatNumber: seatNumbers.join(', '),
          ...emailData
        });

        const seatsFormatted = seatNumbers.join(', ');
        const emailSubject = `🎟️ Booking Confirmation #${bookingId}`;
        
        console.log('Preparing to send booking confirmation email to:', userEmail);
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: #4a6fa5; padding: 20px; color: white; text-align: center; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🎬 Booking Confirmed!</h1>
            </div>
            
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
              <h2 style="color: #2c3e50; margin-top: 0;">${movie?.movieName || 'Movie'}</h2>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${show?.showdate || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${show?.showtime || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Theater:</strong> ${show?.theatreName || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Seats:</strong> ${seatsFormatted}</p>
              </div>
              
              <p>Thank you for choosing our service. Your booking is confirmed!</p>
              <p>Please present this email or the attached ticket at the theater.</p>
              
              <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                <p>If you have any questions, please contact our support team.</p>
                <p>This is an automated email, please do not reply directly to this message.</p>
              </div>
            </div>
          </div>
        `;

        const textContent = `
          Booking Confirmation #${bookingId}
          ---------------------------
          Movie: ${movie?.movieName || 'N/A'}
          Theater: ${show?.theatreName || 'N/A'}
          Date: ${show?.showdate || 'N/A'}
          Time: ${show?.showtime || 'N/A'}
          Seats: ${seatsFormatted}
          
          Thank you for your booking!
          Please present this email at the theater.
        `;

        // Send the email with PDF attachment
        const mailOptions = {
          from: process.env.MAIL_FROM,
          to: userEmail,
          subject: emailSubject,
          html: emailHtml,
          text: textContent,
          attachments: [
            {
              filename: `ticket-${bookingId}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        };

        console.log('Sending email to:', userEmail);
        const emailResult = await sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', emailResult.messageId);
        return emailResult;
      } catch (emailError) {
        console.error('❌ Error sending booking email:', emailError.message);
        console.error('Error stack:', emailError.stack);
      }

    return res.json({ status: true, msg: "Tickets booked successfully:)" });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, msg: "Server issue :(" });
  }
};

module.exports.getBookings = async (req, res) => {
  try {
    const userEmail = req.user.userDetails.email;
    const getBookings = await Booking.find({ userEmail });
    const bookings = (
      await Promise.all(
        getBookings?.map(async (b) => {
          try {
            const show = await Show.findOne({ showId: b.showId });
            if (!show) {
              console.log("getBookings: Missing show for booking:", b.bookingId);
              return null;
            }
            const movie = await Movie.findOne({ movieId: show.movieId });
            if (!movie) {
              console.log("getBookings: Missing movie for show:", show.showId);
              return null;
            }

            const data = {
              bookingId: b.bookingId,
              userEmail,
              ticketsData: b.ticketsData,
              theatreName: show.theatreName,
              showdate: show.showdate,
              showtime: show.showtime,
              movieName: movie.movieName,
              media: movie.media,
            };
            return data;
          } catch (innerErr) {
            console.log("getBookings mapping error:", innerErr?.message);
            return null;
          }
        })
      )
    ).filter(Boolean);

    // Optional: sort by show date/time ascending
    bookings.sort((a, b) => {
      const da = new Date(a.showdate);
      const db = new Date(b.showdate);
      if (da.getTime() === db.getTime()) {
        return String(a.showtime).localeCompare(String(b.showtime));
      }
      return da - db;
    });

    return res.status(200).json({ status: true, bookings });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, msg: "Server issue :(" });
  }
};

module.exports.getAllBookings = async (req, res) => {
  try {
    const getAllBookings = await Booking.find({});
    const bookings = (
      await Promise.all(
        getAllBookings?.map(async (b) => {
          try {
            const show = await Show.findOne({ showId: b.showId });
            if (!show) {
              console.log("getAllBookings: Missing show for booking:", b.bookingId);
              return null;
            }
            const movie = await Movie.findOne({ movieId: show.movieId });
            if (!movie) {
              console.log("getAllBookings: Missing movie for show:", show.showId);
              return null;
            }

            const data = {
              bookingId: b.bookingId,
              userEmail: b.userEmail,
              userName: b.userName || b.userEmail,
              ticketsData: b.ticketsData,
              theatreName: show.theatreName,
              showdate: show.showdate,
              showtime: show.showtime,
              movieName: movie.movieName,
              media: movie.media,
            };
            return data;
          } catch (innerErr) {
            console.log("getAllBookings mapping error:", innerErr?.message);
            return null;
          }
        })
      )
    ).filter(Boolean);

    // Optional: sort by show date/time ascending
    bookings.sort((a, b) => {
      const da = new Date(a.showdate);
      const db = new Date(b.showdate);
      if (da.getTime() === db.getTime()) {
        return String(a.showtime).localeCompare(String(b.showtime));
      }
      return da - db;
    });

    return res.status(200).json({ status: true, bookings });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, msg: "Server issue :(" });
  }
};

module.exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { tickets } = req.body;
    //get show details
    const booking = await Booking.findOne({ bookingId });
    const show = await Show.findOne({ showId: booking.showId });

    const filterBalcony = show.tickets.balcony;

    if (tickets.balcony.length > 0) {
      tickets.balcony.forEach((s) => {
        if (filterBalcony.hasOwnProperty(s)) {
          delete filterBalcony[s];
        }
      });
    }

    const filterMiddle = show.tickets.middle;

    if (tickets.middle.length > 0) {
      tickets.middle.forEach((s) => {
        if (filterMiddle.hasOwnProperty(s)) {
          delete filterMiddle.s;
        }
      });
    }

    const filterLower = show.tickets.lower;
    if (tickets.lower.length > 0) {
      tickets.lower.forEach((s) => {
        if (filterLower.hasOwnProperty(s)) {
          delete filterLower.s;
        }
      });
    }

    const filteredTickets = {
      balcony: filterBalcony,
      middle: filterMiddle,
      lower: filterLower,
    };
    await Booking.deleteOne({ bookingId });
    await Show.updateOne(
      { showId: booking.showId },
      { $set: { tickets: filteredTickets } }
    );

    return res
      .status(200)
      .json({ status: true, msg: "Ticket Cancelled Successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, msg: "Server issue :(" });
  }
};
