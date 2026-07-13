const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Tailor shops data
const tailorShops = {
  'bebe': {
    id: 'bebe',
    name: 'BeBe Tailor',
    description: 'Elegant custom suits with over 30 years of experience',
    specialty: 'Classic European Cut',
    image: '✂️'
  },
  'bluesky': {
    id: 'bluesky',
    name: 'Blue Sky Tailor',
    description: 'Modern tailoring with contemporary styles',
    specialty: 'Modern Slim Fit',
    image: '🪡'
  },
  'yali': {
    id: 'yali',
    name: 'Yali Tailor',
    description: 'Traditional craftsmanship meets modern elegance',
    specialty: 'Asian Fusion Style',
    image: '👔'
  }
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

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email function
const sendEmail = async (transporter, mailOptions) => {
  try {
    console.log('📧 Sending email to:', mailOptions.to);
    console.log('📧 From:', mailOptions.from);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully! Message ID:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    console.error('Error code:', error.code);
    console.error('Command:', error.command);
    return false;
  }
};

// Send Zalo message function
const sendZaloMessage = async (message) => {
  const botToken = process.env.ZALO_BOT_TOKEN;
  const chatId = process.env.ZALO_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.log('📱 Zalo notification skipped: BOT_TOKEN or CHAT_ID not configured');
    return false;
  }
  
  try {
    const entrypoint = `https://bot-api.zaloplatforms.com/bot${botToken}/sendMessage`;
    console.log('📱 Sending Zalo notification to:', chatId);
    
    const response = await axios.post(entrypoint, {
      chat_id: chatId,
      text: message
    });
    
    console.log('✅ Zalo message sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ Zalo error:', error.response?.data || error.message);
    return false;
  }
};

// Debug: Log configuration on startup
console.log('📧 Email Configuration:');
console.log('   Service:', process.env.EMAIL_SERVICE || 'gmail');
console.log('   User:', process.env.EMAIL_USER || 'NOT SET');
console.log('   Password:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
console.log('   Hotel Email:', process.env.HOTEL_EMAIL || 'NOT SET');
console.log('📱 Zalo Configuration:');
console.log('   Bot Token:', process.env.ZALO_BOT_TOKEN ? '***' + process.env.ZALO_BOT_TOKEN.slice(-4) : 'NOT SET');
console.log('   Chat ID:', process.env.ZALO_CHAT_ID || 'NOT SET');

// API: Get all tailor shops
app.get('/api/tailors', (req, res) => {
  res.json(tailorShops);
});

// API: Submit coupon request
app.post('/api/submit-coupon', async (req, res) => {
  try {
    const { tailorId, firstName, lastName, roomNumber, email, phone } = req.body;

    // Validation
    if (!tailorId || !tailorShops[tailorId]) {
      return res.status(400).json({ success: false, message: 'Invalid tailor selection' });
    }
    if (!firstName || !lastName || !roomNumber || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const tailor = tailorShops[tailorId];
    const couponCode = generateCouponCode();
    const timestamp = new Date().toISOString();

    // Email transporter
    const transporter = createTransporter();
    const hotelEmail = process.env.HOTEL_EMAIL || 'hotel@laluna.com';

    // Single email to guest with hotel CC'd
    const emailContent = {
      from: `"La Luna Hotel" <${hotelEmail}>`,
      to: email,
      cc: hotelEmail,
      subject: `Your Exclusive 10% Discount at ${tailor.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 2px solid #c9a227; padding-bottom: 20px;">
            <h1 style="color: #1a365d; margin: 0;">La Luna Hotel</h1>
            <p style="color: #718096; margin: 5px 0;">Exclusive Guest Benefit</p>
          </div>
          
          <div style="padding: 30px 0;">
            <h2 style="color: #2d3748;">Dear ${firstName} ${lastName},</h2>
            <p style="color: #4a5568; line-height: 1.6;">
              Thank you for staying with us at La Luna Hotel! As our valued guest, 
              we're pleased to offer you an exclusive <strong>10% discount</strong> 
              at <strong>${tailor.name}</strong>.
            </p>
            
            <div style="background: #faf9f7; border: 2px dashed #c9a227; border-radius: 12px; 
                        padding: 30px; margin: 30px 0; text-align: center;">
              <p style="color: #718096; font-size: 14px; margin: 0 0 10px;">Your Coupon Code</p>
              <h1 style="color: #1a365d; font-size: 36px; margin: 0; letter-spacing: 4px;">${couponCode}</h1>
            </div>
            
            <div style="background: #1a365d; color: white; border-radius: 12px; padding: 20px;">
              <h3 style="margin: 0 0 10px;">${tailor.name}</h3>
              <p style="margin: 5px 0;"><strong>Specialty:</strong> ${tailor.specialty}</p>
              <p style="margin: 5px 0;"><strong>Discount:</strong> 10% off your purchase</p>
            </div>
            
            <p style="color: #4a5568; line-height: 1.6; margin-top: 30px;">
              Simply show this email or provide the coupon code to the staff at ${tailor.name} 
              to redeem your discount. This offer is exclusively for La Luna Hotel guests.
            </p>
            
            <div style="background: #f7fafc; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <p style="color: #718096; font-size: 12px; margin: 0;">
                <strong>Hotel Reference:</strong><br>
                Guest: ${firstName} ${lastName} | Room: ${roomNumber} | Phone: ${phone || 'N/A'}
              </p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
            <p style="color: #718096; font-size: 12px;">
              La Luna Hotel | Room ${roomNumber} | ${new Date(timestamp).toLocaleString()}<br>
              For inquiries: ${hotelEmail}
            </p>
          </div>
        </div>
      `
    };

    // Send email with CC (only if HOTEL_EMAIL is configured)
    if (process.env.HOTEL_EMAIL) {
      await sendEmail(transporter, emailContent);
    } else {
      console.log('📧 Email skipped: HOTEL_EMAIL not configured');
    }

    // Send Zalo notification
    const zaloMessage = `🏨 La Luna Hotel - New Coupon Created!\n\n` +
      `👤 Guest: ${firstName} ${lastName}\n` +
      `🏠 Room: ${roomNumber}\n` +
      `📧 Email: ${email}\n` +
      `📱 Phone: ${phone || 'N/A'}\n` +
      `✂️ Tailor: ${tailor.name}\n` +
      `🎟️ Coupon: ${couponCode}\n` +
      `💰 Discount: 10% off\n\n` +
      `📅 Time: ${new Date(timestamp).toLocaleString()}`;
    
    await sendZaloMessage(zaloMessage);

    res.json({
      success: true,
      couponCode,
      message: 'Coupon created successfully! Email sent to guest.'
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🏨 La Luna Hotel Referral System`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
