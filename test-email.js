require("dotenv").config();
const { transporter } = require("./utils/mailer");

async function testEmail() {
  try {
    console.log("Sending test email...");

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_FROM, // Sending to yourself for testing
      subject: "Test Email from Movie Booking System",
      text: "This is a test email from your Movie Booking System.",
      html: "<b>Success! Your email configuration is working correctly.</b>",
    });

    console.log("✅ Test email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Failed to send test email:");
    console.error(error);

    // More detailed error information
    if (error.responseCode === 535) {
      console.error("\nAuthentication failed. Please check:");
      console.error(
        "1. Is 2-Step Verification enabled on your Google account?"
      );
      console.error(
        "2. Did you generate an App Password (not your regular password)?"
      );
      console.error(
        "3. Is the App Password correctly set in your .env file as SMTP_APP_PASSWORD?"
      );
    }
  }
}

testEmail();
