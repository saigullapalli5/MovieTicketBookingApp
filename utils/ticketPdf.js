const { sendMail } = require('./mailer');

// Example usage
const sendWelcomeEmail = async (userEmail, userName) => {
    try {
        const result = await sendMail({
            to: userEmail,
            subject: 'Welcome to Movie Booking System',
            text: `Hello ${userName},\n\nThank you for registering with us!`,
            html: `<h1>Welcome ${userName}!</h1><p>Thank you for registering with us!</p>`
        });
        console.log('Email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
};

// PDF Generation
const PDFDocument = require("pdfkit");

async function generateTicketPdfBuffer(ticketData) {
  const doc = new PDFDocument();
  const chunks = [];
  
  return new Promise((resolve, reject) => {
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Ticket content
    doc.fontSize(20).text("🎟 Movie Ticket", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Booking ID: ${ticketData.bookingId || 'N/A'}`);
    doc.text(`User: ${ticketData.userEmail || 'N/A'}`);
    doc.text(`Seat: ${ticketData.seatNumber || 'N/A'}`);
    doc.moveDown();
    doc.text('Thank you for your booking!', { align: 'center' });
    doc.end();
  });
}

module.exports = { generateTicketPdfBuffer };
