-- =====================================================================
-- SkyReserve - Airline Reservation & Ticket Management System
-- Group Members: Sadeem Arshad, Hannan Khan, Abdul Ahad
-- =====================================================================

-- CREATE DATABASE
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'SkyReserve')
BEGIN
    ALTER DATABASE SkyReserve SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SkyReserve;
END
GO

CREATE DATABASE SkyReserve;
GO

USE SkyReserve;
GO

-- =====================================================================
-- DROP EXISTING TABLES (in correct order due to FK dependencies)
-- =====================================================================
IF OBJECT_ID('Payments',         'U') IS NOT NULL DROP TABLE Payments;
IF OBJECT_ID('Tickets',          'U') IS NOT NULL DROP TABLE Tickets;
IF OBJECT_ID('Bookings',         'U') IS NOT NULL DROP TABLE Bookings;
IF OBJECT_ID('Seats',            'U') IS NOT NULL DROP TABLE Seats;
IF OBJECT_ID('Flight_Schedules', 'U') IS NOT NULL DROP TABLE Flight_Schedules;
IF OBJECT_ID('Flights',          'U') IS NOT NULL DROP TABLE Flights;
IF OBJECT_ID('Aircraft',         'U') IS NOT NULL DROP TABLE Aircraft;
IF OBJECT_ID('Seat_Class_Prices','U') IS NOT NULL DROP TABLE Seat_Class_Prices;
IF OBJECT_ID('Payment_Methods',  'U') IS NOT NULL DROP TABLE Payment_Methods;
IF OBJECT_ID('Cities',           'U') IS NOT NULL DROP TABLE Cities;
IF OBJECT_ID('Admin',            'U') IS NOT NULL DROP TABLE Admin;
IF OBJECT_ID('Users',            'U') IS NOT NULL DROP TABLE Users;
GO

-- =====================================================================
-- TABLE CREATION
-- =====================================================================

-- ─── 1NF / 3NF FIX: Cities lookup table ─────────────────────────────
-- Before: departure_city / destination_city stored as free-text VARCHAR
--         in Flights, causing duplicates and no referential integrity.
-- After:  City names live in one place; Flights references city_id FK.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE Cities (
    city_id     INT PRIMARY KEY IDENTITY(1,1),
    city_name   VARCHAR(100) UNIQUE NOT NULL,
    country     VARCHAR(100) NOT NULL,
    iata_code   CHAR(3) NULL   -- optional IATA airport code
);
GO

-- ─── 1NF FIX: Payment_Methods lookup table ───────────────────────────
-- Before: payment_method stored as free-text VARCHAR in Payments table,
--         allowing inconsistent values ('credit card', 'Credit_Card'…).
-- After:  Valid payment method names live in one authoritative table.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE Payment_Methods (
    method_id   INT PRIMARY KEY IDENTITY(1,1),
    method_name VARCHAR(30) UNIQUE NOT NULL   -- 'credit_card', 'paypal', etc.
);
GO

-- ─── 2NF / 3NF FIX: Seat_Class_Prices lookup table ──────────────────
-- Before: price_multiplier was stored directly on every Seat row.
--         This created a transitive dependency:
--             seat_id -> seat_class -> price_multiplier
--         (price_multiplier depends on seat_class, not on seat_id).
--         Any price change required updating thousands of Seat rows.
-- After:  Multipliers live in this table keyed by seat_class alone.
--         Seats no longer carry price_multiplier; the value is joined
--         at query time from here.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE Seat_Class_Prices (
    seat_class       VARCHAR(20) PRIMARY KEY
                     CHECK (seat_class IN ('economy','business','first_class')),
    price_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    description      VARCHAR(100) NULL
);
GO

-- Users Table (unchanged – already in 3NF)
CREATE TABLE Users (
    user_id         INT PRIMARY KEY IDENTITY(1,1),
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    phone_number    VARCHAR(15)  NULL,
    date_of_birth   DATE         NULL,
    passport_number VARCHAR(20)  UNIQUE NULL,
    created_at      DATETIME     DEFAULT GETDATE()
);
GO

