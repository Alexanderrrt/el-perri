# 🔧 Security Remediation Plan

**Objective:** Fix all CRITICAL and HIGH-priority security issues  
**Timeline:** 9-10 hours  
**Deadline Before:** Production deployment  

---

## CRITICAL ISSUES (MUST FIX FIRST) 🔴

### Issue #1: Password Hashing Not Implemented
**Time:** 30 minutes  
**Files to Modify:** `lib/auth.js`, `app/api/auth/admin-login/route.js`

#### Step 1: Install bcrypt
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

#### Step 2: Update `lib/auth.js`
**File:** `lib/auth.js`

Replace:
```javascript
/**
 * Hash password using bcrypt.
 * In production, use bcrypt.hash()
 */
export async function hashPassword(password) {
  // In production:
  // const salt = await bcrypt.genSalt(10);
  // return await bcrypt.hash(password, salt);

  // Mock: Return input (insecure, for demo only)
  return password;
}

/**
 * Verify password against hash.
 * In production, use bcrypt.compare()
 */
export async function verifyPassword(password, hash) {
  // In production:
  // return await bcrypt.compare(password, hash);

  // Mock: Compare directly (insecure, for demo only)
  return password === hash;
}
```

With:
```javascript
import bcrypt from 'bcrypt';

/**
 * Hash password using bcrypt (SECURE).
 * Uses salt rounds = 10 (balance between security and performance)
 */
export async function hashPassword(password) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify password against bcrypt hash (SECURE).
 * Uses constant-time comparison to prevent timing attacks
 */
export async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('[AUTH] Password verification failed:', error);
    return false;
  }
}
```

#### Step 3: Update `app/api/auth/admin-login/route.js`
In the admin login endpoint, change:
```javascript
// OLD (insecure)
const passwordMatch = true; // Skipped for demo

// NEW (secure)
const passwordMatch = await verifyPassword(password, admin.passwordHash);
if (!passwordMatch) {
  return Response.json(
    { error: "Invalid email or password" },
    { status: 401 }
  );
}
```

#### Step 4: Hash admin password during setup
When creating admin account:
```javascript
import { hashPassword } from '@/lib/auth';

// During admin account creation
const passwordHash = await hashPassword('Admin@123');
// Store passwordHash in database, never store plaintext
```

**Verification:**
```bash
npm run verify # Should pass
```

---

### Issue #2: Add CORS Protection
**Time:** 1 hour  
**Files to Modify:** `next.config.js`, all `/api/` routes

#### Step 1: Update `next.config.js`
Create or update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // CORS - only allow your domain
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          // Security headers
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

#### Step 2: Handle CORS in API routes
Add to each API route:

```javascript
// Middleware function
function setCORSHeaders(response) {
  response.headers.set(
    'Access-Control-Allow-Origin',
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  );
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export async function POST(request) {
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return setCORSHeaders(new Response(null, { status: 200 }));
  }

  try {
    // ... your endpoint logic ...
    const response = Response.json(data, { status: 200 });
    return setCORSHeaders(response);
  } catch (error) {
    const response = Response.json({ error: error.message }, { status: 500 });
    return setCORSHeaders(response);
  }
}

export async function OPTIONS(request) {
  return setCORSHeaders(new Response(null, { status: 200 }));
}
```

---

### Issue #3: Add CSRF Token Protection
**Time:** 2 hours  
**Files to Modify:** `lib/csrf.js` (new), `GuestCheckoutForm.jsx`, all POST endpoints

#### Step 1: Create CSRF utility (`lib/csrf.js`)
```javascript
import crypto from 'crypto';

/**
 * Generate CSRF token for session
 * Store in session, return to client
 */
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token using constant-time comparison
 * Prevents timing attacks
 */
export function validateCSRFToken(submittedToken, sessionToken) {
  if (!submittedToken || !sessionToken) {
    return false;
  }

  // Use crypto.timingSafeEqual for constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(submittedToken),
      Buffer.from(sessionToken)
    );
  } catch (error) {
    console.error('[CSRF] Token validation failed:', error);
    return false;
  }
}
```

#### Step 2: Update `GuestCheckoutForm.jsx`
```javascript
"use client";
import { useState, useEffect } from "react";

export function GuestCheckoutForm({ onSubmit, isLoading }) {
  const [csrfToken, setCSRFToken] = useState("");
  
  useEffect(() => {
    // Get CSRF token from server
    fetch("/api/csrf-token")
      .then(res => res.json())
      .then(data => setCSRFToken(data.token))
      .catch(err => console.error('Failed to fetch CSRF token:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Include CSRF token in request
    const data = {
      ...formData,
      csrf_token: csrfToken,
    };

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Hidden CSRF token input (for non-AJAX forms) */}
      <input type="hidden" name="csrf_token" value={csrfToken} />
      
      {/* ... rest of form ... */}
    </form>
  );
}
```

