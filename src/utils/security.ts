/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Escapes HTML characters to prevent Cross-Site Scripting (XSS) attacks.
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes input string to remove potential script injections and trim spaces.
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  // Trim spaces and escape HTML tags
  const trimmed = input.trim();
  return escapeHtml(trimmed);
}

/**
 * Strictly validates email format using a standard production regex.
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates phone format, supporting international formats and standard Pakistani mobile formats (+92/03xx).
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  // Clean special characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  // RegEx for general international phone format (+ or digits, min 8 digits)
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  return phoneRegex.test(cleanPhone);
}

// In-memory client-side rate limiter
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitBuckets: Record<string, RateLimitBucket> = {};

/**
 * Throttles/rate-limits client-side operations (e.g., logins, checkouts, review submissions).
 * Uses a token-bucket algorithm to allow short bursts but prevent sustained spam/brute-force attacks.
 * 
 * @param key Unique key for the action (e.g., 'checkout-127.0.0.1' or 'login-user')
 * @param limit Maximum tokens (burst limit)
 * @param intervalMs Time in ms to fully refill the bucket
 * @returns Object with allowed boolean and remaining token count
 */
export function checkRateLimit(
  key: string,
  limit: number,
  intervalMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = rateLimitBuckets[key] || { tokens: limit, lastRefill: now };

  // Calculate elapsed time and tokens to add
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / (intervalMs / limit));

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    rateLimitBuckets[key] = bucket;
    return { allowed: true, remaining: bucket.tokens };
  }

  rateLimitBuckets[key] = bucket;
  return { allowed: false, remaining: 0 };
}