-- Admin Table (unchanged – already in 3NF)
CREATE TABLE Admin (
    admin_id      INT PRIMARY KEY IDENTITY(1,1),
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    role          VARCHAR(20)  DEFAULT 'flight_manager',
    created_at    DATETIME     DEFAULT GETDATE()
);
GO

-- Aircraft Table (unchanged – already in 3NF)
CREATE TABLE Aircraft (
    aircraft_id           INT PRIMARY KEY IDENTITY(1,1),
    aircraft_type         VARCHAR(50) UNIQUE NOT NULL,
    manufacturer          VARCHAR(50) NOT NULL,
    model                 VARCHAR(50) NOT NULL,
    total_seats           INT         NOT NULL,
    economy_seats         INT         NOT NULL,
    business_seats        INT         NOT NULL,
    first_class_seats     INT         NOT NULL,
    max_range_km          INT         NULL,
    cruise_speed_kmh      INT         NULL,
    fuel_capacity_liters  INT         NULL,
    created_at            DATETIME    DEFAULT GETDATE(),
    CHECK (total_seats = economy_seats + business_seats + first_class_seats)
);
GO

-- ─── 1NF / 3NF FIX: Flights now references Cities ────────────────────
-- Before: departure_city / destination_city were free-text VARCHAR(100).
--         The same city name could be spelled differently across rows,
--         violating referential integrity and first normal form atomicity.
-- After:  Both columns are FK references to Cities(city_id).
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE Flights (
    flight_id            INT PRIMARY KEY IDENTITY(1,1),
    flight_number        VARCHAR(10)    UNIQUE NOT NULL,
    airline_name         VARCHAR(100)   NOT NULL,
    departure_city_id    INT            NOT NULL,
    destination_city_id  INT            NOT NULL,
    aircraft_id          INT            NOT NULL,
    base_price           DECIMAL(10,2)  NOT NULL,
    created_at           DATETIME       DEFAULT GETDATE(),
    FOREIGN KEY (departure_city_id)   REFERENCES Cities(city_id)   ON DELETE NO ACTION,
    FOREIGN KEY (destination_city_id) REFERENCES Cities(city_id)   ON DELETE NO ACTION,
    FOREIGN KEY (aircraft_id)         REFERENCES Aircraft(aircraft_id) ON DELETE NO ACTION,
    CHECK (departure_city_id <> destination_city_id)
);
GO

-- ─── 3NF FIX: Flight_Schedules – removed available_seats ─────────────
-- Before: available_seats was stored and manually updated on every
--         booking / cancellation. This is a derived value:
--             available_seats = total_seats - COUNT(booked seats)
--         Storing derived data violates 3NF and causes update anomalies
--         (the column can drift out of sync with actual seat records).
-- After:  available_seats is REMOVED. Queries compute it live as:
--             SELECT COUNT(*) FROM Seats
--             WHERE schedule_id = @id AND is_available = 1
--         A computed-column VIEW (vw_Schedule_Availability) is provided
--         so application code can still SELECT available_seats easily.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE Flight_Schedules (
    schedule_id    INT PRIMARY KEY IDENTITY(1,1),
    flight_id      INT         NOT NULL,
    departure_time DATETIME    NOT NULL,
    arrival_time   DATETIME    NOT NULL,
    flight_date    DATE        NOT NULL,
    status         VARCHAR(20) DEFAULT 'on_time'
                   CHECK (status IN ('on_time','delayed','cancelled','boarding')),
    gate_number    VARCHAR(10) NULL,
    created_at     DATETIME    DEFAULT GETDATE(),
    FOREIGN KEY (flight_id) REFERENCES Flights(flight_id) ON DELETE CASCADE
);
GO

