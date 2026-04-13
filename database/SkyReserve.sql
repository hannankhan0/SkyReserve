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
 
CREATE DATABASE SkyReserve;

USE SkyReserve;
 

-- DROP EXISTING TABLES (in correct order due to foreign key dependencies)

IF OBJECT_ID('Payments', 'U') IS NOT NULL DROP TABLE Payments;
IF OBJECT_ID('Tickets', 'U') IS NOT NULL DROP TABLE Tickets;
IF OBJECT_ID('Bookings', 'U') IS NOT NULL DROP TABLE Bookings;
IF OBJECT_ID('Seats', 'U') IS NOT NULL DROP TABLE Seats;
IF OBJECT_ID('Flight_Schedules', 'U') IS NOT NULL DROP TABLE Flight_Schedules;
IF OBJECT_ID('Flights', 'U') IS NOT NULL DROP TABLE Flights;
IF OBJECT_ID('Aircraft', 'U') IS NOT NULL DROP TABLE Aircraft;
IF OBJECT_ID('Admin', 'U') IS NOT NULL DROP TABLE Admin;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
 

-- =====================================================================
-- TABLE CREATION
-- =====================================================================

-- Users Table
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    date_of_birth DATE,
    passport_number VARCHAR(20) UNIQUE,
    created_at DATETIME DEFAULT GETDATE()
);
 

-- Admin Table
CREATE TABLE Admin (
    admin_id INT PRIMARY KEY IDENTITY(1,1),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'flight_manager',
    created_at DATETIME DEFAULT GETDATE()
);
 

-- =====================================================================
-- NEW: Aircraft Table
-- Stores aircraft specifications separately to eliminate redundancy
-- =====================================================================
CREATE TABLE Aircraft (
    aircraft_id INT PRIMARY KEY IDENTITY(1,1),
    aircraft_type VARCHAR(50) UNIQUE NOT NULL,
    manufacturer VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    total_seats INT NOT NULL,
    economy_seats INT NOT NULL,
    business_seats INT NOT NULL,
    first_class_seats INT NOT NULL,
    max_range_km INT,
    cruise_speed_kmh INT,
    fuel_capacity_liters INT,
    created_at DATETIME DEFAULT GETDATE(),
    CHECK (total_seats = economy_seats + business_seats + first_class_seats)
);

-- =====================================================================
-- MODIFIED: Flights Table
-- Now references Aircraft table instead of storing aircraft details
-- Focuses only on route information
-- =====================================================================
CREATE TABLE Flights (
    flight_id INT PRIMARY KEY IDENTITY(1,1),
    flight_number VARCHAR(10) UNIQUE NOT NULL,
    airline_name VARCHAR(100) NOT NULL,
    departure_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    aircraft_id INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (aircraft_id) REFERENCES Aircraft(aircraft_id) ON DELETE NO ACTION
);
 

-- Flight_Schedules Table
CREATE TABLE Flight_Schedules (
    schedule_id INT PRIMARY KEY IDENTITY(1,1),
    flight_id INT NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    flight_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('on_time','delayed','cancelled','boarding')) DEFAULT 'on_time',
    gate_number VARCHAR(10),
    available_seats INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (flight_id) REFERENCES Flights(flight_id) ON DELETE CASCADE
);
 

-- Seats Table
CREATE TABLE Seats (
    seat_id INT PRIMARY KEY IDENTITY(1,1),
    schedule_id INT NOT NULL,
    seat_number VARCHAR(5) NOT NULL,
    seat_class VARCHAR(20) NOT NULL CHECK (seat_class IN ('economy','business','first_class')),
    is_available BIT DEFAULT 1,
    price_multiplier DECIMAL(3, 2) DEFAULT 1.00,
    FOREIGN KEY (schedule_id) REFERENCES Flight_Schedules(schedule_id) ON DELETE CASCADE,
    UNIQUE (schedule_id, seat_number)
);
 

