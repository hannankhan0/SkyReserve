import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const AdminDashboard = () => {
  const { toast } = useApp();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/bookings');
        setBookings(res.data.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load admin dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter((booking) => String(booking.booking_date || '').split('T')[0] === today);
    return {
      bookingsToday: todayBookings.length,
      revenue: bookings.reduce((sum, booking) => ['confirmed', 'completed'].includes(booking.booking_status) ? sum + Number(booking.total_amount || 0) : sum, 0),
      seatsSold: bookings.reduce((sum, booking) => ['confirmed', 'completed'].includes(booking.booking_status) ? sum + Number(booking.total_passengers || 0) : sum, 0),
      pending: bookings.filter((booking) => booking.booking_status === 'pending').length,
    };
  }, [bookings]);

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  return (
    <div className="page-container dashboard-page">
      <div className="page-header"><div><h1>Admin Dashboard</h1><p>Operational snapshot across bookings, revenue, and seats.</p></div></div>
      <div className="stat-card-grid">
        <div className="admin-stat-card"><span className="stat-icon">TD</span><strong>{metrics.bookingsToday}</strong><span>Bookings today</span><em>live</em></div>
        <div className="admin-stat-card"><span className="stat-icon">RS</span><strong>Rs {metrics.revenue.toLocaleString()}</strong><span>Confirmed revenue</span><em>up</em></div>
        <div className="admin-stat-card"><span className="stat-icon">ST</span><strong>{metrics.seatsSold}</strong><span>Seats sold</span><em>sold</em></div>
        <div className="admin-stat-card"><span className="stat-icon">PN</span><strong>{metrics.pending}</strong><span>Pending bookings</span><em>watch</em></div>
      </div>
      <div className="dashboard-grid">
        <div className="card"><h3>Admin Shortcuts</h3><div className="shortcut-grid"><Link className="btn-link" to="/admin/bookings">Bookings</Link><Link className="btn-link" to="/admin/flights">Flights</Link><Link className="btn-link" to="/admin/schedules">Schedules</Link><Link className="btn-link" to="/admin/tools">Tools</Link></div></div>
        <div className="card"><h3>Latest Bookings</h3>{bookings.slice(0, 5).map((booking) => <div className="recent-row" key={booking.booking_id}><strong>{booking.booking_reference}</strong><span>{booking.flight_number}</span><span className={`badge ${booking.booking_status}`}>{booking.booking_status}</span></div>)}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;