-- ─── 2NF / 3NF FIX: Seats – price_multiplier removed ────────────────
-- Before: price_multiplier on every Seat row caused a transitive FD:
--             seat_id -> seat_class -> price_multiplier
-- After:  price_multiplier is looked up from Seat_Class_Prices at query
--         time. held_until / hold_user_id stay here (truly seat-specific).
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE Seats (
    seat_id      INT PRIMARY KEY IDENTITY(1,1),
    schedule_id  INT         NOT NULL,
    seat_number  VARCHAR(5)  NOT NULL,
    seat_class   VARCHAR(20) NOT NULL
                 CHECK (seat_class IN ('economy','business','first_class')),
    is_available BIT         DEFAULT 1,
    held_until   DATETIME2   NULL,
    hold_user_id INT         NULL,
    FOREIGN KEY (schedule_id) REFERENCES Flight_Schedules(schedule_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_class)  REFERENCES Seat_Class_Prices(seat_class) ON DELETE NO ACTION,
    UNIQUE (schedule_id, seat_number)
);
GO

-- Bookings Table (unchanged – already in 3NF)
CREATE TABLE Bookings (
    booking_id        INT PRIMARY KEY IDENTITY(1,1),
    user_id           INT         NOT NULL,
    schedule_id       INT         NOT NULL,
    booking_reference VARCHAR(10) UNIQUE NOT NULL,
    booking_date      DATETIME    DEFAULT GETDATE(),
    total_passengers  INT         DEFAULT 1,
    total_amount      DECIMAL(10,2) NOT NULL,
    booking_status    VARCHAR(20) DEFAULT 'pending'
                      CHECK (booking_status IN ('pending','confirmed','cancelled','completed')),
    special_requests  VARCHAR(MAX) NULL,
    FOREIGN KEY (user_id)     REFERENCES Users(user_id)                ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES Flight_Schedules(schedule_id) ON DELETE NO ACTION
);
GO

-- Tickets Table (unchanged – already in 3NF)
CREATE TABLE Tickets (
    ticket_id      INT PRIMARY KEY IDENTITY(1,1),
    booking_id     INT         NOT NULL,
    seat_id        INT         NULL,
    passenger_name VARCHAR(100) NOT NULL,
    ticket_number  VARCHAR(50) UNIQUE NOT NULL,
    ticket_status  VARCHAR(20) DEFAULT 'issued'
                   CHECK (ticket_status IN ('issued','checked_in','boarded','cancelled')),
    issued_at      DATETIME    DEFAULT GETDATE(),
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id)    REFERENCES Seats(seat_id)       ON DELETE NO ACTION
);
GO

-- ─── 1NF FIX: Payments – method_id FK replaces free-text ─────────────
-- Before: payment_method VARCHAR(20) — any string accepted, no lookup.
-- After:  method_id INT FK → Payment_Methods, enforcing valid values.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE Payments (
    payment_id     INT PRIMARY KEY IDENTITY(1,1),
    booking_id     INT           NOT NULL,
    method_id      INT           NOT NULL,          -- FK to Payment_Methods
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20)   DEFAULT 'pending'
                   CHECK (payment_status IN ('pending','completed','failed','refunded')),
    transaction_id VARCHAR(50)   UNIQUE NULL,
    payment_date   DATETIME      DEFAULT GETDATE(),
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)     ON DELETE CASCADE,
    FOREIGN KEY (method_id)  REFERENCES Payment_Methods(method_id) ON DELETE NO ACTION
);
GO

-- =====================================================================
-- VIEWS (replace derived column available_seats)
-- =====================================================================

-- Convenience view so all existing queries using available_seats still
-- work without modification — just swap table name for view name.
CREATE VIEW vw_Schedule_Availability AS
SELECT
    fs.schedule_id,
    fs.flight_id,
    fs.departure_time,
    fs.arrival_time,
    fs.flight_date,
    fs.status,
    fs.gate_number,
    fs.created_at,
    COUNT(CASE WHEN s.is_available = 1 THEN 1 END) AS available_seats,
    COUNT(s.seat_id)                                AS total_seats_allocated
FROM Flight_Schedules fs
LEFT JOIN Seats s ON fs.schedule_id = s.schedule_id
GROUP BY
    fs.schedule_id, fs.flight_id, fs.departure_time, fs.arrival_time,
    fs.flight_date, fs.status, fs.gate_number, fs.created_at;
GO