#### Step 3: Create CSRF token endpoint
**File:** `app/api/csrf-token/route.js`

```javascript
import { generateCSRFToken } from '@/lib/csrf';

export async function GET(request) {
  const token = generateCSRFToken();
  
  // Store in session (Redis/memory cache)
  // const sessionId = request.cookies.get('sessionId')?.value;
  // await redis.set(`csrf:${sessionId}`, token, { EX: 3600 });

  return Response.json({ token, status: 200 });
}
```

#### Step 4: Validate CSRF in POST endpoints
Update `app/api/checkout/guest/route.js`:

```javascript
import { validateCSRFToken } from '@/lib/csrf';

export async function POST(request) {
  try {
    const { csrf_token, ...data } = await request.json();

    // Validate CSRF token
    const sessionToken = request.cookies.get('sessionToken')?.value;
    if (!validateCSRFToken(csrf_token, sessionToken)) {
      return Response.json(
        { error: "Invalid security token" },
        { status: 403 }
      );
    }

    // Process checkout...
  } catch (error) {
    // ...
  }
}
```

---

### Issue #4: Secure Environment Variables
**Time:** 15 minutes  
**Files to Modify:** `.env.local.example`, `.gitignore`

#### Step 1: Update `.env.local.example`
Replace with FAKE example values:

```bash
# .env.local.example - TEMPLATE ONLY
# Copy to .env.local and fill with REAL values
# NEVER commit .env.local to git

NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database (CHANGE THESE)
DATABASE_URL=mysql://root:FAKE_PASSWORD@localhost:3306/el_perri

# Security (GENERATE REAL VALUES)
JWT_SECRET=GENERATE_RANDOM_32_CHAR_STRING_HERE
ADMIN_2FA_SECRET=GENERATE_IN_AUTHENTICATOR_APP

# Email (GET FROM SERVICE)
SENDGRID_API_KEY=SG.FAKE_KEY_GET_FROM_SENDGRID

# Payment (GET FROM PROVIDER)
STRIPE_SECRET_KEY=sk_test_FAKE_KEY_HERE
```

#### Step 2: Verify `.gitignore`
Ensure `.gitignore` contains:
```
.env.local
.env*.local
.env.production.local
```

**Verify:**
```bash
git status # Should NOT show .env.local
```

---

### Issue #5: Add Rate Limiting
**Time:** 1 hour  
**Files to Modify:** Create `lib/rateLimit.js`, update API routes

#### Step 1: Install package
```bash
npm install express-rate-limit
```

#### Step 2: Create `lib/rateLimit.js`
```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
// Note: In development, use memory store. In production, use Redis.

/**
 * Rate limiter for admin login (5 attempts per 15 minutes)
 */
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter for 2FA verification (3 attempts per 5 minutes)
 */
export const twoFaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 attempts
  message: 'Too many 2FA attempts. Please try again in 5 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter for guest checkout (100 per hour per IP)
 */
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests
  message: 'Too many checkouts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});
```

#### Step 3: Apply to endpoints

**File:** `app/api/auth/admin-login/route.js`

```javascript
import { adminLoginLimiter } from '@/lib/rateLimit';

export async function POST(request) {
  // Check rate limit
  try {
    await new Promise((resolve, reject) => {
      adminLoginLimiter(request, new Response(), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    return Response.json(
      { error: "Too many login attempts" },
      { status: 429 }
    );
  }

  // ... rest of login logic
}
```

**File:** `app/api/checkout/guest/route.js`

```javascript
import { checkoutLimiter } from '@/lib/rateLimit';

export async function POST(request) {
  // Check rate limit
  try {
    await new Promise((resolve, reject) => {
      checkoutLimiter(request, new Response(), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    return Response.json(
      { error: "Too many checkout attempts" },
      { status: 429 }
    );
  }

  // ... rest of checkout logic
}
```

---

## HIGH-PRIORITY ISSUES (SHOULD FIX) 🟠

### Issue #6: Add Input Validation (2 hours)

```bash
npm install zod
```

**Create `lib/validators.js`:**
```javascript
import { z } from 'zod';

export const GuestCheckoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Invalid phone format'),
  delivery_address: z.string().min(5).max(200),
  marketing_consent: z.boolean(),
  items: z.array(z.object({
    item_id: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })),
  total: z.number().positive().max(10000),
});

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
```

