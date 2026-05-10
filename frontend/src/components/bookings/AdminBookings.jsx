import React, { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const formatPKR = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK')}`;

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const { toast } = useApp();
  const [stats, setStats] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [b, s, sc] = await Promise.all([api.get('/bookings'), api.get('/bookings/stats'), api.get('/schedules')]);
      setBookings(b.data.data || []);
      setStats(s.data.data || []);
      setSchedules(sc.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admin bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statCards = useMemo(() => {
    const rows = Array.isArray(stats) ? stats : [];
    const totalBookings = rows.reduce((sum, row) => sum + Number(row.total_bookings || 0), 0);
    const passengers = rows.reduce((sum, row) => sum + Number(row.total_passengers || 0), 0);
    const revenue = rows.reduce((sum, row) => sum + Number(row.total_revenue || 0), 0);
    const confirmed = rows.find((row) => row.booking_status === 'confirmed')?.total_bookings || 0;
    return [
      { icon: 'BK', label: 'Total bookings', value: totalBookings.toLocaleString(), trend: '+ live' },
      { icon: 'RS', label: 'Confirmed revenue', value: formatPKR(revenue), trend: 'up' },
      { icon: 'PX', label: 'Passengers', value: passengers.toLocaleString(), trend: 'up' },
      { icon: 'OK', label: 'Confirmed', value: Number(confirmed).toLocaleString(), trend: 'ready' },
    ];
  }, [stats]);

  const bookingsOverTime = useMemo(() => {
    const grouped = bookings.reduce((acc, booking) => {
      const date = String(booking.booking_date || '').split('T')[0] || 'Unknown';
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  }, [bookings]);

  const occupancy = useMemo(() => schedules.slice(0, 8).map((schedule) => {
    const total = Number(schedule.total_seats || 0);
    const sold = Math.max(0, total - Number(schedule.available_seats || 0));
    return { ...schedule, sold, occupancyRate: total ? Math.round((sold / total) * 100) : 0 };
  }), [schedules]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Admin Bookings</h1>
          <p>Hannan admin module: all bookings and stats.</p>
        </div>
        <button className="btn-secondary" onClick={load}>Refresh</button>
      </div>
      {stats && (
        <div className="stat-card-grid">
          {statCards.map((card) => (
            <div className="admin-stat-card" key={card.label}>
              <span className="stat-icon">{card.icon}</span>
              <strong>{card.value}</strong>
              <span>{card.label}</span>
              <em>↑ {card.trend}</em>
            </div>
          ))}
        </div>
      )}
      <div className="dashboard-grid">
        <div className="card chart-panel">
          <h3>Bookings Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={bookingsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1a3a6b" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Schedule Occupancy</h3>
          {occupancy.map((item) => <div className="occupancy-row" key={item.schedule_id}><span>{item.flight_number}</span><div><i style={{ width: `${item.occupancyRate}%` }}></i></div><strong>{item.occupancyRate}%</strong></div>)}
        </div>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Reference</th><th>User</th><th>Flight</th><th>Route</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>
              {bookings.map((b) => {
                const userName = [b.first_name, b.last_name].filter(Boolean).join(' ') || 'Passenger';
                return (
                  <tr key={b.booking_id}>
                    <td>{b.booking_id}</td>
                    <td>{b.booking_reference}</td>
                    <td><strong>{userName}</strong><br /><span className="muted-small">{b.email}</span></td>
                    <td>{b.flight_number}</td>
                    <td>{b.departure_city} to {b.destination_city}</td>
                    <td><span className={`badge ${b.booking_status}`}>{b.booking_status}</span></td>
                    <td>{formatPKR(b.total_amount)}</td>
                  </tr>
                );
              })}
              {!bookings.length && <tr><td colSpan="7">No bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