-- Full flight detail view (used by most application queries)
CREATE VIEW vw_Flight_Full AS
SELECT
    f.flight_id,
    f.flight_number,
    f.airline_name,
    dc.city_name   AS departure_city,
    dc.iata_code   AS departure_iata,
    ac2.city_name  AS destination_city,
    ac2.iata_code  AS destination_iata,
    f.base_price,
    f.created_at,
    a.aircraft_id,
    a.aircraft_type,
    a.manufacturer,
    a.model,
    a.total_seats,
    a.economy_seats,
    a.business_seats,
    a.first_class_seats,
    a.max_range_km,
    a.cruise_speed_kmh
FROM Flights f
INNER JOIN Cities   dc  ON f.departure_city_id   = dc.city_id
INNER JOIN Cities   ac2 ON f.destination_city_id  = ac2.city_id
INNER JOIN Aircraft a   ON f.aircraft_id          = a.aircraft_id;
GO

-- Seat view with price_multiplier joined from Seat_Class_Prices
CREATE VIEW vw_Seat_With_Price AS
SELECT
    s.seat_id,
    s.schedule_id,
    s.seat_number,
    s.seat_class,
    s.is_available,
    s.held_until,
    s.hold_user_id,
    scp.price_multiplier,
    scp.description AS class_description
FROM Seats s
INNER JOIN Seat_Class_Prices scp ON s.seat_class = scp.seat_class;
GO

-- Payment view with method name joined from Payment_Methods
CREATE VIEW vw_Payment_Full AS
SELECT
    p.payment_id,
    p.booking_id,
    pm.method_name  AS payment_method,
    p.payment_amount,
    p.payment_status,
    p.transaction_id,
    p.payment_date
FROM Payments p
INNER JOIN Payment_Methods pm ON p.method_id = pm.method_id;
GO

-- =====================================================================
-- INSERT LOOKUP / REFERENCE DATA
-- =====================================================================

-- Seat Class Prices (normalized from Seats.price_multiplier)
INSERT INTO Seat_Class_Prices (seat_class, price_multiplier, description) VALUES
('economy',     1.00, 'Standard economy class'),
('business',    1.50, 'Business class with extra legroom and service'),
('first_class', 2.00, 'First class luxury experience');

-- Payment Methods (normalized from Payments.payment_method)
SET IDENTITY_INSERT Payment_Methods ON;
INSERT INTO Payment_Methods (method_id, method_name) VALUES
(1, 'credit_card'),
(2, 'debit_card'),
(3, 'paypal'),
(4, 'bank_transfer'),
(5, 'cash');
SET IDENTITY_INSERT Payment_Methods OFF;

-- Cities (normalized from Flights.departure_city / destination_city)
SET IDENTITY_INSERT Cities ON;
INSERT INTO Cities (city_id, city_name, country, iata_code) VALUES
(1, 'New York',   'United States', 'JFK'),
(2, 'London',     'United Kingdom','LHR'),
(3, 'Dubai',      'UAE',           'DXB'),
(4, 'Karachi',    'Pakistan',      'KHI'),
(5, 'Lahore',     'Pakistan',      'LHE'),
(6, 'Tokyo',      'Japan',         'NRT'),
(7, 'Singapore',  'Singapore',     'SIN');
SET IDENTITY_INSERT Cities OFF;

-- =====================================================================
-- INSERT DUMMY DATA
-- =====================================================================

-- Users
SET IDENTITY_INSERT Users ON;
INSERT INTO Users (user_id, first_name, last_name, email, password_hash, phone_number, date_of_birth, passport_number) VALUES
(1, 'John',    'Smith',   'john.smith@email.com',    'hashed_password_123', '+1234567890',    '1990-05-15', 'P123456789'),
(2, 'Emma',    'Johnson', 'emma.j@email.com',         'hashed_password_456', '+1234567891',    '1988-08-22', 'P987654321'),
(3, 'Michael', 'Brown',   'michael.brown@email.com',  'hashed_password_789', '+1234567892',    '1995-03-10', 'P456789123'),
(4, 'Sarah',   'Davis',   'sarah.davis@email.com',    'hashed_password_012', '+1234567893',    '1992-11-28', 'P789123456'),
(5, 'Ahmed',   'Ali',     'ahmed.ali@email.com',      'hashed_password_345', '+923001234567',  '1991-07-05', 'P321654987');
SET IDENTITY_INSERT Users OFF;