-- Bookings Table
CREATE TABLE Bookings (
    booking_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    schedule_id INT NOT NULL,
    booking_reference VARCHAR(10) UNIQUE NOT NULL,
    booking_date DATETIME DEFAULT GETDATE(),
    total_passengers INT DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(20) CHECK (booking_status IN ('pending','confirmed','cancelled','completed')) DEFAULT 'pending',
    special_requests VARCHAR(MAX),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES Flight_Schedules(schedule_id) ON DELETE NO ACTION
);
 

-- Tickets Table
CREATE TABLE Tickets (
    ticket_id INT PRIMARY KEY IDENTITY(1,1),
    booking_id INT NOT NULL,
    seat_id INT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    ticket_number VARCHAR(15) UNIQUE NOT NULL,
    ticket_status VARCHAR(20) CHECK (ticket_status IN ('issued','checked_in','boarded','cancelled')) DEFAULT 'issued',
    issued_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES Seats(seat_id) ON DELETE NO ACTION
);
 

-- Payments Table
CREATE TABLE Payments (
    payment_id INT PRIMARY KEY IDENTITY(1,1),
    booking_id INT NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending','completed','failed','refunded')) DEFAULT 'pending',
    transaction_id VARCHAR(50) UNIQUE,
    payment_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE
);
GO

-- =====================================================================
-- INSERT DUMMY DATA
-- =====================================================================

-- Insert Users
SET IDENTITY_INSERT Users ON;
INSERT INTO Users (user_id, first_name, last_name, email, password_hash, phone_number, date_of_birth, passport_number) VALUES
(1, 'John', 'Smith', 'john.smith@email.com', 'hashed_password_123', '+1234567890', '1990-05-15', 'P123456789'),
(2, 'Emma', 'Johnson', 'emma.j@email.com', 'hashed_password_456', '+1234567891', '1988-08-22', 'P987654321'),
(3, 'Michael', 'Brown', 'michael.brown@email.com', 'hashed_password_789', '+1234567892', '1995-03-10', 'P456789123'),
(4, 'Sarah', 'Davis', 'sarah.davis@email.com', 'hashed_password_012', '+1234567893', '1992-11-28', 'P789123456'),
(5, 'Ahmed', 'Ali', 'ahmed.ali@email.com', 'hashed_password_345', '+923001234567', '1991-07-05', 'P321654987');
SET IDENTITY_INSERT Users OFF;
 

-- Insert Admin
SET IDENTITY_INSERT Admin ON;
INSERT INTO Admin (admin_id, username, password_hash, full_name, email, role) VALUES
(1, 'admin_super', 'admin_hashed_pass_001', 'Robert Wilson', 'robert.w@skyreserve.com', 'super_admin'),
(2, 'flight_mgr1', 'admin_hashed_pass_002', 'Lisa Anderson', 'lisa.a@skyreserve.com', 'flight_manager'),
(3, 'support_mgr1', 'admin_hashed_pass_003', 'David Martinez', 'david.m@skyreserve.com', 'support');
SET IDENTITY_INSERT Admin OFF;
 

-- =====================================================================
-- NEW: Insert Aircraft Data
-- Each aircraft type is stored only once
-- =====================================================================
SET IDENTITY_INSERT Aircraft ON;
INSERT INTO Aircraft (aircraft_id, aircraft_type, manufacturer, model, total_seats, economy_seats, business_seats, first_class_seats, max_range_km, cruise_speed_kmh, fuel_capacity_liters) VALUES
(1, 'Boeing 777', 'Boeing', '777-300ER', 300, 250, 40, 10, 13650, 905, 181280),
(2, 'Airbus A380', 'Airbus', 'A380-800', 400, 320, 60, 20, 15200, 903, 320000),
(3, 'Boeing 737', 'Boeing', '737-800', 180, 150, 25, 5, 5765, 842, 26020),
(4, 'Airbus A320', 'Airbus', 'A320-200', 150, 130, 18, 2, 6100, 840, 24210),
(5, 'Boeing 787', 'Boeing', '787-9 Dreamliner', 280, 220, 50, 10, 14140, 913, 126206),
(6, 'Airbus A350', 'Airbus', 'A350-900', 260, 210, 40, 10, 15000, 910, 138000);
SET IDENTITY_INSERT Aircraft OFF;
 

