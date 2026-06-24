-- El Perri Database Migrations
-- Run these SQL scripts in order to set up the production database schema
-- Supports: MySQL 8.0+, PostgreSQL 12+

-- ============================================
-- TABLE 1: CUSTOMERS (Universal customer record)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) PRIMARY KEY, -- UUID

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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  KEY idx_email (email),
  KEY idx_phone (phone),
  KEY idx_customer_type (customer_type),
  KEY idx_marketing_consent (marketing_consent),
  KEY idx_created_at (created_at)
);

-- ============================================
-- TABLE 2: USERS (Registered user extension)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL UNIQUE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,

  -- Authentication
  password_hash VARCHAR(255) NOT NULL,
  password_changed_at TIMESTAMP,

  -- Profile
  profile_data JSON,

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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_customer_id (customer_id)
);

-- ============================================
-- TABLE 3: GUESTS (Guest checkout extension)
-- ============================================
CREATE TABLE IF NOT EXISTS guests (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL UNIQUE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,

  -- Guest Metadata
  guest_orders_count INT DEFAULT 1,
  last_order_date TIMESTAMP,

  -- For conversion tracking
  conversion_eligible_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_customer_id (customer_id)
);

-- ============================================
-- TABLE 4: ORDERS (Unified order record)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,

  -- Customer Reference
  customer_id CHAR(36) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),

  -- Order Details
  order_number VARCHAR(50) NOT NULL UNIQUE,
  items JSON NOT NULL, -- Array of {item_id, name, price, quantity}

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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_customer_id (customer_id),
  KEY idx_order_number (order_number),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
);

-- ============================================
-- TABLE 5: PRIVACY_POLICY_AGREEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS privacy_policy_agreements (
  id CHAR(36) PRIMARY KEY,

  -- Customer Reference
  customer_id CHAR(36) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),

  -- Policy Tracking
  policy_version VARCHAR(50) NOT NULL,
  policy_accepted_at TIMESTAMP NOT NULL,

  -- Terms & Conditions
  terms_of_service_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_policy_accepted BOOLEAN NOT NULL DEFAULT FALSE,

  -- Audit Trail
  ip_address VARCHAR(45),
  user_agent TEXT,
  acceptance_method ENUM('web_checkout', 'mobile_app', 'phone_call') NOT NULL DEFAULT 'web_checkout',

  KEY idx_customer_id (customer_id),
  KEY idx_policy_version (policy_version)
);

-- ============================================
-- TABLE 6: MARKETING_CONSENT_HISTORY (Immutable)
-- ============================================
CREATE TABLE IF NOT EXISTS marketing_consent_history (
  id CHAR(36) PRIMARY KEY,

  -- Customer Reference
  customer_id CHAR(36) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),

  -- Consent Status
  previous_status ENUM('opted_in', 'opted_out', 'pending_confirmation'),
  new_status ENUM('opted_in', 'opted_out', 'pending_confirmation') NOT NULL,

  -- Context
  consent_method ENUM('checkout', 'email_link', 'web_form', 'phone', 'in_person', 'automated_double_optin') NOT NULL,
  reason TEXT,

  -- Audit
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,

  KEY idx_customer_id (customer_id),
  KEY idx_timestamp (timestamp),
  KEY idx_new_status (new_status)
);

-- ============================================
-- TABLE 7: AUDIT_LOG (Universal accountability)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id CHAR(36) PRIMARY KEY,

  -- Entity Being Changed
  entity_type ENUM('customer', 'order', 'marketing_consent', 'policy_agreement') NOT NULL,
  entity_id CHAR(36) NOT NULL,

  -- Action
  action ENUM('created', 'updated', 'deleted', 'restored', 'export_data_requested', 'deletion_requested') NOT NULL,

  -- Changes
  old_values JSON,
  new_values JSON,
  changes_description TEXT,

  -- Actor
  actor_type ENUM('system', 'admin', 'customer', 'anonymous') NOT NULL,
  actor_id CHAR(36),

  -- Network
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Timestamp
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_entity (entity_type, entity_id),
  KEY idx_timestamp (timestamp),
  KEY idx_action (action)
);

-- ============================================
-- TABLE 8: DATA_EXPORTS (GDPR portability)
-- ============================================
CREATE TABLE IF NOT EXISTS data_exports (
  id CHAR(36) PRIMARY KEY,

  -- Customer
  customer_id CHAR(36) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),

  -- Export Details
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  export_completed_at TIMESTAMP,
  file_url TEXT,
  file_format ENUM('json', 'pdf', 'csv') NOT NULL DEFAULT 'json',

  -- Status
  status ENUM('pending', 'completed', 'failed', 'expired') NOT NULL DEFAULT 'pending',

  -- Audit
  ip_address VARCHAR(45),
  reason_code VARCHAR(50),

  KEY idx_customer_id (customer_id),
  KEY idx_requested_at (requested_at)
);

-- ============================================
-- TABLE 9: DELETION_REQUESTS (GDPR right to forget)
-- ============================================
CREATE TABLE IF NOT EXISTS deletion_requests (
  id CHAR(36) PRIMARY KEY,

  -- Customer
  customer_id CHAR(36) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),

  -- Request Details
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Status
  status ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',

  -- Reason
  deletion_reason TEXT,

  -- Audit
  ip_address VARCHAR(45),

  KEY idx_customer_id (customer_id),
  KEY idx_status (status)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_created ON customers(created_at);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- ============================================
-- VIEWS
-- ============================================
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

-- ============================================
-- Migration complete! All tables created.
-- ============================================
