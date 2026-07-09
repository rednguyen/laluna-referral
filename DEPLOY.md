# Deploying La Luna Hotel to Vercel (Frontend + Backend)

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Vercel                             │
│                                                      │
│  ┌─────────────┐     ┌─────────────────────────────┐ │
│  │   Frontend  │     │        Backend              │ │
│  │   (React)   │────▶│   (Serverless Functions)   │ │
│  │  /client/   │     │      /api/index.js         │ │
│  └─────────────┘     └─────────────────────────────┘ │
│         │                        │                    │
│         ▼                        ▼                    │
│   Static CDN               Supabase DB               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## IMPORTANT: Cloud Deployment Requires Supabase

Local development uses SQLite (`laluna.db`), but **cloud deployment requires Supabase** for the database.

## Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create free account
2. Create new project → Copy your **Project URL** and **anon/public** key
3. Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE coupons (
  id BIGSERIAL PRIMARY KEY,
  coupon_code TEXT UNIQUE NOT NULL,
  tailor_id TEXT NOT NULL,
  tailor_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_coupon_code ON coupons(coupon_code);
CREATE INDEX idx_email ON coupons(email);
```

## Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "La Luna Hotel Referral System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/laluna-referral.git
git push -u origin main
```

## Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your `laluna-referral` repository
4. Framework Preset: **Other**
5. Root Directory: `.`
6. Click **"Deploy"**

## Step 4: Configure Environment Variables

Go to: **Project Settings → Environment Variables**

| Variable | Value | Required |
|----------|-------|----------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | ✅ Database |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` | ✅ Database |
| `EMAIL_SERVICE` | `gmail` | ✅ Emails |
| `EMAIL_USER` | `your@gmail.com` | ✅ Emails |
| `EMAIL_PASS` | `xxxx xxxx xxxx xxxx` | ✅ App Password |
| `HOTEL_EMAIL` | `hotel@yourhotel.com` | ✅ Notifications |

## Step 5: Redeploy

After adding environment variables:
- Go to **Deployments**
- Click **...** → **"Redeploy"**

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                   Vercel                             │
│                                                      │
│  ┌─────────────┐     ┌─────────────────────────────┐ │
│  │   Frontend  │     │        Backend              │ │
│  │   (React)   │────▶│   (Serverless Functions)   │ │
│  │  /client/   │     │      /api/index.js         │ │
│  └─────────────┘     └─────────────────────────────┘ │
│         │                        │                    │
│         ▼                        ▼                    │
│   Static CDN               Supabase DB               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## URLs After Deployment

- **Website:** `https://your-project.vercel.app`
- **API Endpoint:** `https://your-project.vercel.app/api/submit-coupon`

## Common Issues

### 1. "Cannot find module" errors
Make sure `@supabase/supabase-js` is in dependencies (it is!)

### 2. Emails not sending
- Check `EMAIL_USER` and `EMAIL_PASS` are correct
- Make sure you're using Gmail **App Password**, not your regular password
- Enable 2FA → Create App Password at: https://myaccount.google.com/apppasswords

### 3. Database errors
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check Supabase table exists (see SUPABASE_SETUP.md)

### 4. Build errors
- Run `npm run build` locally first to check
- Ensure all dependencies are in package.json

## Updating Your App

```bash
# Make changes
git add .
git commit -m "Your changes"
git push
# Vercel auto-deploys!
```

## Custom Domain (Optional)

1. **Settings → Domains**
2. Add `coupon.lalunahotel.com`
3. Update DNS as instructed
4. Wait for SSL certificate (automatic)