-- =====================================================================
-- MODIFIED: Insert Flights
-- Now references aircraft_id instead of storing aircraft details
-- =====================================================================
SET IDENTITY_INSERT Flights ON;
INSERT INTO Flights (flight_id, flight_number, airline_name, departure_city, destination_city, aircraft_id, base_price) VALUES
(1, 'SK101', 'SkyReserve Airlines', 'New York', 'London', 1, 450.00),      -- Boeing 777
(2, 'SK202', 'SkyReserve Airlines', 'London', 'Dubai', 2, 550.00),         -- Airbus A380
(3, 'SK303', 'SkyReserve Airlines', 'Dubai', 'Karachi', 3, 280.00),        -- Boeing 737
(4, 'SK404', 'SkyReserve Airlines', 'Karachi', 'Lahore', 4, 120.00),       -- Airbus A320
(5, 'SK505', 'SkyReserve Airlines', 'New York', 'Tokyo', 5, 680.00),       -- Boeing 787
(6, 'SK606', 'SkyReserve Airlines', 'Tokyo', 'Singapore', 6, 520.00);      -- Airbus A350
SET IDENTITY_INSERT Flights OFF;
 

-- Insert Flight Schedules
SET IDENTITY_INSERT Flight_Schedules ON;
INSERT INTO Flight_Schedules (schedule_id, flight_id, departure_time, arrival_time, flight_date, status, gate_number, available_seats) VALUES
(1, 1, '2025-04-15 08:00:00', '2025-04-15 20:00:00', '2025-04-15', 'on_time', 'A12', 297),
(2, 1, '2025-04-16 08:00:00', '2025-04-16 20:00:00', '2025-04-16', 'on_time', 'A12', 300),
(3, 2, '2025-04-15 14:00:00', '2025-04-15 22:30:00', '2025-04-15', 'on_time', 'B05', 399),
(4, 3, '2025-04-16 10:00:00', '2025-04-16 13:30:00', '2025-04-16', 'delayed', 'C08', 180),
(5, 4, '2025-04-17 06:00:00', '2025-04-17 07:30:00', '2025-04-17', 'on_time', 'D15', 148),
(6, 5, '2025-04-18 16:00:00', '2025-04-19 10:00:00', '2025-04-18', 'boarding', 'E22', 280),
(7, 6, '2025-04-20 11:00:00', '2025-04-20 17:00:00', '2025-04-20', 'cancelled', 'F10', 260);
SET IDENTITY_INSERT Flight_Schedules OFF;
 

-- Insert Seats
SET IDENTITY_INSERT Seats ON;
INSERT INTO Seats (seat_id, schedule_id, seat_number, seat_class, is_available, price_multiplier) VALUES
-- Seats for schedule 1 (SK101 on 2025-04-15)
(1, 1, '1A', 'economy', 0, 1.00),
(2, 1, '1B', 'economy', 0, 1.00),
(3, 1, '1C', 'economy', 1, 1.00),
(4, 1, '2A', 'economy', 0, 1.00),
(5, 1, '2B', 'economy', 1, 1.00),
(6, 1, '2C', 'economy', 1, 1.00),
(7, 1, '10A', 'business', 1, 1.50),
(8, 1, '10B', 'business', 0, 1.50),
(9, 1, '11A', 'business', 1, 1.50),
(10, 1, '20A', 'first_class', 1, 2.00),
(11, 1, '20B', 'first_class', 1, 2.00),
-- Seats for schedule 3 (SK202 on 2025-04-15)
(12, 3, '1A', 'economy', 0, 1.00),
(13, 3, '1B', 'economy', 1, 1.00),
(14, 3, '2A', 'economy', 1, 1.00),
(15, 3, '10A', 'business', 1, 1.50),
(16, 3, '10B', 'business', 1, 1.50),
-- Seats for schedule 5 (SK404 on 2025-04-17)
(17, 5, '1A', 'economy', 0, 1.00),
(18, 5, '1B', 'economy', 0, 1.00),
(19, 5, '2A', 'economy', 1, 1.00),
(20, 5, '10A', 'business', 1, 1.50);
SET IDENTITY_INSERT Seats OFF;
 

