# Database Schema — Guest Checkout & Marketing Compliance

**Design Principle:** Customer-centric model where both registered users and guests are treated as "customers" with different privileges, enabling unified order tracking, marketing analytics, and audit logging.

**Compliance Considerations:** Every field, relationship, and operation supports GDPR/CCPA accountability.

---

## Core Tables

### 1. `customers` (Universal Customer Record)

Holds all customer data — registered users and guests use this as the foundation.

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  
  -- Identity
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  -- Customer Type
  customer_type ENUM('registered', 'guest') NOT NULL DEFAULT 'guest',
  
  -- Marketing & Communications
  marketing_consent ENUM('opted_in', 'opted_out', 'pending_confirmation') NOT NULL DEFAULT 'pending_confirmation',
  marketing_consent_date TIMESTAMP,
  marketing_consent_method ENUM('checkout', 'email_link', 'web_form', 'phone', 'in_person') DEFAULT 'checkout',
  
  -- Account Status
  account_status ENUM('active', 'inactive', 'deleted') NOT NULL DEFAULT 'active',
  
  -- Data Collection
  ip_address_at_signup VARCHAR(45), -- IPv4 or IPv6
  user_agent_at_signup TEXT,
  
  -- Audit Fields
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP, -- Soft delete support for GDPR right-to-be-forgotten
  
  -- Indexes
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_customer_type (customer_type),
  INDEX idx_marketing_consent (marketing_consent),
  UNIQUE INDEX idx_email_not_deleted (email, deleted_at) -- Allows re-signup after deletion
);
```

**Notes:**
- `customer_type` determines if this customer has a corresponding row in `users` or `guests` table
- `marketing_consent` defaults to `pending_confirmation` — requires explicit double-opt-in via email confirmation
- `deleted_at` enables soft delete for GDPR compliance (user can be "deleted" without losing order history for accounting)
- `ip_address_at_signup` and `user_agent_at_signup` are captured for compliance audit trail

---

### 2. `users` (Registered User Extension)

Only populated if `customers.customer_type = 'registered'`.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL UNIQUE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Authentication
  password_hash VARCHAR(255) NOT NULL,
  password_changed_at TIMESTAMP,
  
  -- Profile
  profile_data JSON, -- Stores additional profile info: {address, birthday, preferences, etc.}
  
  -- Account Settings
  email_verified_at TIMESTAMP,
  phone_verified_at TIMESTAMP,
  
  -- Loyalty
  loyalty_points INT DEFAULT 0,
  loyalty_tier ENUM('bronze', 'silver', 'gold') DEFAULT 'bronze',
  
  -- Preferences
  preferred_delivery_address TEXT,
  preferred_payment_method VARCHAR(50),
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_customer_id (customer_id)
);
```

**Notes:**
- This table only has data if the customer completed full registration
- `profile_data` (JSON) stores optional fields: address, birthday, dietary restrictions, etc.
- Registered users can update their profile; guests cannot

---

### 3. `guests` (Guest Checkout Extension)

Only populated if `customers.customer_type = 'guest'`.

```sql
CREATE TABLE guests (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL UNIQUE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Guest Metadata
  guest_orders_count INT DEFAULT 1,
  last_order_date TIMESTAMP,
  
  -- For potential future conversion to registered user
  conversion_eligible_at TIMESTAMP, -- When this guest can be invited to sign up
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_customer_id (customer_id)
);
```

**Notes:**
- Lightweight table; most data lives in `customers`
- `guest_orders_count` helps identify high-value guests for conversion campaigns
- `conversion_eligible_at` implements politeness: don't re-invite immediately after first order

---

### 4. `orders` (Unified Order Record)

