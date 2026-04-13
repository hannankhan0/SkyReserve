# SkyReserve Backend

This backend covers the member 3 scope:
- Bookings
- Tickets
- Payments

## Setup

1. Copy `.env.example` to `.env`
2. Update database credentials
3. Run:

```bash
npm install
npm run dev
```

## Base URL
`http://localhost:5001`

## Main routes
- `POST /api/bookings`
- `GET /api/bookings/my-bookings`
- `GET /api/bookings/:id`
- `PUT /api/bookings/:id/confirm`
- `POST /api/bookings/:id/cancel`
- `GET /api/bookings`
- `GET /api/bookings/stats`

- `GET /api/tickets/my-tickets`
- `GET /api/tickets/:id`
- `PUT /api/tickets/:id/check-in`
- `GET /api/tickets/:id/download`

- `POST /api/payments`
- `GET /api/payments/my-payments`
- `GET /api/payments/:id`
- `POST /api/payments/:id/refund`

## Temporary testing note
Until auth middleware is added, use:
- request body: `user_id`
- or header: `x-user-id`