-- Insert Bookings
SET IDENTITY_INSERT Bookings ON;
INSERT INTO Bookings (booking_id, user_id, schedule_id, booking_reference, total_passengers, total_amount, booking_status, special_requests) VALUES
(1, 1, 1, 'SKR2B4A1', 2, 900.00, 'confirmed', 'Window seat preferred'),
(2, 2, 1, 'SKR8K3L9', 1, 675.00, 'confirmed', 'Vegetarian meal'),
(3, 3, 3, 'SKR5M2P7', 1, 550.00, 'confirmed', NULL),
(4, 4, 4, 'SKR9X1Q4', 1, 280.00, 'pending', 'Extra legroom'),
(5, 5, 5, 'SKR3T6Y8', 2, 240.00, 'confirmed', 'Wheelchair assistance'),
(6, 1, 3, 'SKR7H9K2', 1, 550.00, 'cancelled', NULL);
SET IDENTITY_INSERT Bookings OFF;
 

-- Insert Tickets
SET IDENTITY_INSERT Tickets ON;
INSERT INTO Tickets (ticket_id, booking_id, seat_id, passenger_name, ticket_number, ticket_status) VALUES
(1, 1, 1, 'John Smith', 'TKT-SK101-001', 'checked_in'),
(2, 1, 2, 'Jane Smith', 'TKT-SK101-002', 'checked_in'),
(3, 2, 8, 'Emma Johnson', 'TKT-SK101-003', 'boarded'),
(4, 3, 12, 'Michael Brown', 'TKT-SK202-001', 'issued'),
(5, 5, 17, 'Ahmed Ali', 'TKT-SK404-001', 'issued'),
(6, 5, 18, 'Fatima Ali', 'TKT-SK404-002', 'issued'),
(7, 6, NULL, 'John Smith', 'TKT-SK202-002', 'cancelled');
SET IDENTITY_INSERT Tickets OFF;
 

-- Insert Payments
SET IDENTITY_INSERT Payments ON;
INSERT INTO Payments (payment_id, booking_id, payment_method, payment_amount, payment_status, transaction_id) VALUES
(1, 1, 'credit_card', 900.00, 'completed', 'TXN1001234567'),
(2, 2, 'paypal', 675.00, 'completed', 'TXN1001234568'),
(3, 3, 'debit_card', 550.00, 'completed', 'TXN1001234569'),
(4, 4, 'credit_card', 280.00, 'pending', 'TXN1001234570'),
(5, 5, 'bank_transfer', 240.00, 'completed', 'TXN1001234571'),
(6, 6, 'credit_card', 550.00, 'refunded', 'TXN1001234572');
SET IDENTITY_INSERT Payments OFF;
GO

-- =====================================================================
-- FEATURE SPECIFIC QUERIES
-- =====================================================================

-- =====================================================================
-- 1) User Registration & Management
-- =====================================================================

-- Register a new user
INSERT INTO Users (first_name, last_name, email, password_hash, phone_number, date_of_birth, passport_number)
VALUES ('Alice', 'Williams', 'alice.w@email.com', 'hashed_password_999', '+1234567899', '1993-09-18', 'P555666777');
 

-- User login
SELECT user_id, first_name, last_name, email
FROM Users
WHERE email = 'john.smith@email.com' AND password_hash = 'hashed_password_123';
 

-- Update user profile
UPDATE Users
SET phone_number = '+1234567894', date_of_birth = '1990-06-15'
WHERE user_id = 1;
 

-- =====================================================================
-- 2) Aircraft Management (NEW)
-- =====================================================================

-- Add a new aircraft type
INSERT INTO Aircraft (aircraft_type, manufacturer, model, total_seats, economy_seats, business_seats, first_class_seats, max_range_km, cruise_speed_kmh, fuel_capacity_liters)
VALUES ('Boeing 747', 'Boeing', '747-8', 410, 350, 50, 10, 14815, 917, 238610);
 