All orders, whether placed by registered users or guests.

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  
  -- Customer Reference
  customer_id INT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  
  -- Order Details
  order_number VARCHAR(50) NOT NULL UNIQUE, -- Format: "ORD-20260623-001"
  items JSON NOT NULL, -- Array of {item_id, name, price, quantity, customizations}
  
  -- Financial
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Fulfillment
  order_type ENUM('delivery', 'pickup', 'dine_in') NOT NULL,
  delivery_address TEXT,
  estimated_ready_time TIMESTAMP,
  actual_ready_time TIMESTAMP,
  
  -- Status
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  
  -- Payment
  payment_method ENUM('cash', 'card', 'paypal', 'apple_pay') NOT NULL,
  payment_status ENUM('pending', 'completed', 'refunded', 'failed') NOT NULL DEFAULT 'pending',
  
  -- Special Requests
  special_instructions TEXT,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_customer_id (customer_id),
  INDEX idx_order_number (order_number),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

**Notes:**
- `order_number` is human-readable for customer support
- `items` stored as JSON for flexibility (no separate items table required initially)
- All orders are tracked for accounting and marketing analytics
- `delivery_address` can be different from customer's stored address

---

### 5. `privacy_policy_agreements` (Compliance Tracking)

Tracks which version of privacy policy user agreed to, and when.

```sql
CREATE TABLE privacy_policy_agreements (
  id SERIAL PRIMARY KEY,
  
  -- Customer Reference
  customer_id INT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  
  -- Policy Tracking
  policy_version VARCHAR(50) NOT NULL, -- Format: "1.0", "2.0", etc.
  policy_accepted_at TIMESTAMP NOT NULL,
  
  -- Terms & Conditions
  terms_of_service_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_policy_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Audit Trail
  ip_address VARCHAR(45),
  user_agent TEXT,
  acceptance_method ENUM('web_checkout', 'mobile_app', 'phone_call') NOT NULL DEFAULT 'web_checkout',
  
  -- Indexes
  INDEX idx_customer_id (customer_id),
  INDEX idx_policy_version (policy_version),
  
  CONSTRAINT ensure_at_least_one_accepted CHECK (
    terms_of_service_accepted = TRUE AND privacy_policy_accepted = TRUE
  )
);
```

**Notes:**
- When privacy policy is updated, new agreements must be re-signed
- `policy_version` tracks which version of policy customer agreed to (critical for GDPR defense)
- Latest agreement for a customer is found via: `SELECT * FROM privacy_policy_agreements WHERE customer_id = X ORDER BY policy_accepted_at DESC LIMIT 1`

---

### 6. `marketing_consent_history` (Opt-in/Out Tracking)

Immutable log of all marketing consent changes (required for CCPA/GDPR compliance).

```sql
CREATE TABLE marketing_consent_history (
  id SERIAL PRIMARY KEY,
  
  -- Customer Reference
  customer_id INT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  
  -- Consent Status
  previous_status ENUM('opted_in', 'opted_out', 'pending_confirmation'),
  new_status ENUM('opted_in', 'opted_out', 'pending_confirmation') NOT NULL,
  
  -- Context
  consent_method ENUM('checkout', 'email_link', 'web_form', 'phone', 'in_person', 'automated_double_optin') NOT NULL,
  reason TEXT, -- e.g., "User clicked unsubscribe link", "User selected skip signup"
  
  -- Audit
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  INDEX idx_customer_id (customer_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_new_status (new_status)
);
```

**Notes:**
- Immutable log — never update, only insert
- Used to prove compliance: "User X opted out on date Y via method Z"
- Critical for CCPA right-to-opt-out enforcement

---

### 7. `audit_log` (Universal Accountability)

Captures every significant action for financial reporting and compliance audits.

```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  
  -- Entity Being Changed
  entity_type ENUM('customer', 'order', 'marketing_consent', 'policy_agreement') NOT NULL,
  entity_id INT NOT NULL, -- ID of the customer, order, etc.
  
  -- Action
  action ENUM('created', 'updated', 'deleted', 'restored', 'export_data_requested', 'deletion_requested') NOT NULL,
  
  -- Changes
  old_values JSON, -- Previous state (for updates)
  new_values JSON, -- New state
  changes_description TEXT, -- Human-readable summary
  
  -- Actor
  actor_type ENUM('system', 'admin', 'customer', 'anonymous') NOT NULL,
  actor_id INT, -- ID of admin or customer making change
  
  -- Network
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action)
);
```