-- Admin
SET IDENTITY_INSERT Admin ON;
INSERT INTO Admin (admin_id, username, password_hash, full_name, email, role) VALUES
(1, 'admin_super',   'admin_hashed_pass_001', 'Robert Wilson',  'robert.w@skyreserve.com', 'super_admin'),
(2, 'flight_mgr1',   'admin_hashed_pass_002', 'Lisa Anderson',  'lisa.a@skyreserve.com',   'flight_manager'),
(3, 'support_mgr1',  'admin_hashed_pass_003', 'David Martinez', 'david.m@skyreserve.com',  'support');
SET IDENTITY_INSERT Admin OFF;

-- Aircraft
SET IDENTITY_INSERT Aircraft ON;
INSERT INTO Aircraft (aircraft_id, aircraft_type, manufacturer, model, total_seats, economy_seats, business_seats, first_class_seats, max_range_km, cruise_speed_kmh, fuel_capacity_liters) VALUES
(1, 'Boeing 777',  'Boeing', '777-300ER',       300, 250, 40, 10, 13650, 905, 181280),
(2, 'Airbus A380', 'Airbus', 'A380-800',         400, 320, 60, 20, 15200, 903, 320000),
(3, 'Boeing 737',  'Boeing', '737-800',           180, 150, 25,  5,  5765, 842,  26020),
(4, 'Airbus A320', 'Airbus', 'A320-200',          150, 130, 18,  2,  6100, 840,  24210),
(5, 'Boeing 787',  'Boeing', '787-9 Dreamliner',  280, 220, 50, 10, 14140, 913, 126206),
(6, 'Airbus A350', 'Airbus', 'A350-900',          260, 210, 40, 10, 15000, 910, 138000);
SET IDENTITY_INSERT Aircraft OFF;

-- Flights (departure_city / destination_city now use city_id FK)
SET IDENTITY_INSERT Flights ON;
INSERT INTO Flights (flight_id, flight_number, airline_name, departure_city_id, destination_city_id, aircraft_id, base_price) VALUES
(1, 'SK101', 'SkyReserve Airlines', 1, 2, 1, 450.00),  -- New York -> London    (Boeing 777)
(2, 'SK202', 'SkyReserve Airlines', 2, 3, 2, 550.00),  -- London   -> Dubai     (Airbus A380)
(3, 'SK303', 'SkyReserve Airlines', 3, 4, 3, 280.00),  -- Dubai    -> Karachi   (Boeing 737)
(4, 'SK404', 'SkyReserve Airlines', 4, 5, 4, 120.00),  -- Karachi  -> Lahore    (Airbus A320)
(5, 'SK505', 'SkyReserve Airlines', 1, 6, 5, 680.00),  -- New York -> Tokyo     (Boeing 787)
(6, 'SK606', 'SkyReserve Airlines', 6, 7, 6, 520.00);  -- Tokyo    -> Singapore (Airbus A350)
SET IDENTITY_INSERT Flights OFF;

-- Flight Schedules (available_seats column removed – computed via view)
SET IDENTITY_INSERT Flight_Schedules ON;
INSERT INTO Flight_Schedules (schedule_id, flight_id, departure_time, arrival_time, flight_date, status, gate_number) VALUES
(1, 1, '2025-04-15 08:00:00', '2025-04-15 20:00:00', '2025-04-15', 'on_time',  'A12'),
(2, 1, '2025-04-16 08:00:00', '2025-04-16 20:00:00', '2025-04-16', 'on_time',  'A12'),
(3, 2, '2025-04-15 14:00:00', '2025-04-15 22:30:00', '2025-04-15', 'on_time',  'B05'),
(4, 3, '2025-04-16 10:00:00', '2025-04-16 13:30:00', '2025-04-16', 'delayed',  'C08'),
(5, 4, '2025-04-17 06:00:00', '2025-04-17 07:30:00', '2025-04-17', 'on_time',  'D15'),
(6, 5, '2025-04-18 16:00:00', '2025-04-19 10:00:00', '2025-04-18', 'boarding', 'E22'),
(7, 6, '2025-04-20 11:00:00', '2025-04-20 17:00:00', '2025-04-20', 'cancelled','F10');
SET IDENTITY_INSERT Flight_Schedules OFF;

