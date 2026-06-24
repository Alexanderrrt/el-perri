# El Perri - Backend Integration Checklist

## ✅ What's Been Setup

### Email Integration (Resend)
- [x] Email utility created: `lib/email.js`
- [x] Newsletter signup sends welcome email
- [x] Order creation sends confirmation email
- [x] Admin notification system ready
- [x] Email templates with HTML formatting

### Database Preparation
- [x] Database utility created: `lib/db.js`
- [x] Environment variables template: `.env.example`
- [x] API routes updated with email sending
- [x] Order ID format improved (ORD-timestamp)
- [x] Database schema SQL provided

### API Improvements
- [x] POST `/api/subscribers` - sends email + stores subscriber
- [x] POST `/api/orders` - sends email + stores order
- [x] Error handling for failed emails (continues on failure)
- [x] Console logging for debugging

---

## 🚀 Next Steps (Your Action Required)

### Step 1: Install Required Packages
```powershell
cd "C:\Users\Alexander\Desktop\El perri"
npm install pg resend
```

### Step 2: Setup PostgreSQL Database

**Option A - Local (Development):**
```powershell
# Windows - Install PostgreSQL from https://www.postgresql.org/download/windows/
# Or use Docker:
docker run --name el_perri_db ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=el_perri ^
  -p 5432:5432 ^
  -d postgres:latest
```

**Option B - Cloud (Production):**
- Sign up at Railway.app (easiest), Supabase, or Heroku
- Get connection string

### Step 3: Setup Resend Account
1. Go to https://resend.com
2. Sign up (free account)
3. Get API Key from Settings → API Keys
4. Key will start with "re_"

### Step 4: Create .env.local File
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/el_perri

# Email (Resend)
RESEND_API_KEY=re_YOUR_KEY_HERE

# App
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### Step 5: Create Database Tables
Connect to PostgreSQL and run:

```sql
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  image_url TEXT,
  tag VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_email ON orders(email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_subscribers_email ON subscribers(email);
```

### Step 6: Test Email Sending
```bash
curl -X POST http://localhost:3000/api/subscribers \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"your-email@example.com\",\"name\":\"Test\"}"
```
Check email inbox for welcome message!

---

## 📊 File Summary

### New Files Created:
- `lib/db.js` - PostgreSQL connection utility
- `lib/email.js` - Resend email service
- `.env.example` - Environment template
- `DATABASE_SETUP.md` - Full setup guide

### Modified Files:
- `app/api/subscribers/route.js` - Now sends email on signup
- `app/api/orders/route.js` - Now sends email on order

---

## 🔑 Key Features

### Newsletter Signup Flow:
1. User enters email on homepage
2. WelcomeBubble submits to `/api/subscribers`
3. Email validated and stored
4. Welcome email sent via Resend
5. User sees "Thank You" message

### Order Flow:
1. Customer fills checkout form
2. POST to `/api/orders` with email
3. Order stored in PostgreSQL
4. Order confirmation email sent
5. Customer sees confirmation page

### Email Templates:
- Welcome email (newsletter)
- Order confirmation (with itemized receipt)
- Admin notifications (for new features)

---

## 💡 Pro Tips

### For Development:
- Use local PostgreSQL with Docker
- Use Resend test emails (no real emails sent yet)
- Check http://localhost:3000 for errors

### For Production:
- Use Railway or Supabase for database (easier than Heroku)
- Verify your domain in Resend for production emails
- Add DATABASE_URL and RESEND_API_KEY to Vercel secrets

### Monitoring:
- Check console logs with `npm run dev`
- View sent emails in Resend dashboard
- Query database with pgAdmin or psql

---

## ❓ Common Issues

**"Cannot find module pg"**
```bash
npm install pg
```

**"ECONNREFUSED - PostgreSQL not running"**
```bash
# Check if running
pg_isready
# Start PostgreSQL service (Windows)
# Or start Docker: docker start el_perri_db
```

**"Resend API key invalid"**
- Double-check key starts with "re_"
- Verify in Resend dashboard
- Key might be rotated

---

## 📝 Next After Setup

1. Test email sending (newsletter + order)
2. Verify database has data
3. Commit changes: `git add . && git commit -m "feat: database and email integration"`
4. Push to GitHub: `git push origin master`
5. Deploy to Vercel with environment variables

---

**Current Status:** 
- Backend integration code ready ✅
- Just need to run setup steps ⏳
- Then ready for Vercel deployment 🚀