**Notes:**
- `old_values` and `new_values` as JSON enable auditors to see exactly what changed
- `actor_type` distinguishes: system (automated process), admin (staff), customer (user action), anonymous (guest)
- Used for compliance audits: "Show me all changes to customer 123's data"

---

### 8. `data_exports` (GDPR Right to Data Portability)

Tracks data export requests (user can request their data in portable format).

```sql
CREATE TABLE data_exports (
  id SERIAL PRIMARY KEY,
  
  -- Customer
  customer_id INT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  
  -- Export Details
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  export_completed_at TIMESTAMP,
  file_url TEXT, -- URL to download their data (PDF or JSON)
  file_format ENUM('json', 'pdf', 'csv') NOT NULL DEFAULT 'json',
  
  -- Status
  status ENUM('pending', 'completed', 'failed', 'expired') NOT NULL DEFAULT 'pending',
  
  -- Audit
  ip_address VARCHAR(45),
  reason_code VARCHAR(50), -- e.g., "gdpr_request", "user_initiated"
  
  INDEX idx_customer_id (customer_id),
  INDEX idx_requested_at (requested_at)
);
```

**Notes:**
- When customer requests "download my data", create a row here
- Background job generates JSON export of all their orders, profile, communications
- URL expires after 30 days for security

---

### 9. `deletion_requests` (GDPR Right to Be Forgotten)

Tracks data deletion requests (user can request account deletion).

```sql
CREATE TABLE deletion_requests (
  id SERIAL PRIMARY KEY,
  
  -- Customer
  customer_id INT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  
  -- Request Details
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP, -- When user confirmed deletion (after email confirmation)
  completed_at TIMESTAMP, -- When deletion was executed
  
  -- Status
  status ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  
  -- Reason
  deletion_reason TEXT, -- "I want to delete my account", etc.
  
  -- Audit
  ip_address VARCHAR(45),
  
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status)
);
```

**Notes:**
- User requests deletion → we send confirmation email (30-day grace period)
- After confirmation, we soft-delete: set `customers.deleted_at` and `customers.account_status = 'deleted'`
- We keep order records for accounting purposes but anonymize personal data
- Never fully purge customer data due to tax/accounting requirements

---

## Views (Simplified Data Access)

### View: `customer_summary`

Single query to get customer + registration status + latest order:

```sql
CREATE VIEW customer_summary AS
SELECT 
  c.id,
  c.email,
  c.phone,
  c.first_name,
  c.last_name,
  c.customer_type,
  c.marketing_consent,
  c.created_at,
  COALESCE(u.loyalty_tier, 'none') as loyalty_tier,
  COUNT(DISTINCT o.id) as total_orders,
  MAX(o.created_at) as last_order_date,
  SUM(o.total) as lifetime_spending
FROM customers c
LEFT JOIN users u ON c.id = u.customer_id
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.deleted_at IS NULL
GROUP BY c.id, u.id;
```

### View: `marketing_eligible_contacts`

Used to pull contact list for marketing campaigns (only opted-in):

```sql
CREATE VIEW marketing_eligible_contacts AS
SELECT 
  c.id,
  c.email,
  c.phone,
  c.first_name,
  c.marketing_consent_date,
  c.created_at,
  COUNT(o.id) as order_count,
  SUM(o.total) as lifetime_value
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.deleted_at IS NULL 
  AND c.marketing_consent = 'opted_in'
GROUP BY c.id
ORDER BY lifetime_value DESC;
```

---

## Data Lifecycle & Compliance Rules

### Guest Checkout Flow:
1. Guest enters email/phone at checkout
2. Create `customers` row with `customer_type = 'guest'`, `marketing_consent = 'pending_confirmation'`
3. Create `guests` row
4. Create `orders` row
5. Create `privacy_policy_agreements` row
6. Send confirmation email: "Click here to confirm your email and opt into marketing"
7. User clicks link → sets `marketing_consent = 'opted_in'`, create `marketing_consent_history` log

### Registered Signup Flow:
1. User fills signup form
2. Create `customers` row with `customer_type = 'registered'`
3. Create `users` row with hashed password
4. Send verification email
5. User confirms email → sets `email_verified_at`, `marketing_consent = 'opted_in'`

