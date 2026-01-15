# Admin Panel - Required Endpoints

## Overview

Comprehensive list of admin endpoints needed for the Nyengo marketplace platform with support system capabilities.

---

## 1. USER MANAGEMENT

### Users

- **GET** `/api/admin/users` - List all users with filters (role, status, KYC verification)
  - Query params: `?page=1&limit=20&role=seller&kycVerified=false&search=name`
- **GET** `/api/admin/users/:id` - Get user details
- **PUT** `/api/admin/users/:id` - Update user information
- **PUT** `/api/admin/users/:id/status` - Activate/Deactivate user account
- **DELETE** `/api/admin/users/:id` - Soft delete user account
- **GET** `/api/admin/users/:id/activity` - Get user activity logs

### KYC Verification

- **GET** `/api/admin/kyc/pending` - List pending KYC verifications
- **GET** `/api/admin/kyc/:userId` - Get KYC documents and details
- **POST** `/api/admin/kyc/:userId/approve` - Approve KYC verification
- **POST** `/api/admin/kyc/:userId/reject` - Reject KYC with reason
- **GET** `/api/admin/kyc/:userId/documents` - Download verification documents

---

## 2. BUSINESS/SELLER MANAGEMENT

### Businesses

- **GET** `/api/admin/businesses` - List all businesses with filters
  - Query params: `?page=1&limit=20&status=pending&type=electronics&verified=false`
- **GET** `/api/admin/businesses/:id` - Get business details
- **PUT** `/api/admin/businesses/:id` - Update business information
- **PUT** `/api/admin/businesses/:id/status` - Approve/Suspend/Close business
- **GET** `/api/admin/businesses/:id/compliance-documents` - View compliance docs
- **POST** `/api/admin/businesses/:id/verify` - Verify business compliance
- **GET** `/api/admin/businesses/:id/revenue` - Business revenue statistics
- **GET** `/api/admin/businesses/:id/orders` - Business order history

### Subscription Management

- **GET** `/api/admin/subscriptions` - List all business subscriptions
- **GET** `/api/admin/subscriptions/:businessId` - Get subscription details
- **PUT** `/api/admin/subscriptions/:businessId` - Update subscription status
- **POST** `/api/admin/subscriptions/:businessId/extend` - Extend subscription period

---

## 3. PRODUCT MANAGEMENT

### Products

- **GET** `/api/admin/products` - List all products with filters
  - Query params: `?page=1&limit=20&status=draft&category=electronics&businessId=xxx`
- **GET** `/api/admin/products/:id` - Get product details
- **PUT** `/api/admin/products/:id/status` - Approve/Reject/Suspend product
- **DELETE** `/api/admin/products/:id` - Remove product from platform
- **GET** `/api/admin/products/flagged` - List flagged/reported products
- **POST** `/api/admin/products/:id/flag` - Flag product for review

### Categories

- **GET** `/api/admin/categories` - List all categories
- **POST** `/api/admin/categories` - Create category (existing)
- **PUT** `/api/admin/categories/:id` - Update category (existing)
- **DELETE** `/api/admin/categories/:id` - Delete category (existing)
- **GET** `/api/admin/categories/:id/analytics` - Category performance metrics

---

## 4. ORDER MANAGEMENT

### Orders

- **GET** `/api/admin/orders` - List all orders with filters
  - Query params: `?page=1&limit=20&status=new&paymentStatus=pending&dateFrom=2025-01-01`
- **GET** `/api/admin/orders/:id` - Get order details with full history
- **PUT** `/api/admin/orders/:id/status` - Override order status
- **POST** `/api/admin/orders/:id/cancel` - Cancel order with reason
- **POST** `/api/admin/orders/:id/refund` - Process refund
- **GET** `/api/admin/orders/disputes` - List orders with disputes
- **POST** `/api/admin/orders/:id/resolve-dispute` - Resolve order dispute

### Order Analytics

- **GET** `/api/admin/orders/statistics` - Overall order statistics
- **GET** `/api/admin/orders/revenue` - Revenue by period
- **GET** `/api/admin/orders/top-sellers` - Top performing sellers

---

## 5. PAYMENT & FINANCIAL MANAGEMENT

### Payments

