# Security Specification for Firestore & Storage Rules

This document outlines the Security Invariants, threat modeling payloads ("The Dirty Dozen"), and the expected authorization rules matrix designed for the Atelier application.

## 1. Data Invariants

- **Product Integrity**: Only authenticated Administrator accounts (`isAdmin()`) can create, update, or delete products and change stock.
- **Review Isolation**: Guests or general users can view only `approved` reviews. Normal users can submit reviews with `approved == false` (pending review) and `likes == 0`. Users can toggle likes on existing reviews (only modifying `likes` and `likedBy`), but cannot modify review comment, rating, or productId.
- **PII Isolation**: Customer profiles (e.g., email, displayName, wishlist) are private; users can only read and write their own profile (`request.auth.uid == userId`). General users cannot view or scrape other users' profile details or emails.
- **Order Tracking Ownership**: Authenticated users can only read and create their own orders. For guest orders, public users can get an individual order by ID if they know the order ID (tracking), but they cannot query or list all orders.
- **Inventory Logs**: Purely system/admin-only. No client reading or editing allowed.
- **Contact Forms & Newsletters**: Anyone can submit a message or sign up (create), but only admins can list or read them.

---

## 2. The "Dirty Dozen" Threat Payloads

Below are twelve malicious payloads/scenarios that our rules must block to prevent privilege escalation, data poisoning, or "Denial of Wallet" resource exhaustion:

1. **Privilege Escalation on Signup**: An attacker registers and sends `{ uid: "attacker-123", email: "attacker@gmail.com", role: "admin" }` to set themselves as administrator.
2. **Review Self-Approval**: A user submits a 5-star review with `{ approved: true }` bypassing admin screening.
3. **Likes Counter Hijacking**: An attacker updates a review with `{ likes: 99999 }` without adding their UID to `likedBy`.
4. **Product Price Override**: A malicious shopper updates a product's price field `{ price: 0.01 }` directly via Firestore SDK to discount their order.
5. **Unauthorized Inventory Write**: An unauthenticated script attempts to empty the stock of a product `{ stock: 0 }`.
6. **Billing/Order Manipulation**: A shopper creates an order under another user's UID `{ userId: "victim-456", total: 0 }` to charge the victim or bypass payment.
7. **Cross-User Profile Scraping**: An authenticated user attempts to query/list all user profiles to harvest customer emails.
8. **Malicious ID Poisoning**: An attacker tries to write a product or order with an extremely large, corrupted ID containing escape characters (e.g., `../poison\0`) to cause database path traversal or UI rendering issues.
9. **Tampering with Inventory Logs**: A rogue user tries to delete log records in `/inventoryLogs` to hide physical stock stealing.
10. **Review Hijacking**: An attacker updates another user's review comment or rating field without permission.
11. **Impersonating Guest Orders**: A guest user attempts to query/list all guest order records from the database.
12. **Temporal Invariant Violation**: A client attempts to set `createdAt` or `updatedAt` to a future date instead of the server timestamp (`request.time`).

---

## 3. Test Matrix Validation

The rules must return `PERMISSION_DENIED` for all the above malicious actions.
All standard customer interactions (purchasing, viewing products, writing reviews, subscribing) are allowed.
