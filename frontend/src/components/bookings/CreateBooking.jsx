import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const formatHoldTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const CreateBooking = () => {
  const navigate = useNavigate();
  const { toast } = useApp();
  const { state } = useLocation();
  const schedule = state?.schedule;
  const selectedSeats = state?.selectedSeats || [];
  const [passengerNames, setPassengerNames] = useState(selectedSeats.map(() => ''));
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(0);

  const estimatedTotal = useMemo(() => Number(state?.totalAmount || 0), [state]);
  const holdExpiresAt = state?.holdExpiresAt;

  useEffect(() => {
    if (!holdExpiresAt) return undefined;
    const tick = () => setHoldSecondsLeft(Math.max(0, Math.ceil((holdExpiresAt - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [holdExpiresAt]);

  if (!schedule || selectedSeats.length === 0) {
    return <div className="page-container"><div className="illustrated-empty-state"><div className="empty-icon">SE</div><h3>No seats selected</h3><p>Go back to Flight Search and select seats first.</p></div></div>;
  }

  const updatePassenger = (index, value) => setPassengerNames((prev) => prev.map((v, i) => i === index ? value : v));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const passengers = selectedSeats.map((seat, i) => ({ seat_id: seat.seat_id, passenger_name: passengerNames[i]?.trim() }));
    if (passengers.some((p) => !p.passenger_name || p.passenger_name.length < 2)) {
      toast.error('Enter passenger name for every selected seat.');
      setLoading(false);
      return;
    }
    try {
      const res = await api.post('/bookings', { schedule_id: schedule.schedule_id, passengers, special_requests: specialRequests });
      const result = res.data.data || {};
      const booking = result.booking || result;
      navigate(`/payments/${booking.booking_id}`, { state: { booking, totalAmount: result.total_amount || estimatedTotal } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Check seat availability and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header"><div><h1>Create Booking</h1><p>Hannan module: create booking from Ahad's selected seats.</p></div></div>
      {holdSecondsLeft > 0 && <div className="hold-countdown">Your seats are held for {formatHoldTime(holdSecondsLeft)}</div>}
      <div className="card summary-card">
        <h3>{schedule.flight_number} - {schedule.departure_city} to {schedule.destination_city}</h3>
        <p><strong>Schedule ID:</strong> {schedule.schedule_id} | <strong>Date:</strong> {String(schedule.flight_date || '').split('T')[0]}</p>
        <p><strong>Seats:</strong> {selectedSeats.map((s) => s.seat_number).join(', ')}</p>
        <p><strong>Estimated Total:</strong> Rs {estimatedTotal.toLocaleString()}</p>
      </div>
      <div className="card form-card wide-form">
        <form onSubmit={submit}>
          {selectedSeats.map((seat, index) => (
            <div className="form-group" key={seat.seat_id}>
              <label>Passenger for Seat {seat.seat_number}</label>
              <input value={passengerNames[index]} onChange={(e) => updatePassenger(index, e.target.value)} placeholder="Passenger full name" required />
            </div>
          ))}
          <div className="form-group"><label>Special Requests</label><textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder="Optional" rows="3" /></div>
          <button className="btn-primary" disabled={loading}>{loading ? 'Creating Booking...' : 'Create Booking & Continue to Payment'}</button>
        </form>
      </div>
    </div>
  );
};

export default CreateBooking;