- **GET** `/api/admin/payments` - List all payments with filters
- **GET** `/api/admin/payments/:id` - Get payment details
- **POST** `/api/admin/payments/:id/verify` - Manually verify payment
- **POST** `/api/admin/payments/:id/refund` - Process refund
- **GET** `/api/admin/payments/pending` - List pending verifications

### Payouts (Seller Withdrawals)

- **GET** `/api/admin/payouts` - List all payout requests
- **GET** `/api/admin/payouts/:id` - Get payout request details
- **POST** `/api/admin/payouts/:id/approve` - Approve payout
- **POST** `/api/admin/payouts/:id/reject` - Reject payout with reason
- **POST** `/api/admin/payouts/:id/complete` - Mark payout as completed
- **GET** `/api/admin/payouts/pending` - List pending payout requests

### Financial Reports

- **GET** `/api/admin/financial/revenue` - Platform revenue report
- **GET** `/api/admin/financial/commission` - Commission earnings
- **GET** `/api/admin/financial/transactions` - All financial transactions
- **GET** `/api/admin/financial/export` - Export financial data (CSV/Excel)

---

## 6. COURIER MANAGEMENT

### Couriers

- **GET** `/api/admin/couriers` - List all registered couriers
- **GET** `/api/admin/couriers/:id` - Get courier details
- **PUT** `/api/admin/couriers/:id/status` - Activate/Deactivate courier
- **GET** `/api/admin/couriers/:id/deliveries` - Courier delivery history
- **GET** `/api/admin/couriers/:id/performance` - Courier performance metrics
- **POST** `/api/admin/couriers/:id/verify` - Verify courier credentials

### Delivery Companies

- **GET** `/api/admin/delivery-companies` - List delivery companies
- **POST** `/api/admin/delivery-companies` - Add new delivery company
- **PUT** `/api/admin/delivery-companies/:id` - Update delivery company
- **DELETE** `/api/admin/delivery-companies/:id` - Remove delivery company

---

## 7. REVIEWS & RATINGS

### Reviews

- **GET** `/api/admin/reviews` - List all reviews with filters
- **GET** `/api/admin/reviews/flagged` - List flagged reviews
- **GET** `/api/admin/reviews/:id` - Get review details
- **DELETE** `/api/admin/reviews/:id` - Remove inappropriate review
- **POST** `/api/admin/reviews/:id/flag` - Flag review for moderation
- **PUT** `/api/admin/reviews/:id/status` - Hide/Show review

---

## 8. SUPPORT TICKET SYSTEM

### Support Tickets

- **GET** `/api/admin/support/tickets` - List all support tickets
  - Query params: `?page=1&limit=20&status=open&priority=high&category=payment`
- **GET** `/api/admin/support/tickets/:id` - Get ticket details with full conversation
- **POST** `/api/admin/support/tickets/:id/reply` - Reply to ticket
- **PUT** `/api/admin/support/tickets/:id/status` - Update ticket status (open/in-progress/resolved/closed)
- **PUT** `/api/admin/support/tickets/:id/assign` - Assign ticket to admin staff
- **PUT** `/api/admin/support/tickets/:id/priority` - Change ticket priority
- **POST** `/api/admin/support/tickets/:id/escalate` - Escalate ticket
- **GET** `/api/admin/support/tickets/statistics` - Support metrics (response time, resolution rate)

### Support Categories

- **GET** `/api/admin/support/categories` - List support categories
- **POST** `/api/admin/support/categories` - Create category
- **PUT** `/api/admin/support/categories/:id` - Update category
- **DELETE** `/api/admin/support/categories/:id` - Delete category

### Canned Responses

- **GET** `/api/admin/support/canned-responses` - List saved responses
- **POST** `/api/admin/support/canned-responses` - Create canned response
- **PUT** `/api/admin/support/canned-responses/:id` - Update response
- **DELETE** `/api/admin/support/canned-responses/:id` - Delete response

---

## 9. MESSAGING & CHAT MODERATION

### Messages

- **GET** `/api/admin/messages/threads` - List all message threads
- **GET** `/api/admin/messages/threads/:id` - Get thread messages
- **GET** `/api/admin/messages/flagged` - List flagged messages
- **DELETE** `/api/admin/messages/:id` - Delete inappropriate message
- **POST** `/api/admin/messages/:threadId/warn` - Send warning to users

