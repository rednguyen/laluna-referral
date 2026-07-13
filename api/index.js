const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Tailor shops data
const tailorShops = {
  'bebe': { id: 'bebe', name: 'BeBe Tailor', specialty: 'Classic European Cut' },
  'bluesky': { id: 'bluesky', name: 'Blue Sky Tailor', specialty: 'Modern Slim Fit' },
  'yali': { id: 'yali', name: 'Yali Tailor', specialty: 'Asian Fusion Style' }
};

// Generate unique coupon code
const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'LUNA-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
};

// Send email helper
const sendEmail = async (transporter, options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured - skipping');
    return false;
  }
  try {
    await transporter.sendMail(options);
    return true;
  } catch (err) {
    console.log('Email failed:', err.message);
    return false;
  }
};

// API: Get tailors
app.get('/tailors', (req, res) => res.json(tailorShops));

// API: Submit coupon
app.post('/submit-coupon', async (req, res) => {
  try {
    const { tailorId, firstName, lastName, roomNumber, email, phone } = req.body;

    if (!tailorId || !tailorShops[tailorId]) {
      return res.status(400).json({ success: false, message: 'Invalid tailor' });
    }
    if (!firstName || !lastName || !roomNumber || !email) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const tailor = tailorShops[tailorId];
    const couponCode = generateCouponCode();
    const timestamp = new Date().toISOString();

    // Send email only if HOTEL_EMAIL is configured
    if (process.env.EMAIL_USER && process.env.HOTEL_EMAIL) {
      const transporter = createTransporter();
      const hotelEmail = process.env.HOTEL_EMAIL;

      await sendEmail(transporter, {
        from: `"La Luna Hotel" <${hotelEmail}>`,
        to: email,
        cc: hotelEmail,
        subject: `Your 10% Discount at ${tailor.name}`,
        html: `<div style="font-family: Arial; padding: 20px;">
          <h1 style="color: #1a365d;">La Luna Hotel</h1>
          <h2>Dear ${firstName} ${lastName},</h2>
          <p>Here is your exclusive coupon code for <strong>${tailor.name}</strong>:</p>
          <div style="background: #f0f0f0; padding: 20px; font-size: 24px; text-align: center;">
            <strong>${couponCode}</strong>
          </div>
          <p><strong>10% OFF</strong> - Show this email to redeem your discount.</p>
          <hr>
          <p><small>Hotel Reference: Room ${roomNumber} | Phone: ${phone || 'N/A'}</small></p>
        </div>`
      });
    } else {
      console.log('Email skipped: HOTEL_EMAIL not configured');
    }

    res.json({ success: true, couponCode, tailor });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = app;
