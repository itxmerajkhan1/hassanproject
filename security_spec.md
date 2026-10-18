# Security Specification for Firestore & Storage Rules

This document outlines the Security Invariants, threat modeling payloads ("The Dirty Dozen"), and the expected authorization rules matrix designed for the NAYAB FIT application.

## 1. Data Invariants

- **Product Integrity**: Public users can read active and published items in `/products/{productId}` and `/categories/{categoryId}`. Only authenticated Administrator accounts (`isAdmin()`) can create, update, or delete products and change stock.
- **Hero Banners & Website Settings**: Public users can read published hero banners (`/heroBanners/{bannerId}`) and website settings (`/websiteSettings/{settingId}`, `/settings/{settingId}`). Only authenticated Administrator accounts (`isAdmin()`) can create, update, reorder, or delete slides and settings.
- **Admin Role Registry**: Administrator status is authenticated via `isAdmin()` (evaluated against the `/admins/{uid}` registry, designated verified administrator email in auth token, or `users/{uid}` role attribute). Only authorized administrators can write to the `/admins` collection.
- **PII Isolation & Profile Access**: Customer profiles (`/users/{userId}`) can only be retrieved or updated by the profile owner (`request.auth.uid == userId`) or an authorized administrator (`isAdmin()`). General public users cannot list or scrape customer emails or profile details. Customers cannot self-assign or escalate their `role` to `'admin'`.
- **Review Integrity**: Public users can view reviews. Authenticated users can submit reviews with initial `likes: 0`. Users can only toggle their own like in `likedBy`. Only administrators can moderate, approve, edit, or delete reviews.
- **Order Tracking & Ownership**: Authenticated users can only read and create their own orders (`userId == request.auth.uid`). Public guests can only query/track individual orders if they match guest order identifier formats. Administrators can list and manage all orders.
- **Inventory Logs**: Purely system/admin-only audit records (`/inventoryLogs`). No client reading or editing allowed.
- **Contact Forms & Newsletters**: Anyone can submit a message (`/contacts`) or subscribe to newsletter (`/subscribers`), but only admins can list or manage them.

---

## 2. The "Dirty Dozen" Threat Payloads

Below are twelve malicious payloads/scenarios that our rules block to prevent privilege escalation, data poisoning, or "Denial of Wallet" resource exhaustion:

1. **Privilege Escalation on Public Registration**: An unprivileged user sends `{ uid: "attacker-123", email: "attacker@gmail.com", role: "admin" }` to `/users/attacker-123`.
   - **Result**: `PERMISSION_DENIED` (only authorized admins can create or set `role: "admin"`).
2. **Self-Promotion via Profile Update**: An existing customer attempts to patch `{ role: "admin" }` on their `/users/{uid}` document.
   - **Result**: `PERMISSION_DENIED` (users cannot change their existing role attribute).
3. **Unauthorized Product Price/Stock Tampering**: A shopper sends a write payload to `/products/prod-1` setting `{ price: 1, stock: 999 }`.
   - **Result**: `PERMISSION_DENIED` (only `isAdmin()` can write to `/products`).
4. **Hero Banner Defacement**: An unauthenticated script sends a delete or write request to `/heroBanners/banner-1`.
   - **Result**: `PERMISSION_DENIED` (only `isAdmin()` can write to `/heroBanners`).
5. **Likes Counter Hijacking**: An attacker updates a review with `{ likes: 99999 }` without adding their UID to `likedBy`.
   - **Result**: `PERMISSION_DENIED` (`likes` must equal `likedBy.size()`).
6. **Cross-Customer Profile Scraping**: An authenticated regular user performs a `collection("users")` list query to harvest customer emails and addresses.
   - **Result**: `PERMISSION_DENIED` (`allow list: if isAdmin();`).
7. **Order Spoofing / Impersonation**: A customer attempts to create an order setting `userId: "other-user-uid"`.
   - **Result**: `PERMISSION_DENIED` (`incoming().userId == request.auth.uid`).
8. **Unauthorized Order Status Modification**: A customer attempts to mark their order as `"Delivered"` or `"paid"`.
   - **Result**: `PERMISSION_DENIED` (customers can only update `shippingAddress` on pending orders; status changes require `isAdmin()`).
9. **Tampering with Inventory Logs**: A malicious user attempts to insert or delete audit entries in `/inventoryLogs`.
   - **Result**: `PERMISSION_DENIED` (`allow read, write: if isAdmin();`).
10. **Review Hijacking**: A customer attempts to modify another customer's review comment or rating.
    - **Result**: `PERMISSION_DENIED` (only toggling like or admin moderation is allowed).
11. **Malicious ID Poisoning**: An attacker tries to write records with oversized or path-traversal IDs containing special characters.
    - **Result**: `PERMISSION_DENIED` (`isValidId()` constraint).
12. **Unauthorized Storage Path Exploitation**: An unauthenticated user attempts to upload executable files or files outside permitted media buckets.
    - **Result**: `PERMISSION_DENIED` (Firebase Storage rules restrict uploads to authenticated media types).

---

## 3. Test Matrix Validation

- `products/{id}`: Public read ✅ | Public write ❌ | Admin write ✅
- `heroBanners/{id}`: Public read ✅ | Public write ❌ | Admin write ✅
- `categories/{id}`: Public read ✅ | Public write ❌ | Admin write ✅
- `users/{id}`: Owner get/update ✅ | Non-owner get/update ❌ | Customer list ❌ | Admin list/get/update ✅
- `orders/{id}`: Owner list/get/create ✅ | Non-owner get ❌ | Admin all ✅
- `reviews/{id}`: Public read ✅ | User create ✅ | User toggle like ✅ | Non-owner edit ❌ | Admin all ✅
- `admins/{id}`: Public read (authenticated) ✅ | Public write ❌ | Admin write ✅
