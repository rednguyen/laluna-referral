const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'laluna.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coupon_code TEXT UNIQUE NOT NULL,
    tailor_id TEXT NOT NULL,
    tailor_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    room_number TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT 0,
    used_at DATETIME
  );

  CREATE INDEX IF NOT EXISTS idx_coupon_code ON coupons(coupon_code);
  CREATE INDEX IF NOT EXISTS idx_email ON coupons(email);
`);

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
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = 'LUNA-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = db.prepare('SELECT id FROM coupons WHERE coupon_code = ?').get(code);
    if (!existing) isUnique = true;
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

// Debug: Log email configuration on startup
console.log('📧 Email Configuration:');
console.log('   Service:', process.env.EMAIL_SERVICE || 'gmail');
console.log('   User:', process.env.EMAIL_USER || 'NOT SET');
console.log('   Password:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
console.log('   Hotel Email:', process.env.HOTEL_EMAIL || 'NOT SET');

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

    // Save to SQLite database
    const insertStmt = db.prepare(`
      INSERT INTO coupons (coupon_code, tailor_id, tailor_name, first_name, last_name, room_number, email, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertStmt.run(
      couponCode,
      tailorId,
      tailor.name,
      firstName,
      lastName,
      roomNumber,
      email,
      phone || null,
      timestamp
    );

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

    // Send single email with CC
    await sendEmail(transporter, emailContent);

    res.json({
      success: true,
      couponCode,
      message: 'Coupon created successfully!',
      tailor: tailor,
      couponId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
});

// API: Get all coupons (for hotel admin)
app.get('/api/coupons', (req, res) => {
  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
    res.json(coupons);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Mark coupon as used
app.post('/api/use-coupon/:code', (req, res) => {
  try {
    const { code } = req.params;
    const result = db.prepare(`
      UPDATE coupons SET used = 1, used_at = CURRENT_TIMESTAMP 
      WHERE coupon_code = ? AND used = 0
    `).run(code);

    if (result.changes > 0) {
      res.json({ success: true, message: 'Coupon marked as used' });
    } else {
      res.status(400).json({ success: false, message: 'Coupon not found or already used' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Check coupon validity
app.get('/api/check-coupon/:code', (req, res) => {
  try {
    const { code } = req.params;
    const coupon = db.prepare('SELECT * FROM coupons WHERE coupon_code = ?').get(code);
    
    if (coupon) {
      res.json({
        valid: !coupon.used,
        coupon: coupon
      });
    } else {
      res.status(404).json({ valid: false, message: 'Coupon not found' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🏨 La Luna Hotel Referral System`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: SQLite (${dbPath})`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
