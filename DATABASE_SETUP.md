# El Perri - Database & Email Setup Guide

## Overview
This guide explains how to set up PostgreSQL and Resend email notifications for the El Perri website.

## Prerequisites
- Node.js 18+ (already installed)
- PostgreSQL (local or cloud)
- Resend account

---

## 1. PostgreSQL Setup

### Option A: Local PostgreSQL (Development)

#### Windows Installation
1. Download PostgreSQL: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Create a new database:
```bash
createdb el_perri
```

#### Or use Docker (Recommended for Development)
```bash
docker run --name el_perri_db `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=el_perri `
  -p 5432:5432 `
  -d postgres:latest
```

### Option B: Cloud PostgreSQL (Production)

Use any of these services:
- **Railway** (Recommended): https://railway.app
- **Supabase**: https://supabase.com
- **Heroku Postgres**: https://www.heroku.com/postgres
- **AWS RDS**: https://aws.amazon.com/rds/

### Configure Connection String
Create `.env.local` in project root:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/el_perri
```

### Database Schema

```sql
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
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
```

---

## 2. Resend Email Setup

### Create Account
1. Go to https://resend.com
2. Sign up for free
3. Get API key (starts with re_)

### Configure .env.local
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 3. Install Dependencies

```bash
npm install pg resend
```

---

## 4. Production Deployment

### Vercel Environment Variables
1. Go to Vercel Dashboard
2. Project → Settings → Environment Variables
3. Add DATABASE_URL and RESEND_API_KEY

### Deploy
```bash
git push origin main
```

---

**Status:** Ready for production deployment
