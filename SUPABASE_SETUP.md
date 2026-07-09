# La Luna Hotel - Database Setup

## Option 1: Use Supabase (Recommended for Production)

### Why Supabase?
- Free tier: 500MB database, 2GB transfer/month
- No credit card required
- PostgreSQL-based, very reliable
- Works perfectly with Vercel

### Setup Steps:

1. **Create Supabase Account:**
   - Go to https://supabase.com
   - Sign up with GitHub (easiest)
   - Create new project

2. **Get Your Credentials:**
   - Go to Project Settings → API
   - Copy: `SUPABASE_URL` and `SUPABASE_ANON_KEY`

3. **Create Table:**
   In Supabase SQL Editor, run:
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
   
   -- Enable Row Level Security (optional, for public inserts)
   ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
   
   -- Allow public insert (for guests submitting coupons)
   CREATE POLICY "Allow inserts" ON coupons FOR INSERT WITH CHECK (true);
   
   -- Allow public read of coupons (for validation)
   CREATE POLICY "Allow read" ON coupons FOR SELECT USING (true);
   
   -- Allow updates (for marking as used)
   CREATE POLICY "Allow update" ON coupons FOR UPDATE USING (true);
   ```

4. **Add Environment Variables in Vercel:**
   ```
   SUPABASE_URL = https://xxxxx.supabase.co
   SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIs...
   ```

---

## Option 2: Use Memory Store (Free, Limited)

The app includes a fallback in-memory store. No setup needed!

- ✅ Works immediately
- ✅ Free
- ❌ Data resets when server sleeps/restarts
- ❌ Not suitable for production with real customers

---

## Option 3: Local Development with SQLite

For running locally on your machine:

```bash
# Install dependencies
npm install
cd client && npm install

# Run local server (uses SQLite)
npm run server

# In another terminal, run frontend
npm run client
```

The SQLite database file (`laluna.db`) will be created automatically.

---

## Quick Comparison

| Feature | Supabase | Memory | SQLite |
|---------|----------|--------|--------|
| Setup | Medium | None | None |
| Cost | Free tier | Free | Free |
| Persistence | ✅ Yes | ❌ No | ✅ Yes (local) |
| Scalability | High | None | None |
| Cloud Compatible | ✅ Yes | ✅ Yes | ❌ No |

**Recommendation:** Use **Supabase** for production deployment to Vercel.