-- Seats (price_multiplier column removed; seat_class FK to Seat_Class_Prices)
SET IDENTITY_INSERT Seats ON;
INSERT INTO Seats (seat_id, schedule_id, seat_number, seat_class, is_available) VALUES
-- schedule 1 (SK101 on 2025-04-15)
(1,  1, '1A',  'economy',     0),
(2,  1, '1B',  'economy',     0),
(3,  1, '1C',  'economy',     1),
(4,  1, '2A',  'economy',     0),
(5,  1, '2B',  'economy',     1),
(6,  1, '2C',  'economy',     1),
(7,  1, '10A', 'business',    1),
(8,  1, '10B', 'business',    0),
(9,  1, '11A', 'business',    1),
(10, 1, '20A', 'first_class', 1),
(11, 1, '20B', 'first_class', 1),
-- schedule 3 (SK202 on 2025-04-15)
(12, 3, '1A',  'economy',     0),
(13, 3, '1B',  'economy',     1),
(14, 3, '2A',  'economy',     1),
(15, 3, '10A', 'business',    1),
(16, 3, '10B', 'business',    1),
-- schedule 5 (SK404 on 2025-04-17)
(17, 5, '1A',  'economy',     0),
(18, 5, '1B',  'economy',     0),
(19, 5, '2A',  'economy',     1),
(20, 5, '10A', 'business',    1);
SET IDENTITY_INSERT Seats OFF;

-- Bookings
SET IDENTITY_INSERT Bookings ON;
INSERT INTO Bookings (booking_id, user_id, schedule_id, booking_reference, total_passengers, total_amount, booking_status, special_requests) VALUES
(1, 1, 1, 'SKR2B4A1', 2,  900.00, 'confirmed', 'Window seat preferred'),
(2, 2, 1, 'SKR8K3L9', 1,  675.00, 'confirmed', 'Vegetarian meal'),
(3, 3, 3, 'SKR5M2P7', 1,  550.00, 'confirmed', NULL),
(4, 4, 4, 'SKR9X1Q4', 1,  280.00, 'pending',   'Extra legroom'),
(5, 5, 5, 'SKR3T6Y8', 2,  240.00, 'confirmed', 'Wheelchair assistance'),
(6, 1, 3, 'SKR7H9K2', 1,  550.00, 'cancelled', NULL);
SET IDENTITY_INSERT Bookings OFF;

-- Tickets
SET IDENTITY_INSERT Tickets ON;
INSERT INTO Tickets (ticket_id, booking_id, seat_id, passenger_name, ticket_number, ticket_status) VALUES
(1, 1,  1,    'John Smith',    'TKT-SK101-001', 'checked_in'),
(2, 1,  2,    'Jane Smith',    'TKT-SK101-002', 'checked_in'),
(3, 2,  8,    'Emma Johnson',  'TKT-SK101-003', 'boarded'),
(4, 3,  12,   'Michael Brown', 'TKT-SK202-001', 'issued'),
(5, 5,  17,   'Ahmed Ali',     'TKT-SK404-001', 'issued'),
(6, 5,  18,   'Fatima Ali',    'TKT-SK404-002', 'issued'),
(7, 6,  NULL, 'John Smith',    'TKT-SK202-002', 'cancelled');
SET IDENTITY_INSERT Tickets OFF;

-- Payments (payment_method replaced by method_id FK)
SET IDENTITY_INSERT Payments ON;
INSERT INTO Payments (payment_id, booking_id, method_id, payment_amount, payment_status, transaction_id) VALUES
(1, 1, 1, 900.00, 'completed', 'TXN1001234567'),  -- credit_card
(2, 2, 3, 675.00, 'completed', 'TXN1001234568'),  -- paypal
(3, 3, 2, 550.00, 'completed', 'TXN1001234569'),  -- debit_card
(4, 4, 1, 280.00, 'pending',   'TXN1001234570'),  -- credit_card
(5, 5, 4, 240.00, 'completed', 'TXN1001234571'),  -- bank_transfer
(6, 6, 1, 550.00, 'refunded',  'TXN1001234572');  -- credit_card
SET IDENTITY_INSERT Payments OFF;
GO