-- View all aircraft in fleet
SELECT 
    aircraft_id,
    aircraft_type,
    manufacturer,
    model,
    total_seats,
    economy_seats,
    business_seats,
    first_class_seats,
    max_range_km,
    cruise_speed_kmh
FROM Aircraft
ORDER BY aircraft_type;
 

-- Update aircraft specifications
UPDATE Aircraft
SET economy_seats = 240, business_seats = 50
WHERE aircraft_type = 'Boeing 777';
 

-- View aircraft utilization (how many flights use each aircraft)
SELECT 
    a.aircraft_type,
    a.manufacturer,
    a.model,
    COUNT(f.flight_id) AS total_routes,
    a.total_seats,
    a.max_range_km
FROM Aircraft a
LEFT JOIN Flights f ON a.aircraft_id = f.aircraft_id
GROUP BY a.aircraft_type, a.manufacturer, a.model, a.total_seats, a.max_range_km
ORDER BY total_routes DESC;
 

-- =====================================================================
-- 3) Flight Management (MODIFIED to include Aircraft info)
-- =====================================================================

-- Add a new flight (now references aircraft_id)
INSERT INTO Flights (flight_number, airline_name, departure_city, destination_city, aircraft_id, base_price)
VALUES ('SK707', 'SkyReserve Airlines', 'Paris', 'Rome', 4, 320.00);  -- Uses Airbus A320
 

-- Update flight details
UPDATE Flights
SET base_price = 480.00, aircraft_id = 1  -- Changed to Boeing 777
WHERE flight_number = 'SK101';
 

-- View all flights WITH aircraft details
SELECT 
    f.flight_id,
    f.flight_number,
    f.airline_name,
    f.departure_city,
    f.destination_city,
    a.aircraft_type,
    a.manufacturer,
    a.model,
    a.total_seats,
    f.base_price
FROM Flights f
INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
ORDER BY f.flight_number;
 

-- =====================================================================
-- 4) Flight Search (MODIFIED to include Aircraft info)
-- =====================================================================

-- Search flights by route with aircraft details
SELECT 
    f.flight_number,
    f.airline_name,
    f.departure_city,
    f.destination_city,
    a.aircraft_type,
    a.manufacturer,
    a.total_seats,
    fs.flight_date,
    FORMAT(fs.departure_time, 'hh:mm tt') AS departure_time,
    FORMAT(fs.arrival_time, 'hh:mm tt') AS arrival_time,
    fs.status,
    fs.available_seats,
    f.base_price
FROM Flights f
INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
INNER JOIN Flight_Schedules fs ON f.flight_id = fs.flight_id
WHERE f.departure_city = 'New York' 
  AND f.destination_city = 'London'
  AND fs.flight_date >= CAST(GETDATE() AS DATE)
ORDER BY fs.flight_date, fs.departure_time;
 

-- Search flights by date with filtering and aircraft info
SELECT 
    f.flight_number,
    f.departure_city + ' → ' + f.destination_city AS route,
    a.aircraft_type,
    fs.flight_date,
    fs.departure_time,
    fs.status,
    fs.available_seats,
    a.total_seats
FROM Flights f
INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
INNER JOIN Flight_Schedules fs ON f.flight_id = fs.flight_id
WHERE fs.flight_date = '2025-04-15'
  AND fs.status != 'cancelled'
ORDER BY fs.departure_time;
 

-- =====================================================================
-- 5) Schedule Management
-- =====================================================================

-- Create a new schedule
INSERT INTO Flight_Schedules (flight_id, departure_time, arrival_time, flight_date, status, gate_number, available_seats)
VALUES (1, '2025-04-25 09:00:00', '2025-04-25 21:00:00', '2025-04-25', 'on_time', 'A15', 300);
 

-- View schedule with flight AND aircraft details
SELECT 
    fs.schedule_id,
    f.flight_number,
    f.departure_city,
    f.destination_city,
    a.aircraft_type,
    a.manufacturer,
    fs.flight_date,
    fs.departure_time,
    fs.arrival_time,
    fs.status,
    fs.gate_number,
    fs.available_seats,
    a.total_seats
