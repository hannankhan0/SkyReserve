import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true); setError('');
    try { const res = await api.get('/bookings/my-bookings'); setBookings(res.data.data || []); }
    catch (err) { setError(err.response?.data?.message || 'Failed to load bookings.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking? Seats will be released and payment may be refunded.')) return;
    try { await api.post(`/bookings/${id}/cancel`); setMessage('Booking cancelled successfully.'); load(); }
    catch (err) { setError(err.response?.data?.message || 'Cancellation failed.'); }
  };

  return <div className="page-container"><div className="page-header"><div><h1>My Bookings</h1><p>Booking history and cancellation demo.</p></div><button className="btn-secondary" onClick={load}>Refresh</button></div>{error && <div className="alert alert-error">{error}</div>}{message && <div className="alert alert-success">{message}</div>}{loading ? <div className="loading">Loading bookings...</div> : <div className="cards-list">{bookings.map(b => <div className="card booking-card" key={b.booking_id}><div className="card-title-row"><h3>{b.booking_reference}</h3><span className={`badge ${b.booking_status}`}>{b.booking_status}</span></div><p><strong>{b.flight_number}</strong> — {b.departure_city} → {b.destination_city}</p><p>Date: {String(b.flight_date || '').split('T')[0]} | Passengers: {b.total_passengers} | Total: Rs {Number(b.total_amount || 0).toLocaleString()}</p><div className="card-actions"><button className="btn-secondary" onClick={()=>navigate(`/payments/${b.booking_id}`, { state: { booking: b, totalAmount: b.total_amount } })}>Pay</button><button className="btn-delete" onClick={()=>cancel(b.booking_id)} disabled={b.booking_status === 'cancelled'}>Cancel</button><Link className="btn-link" to="/tickets/my">View Tickets</Link></div></div>)}{!bookings.length && <div className="empty-state">No bookings yet.</div>}</div>}</div>;
};
export default MyBookings;