-- =====================================================================
-- UPDATED QUERIES (using normalized schema)
-- =====================================================================

-- Q1: All users ordered by registration date
SELECT * FROM Users ORDER BY created_at DESC;

-- Q2: All admins
SELECT * FROM Admin;

-- Q3: All flights with human-readable city names (via vw_Flight_Full)
SELECT
    flight_id,
    flight_number,
    airline_name,
    departure_city,
    destination_city,
    aircraft_type,
    model,
    base_price,
    created_at
FROM vw_Flight_Full
ORDER BY created_at DESC;

-- Q4: All schedules with available seat count (via vw_Schedule_Availability)
SELECT
    va.schedule_id,
    va.flight_date,
    va.departure_time,
    va.arrival_time,
    va.status,
    va.gate_number,
    va.available_seats,
    vf.flight_number,
    vf.airline_name,
    vf.departure_city,
    vf.destination_city
FROM vw_Schedule_Availability va
INNER JOIN vw_Flight_Full vf ON va.flight_id = vf.flight_id
ORDER BY va.flight_date, va.departure_time;

-- Q5: Seat map for a schedule with price (multiplier from Seat_Class_Prices)
SELECT
    sp.seat_id,
    sp.seat_number,
    sp.seat_class,
    sp.is_available,
    sp.price_multiplier,
    sp.class_description,
    f.base_price,
    CAST(f.base_price * sp.price_multiplier AS DECIMAL(10,2)) AS seat_price
FROM vw_Seat_With_Price sp
INNER JOIN Flight_Schedules fs ON sp.schedule_id = fs.schedule_id
INNER JOIN Flights f           ON fs.flight_id   = f.flight_id
WHERE sp.schedule_id = 1
ORDER BY sp.seat_number;

-- Q6: Full booking details for a user
SELECT
    b.booking_id,
    b.booking_reference,
    b.booking_date,
    b.total_passengers,
    b.total_amount,
    b.booking_status,
    vf.flight_number,
    vf.airline_name,
    vf.departure_city,
    vf.destination_city,
    vf.aircraft_type,
    fs.flight_date,
    fs.departure_time,
    fs.arrival_time
FROM Bookings b
INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
INNER JOIN vw_Flight_Full   vf ON fs.flight_id  = vf.flight_id
WHERE b.user_id = 1
ORDER BY b.booking_date DESC;

-- Q7: My tickets with seat and flight info
SELECT
    t.ticket_id,
    t.ticket_number,
    t.passenger_name,
    t.ticket_status,
    t.issued_at,
    sp.seat_number,
    sp.seat_class,
    b.booking_reference,
    vf.flight_number,
    vf.airline_name,
    vf.departure_city,
    vf.destination_city,
    fs.flight_date,
    fs.departure_time,
    fs.arrival_time
FROM Tickets t
INNER JOIN Bookings         b  ON t.booking_id  = b.booking_id
INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
INNER JOIN vw_Flight_Full   vf ON fs.flight_id  = vf.flight_id
LEFT  JOIN vw_Seat_With_Price sp ON t.seat_id   = sp.seat_id
WHERE b.user_id = 1
  AND b.booking_status IN ('confirmed','completed')
ORDER BY t.issued_at DESC;

-- Q8: My payments with method name (via vw_Payment_Full)
SELECT
    pf.payment_id,
    pf.payment_method,
    pf.payment_amount,
    pf.payment_status,
    pf.transaction_id,
    pf.payment_date,
    b.booking_reference,
    vf.flight_number
FROM vw_Payment_Full pf
INNER JOIN Bookings         b  ON pf.booking_id = b.booking_id
INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
INNER JOIN vw_Flight_Full   vf ON fs.flight_id  = vf.flight_id
WHERE b.user_id = 1
ORDER BY pf.payment_date DESC;