FROM Flight_Schedules fs
INNER JOIN Flights f ON fs.flight_id = f.flight_id
INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
WHERE fs.flight_date >= CAST(GETDATE() AS DATE)
ORDER BY fs.flight_date, fs.departure_time;
 

-- Get schedule grouped by status
SELECT 
    status,
    COUNT(*) AS schedule_count,
    SUM(available_seats) AS total_available_seats,
    AVG(available_seats) AS avg_available_seats
FROM Flight_Schedules
WHERE flight_date >= CAST(GETDATE() AS DATE)
GROUP BY status
ORDER BY schedule_count DESC;
 

-- =====================================================================
-- 6) Seat Availability
-- =====================================================================

-- View available seats for a flight
SELECT 
    s.seat_number,
    s.seat_class,
    'Available' AS availability_status,
    (f.base_price * s.price_multiplier) AS seat_price
FROM Seats s
INNER JOIN Flight_Schedules fs ON s.schedule_id = fs.schedule_id
INNER JOIN Flights f ON fs.flight_id = f.flight_id
WHERE fs.schedule_id = 1
AND s.is_available = 1
ORDER BY s.seat_class, s.seat_number;
 

-- Count available seats by class
SELECT 
    s.seat_class,
    COUNT(*) AS total_seats,

    (SELECT COUNT(*)
     FROM Seats s2
     WHERE s2.schedule_id = 1
     AND s2.seat_class = s.seat_class
     AND s2.is_available = 1) AS available_seats,

    (SELECT COUNT(*)
     FROM Seats s3
     WHERE s3.schedule_id = 1
     AND s3.seat_class = s.seat_class
     AND s3.is_available = 0) AS booked_seats

FROM Seats s
WHERE s.schedule_id = 1
GROUP BY s.seat_class
ORDER BY s.seat_class;
 

-- View seat availability across all flights - COMPLEX JOIN with Aircraft info
SELECT 
    f.flight_number,
    a.aircraft_type,
    fs.flight_date,
    s.seat_class,
    COUNT(*) AS total_seats,
    SUM(CASE WHEN s.is_available = 1 THEN 1 ELSE 0 END) AS available,
    SUM(CASE WHEN s.is_available = 0 THEN 1 ELSE 0 END) AS booked
FROM Flights f
INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
INNER JOIN Flight_Schedules fs ON f.flight_id = fs.flight_id
INNER JOIN Seats s ON fs.schedule_id = s.schedule_id
WHERE fs.flight_date >= CAST(GETDATE() AS DATE)
GROUP BY f.flight_number, a.aircraft_type, fs.flight_date, s.seat_class
ORDER BY fs.flight_date, f.flight_number, s.seat_class;
 

-- =====================================================================
-- 7) Booking Management
-- =====================================================================

-- View user booking history with aircraft info
SELECT 
    b.booking_reference,
    b.booking_date,
    f.flight_number,
    f.departure_city,
    f.destination_city,
    a.aircraft_type,
    fs.flight_date,
    fs.departure_time,
    b.total_passengers,
    b.total_amount,
    b.booking_status
FROM Bookings b
INNER JOIN Users u ON b.user_id = u.user_id
INNER JOIN Flight_Schedules fs ON b.schedule_id = fs.schedule_id
INNER JOIN Flights f ON fs.flight_id = f.flight_id
INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
WHERE u.user_id = 1
ORDER BY b.booking_date DESC;
 

-- Get booking statistics
SELECT 
    booking_status,
    COUNT(*) AS total_bookings,
    SUM(total_passengers) AS total_passengers,
    SUM(total_amount) AS total_revenue,
    AVG(total_amount) AS avg_booking_value
FROM Bookings
GROUP BY booking_status
ORDER BY total_bookings DESC;
 

-- Top 5 most booked flights with aircraft info
SELECT TOP 5
    f.flight_number,
    f.departure_city + ' → ' + f.destination_city AS route,
    a.aircraft_type,
    COUNT(b.booking_id) AS total_bookings,
    SUM(b.total_passengers) AS total_passengers
