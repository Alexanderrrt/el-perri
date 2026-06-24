/**
 * 2FA (Two-Factor Authentication) Management
 * Tracks failed attempts and enforces account lockout
 */

// In-memory store for 2FA attempt tracking
// In production, use Redis or database
const twoFAAttempts = new Map();

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Track a failed 2FA attempt
 */
export function recordFailedAttempt(sessionToken) {
  const key = `2fa-attempts:${sessionToken}`;
  const current = twoFAAttempts.get(key) || {
    count: 0,
    firstAttemptTime: Date.now(),
    lockedUntil: null,
  };

  current.count += 1;

  if (current.count >= MAX_FAILED_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  twoFAAttempts.set(key, current);

  return {
    count: current.count,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - current.count),
    locked: current.count >= MAX_FAILED_ATTEMPTS,
    lockedUntil: current.lockedUntil,
  };
}

/**
 * Check if session is locked due to too many failed attempts
 */
export function isSessionLocked(sessionToken) {
  const key = `2fa-attempts:${sessionToken}`;
  const data = twoFAAttempts.get(key);

  if (!data || !data.lockedUntil) {
    return false;
  }

  const now = Date.now();

  if (now > data.lockedUntil) {
    // Lockout has expired
    twoFAAttempts.delete(key);
    return false;
  }

  return true;
}

/**
 * Get lockout info if session is locked
 */
export function getLockoutInfo(sessionToken) {
  const key = `2fa-attempts:${sessionToken}`;
  const data = twoFAAttempts.get(key);

  if (!data || !data.lockedUntil) {
    return null;
  }

  const now = Date.now();
  const timeRemaining = Math.max(0, data.lockedUntil - now);

  return {
    locked: timeRemaining > 0,
    timeRemaining,
    retryAfterSeconds: Math.ceil(timeRemaining / 1000),
  };
}

/**
 * Clear failed attempts for a session (after successful 2FA)
 */
export function clearAttempts(sessionToken) {
  const key = `2fa-attempts:${sessionToken}`;
  twoFAAttempts.delete(key);
}

/**
 * Clean up expired lockouts
 */
export function cleanupExpiredLockouts() {
  const now = Date.now();
  for (const [key, data] of twoFAAttempts.entries()) {
    if (data.lockedUntil && now > data.lockedUntil) {
      twoFAAttempts.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredLockouts, 60 * 1000);
