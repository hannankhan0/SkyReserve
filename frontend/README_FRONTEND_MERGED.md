# SkyReserve Deliverable 3 Frontend

This frontend merges:

- Sadeem: Authentication + Flight Management
- Ahad: Aircraft + Schedule + Seat Selection
- Hannan: Booking + Payment + Ticket features

## Run

```bash
npm install
npm start
```

Default API:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Demo Flow

### Admin Flow

1. Admin login
2. Add aircraft
3. Add flight using aircraft
4. Create schedule for flight
5. Seats are generated automatically
6. View admin bookings/tools

### User Flow

1. Register/login user
2. Search scheduled flight
3. Select seats
4. Create booking
5. Pay booking
6. View/download ticket
7. Cancel booking from My Bookings

## Important Backend Notes

- Admin credentials must match your SQL seed data.
- Schedule status values are: `on_time`, `delayed`, `cancelled`, `boarding`.
- Payment body uses `payment_amount`, not `amount`.
- Ticket download works after payment confirms the booking.
