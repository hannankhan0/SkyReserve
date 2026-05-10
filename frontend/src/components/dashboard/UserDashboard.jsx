import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const today = new Date().toISOString().split('T')[0];

const UserDashboard = () => {
  const { user, toast } = useApp();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [quickSearch, setQuickSearch] = useState({ departure_city: '', destination_city: '', flight_date: today });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/bookings/my-bookings');
        setBookings(res.data.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const upcoming = useMemo(() => bookings.find((booking) => ['confirmed', 'completed'].includes(booking.booking_status) && new Date(String(booking.flight_date || '').split('T')[0]) >= new Date(today)), [bookings]);
  const recent = bookings.slice(0, 3);

  const submit = (e) => {
    e.preventDefault();
    navigate('/flights', { state: { quickSearch } });
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="page-container dashboard-page">
      <div className="page-header"><div><h1>Welcome, {user?.first_name || 'traveller'}</h1><p>Your trips, bookings, and next flight search.</p></div></div>
      <div className="dashboard-grid">
        <div className="card dashboard-hero-card">
          <span className="muted-small">Upcoming trip</span>
          {upcoming ? (
            <>
              <h2>{upcoming.departure_city} to {upcoming.destination_city}</h2>
              <p><strong>{upcoming.flight_number}</strong> | {String(upcoming.flight_date || '').split('T')[0]} | {upcoming.booking_reference}</p>
              <Link className="btn-primary compact" to="/tickets/my">View Boarding Pass</Link>
            </>
          ) : (
            <>
              <h2>No upcoming trip</h2>
              <p>Search flights and reserve seats for your next journey.</p>
              <Link className="btn-primary compact" to="/flights">Search Flights</Link>
            </>
          )}
        </div>
        <div className="card quick-search-card">
          <h3>Quick Search</h3>
          <form onSubmit={submit}>
            <div className="form-group"><label>From</label><input value={quickSearch.departure_city} onChange={(e) => setQuickSearch((prev) => ({ ...prev, departure_city: e.target.value }))} placeholder="Departure city" /></div>
            <div className="form-group"><label>To</label><input value={quickSearch.destination_city} onChange={(e) => setQuickSearch((prev) => ({ ...prev, destination_city: e.target.value }))} placeholder="Destination city" /></div>
            <div className="form-group"><label>Date</label><input type="date" value={quickSearch.flight_date} onChange={(e) => setQuickSearch((prev) => ({ ...prev, flight_date: e.target.value }))} /></div>
            <button className="btn-primary">Search</button>
          </form>
        </div>
      </div>
      <div className="card">
        <div className="card-title-row"><h3>Recent Bookings</h3><Link className="btn-link" to="/bookings/my">View all</Link></div>
        {recent.length ? recent.map((booking) => <div className="recent-row" key={booking.booking_id}><strong>{booking.booking_reference}</strong><span>{booking.flight_number} | {booking.departure_city} to {booking.destination_city}</span><span className={`badge ${booking.booking_status}`}>{booking.booking_status}</span></div>) : <div className="illustrated-empty-state"><div className="empty-icon">BK</div><h3>No bookings yet</h3><p>Your latest bookings will appear here.</p><Link className="btn-primary compact" to="/flights">Search Flights</Link></div>}
      </div>
    </div>
  );
};

export default UserDashboard;
