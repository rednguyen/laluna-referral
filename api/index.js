const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Fallback in-memory storage (for development without Supabase)
let memoryStore = { coupons: [], nextId: 1 };

// Tailor shops data
const tailorShops = {
  'bebe': { id: 'bebe', name: 'BeBe Tailor', specialty: 'Classic European Cut' },
  'bluesky': { id: 'bluesky', name: 'Blue Sky Tailor', specialty: 'Modern Slim Fit' },
  'yali': { id: 'yali', name: 'Yali Tailor', specialty: 'Asian Fusion Style' }
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
    // Check uniqueness (for memory store)
    isUnique = !memoryStore.coupons.some(c => c.coupon_code === code);
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

    const newCoupon = {
      coupon_code: couponCode,
      tailor_id: tailorId,
      tailor_name: tailor.name,
      first_name: firstName,
      last_name: lastName,
      room_number: roomNumber,
      email: email,
      phone: phone || null,
      created_at: timestamp,
      used: false,
      used_at: null
    };

    // Save to Supabase or memory
    if (supabase) {
      const { data, error } = await supabase
        .from('coupons')
        .insert([newCoupon])
        .select()
        .single();
      if (error) throw error;
      newCoupon.id = data.id;
    } else {
      newCoupon.id = memoryStore.nextId++;
      memoryStore.coupons.push(newCoupon);
    }

    // Send single email to guest with hotel CC'd
    if (process.env.EMAIL_USER && process.env.HOTEL_EMAIL) {
      const transporter = createTransporter();
      const hotelEmail = process.env.HOTEL_EMAIL || 'hotel@laluna.com';

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
    }

    res.json({ success: true, couponCode, tailor, couponId: newCoupon.id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API: Get all coupons
app.get('/coupons', async (req, res) => {
  try {
    if (supabase) {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      res.json(data || []);
    } else {
      res.json(memoryStore.coupons);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching coupons' });
  }
});

// API: Check coupon
app.get('/check-coupon/:code', async (req, res) => {
  const { code } = req.params;
  try {
    if (supabase) {
      const { data } = await supabase.from('coupons').select('*').eq('coupon_code', code).single();
      res.json(data ? { valid: !data.used, coupon: data } : { valid: false, message: 'Not found' });
    } else {
      const coupon = memoryStore.coupons.find(c => c.coupon_code === code);
      res.json(coupon ? { valid: !coupon.used, coupon } : { valid: false, message: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// API: Mark as used
app.post('/use-coupon/:code', async (req, res) => {
  const { code } = req.params;
  try {
    if (supabase) {
      const { error } = await supabase.from('coupons').update({ used: true, used_at: new Date().toISOString() }).eq('coupon_code', code).eq('used', false);
      if (error) throw error;
      res.json({ success: true });
    } else {
      const coupon = memoryStore.coupons.find(c => c.coupon_code === code && !c.used);
      if (coupon) { coupon.used = true; coupon.used_at = new Date().toISOString(); res.json({ success: true }); }
      else res.status(400).json({ success: false, message: 'Not found or used' });
    }
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = app;
