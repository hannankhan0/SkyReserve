import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import api from './services/api';

import RegisterForm from './components/auth/RegisterForm';
import LoginForm from './components/auth/LoginForm';
import AdminLogin from './components/auth/AdminLogin';
import UserProfile from './components/auth/UserProfile';
import UserDashboard from './components/dashboard/UserDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import FlightSearch from './components/flights/FlightSearch';
import FlightDetail from './components/flights/FlightDetail';
import AdminFlightList from './components/flights/admin/AdminFlightList';

import AdminAircraft from './components/aircraft/AdminAircraft';
import AdminSchedules from './components/schedules/AdminSchedules';
import SeatSelection from './components/seats/SeatSelection';

import CreateBooking from './components/bookings/CreateBooking';
import BookingConfirmation from './components/bookings/BookingConfirmation';
import MyBookings from './components/bookings/MyBookings';
import AdminBookings from './components/bookings/AdminBookings';
import PaymentPage from './components/payments/PaymentPage';
import MyPayments from './components/payments/MyPayments';
import MyTickets from './components/tickets/MyTickets';
import AdminTicketCheckIn from './components/tickets/AdminTicketCheckIn';

import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

const initialsFor = (user) => {
  const first = user?.first_name || user?.name || user?.email || 'U';
  const last = user?.last_name || '';
  return `${String(first).charAt(0)}${String(last).charAt(0)}`.toUpperCase();
};

const ToastViewport = () => {
  const { toasts, toast } = useApp();
  return (
    <div className="toast-viewport">
      {toasts.map((item) => (
        <div className={`toast toast-${item.type}`} key={item.id}>
          <span>{item.message}</span>
          <button onClick={() => toast.dismiss(item.id)} aria-label="Dismiss notification">x</button>
        </div>
      ))}
    </div>
  );
};

const Navbar = () => {
  const { user, isAdmin, logout } = useApp();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);
  const [seenTicketCount, setSeenTicketCount] = useState(() => Number(localStorage.getItem('seenTicketCount') || 0));

  useEffect(() => {
    if (!user || isAdmin) return undefined;
    let active = true;
    api.get('/tickets/my-tickets')
      .then((res) => { if (active) setTicketCount((res.data.data || []).length); })
      .catch(() => { if (active) setTicketCount(0); });
    return () => { active = false; };
  }, [user, isAdmin]);

  useEffect(() => {
    if (location.pathname === '/tickets/my' && ticketCount > 0) {
      setSeenTicketCount(ticketCount);
      localStorage.setItem('seenTicketCount', String(ticketCount));
    }
  }, [location.pathname, ticketCount]);

  if (!user) return null;
  const closeMenu = () => setOpen(false);
  const newTicketCount = Math.max(0, ticketCount - seenTicketCount);

  return (
    <nav className="navbar">
      <div className="nav-topline">
        <div className="nav-brand">SkyReserve</div>
        <button className="mobile-menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation"><span></span><span></span><span></span></button>
      </div>
      <div className={`nav-links ${open ? 'open' : ''}`}>
        {!isAdmin && <NavLink onClick={closeMenu} to="/home">Home</NavLink>}
        {!isAdmin && <NavLink onClick={closeMenu} to="/flights">Search Flights</NavLink>}
        {!isAdmin && <NavLink onClick={closeMenu} to="/bookings/my">My Bookings</NavLink>}
        {!isAdmin && <NavLink onClick={closeMenu} to="/payments/my">My Payments</NavLink>}
        {!isAdmin && <NavLink onClick={closeMenu} to="/tickets/my" className="nav-ticket-link">My Tickets{newTicketCount > 0 && <span className="nav-badge">{newTicketCount}</span>}</NavLink>}
        {isAdmin && <NavLink onClick={closeMenu} to="/admin">Dashboard</NavLink>}
        {isAdmin && <NavLink onClick={closeMenu} to="/admin/aircraft">Aircraft</NavLink>}
        {isAdmin && <NavLink onClick={closeMenu} to="/admin/flights">Flights</NavLink>}
        {isAdmin && <NavLink onClick={closeMenu} to="/admin/schedules">Schedules</NavLink>}
        {isAdmin && <NavLink onClick={closeMenu} to="/admin/bookings">Bookings</NavLink>}
        {isAdmin && <NavLink onClick={closeMenu} to="/admin/tools">Tools</NavLink>}
        <NavLink onClick={closeMenu} to="/profile" className="profile-link"><span className="user-avatar">{initialsFor(user)}</span><span>Profile</span></NavLink>
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
      <ToastViewport />
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/home" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/flights" element={<ProtectedRoute><FlightSearch /></ProtectedRoute>} />
        <Route path="/flights/:flightId" element={<ProtectedRoute><FlightDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/seats/:scheduleId" element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} />
        <Route path="/bookings/create" element={<ProtectedRoute><CreateBooking /></ProtectedRoute>} />
        <Route path="/bookings/confirmation" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
        <Route path="/bookings/my" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/payments/:bookingId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/payments/my" element={<ProtectedRoute><MyPayments /></ProtectedRoute>} />
        <Route path="/tickets/my" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
        <Route path="/admin/flights" element={<ProtectedRoute adminOnly><AdminFlightList /></ProtectedRoute>} />
        <Route path="/admin/aircraft" element={<ProtectedRoute adminOnly><AdminAircraft /></ProtectedRoute>} />
        <Route path="/admin/schedules" element={<ProtectedRoute adminOnly><AdminSchedules /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/tools" element={<ProtectedRoute adminOnly><AdminTicketCheckIn /></ProtectedRoute>} />
        <Route path="/" element={user ? (isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/home" replace />) : <Navigate to="/login" replace />} />
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
