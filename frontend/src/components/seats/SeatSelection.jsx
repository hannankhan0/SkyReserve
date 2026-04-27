import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const classLabel = (value) => String(value || '').replace('_', ' ');
const formatPKR = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK')}`;

const normalizeSeatStatus = (seat) => {
  if (seat.seat_status) return String(seat.seat_status).toLowerCase();
  const available = seat.is_available === true || seat.is_available === 1;
  return available ? 'available' : 'booked';
};

const isAvailable = (seat) => normalizeSeatStatus(seat) === 'available';

const cabinOrder = ['first_class', 'business', 'economy', 'other'];

const SeatSelection = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reserving, setReserving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const scheduleRes = await api.get(`/schedules/${scheduleId}`);
      const scheduleData = scheduleRes.data?.data || scheduleRes.data || null;
      setSchedule(scheduleData);

      const seatsRes = await api.get(`/seats/schedule/${scheduleId}/map`);
      const seatsData = Array.isArray(seatsRes.data?.data) ? seatsRes.data.data : [];
      setSeats(seatsData);
      setSelected([]);
    } catch (err) {
      const backendMessage = err.response?.data?.message || err.response?.data?.error;
      setError(backendMessage || 'Failed to load seat map. Please check backend and database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [scheduleId]);

  const selectedSeats = useMemo(
    () => seats.filter((s) => selected.includes(s.seat_id)),
    [seats, selected]
  );

  const total = useMemo(
    () => selectedSeats.reduce((sum, s) => sum + Number(s.seat_price || 0), 0),
    [selectedSeats]
  );

  const toggleSeat = (seat) => {
    if (!isAvailable(seat)) return;
    setSelected((prev) => (
      prev.includes(seat.seat_id)
        ? prev.filter((id) => id !== seat.seat_id)
        : [...prev, seat.seat_id]
    ));
  };

  const proceed = async () => {
    if (!selected.length) {
      setError('Please select at least one available seat.');
      return;
    }
    setReserving(true);
    setError('');
    try {
      await api.post('/seats/reserve', { seat_ids: selected });
      navigate('/bookings/create', {
        state: {
          schedule,
          selectedSeats,
          totalAmount: total,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Seat reserve failed. Refresh and try again.');
      await load();
    } finally {
      setReserving(false);
    }
  };

  const grouped = useMemo(() => {
    const result = seats.reduce((acc, seat) => {
      const key = seat.seat_class || 'other';
      acc[key] = acc[key] || [];
      acc[key].push(seat);
      return acc;
    }, {});

    return Object.entries(result).sort(([a], [b]) => {
      const ai = cabinOrder.indexOf(a) === -1 ? 99 : cabinOrder.indexOf(a);
      const bi = cabinOrder.indexOf(b) === -1 ? 99 : cabinOrder.indexOf(b);
      return ai - bi;
    });
  }, [seats]);

  const availableCount = seats.filter(isAvailable).length;
  const bookedCount = seats.length - availableCount;

  if (loading) return <div className="loading">Loading seat map...</div>;

  return (
    <div className="page-container seat-page">
      <div className="page-header">
        <div>
          <h1>Select Seats</h1>
          <p>{schedule?.flight_number || 'Flight'} — {schedule?.departure_city || 'From'} to {schedule?.destination_city || 'To'}</p>
        </div>
        <button className="btn-secondary" onClick={load}>Refresh</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card summary-card flight-seat-summary">
        <span><strong>Date:</strong> {String(schedule?.flight_date || '').split('T')[0] || 'N/A'}</span>
        <span><strong>Gate:</strong> {schedule?.gate_number || 'N/A'}</span>
        <span><strong>Base price:</strong> {formatPKR(schedule?.base_price)}</span>
        <span><strong>Available:</strong> {availableCount}</span>
        <span><strong>Reserved/Booked:</strong> {bookedCount}</span>
      </div>

      <div className="seat-legend">
        <span><i className="seat available"></i> Available</span>
        <span><i className="seat selected"></i> Selected</span>
        <span><i className="seat held"></i> Reserved/Hold</span>
        <span><i className="seat booked"></i> Booked</span>
      </div>

      <div className="airplane-card">
        <div className="airplane-nose">✈ Cockpit</div>
        <div className="airplane-body">
          {grouped.length === 0 ? (
            <div className="empty-state">No seats generated for this schedule yet.</div>
          ) : (
            grouped.map(([klass, klassSeats]) => (
              <div key={klass} className="cabin-section">
                <div className="cabin-title">{classLabel(klass)} Class</div>
                <div className="airplane-seat-grid">
                  {klassSeats.map((seat, index) => {
                    const status = normalizeSeatStatus(seat);
                    const selectedClass = selected.includes(seat.seat_id) ? 'selected' : '';
                    const aisleAfter = (index + 1) % 3 === 0 ? ' aisle-after' : '';
                    return (
                      <button
                        type="button"
                        key={seat.seat_id}
                        className={`seat airplane-seat ${status} ${selectedClass}${aisleAfter}`}
                        onClick={() => toggleSeat(seat)}
                        disabled={!isAvailable(seat)}
                        title={`${seat.seat_number} - ${classLabel(seat.seat_class)} - ${status} - ${formatPKR(seat.seat_price)}`}
                      >
                        <span>{seat.seat_number}</span>
                        <small>{formatPKR(seat.seat_price)}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="airplane-tail">Tail</div>
      </div>

      <div className="card summary-card sticky-booking-summary">
        <h3>Booking Summary</h3>
        <p><strong>Selected:</strong> {selectedSeats.map(s => `${s.seat_number} (${classLabel(s.seat_class)})`).join(', ') || 'None'}</p>
        <p><strong>Total:</strong> {formatPKR(total)}</p>
        <button className="btn-primary" disabled={reserving || !selected.length} onClick={proceed}>
          {reserving ? 'Reserving...' : 'Reserve Selected Seats & Proceed to Booking'}
        </button>
      </div>
    </div>
  );
};

export default SeatSelection;