Apply in endpoints:
```javascript
export async function POST(request) {
  const body = await request.json();
  
  try {
    const validated = GuestCheckoutSchema.parse(body);
    // Use validated data only
    await createOrder(validated);
  } catch (error) {
    return Response.json(
      { error: "Invalid input", details: error.errors },
      { status: 400 }
    );
  }
}
```

---

### Issue #7: Add XSS Protection (1 hour)

**Create `lib/security.js`:**
```javascript
/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHTML(text) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (char) => escapeMap[char]);
}

/**
 * Sanitize URLs to prevent javascript: attacks
 */
export function sanitizeURL(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '#'; // Fallback to safe URL
    }
    return url;
  } catch {
    return '#'; // Fallback on invalid URL
  }
}
```

Use in email templates:
```javascript
// lib/email.js
import { escapeHTML } from './security';

export async function sendOrderConfirmation(order) {
  const html = `
    <p>Hello ${escapeHTML(order.customerName)},</p>
    <p>Order #${escapeHTML(order.orderNumber)} confirmed!</p>
  `;
  
  return sendEmail({
    to: order.email,
    html,
  });
}
```

---

### Issue #8: Add Security Headers (30 minutes)

Already done in `next.config.js` (Issue #2). Verify it's applied:

```bash
# Test headers
curl -i http://localhost:3000/api/checkout/guest

# Look for:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

---

### Issue #9: Implement Logout Endpoint (30 minutes)

**File:** `app/api/auth/logout/route.js` (new)

```javascript
export async function POST(request) {
  // Get admin token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.slice(7);

  if (token) {
    // Invalidate token in Redis/cache
    // await redis.del(`adminToken:${token}`);
    console.log(`[AUTH] Admin logged out: ${token.slice(0, 8)}...`);
  }

  return Response.json(
    { message: 'Logged out successfully' },
    {
      status: 200,
      headers: {
        'Set-Cookie': 'adminToken=; Max-Age=0; Secure; HttpOnly; SameSite=Strict',
      },
    }
  );
}
```

Add to `AdminLoginForm.jsx`:
```javascript
const handleLogout = async () => {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });

  // Clear client-side state
  document.cookie = 'adminToken=; Max-Age=0';
  window.location.href = '/admin/login';
};
```

---

### Issue #10: Weaken 2FA Window (30 minutes)

**File:** `app/api/auth/verify-2fa/route.js`

Change:
```javascript
// OLD - too generous
const verified = speakeasy.totp.verify({
  window: 2, // ±2 intervals = 2 minutes
});

// NEW - more strict
const verified = speakeasy.totp.verify({
  window: 1, // ±1 interval = ±30 seconds only
});
```

---

## Verification Checklist

After all fixes are applied:

```bash
# 1. Install all dependencies
npm install

# 2. Verify build still works
npm run build

# 3. Run security check
npm audit

# 4. Test locally
npm run dev

# 5. Test guest checkout
#    - Visit http://localhost:3000/checkout
#    - Submit form
#    - Verify CSRF token included

# 6. Test admin login
#    - Visit http://localhost:3000/admin/login
#    - Try invalid password 5 times
#    - Verify rate limit kicks in

# 7. Verify CORS headers
curl -i http://localhost:3000/api/checkout/guest

# 8. Verify passwords are hashed
#    - Check database - passwords should be 60+ character hashes
#    - NOT plaintext
```

---

## Timeline

| Phase | Tasks | Time |
|-------|-------|------|
| 1 | Password hashing | 30 min |
| 2 | CORS protection | 1 hour |
| 3 | CSRF tokens | 2 hours |
| 4 | Rate limiting | 1 hour |
| 5 | Input validation | 2 hours |
| 6 | XSS protection, security headers | 1.5 hours |
| 7 | Logout, weak 2FA fix | 1 hour |
| 8 | Testing & verification | 1 hour |
| | **TOTAL** | **~10 hours** |

---

## Success Criteria

- [ ] All passwords are hashed (bcrypt)
- [ ] CORS only allows your domain
- [ ] CSRF tokens validated on all POST
- [ ] Rate limiting blocks brute force
- [ ] Input validated with Zod
- [ ] XSS threats escaped in emails
- [ ] Security headers configured
- [ ] Logout endpoint works
- [ ] 2FA window reduced to ±30 sec
- [ ] npm audit shows no critical issues
- [ ] Build passes without errors
- [ ] Manual testing confirms no regressions

---

**After completing these fixes, re-run the audit for updated score.**
