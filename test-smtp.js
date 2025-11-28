require("dotenv").config();
const nodemailer = require("nodemailer");

const testEmail = async () => {
  console.log("Testing SMTP configuration...");
  console.log("Using SMTP Host:", process.env.SMTP_HOST);
  console.log("Using SMTP Port:", process.env.SMTP_PORT);
  console.log("Using Email:", process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Only for development
    },
  });

  try {
    console.log("\n🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection successful!");

    console.log("\n✉️ Sending test email...");
    const info = await transporter.sendMail({
      from: `"Test Sender" <${process.env.MAIL_FROM}>`,
      to: process.env.MAIL_FROM,
      subject: "🎬 Test Email from Movie Booking System",
      text: "This is a test email from your Movie Booking System.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎬 Test Email Successful!</h2>
          <p>This is a test email from your Movie Booking System.</p>
          <p>If you're seeing this, your email configuration is working correctly! 🎉</p>
          <hr>
          <p style="color: #666; font-size: 0.9em;">
            <strong>Server Time:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    console.log("✅ Test email sent successfully!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📤 Preview URL:", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("\n❌ Error:", error.message);

    if (error.responseCode === 535) {
      console.log("\n🔐 Authentication failed. Please verify:");
      console.log(
        "1. 2-Step Verification is enabled at: https://myaccount.google.com/security"
      );
      console.log(
        "2. App Password is generated at: https://myaccount.google.com/apppasswords"
      );
      console.log(
        "3. App Password is correctly copied (16 characters, no spaces)"
      );
      console.log(
        "4. You're using the App Password, not your Google account password"
      );
    }

    if (error.response) {
      console.log("\n📨 Server response:", error.response);
    }
  }
};

testEmail();
