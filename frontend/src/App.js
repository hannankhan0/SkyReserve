import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Sadeem: Auth + Flights
import RegisterForm from './components/auth/RegisterForm';
import LoginForm from './components/auth/LoginForm';
import AdminLogin from './components/auth/AdminLogin';
import UserProfile from './components/auth/UserProfile';
import FlightSearch from './components/flights/FlightSearch';
import AdminFlightList from './components/flights/admin/AdminFlightList';

// Ahad: Aircraft + Schedules + Seats
import AdminAircraft from './components/aircraft/AdminAircraft';
import AdminSchedules from './components/schedules/AdminSchedules';
import SeatSelection from './components/seats/SeatSelection';

// Hannan: Bookings + Payments + Tickets
import CreateBooking from './components/bookings/CreateBooking';
import MyBookings from './components/bookings/MyBookings';
import AdminBookings from './components/bookings/AdminBookings';
import PaymentPage from './components/payments/PaymentPage';
import MyPayments from './components/payments/MyPayments';
import MyTickets from './components/tickets/MyTickets';
import AdminTicketCheckIn from './components/tickets/AdminTicketCheckIn';

import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

const Navbar = () => {
  const { user, isAdmin, logout } = useApp();
  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">✈ SkyReserve</div>
      <div className="nav-links">
        {!isAdmin && <Link to="/flights">Search Flights</Link>}
        {!isAdmin && <Link to="/bookings/my">My Bookings</Link>}
        {!isAdmin && <Link to="/payments/my">My Payments</Link>}
        {!isAdmin && <Link to="/tickets/my">My Tickets</Link>}
        {isAdmin && <Link to="/admin/aircraft">Aircraft</Link>}
        {isAdmin && <Link to="/admin/flights">Flights</Link>}
        {isAdmin && <Link to="/admin/schedules">Schedules</Link>}
        {isAdmin && <Link to="/admin/bookings">Bookings</Link>}
        {isAdmin && <Link to="/admin/tools">Tools</Link>}
        <Link to="/profile">Profile</Link>
        {isAdmin && <span className="admin-tag">ADMIN</span>}
        <button className="nav-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

const AppRoutes = () => {
  const { user, isAdmin } = useApp();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route path="/flights" element={<ProtectedRoute><FlightSearch /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/seats/:scheduleId" element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} />
        <Route path="/bookings/create" element={<ProtectedRoute><CreateBooking /></ProtectedRoute>} />
        <Route path="/bookings/my" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/payments/:bookingId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/payments/my" element={<ProtectedRoute><MyPayments /></ProtectedRoute>} />
        <Route path="/tickets/my" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />

        <Route path="/admin/flights" element={<ProtectedRoute adminOnly><AdminFlightList /></ProtectedRoute>} />
        <Route path="/admin/aircraft" element={<ProtectedRoute adminOnly><AdminAircraft /></ProtectedRoute>} />
        <Route path="/admin/schedules" element={<ProtectedRoute adminOnly><AdminSchedules /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/tools" element={<ProtectedRoute adminOnly><AdminTicketCheckIn /></ProtectedRoute>} />

        <Route path="/" element={user ? (isAdmin ? <Navigate to="/admin/aircraft" replace /> : <Navigate to="/flights" replace />) : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;
