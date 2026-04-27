import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CreateBooking = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const schedule = state?.schedule;
  const selectedSeats = state?.selectedSeats || [];
  const [passengerNames, setPassengerNames] = useState(selectedSeats.map(() => ''));
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const estimatedTotal = useMemo(() => Number(state?.totalAmount || 0), [state]);

  if (!schedule || selectedSeats.length === 0) {
    return <div className="page-container"><div className="alert alert-error">No selected schedule/seats found. Go back to Flight Search and select seats first.</div></div>;
  }

  const updatePassenger = (index, value) => setPassengerNames((prev) => prev.map((v, i) => i === index ? value : v));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const passengers = selectedSeats.map((seat, i) => ({ seat_id: seat.seat_id, passenger_name: passengerNames[i]?.trim() }));
    if (passengers.some(p => !p.passenger_name || p.passenger_name.length < 2)) {
      setError('Enter passenger name for every selected seat.'); setLoading(false); return;
    }
    try {
      const res = await api.post('/bookings', { schedule_id: schedule.schedule_id, passengers, special_requests: specialRequests });
      const result = res.data.data || {};
      const booking = result.booking || result;
      navigate(`/payments/${booking.booking_id}`, { state: { booking, totalAmount: result.total_amount || estimatedTotal } });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Check seat availability and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header"><div><h1>Create Booking</h1><p>Hannan module: create booking from Ahad's selected seats.</p></div></div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card summary-card"><h3>{schedule.flight_number} — {schedule.departure_city} to {schedule.destination_city}</h3><p><strong>Schedule ID:</strong> {schedule.schedule_id} | <strong>Date:</strong> {String(schedule.flight_date || '').split('T')[0]}</p><p><strong>Seats:</strong> {selectedSeats.map(s => s.seat_number).join(', ')}</p><p><strong>Estimated Total:</strong> Rs {estimatedTotal.toLocaleString()}</p></div>
      <div className="card form-card wide-form">
        <form onSubmit={submit}>
          {selectedSeats.map((seat, index) => <div className="form-group" key={seat.seat_id}><label>Passenger for Seat {seat.seat_number}</label><input value={passengerNames[index]} onChange={(e) => updatePassenger(index, e.target.value)} placeholder="Passenger full name" required /></div>)}
          <div className="form-group"><label>Special Requests</label><textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder="Optional" rows="3" /></div>
          <button className="btn-primary" disabled={loading}>{loading ? 'Creating Booking...' : 'Create Booking & Continue to Payment'}</button>
        </form>
      </div>
    </div>
  );
};
export default CreateBooking;