---

## 10. NOTIFICATIONS

### Platform Notifications

- **POST** `/api/admin/notifications/broadcast` - Send broadcast notification
- **POST** `/api/admin/notifications/targeted` - Send to specific user group
- **GET** `/api/admin/notifications/history` - Notification history
- **GET** `/api/admin/notifications/analytics` - Notification performance

### SMS Management

- **GET** `/api/admin/sms/history` - SMS sending history
- **GET** `/api/admin/sms/balance` - SMS credit balance
- **POST** `/api/admin/sms/send` - Send SMS to users

---

## 11. CONTENT MANAGEMENT

### Banners

- **GET** `/api/admin/banners` - List all banners
- **POST** `/api/admin/banners` - Create banner (existing)
- **PUT** `/api/admin/banners/:id` - Update banner (existing)
- **DELETE** `/api/admin/banners/:id` - Delete banner (existing)
- **PUT** `/api/admin/banners/:id/activate` - Activate/Deactivate banner

### System Settings

- **GET** `/api/admin/settings` - Get all system settings ✅ IMPLEMENTED
- **PUT** `/api/admin/settings` - Update system settings ✅ IMPLEMENTED

### Commission Settings

- **GET** `/api/admin/settings/commission` - Get commission rates ✅ IMPLEMENTED
- **PUT** `/api/admin/settings/commission` - Update default commission ✅ IMPLEMENTED
- **POST** `/api/admin/settings/commission/rules` - Add custom commission rule ✅ IMPLEMENTED
- **PUT** `/api/admin/settings/commission/rules/:ruleId` - Update commission rule ✅ IMPLEMENTED
- **DELETE** `/api/admin/settings/commission/rules/:ruleId` - Delete commission rule ✅ IMPLEMENTED
- **POST** `/api/admin/settings/commission/calculate` - Calculate commission for order ✅ IMPLEMENTED

### Fee Settings

- **GET** `/api/admin/settings/fees` - Get platform fees ✅ IMPLEMENTED
- **PUT** `/api/admin/settings/fees` - Update platform fees ✅ IMPLEMENTED

**Features:**

- Default commission (percentage or fixed amount)
- Category-specific commission rules
- Business type-based commission rules
- Order value-based commission rules (min/max thresholds)
- Tiered commission (different rates for different order amounts)
- Priority system for overlapping rules
- Transaction fees by payment method
- Registration fees by user role
- Monthly subscription fees for sellers
- Delivery fees by distance
- Payout settings (minimum amount, processing time)
- Tax settings (VAT rate, TPIN requirements)

---

## 12. ANALYTICS & REPORTS

### Dashboard

- **GET** `/api/admin/dashboard/overview` - Main dashboard statistics
- **GET** `/api/admin/dashboard/trends` - Growth trends
- **GET** `/api/admin/dashboard/alerts` - System alerts and warnings

### Reports

- **GET** `/api/admin/reports/sales` - Sales report by period
- **GET** `/api/admin/reports/users` - User growth and activity
- **GET** `/api/admin/reports/products` - Product performance
- **GET** `/api/admin/reports/revenue` - Revenue analysis
- **GET** `/api/admin/reports/export` - Export any report (CSV/PDF)

### Analytics

- **GET** `/api/admin/analytics/traffic` - Platform traffic analytics
- **GET** `/api/admin/analytics/conversion` - Conversion rates
- **GET** `/api/admin/analytics/popular-products` - Most viewed/sold products
- **GET** `/api/admin/analytics/popular-categories` - Category performance

---

## 13. SECURITY & AUDIT

### Audit Logs

- **GET** `/api/admin/audit-logs` - System audit logs
  - Query params: `?page=1&limit=50&action=delete&userId=xxx&dateFrom=2025-01-01`
- **GET** `/api/admin/audit-logs/:id` - Get specific audit entry
- **GET** `/api/admin/audit-logs/export` - Export logs

### Security

- **GET** `/api/admin/security/suspicious-activity` - List suspicious activities
- **POST** `/api/admin/security/ban-ip` - Ban IP address
- **GET** `/api/admin/security/banned-ips` - List banned IPs
- **DELETE** `/api/admin/security/ban-ip/:ip` - Remove IP ban
- **GET** `/api/admin/security/failed-logins` - Failed login attempts

