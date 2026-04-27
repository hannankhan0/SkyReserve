import React, { useState } from 'react';
import api from '../../../services/api';

const AddScheduleModal = ({ flight, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    flight_date: '',
    departure_time: '',
    arrival_time: '',
    gate_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Backend expects full datetime strings e.g. "2026-05-01T08:00"
    // date inputs give "2026-05-01", datetime-local gives "2026-05-01T08:00"
    const payload = {
      flight_id: flight.flight_id,
      flight_date: formData.flight_date,
      departure_time: formData.departure_time,
      arrival_time: formData.arrival_time,
      gate_number: formData.gate_number || null,
    };

    try {
      await api.post('/schedules', payload);
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create schedule.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Add Schedule</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="schedule-flight-info">
          <span className="flight-number">{flight.flight_number}</span>
          <span className="schedule-route">
            {flight.departure_city} → {flight.destination_city}
          </span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Flight Date</label>
            <input
              type="date"
              name="flight_date"
              value={formData.flight_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Departure Time</label>
              <input
                type="datetime-local"
                name="departure_time"
                value={formData.departure_time}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Arrival Time</label>
              <input
                type="datetime-local"
                name="arrival_time"
                value={formData.arrival_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Gate Number <span style={{fontWeight:400, textTransform:'none'}}>(optional)</span></label>
            <input
              type="text"
              name="gate_number"
              value={formData.gate_number}
              onChange={handleChange}
              placeholder="e.g. A12"
            />
          </div>

          <p className="schedule-note">
            💡 Make sure departure time is before arrival time, and the date matches your departure date.
          </p>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddScheduleModal;