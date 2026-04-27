import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [b, s] = await Promise.all([api.get('/bookings'), api.get('/bookings/stats')]);
      setBookings(b.data.data || []);
      setStats(s.data.data || []);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load admin bookings.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return <div className="page-container"><div className="page-header"><div><h1>Admin Bookings</h1><p>Hannan admin module: all bookings and stats.</p></div><button className="btn-secondary" onClick={load}>Refresh</button></div>{error && <div className="alert alert-error">{error}</div>}{stats && <div className="card"><h3>Booking Stats</h3><pre className="json-box">{JSON.stringify(stats, null, 2)}</pre></div>}{loading ? <div className="loading">Loading...</div> : <div className="table-card"><table className="data-table"><thead><tr><th>ID</th><th>Reference</th><th>User</th><th>Flight</th><th>Route</th><th>Status</th><th>Total</th></tr></thead><tbody>{bookings.map(b => <tr key={b.booking_id}><td>{b.booking_id}</td><td>{b.booking_reference}</td><td>{b.user_id}</td><td>{b.flight_number}</td><td>{b.departure_city} → {b.destination_city}</td><td><span className="badge">{b.booking_status}</span></td><td>Rs {Number(b.total_amount || 0).toLocaleString()}</td></tr>)}{!bookings.length && <tr><td colSpan="7">No bookings found.</td></tr>}</tbody></table></div>}</div>;
};
export default AdminBookings;