### Marketing Compliance:
- **Only send emails to users with `marketing_consent = 'opted_in'`**
- Every email must have unsubscribe link
- Unsubscribe updates `customers.marketing_consent = 'opted_out'` and logs in `marketing_consent_history`
- Implement CCPA opt-out mechanism (link on website for guests to opt-out)

### GDPR Right to Delete:
1. User submits deletion request → create `deletion_requests` row with `status = 'pending'`
2. Send confirmation email: "Click here to confirm account deletion (irreversible)"
3. User confirms → set `status = 'confirmed'`, `confirmed_at = NOW()`
4. Background job (24-48 hours later) processes deletion:
   - Set `customers.deleted_at = NOW()`, `customers.account_status = 'deleted'`
   - Anonymize `customers.first_name = NULL`, `customers.phone = NULL`
   - Delete `users` row (password, personal data gone)
   - Delete `guests` row
   - Keep `orders` row unchanged (for accounting)
   - Create audit log entry
   - Set `deletion_requests.status = 'completed'`, `completed_at = NOW()`

### CCPA Right to Opt-Out:
1. Guest/user clicks "Do Not Sell My Personal Information" link on website
2. Update `customers.marketing_consent = 'opted_out'`
3. Log in `marketing_consent_history` with `reason = 'CCPA opt-out request'`
4. Background job: Stop all marketing communications to this contact

---

## Indexes for Performance

```sql
-- Guest checkout flow (fast email lookups)
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Order analytics
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Marketing compliance
CREATE INDEX idx_customers_marketing ON customers(marketing_consent);
CREATE INDEX idx_history_timestamp ON marketing_consent_history(timestamp);

-- Audit queries
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
```

---

## Key Principles Implemented

✅ **Data Minimization:** Only collect data needed for orders and marketing
✅ **Audit Trail:** Every change logged in `audit_log` for compliance review
✅ **Soft Delete:** Never lose order history for accounting, but respect user's right to be forgotten
✅ **Double Opt-In:** Marketing consent requires email confirmation
✅ **Immutable History:** `marketing_consent_history` never updated, only appended
✅ **GDPR Compliance:** Data export, right to delete, policy versioning
✅ **CCPA Compliance:** Opt-out tracking, right to know, right to delete
✅ **Guest Separation:** Guests have lighter data footprint, can convert to registered later

---

## Example Queries

### Get all guests who haven't opted into marketing:
```sql
SELECT * FROM customers 
WHERE customer_type = 'guest' 
  AND marketing_consent = 'pending_confirmation' 
  AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### Audit trail for a specific customer:
```sql
SELECT * FROM audit_log 
WHERE entity_type = 'customer' AND entity_id = 123 
ORDER BY timestamp DESC;
```

### Marketing compliance check (CCPA):
```sql
SELECT customer_id, 
       MAX(timestamp) as latest_consent_change,
       (SELECT new_status FROM marketing_consent_history 
        WHERE customer_id = c.id ORDER BY timestamp DESC LIMIT 1) as current_status
FROM marketing_consent_history c
WHERE timestamp > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY customer_id;
```

### High-value guests (retention opportunity):
```sql
SELECT g.customer_id, c.email, COUNT(o.id) as order_count, SUM(o.total) as lifetime_value
FROM guests g
JOIN customers c ON g.customer_id = c.id
JOIN orders o ON c.id = o.customer_id
WHERE c.marketing_consent = 'opted_in'
  AND g.guest_orders_count >= 3
GROUP BY g.customer_id
ORDER BY lifetime_value DESC
LIMIT 50;
```

---

## Next Steps

1. **Create tables in your database** (MySQL/PostgreSQL)
2. **Implement** privacy policy (see PRIVACY-POLICY.md)
3. **Build** checkout UI with optional signup flow
4. **Configure** double opt-in email confirmation
5. **Set up** audit logging middleware (every API call logs to `audit_log`)
6. **Test** GDPR/CCPA compliance scenarios