FROM Flights f
INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
INNER JOIN Flight_Schedules fs ON f.flight_id = fs.flight_id
INNER JOIN Bookings b ON fs.schedule_id = b.schedule_id
GROUP BY f.flight_number, f.departure_city, f.destination_city, a.aircraft_type
ORDER BY total_bookings DESC;
 

-- =====================================================================
-- 8) Ticket Generation
-- =====================================================================

-- View all tickets for a booking
SELECT 
    t.ticket_number,
    t.passenger_name,
    s.seat_number,
    s.seat_class,
    t.ticket_status
FROM Tickets t
LEFT JOIN Seats s ON t.seat_id = s.seat_id
WHERE t.booking_id = 1
ORDER BY t.ticket_id;
 

-- Count tickets by status
SELECT 
    ticket_status,
    COUNT(*) AS ticket_count
FROM Tickets
GROUP BY ticket_status
ORDER BY ticket_count DESC;
 

-- =====================================================================
-- 9) Booking Cancellation
-- =====================================================================

-- Cancel a booking and update related records
UPDATE Bookings
SET booking_status = 'cancelled'
WHERE booking_reference = 'SKR7H9K2';

UPDATE Tickets
SET ticket_status = 'cancelled'
WHERE booking_id = (SELECT booking_id FROM Bookings WHERE booking_reference = 'SKR7H9K2');

-- Update seats after cancellation
UPDATE Seats
SET is_available = 1
WHERE seat_id IN (
    SELECT seat_id 
    FROM Tickets 
    WHERE booking_id = (SELECT booking_id FROM Bookings WHERE booking_reference = 'SKR7H9K2')
      AND seat_id IS NOT NULL
);

-- Process refund for cancelled booking
UPDATE Payments
SET payment_status = 'refunded'
WHERE booking_id = (SELECT booking_id FROM Bookings WHERE booking_reference = 'SKR7H9K2');
 

-- =====================================================================
-- ADDITIONAL USEFUL QUERIES WITH NEW AIRCRAFT TABLE
-- =====================================================================

-- Query: Find which aircraft type is most profitable
SELECT 
    a.aircraft_type,
    a.manufacturer,
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    SUM(b.total_amount) AS total_revenue,
    AVG(b.total_amount) AS avg_revenue_per_booking
FROM Aircraft a
INNER JOIN Flights f ON a.aircraft_id = f.aircraft_id
INNER JOIN Flight_Schedules fs ON f.flight_id = fs.flight_id
INNER JOIN Bookings b ON fs.schedule_id = b.schedule_id
WHERE b.booking_status IN ('confirmed', 'completed')
GROUP BY a.aircraft_type, a.manufacturer
ORDER BY total_revenue DESC;
 

-- Query: Check aircraft range vs flight distance feasibility
-- (This is a simplified example - in reality you'd calculate actual distance)
SELECT 
    f.flight_number,
    f.departure_city,
    f.destination_city,
    a.aircraft_type,
    a.max_range_km,
    CASE 
        WHEN a.max_range_km > 10000 THEN 'Long-haul capable'
        WHEN a.max_range_km > 5000 THEN 'Medium-haul'
        ELSE 'Short-haul only'
    END AS flight_capability
FROM Flights f
INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
ORDER BY a.max_range_km DESC;
 

-- Query: Seat occupancy rate by aircraft type
SELECT 
    a.aircraft_type,
    a.total_seats AS aircraft_capacity,
    COUNT(DISTINCT fs.schedule_id) AS total_flights_scheduled,
    SUM(a.total_seats - fs.available_seats) AS total_seats_sold,
    SUM(a.total_seats) AS total_seats_offered,
    CAST(SUM(a.total_seats - fs.available_seats) AS FLOAT) / 
        NULLIF(SUM(a.total_seats), 0) * 100 AS occupancy_rate_percentage
FROM Aircraft a
INNER JOIN Flights f ON a.aircraft_id = f.aircraft_id
INNER JOIN Flight_Schedules fs ON f.flight_id = fs.flight_id
WHERE fs.status != 'cancelled'
GROUP BY a.aircraft_type, a.total_seats
ORDER BY occupancy_rate_percentage DESC;

GO