-- Q9: Flight search with filters (replaces raw Flights JOIN)
SELECT
    vf.flight_id,
    vf.flight_number,
    vf.airline_name,
    vf.departure_city,
    vf.destination_city,
    vf.aircraft_type,
    vf.total_seats,
    vf.economy_seats,
    vf.business_seats,
    vf.first_class_seats,
    va.schedule_id,
    va.flight_date,
    va.departure_time,
    va.arrival_time,
    DATEDIFF(MINUTE, va.departure_time, va.arrival_time) AS duration_minutes,
    va.status,
    va.gate_number,
    va.available_seats,
    vf.base_price,
    (vf.base_price * 1.50) AS business_price,
    (vf.base_price * 2.00) AS first_class_price
FROM vw_Flight_Full         vf
INNER JOIN vw_Schedule_Availability va ON vf.flight_id = va.flight_id
WHERE va.status         != 'cancelled'
  AND va.available_seats > 0
ORDER BY va.flight_date ASC, va.departure_time ASC;

-- Q10: Admin – all bookings
SELECT
    b.booking_id,
    b.booking_reference,
    b.booking_date,
    b.total_passengers,
    b.total_amount,
    b.booking_status,
    u.first_name,
    u.last_name,
    u.email,
    vf.flight_number,
    vf.airline_name,
    vf.departure_city,
    vf.destination_city,
    vf.aircraft_type,
    fs.flight_date
FROM Bookings b
INNER JOIN Users            u  ON b.user_id    = u.user_id
INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
INNER JOIN vw_Flight_Full   vf ON fs.flight_id  = vf.flight_id
ORDER BY b.booking_date DESC;

-- Q11: Booking statistics by status
SELECT
    booking_status,
    COUNT(*)           AS total_bookings,
    SUM(total_passengers) AS total_passengers,
    SUM(total_amount)  AS total_revenue,
    AVG(total_amount)  AS avg_booking_value
FROM Bookings
GROUP BY booking_status
ORDER BY total_bookings DESC;

-- Q12: Flight revenue stats (admin)
SELECT
    vf.flight_id,
    vf.flight_number,
    vf.departure_city + ' → ' + vf.destination_city AS route,
    vf.airline_name,
    vf.base_price,
    vf.aircraft_type,
    COUNT(DISTINCT b.booking_id)                         AS total_bookings,
    COALESCE(SUM(b.total_passengers), 0)                 AS total_passengers,
    COALESCE(SUM(b.total_amount), 0)                     AS total_revenue,
    COALESCE(AVG(CAST(b.total_amount AS FLOAT)), 0)      AS avg_booking_value,
    SUM(CASE WHEN b.booking_status = 'confirmed'  THEN 1 ELSE 0 END) AS confirmed_bookings,
    SUM(CASE WHEN b.booking_status = 'cancelled'  THEN 1 ELSE 0 END) AS cancelled_bookings
FROM vw_Flight_Full         vf
LEFT JOIN Flight_Schedules  fs ON vf.flight_id   = fs.flight_id
LEFT JOIN Bookings          b  ON fs.schedule_id = b.schedule_id
GROUP BY
    vf.flight_id, vf.flight_number, vf.departure_city, vf.destination_city,
    vf.airline_name, vf.base_price, vf.aircraft_type
ORDER BY total_revenue DESC;

-- Q13: Available routes (used by flight search UI)
SELECT
    vf.departure_city,
    vf.destination_city,
    vf.departure_city + ' → ' + vf.destination_city AS route,
    COUNT(DISTINCT va.schedule_id) AS flight_count,
    MIN(vf.base_price)             AS starting_from
FROM vw_Flight_Full         vf
INNER JOIN vw_Schedule_Availability va ON vf.flight_id = va.flight_id
WHERE va.status         != 'cancelled'
  AND va.available_seats > 0
GROUP BY vf.departure_city, vf.destination_city
ORDER BY vf.departure_city, vf.destination_city;
GO


SELECT * FROM Users ORDER BY created_at DESC

SELECT * FROM Admin;

SELECT * FROM Flights ORDER BY created_at DESC

select * from Flight_Schedules
