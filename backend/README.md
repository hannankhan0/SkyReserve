# SkyReserve Merged Backend

This is the clean merged backend for all three members' work.

## Member Modules

- Sadeem: `/api/auth`, `/api/flights`
- Ahad: `/api/aircraft`, `/api/schedules`, `/api/seats`
- Hannan: `/api/bookings`, `/api/payments`, `/api/tickets`

## Why this merge was needed

Frontend Deliverable 3 needs one backend, one database, and one API base URL. The booking flow depends on all three modules:

1. Admin creates aircraft.
2. Admin creates flight using aircraft_id.
3. Admin creates schedule using flight_id.
4. Seats are generated for the schedule.
5. User logs in.
6. User selects schedule and seats.
7. User creates booking.
8. User pays.
9. Booking is confirmed and ticket is downloadable.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Update `.env` according to your SQL Server setup.

Example for SQL Server Express:

```env
PORT=5000
DB_USER=sa
DB_PASSWORD=12345678
DB_SERVER=localhost\\SQLEXPRESS
DB_DATABASE=SkyReserve
DB_ENCRYPT=false
DB_TRUST_SERVER_CERT=true
JWT_SECRET=skyreserve_lab_secret_change_me
```

## Database

Run:

```txt
database/SkyReserve.sql
```

Important fixes added in the merged SQL:

- `Seats.held_until` and `Seats.hold_user_id` were added because Ahad's seat reservation code uses temporary seat holds.
- `Tickets.ticket_number` was increased to `VARCHAR(50)` because Hannan's generated ticket numbers are longer than 15 characters.

## Shared API Base URL

Use this in React:

```js
const API_BASE_URL = "http://localhost:5000/api";
```

## Login Notes

The merged auth supports both:

```json
{ "email": "john.smith@email.com", "password_hash": "hashed_password_123" }
```

and frontend-friendly:

```json
{ "email": "john.smith@email.com", "password": "hashed_password_123" }
```

Admin login also supports both `password_hash` and `password`.

## Integration Fixes Done

- One `server.js` registers all routes.
- One `config/db.js` supports Sadeem's `poolPromise`, Ahad's `getConnection`, and Hannan's `getPool` styles.
- JWT token generation was added for user/admin login.
- `/api/auth/profile` works with Bearer token.
- Old `/api/auth/profile/:id` still works for lab/Postman testing.
- Seat reservation and booking flow were corrected: a held seat can now be booked by the same user instead of failing as unavailable.
- Seat cancellation now clears hold fields.
- Booking/payment/ticket routes accept token-based user id or old `x-user-id` / body `user_id` method.

## QA Reviewed Version Notes
This version was reviewed for Deliverable 3 frontend integration. Admin-only routes now require admin JWT tokens, user-specific routes require user JWT tokens, the payment flow validates exact booking amount, and ticket download is only allowed after booking confirmation.

Frontend must store the JWT returned by `/api/auth/login` or `/api/auth/admin-login` and send it as:

```http
Authorization: Bearer <token>
```

Main working demo order:
1. Admin login
2. Create aircraft
3. Create flight
4. Create schedule
5. User register/login
6. Search flight
7. View seat map
8. Reserve seat
9. Create booking
10. Create payment
11. View/download ticket
12. Cancel booking if needed

## Seat Selection Fix
If you previously created the database from an older SQL script and see:

`Invalid column name 'hold_user_id'`

use this updated backend. It automatically adds the missing `Seats.held_until` and `Seats.hold_user_id` columns when seat APIs run.

Manual SSMS option:

```sql
IF COL_LENGTH('Seats', 'held_until') IS NULL
BEGIN
    ALTER TABLE Seats ADD held_until DATETIME2 NULL;
END;

IF COL_LENGTH('Seats', 'hold_user_id') IS NULL
BEGIN
    ALTER TABLE Seats ADD hold_user_id INT NULL;
END;
```
