# La Luna Hotel Referral System

A web application for La Luna Hotel guests to receive exclusive discount coupons for partner tailor shops.

## Features
- 🎫 Select from 3 partner tailor shops
- 📝 Guest information collection
- 📧 Automatic email notifications to guest and hotel
- 💾 SQLite database for coupon records
- ✅ Coupon validation system

## Tech Stack
- **Backend:** Node.js + Express.js
- **Database:** SQLite (file-based, no setup required)
- **Frontend:** React + Vite
- **Email:** Nodemailer

## Setup

### 1. Install Dependencies
```bash
npm install
cd client && npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update with your email settings:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
HOTEL_EMAIL=hotel@laluna.com
PORT=3001
```

**For Gmail:** You'll need an App Password. Enable 2FA first, then create one at:
https://myaccount.google.com/apppasswords

### 3. Run the Application
```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run server  # Backend on port 3001
npm run client  # Frontend on port 5173
```

## Partner Tailor Shops
1. **BeBe Tailor** - Classic European Cut
2. **Blue Sky Tailor** - Modern Slim Fit
3. **Yali Tailor** - Asian Fusion Style

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tailors` | Get all tailor shops |
| POST | `/api/submit-coupon` | Create new coupon |
| GET | `/api/coupons` | Get all coupons (admin) |
| GET | `/api/check-coupon/:code` | Validate coupon |
| POST | `/api/use-coupon/:code` | Mark coupon as used |

## Database
SQLite database file: `laluna.db` (auto-created on first run)

### Schema
```sql
CREATE TABLE coupons (
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
```
