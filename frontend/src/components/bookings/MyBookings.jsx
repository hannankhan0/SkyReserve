import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const formatFlightCountdown = (booking) => {
  if (!['confirmed', 'completed'].includes(booking.booking_status)) return null;
  const datePart = String(booking.flight_date || '').split('T')[0];
  if (!datePart) return null;
  const departure = new Date(`${datePart}T${String(booking.departure_time || '00:00').slice(0, 5)}`);
  if (Number.isNaN(departure.getTime())) return null;
  const diffMs = departure.getTime() - Date.now();
  if (diffMs <= 0) return 'Flight time passed';
  const days = Math.floor(diffMs / 86400000);
  if (days >= 1) return `Departs in ${days} day${days === 1 ? '' : 's'}`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours >= 1) return `Departs in ${hours} hour${hours === 1 ? '' : 's'}`;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  return `Departs in ${minutes} minute${minutes === 1 ? '' : 's'}`;
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const { toast } = useApp();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking? Seats will be released and payment may be refunded.')) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled successfully.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header"><div><h1>My Bookings</h1><p>Booking history and cancellation demo.</p></div><button className="btn-secondary" onClick={load}>Refresh</button></div>
      {loading ? <div className="loading">Loading bookings...</div> : (
        <div className="cards-list">
          {bookings.map((b) => {
            const countdown = formatFlightCountdown(b);
            const confirmed = ['confirmed', 'completed'].includes(b.booking_status);
            const cancelled = b.booking_status === 'cancelled';
            return (
              <div className={`card booking-card booking-status-card ${b.booking_status}`} key={b.booking_id}>
                <div className="card-title-row"><h3>{b.booking_reference}</h3><span className={`badge ${b.booking_status}`}>{b.booking_status}</span></div>
                <p className={cancelled ? 'cancelled-route' : ''}><strong>{b.flight_number}</strong> - {b.departure_city} to {b.destination_city}</p>
                <p>Date: {String(b.flight_date || '').split('T')[0]} | Passengers: {b.total_passengers} | Total: Rs {Number(b.total_amount || 0).toLocaleString()}</p>
                {countdown && <div className="booking-countdown">{countdown}</div>}
                <div className="card-actions">
                  {!confirmed && !cancelled && <button className="btn-secondary" onClick={() => navigate(`/payments/${b.booking_id}`, { state: { booking: b, totalAmount: b.total_amount } })}>Pay</button>}
                  <button className="btn-delete" onClick={() => cancel(b.booking_id)} disabled={cancelled}>Cancel</button>
                  <Link className="btn-link" to="/tickets/my">View Tickets</Link>
                </div>
              </div>
            );
          })}
          {!bookings.length && <div className="illustrated-empty-state"><div className="empty-icon">BK</div><h3>No bookings yet</h3><p>Find a route, pick your seats, and your bookings will appear here.</p><Link className="btn-primary compact" to="/flights">Search Flights</Link></div>}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