---

## 14. ADMIN USER MANAGEMENT

### Admin Staff

- **GET** `/api/admin/staff` - List admin staff
- **POST** `/api/admin/staff` - Create admin account
- **PUT** `/api/admin/staff/:id` - Update admin account
- **DELETE** `/api/admin/staff/:id` - Delete admin account
- **PUT** `/api/admin/staff/:id/permissions` - Update permissions/roles
- **GET** `/api/admin/staff/:id/activity` - Admin activity logs

### Roles & Permissions

- **GET** `/api/admin/roles` - List admin roles
- **POST** `/api/admin/roles` - Create role
- **PUT** `/api/admin/roles/:id` - Update role permissions
- **DELETE** `/api/admin/roles/:id` - Delete role

---

## 15. COMPLIANCE & MODERATION

### Flagged Content

- **GET** `/api/admin/flagged/products` - Flagged products
- **GET** `/api/admin/flagged/reviews` - Flagged reviews
- **GET** `/api/admin/flagged/messages` - Flagged messages
- **POST** `/api/admin/flagged/:type/:id/review` - Review flagged content
- **POST** `/api/admin/flagged/:type/:id/action` - Take action (remove/warn/ban)

### Tax Compliance (Malawi)

- **GET** `/api/admin/compliance/tpin` - List businesses by TIN verification status
- **GET** `/api/admin/compliance/documents/:businessId` - View compliance documents
- **POST** `/api/admin/compliance/:businessId/verify` - Verify business compliance

---

## PRIORITY IMPLEMENTATION ORDER

### Phase 1 (Critical - Launch)

1. User Management (basic CRUD)
2. Business/Seller Management
3. KYC Verification
4. Product Management
5. Order Management
6. Payment Verification
7. Dashboard Overview

### Phase 2 (Essential - Post-Launch)

1. Support Ticket System (HIGH PRIORITY)
2. Reviews Moderation
3. Payout Management
4. Financial Reports
5. Courier Management
6. Notifications Broadcasting

### Phase 3 (Enhanced Features)

1. Advanced Analytics
2. Audit Logs
3. Content Moderation
4. Security Features
5. Admin Roles & Permissions
6. Canned Responses for Support

### Phase 4 (Optimization)

1. Performance Analytics
2. Automated Reports
3. SMS Management
4. Advanced Security Features
5. Export Capabilities

---

## SUPPORT SYSTEM PRIORITIES

### Must-Have for Good Support

1. ✅ Ticket Creation & Management
2. ✅ Ticket Assignment System
3. ✅ Priority Levels (Low/Medium/High/Urgent)
4. ✅ Status Tracking (Open/In Progress/Resolved/Closed)
5. ✅ Category/Type Classification
6. ✅ Response Time Tracking
7. ✅ User History (Previous tickets/orders)
8. ✅ Internal Notes (Admin-only comments)
9. ✅ File Attachments
10. ✅ Email Notifications

### Nice-to-Have

- Canned responses library
- Auto-assignment based on category
- SLA monitoring
- Customer satisfaction ratings
- Knowledge base integration
- Multi-channel support (Email, Chat, Phone)

---

## AUTHENTICATION & AUTHORIZATION

All admin endpoints require:

- JWT token with admin role
- Specific permissions based on admin role
- Rate limiting for security
- IP whitelist (optional, for high-security operations)

### Admin Roles Suggested

1. **Super Admin** - Full access
2. **Admin** - Most operations except system settings
3. **Support Agent** - Tickets, orders, user queries
4. **Finance Manager** - Payments, payouts, financial reports
5. **Content Moderator** - Reviews, products, messages
6. **Viewer** - Read-only access to reports

---

## WEBHOOKS & INTEGRATIONS

### Payment Webhooks

- **POST** `/api/webhooks/payment/airtel` - Airtel Money callback
- **POST** `/api/webhooks/payment/mpamba` - TNM Mpamba callback
- **POST** `/api/webhooks/payment/bank` - Bank transfer confirmation

### Notification Webhooks

- **POST** `/api/webhooks/sms/delivery-status` - SMS delivery confirmation
- **POST** `/api/webhooks/email/status` - Email status updates
