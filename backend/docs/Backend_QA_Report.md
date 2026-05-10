# SkyReserve Backend QA Review

## Scope checked
- Sadeem: authentication, profile, flight management, flight search.
- Ahad: aircraft, schedules, seat map, seat reservation.
- Hannan: bookings, payments, tickets, cancellation/refund flow.

## Checks performed
- Static JavaScript parsing for all `.js` files.
- Route-order audit to ensure specific routes like `/stats`, `/search`, `/my-bookings`, `/my-tickets`, and `/download` are not shadowed by `/:id` routes.
- Database schema alignment with controllers/models.
- Cross-module workflow review: aircraft → flight → schedule → seats → booking → payment → ticket.
- Security review for admin-only and user-only APIs.
- SQL script review for SQL Server batch issues.

## Critical fixes made
1. Added admin middleware to admin-only APIs:
   - Aircraft create/update/delete/stats
   - Flight create/update/delete/stats
   - Schedule create/update/delete
   - Booking list/stats
   - Payment refund
   - Ticket check-in

2. Added user authentication to user-specific APIs:
   - Create booking
   - My bookings
   - Booking detail/confirm/cancel
   - Create payment
   - My payments/payment detail
   - My tickets/ticket detail/download
   - Seat reservation

3. Fixed profile security:
   - `/api/auth/profile` uses the logged-in token.
   - `/api/auth/profile/:id` now requires auth and prevents users from accessing another user's profile.

4. Fixed route-order risks:
   - `/api/flights/stats` and `/api/flights/search` now come before `/:id`.
   - Booking/ticket/payment special routes remain before parameterized routes.

5. Strengthened payment flow:
   - Payment amount must match booking total.
   - Cancelled bookings cannot be paid.
   - Already confirmed/completed bookings cannot be paid again.
   - Duplicate completed/pending payments for the same booking are blocked.
   - Successful payment confirms the booking.

6. Strengthened ticket access:
   - Users only see/download their own tickets.
   - My Tickets only returns tickets for confirmed/completed bookings.
   - PDF download is blocked until booking confirmation.

7. Strengthened booking validation:
   - Each passenger must include `passenger_name` and `seat_id`.
   - Users can only view/cancel/confirm their own bookings unless admin.

8. Fixed SQL Server script issue:
   - Added `GO` after database drop/create batches.
   - Removed executable demo queries from the main setup script so the script creates a clean database and seed data only.

## Main integration flow verified by design
1. Admin login returns admin JWT.
2. Admin creates aircraft.
3. Admin creates flight using `aircraft_id`.
4. Admin creates schedule using `flight_id`.
5. Schedule creation generates seats.
6. User login returns user JWT.
7. User searches flights/schedules.
8. User reserves seats.
9. User creates booking.
10. User pays exact booking amount.
11. Payment confirms booking.
12. Tickets become visible/downloadable.
13. Cancellation releases seats and refunds payment status.

## Required headers for protected APIs
Use:

```http
Authorization: Bearer <token>
```

Admin-only endpoints require an admin token from:

```http
POST /api/auth/admin-login
```

User endpoints require a user token from:

```http
POST /api/auth/login
```
