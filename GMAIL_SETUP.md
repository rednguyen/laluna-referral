# Gmail App Password Setup

## The Problem
Your `.env` file has spaces in the password: `snai gnen ecbh gaax`
Gmail App Passwords should be **16 characters WITHOUT spaces**.

## How to Get a Correct Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" 
3. Turn it **ON**

### Step 2: Create App Password
1. Go to: https://myaccount.google.com/apppasswords
2. You may need to sign in again
3. Select **"Mail"** as the app
4. Select **"Other (Custom name)"** 
5. Enter: `La Luna Hotel`
6. Click **Generate**
7. Copy the 16-character password shown

### Step 3: Update Your .env File
Replace your current `.env` content with:

```
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=chanelnguyen1478@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  ← Replace with the 16-char password (NO SPACES)

# Hotel Email
HOTEL_EMAIL=shibaliquor@gmail.com

# Server Port
PORT=3001
```

**Example of correct password:** `abcdabcdabcdabcd` (16 characters, no spaces)

### Step 4: Restart Server
```bash
npm run server
```

### Step 5: Check Console Logs
When you submit a form, you should see:
```
📧 Sending email to: guest@example.com
✅ Email sent successfully!
```

## Troubleshooting

### Error: "Invalid login"
- ❌ Wrong password - make sure it's an App Password, not your regular password
- ❌ Spaces in password - remove all spaces

### Error: "Less secure app access"
- ✅ This is expected - App Passwords work differently

### Not seeing the email?
- Check spam/junk folder
- Verify recipient email is correct
