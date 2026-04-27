import React from 'react';

const formatTime = (datetimeStr) => {
  if (!datetimeStr) return 'N/A';
  const normalized = datetimeStr.toString().replace(' ', 'T');
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return datetimeStr;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const FlightCard = ({ flight, onEdit, onDelete, onAddSchedule, onSelectSeats, isAdmin }) => {
  return (
    <div className="flight-card">
      <div className="flight-card-header">
        <div className="flight-number">{flight.flight_number}</div>
        <div className="flight-airline">{flight.airline_name}</div>
      </div>

      <div className="flight-route">
        <div className="city"><span className="city-name">{flight.departure_city}</span><span className="city-label">Departure</span></div>
        <div className="flight-arrow">✈</div>
        <div className="city city-right"><span className="city-name">{flight.destination_city}</span><span className="city-label">Destination</span></div>
      </div>

      <div className="flight-details">
        <div className="detail-item"><span className="detail-label">Aircraft</span><span className="detail-value">{flight.aircraft_type || flight.aircraft_id || 'N/A'}</span></div>
        <div className="detail-item"><span className="detail-label">Base Price</span><span className="detail-value price">Rs {parseFloat(flight.base_price || 0).toLocaleString()}</span></div>
        {flight.total_seats && <div className="detail-item"><span className="detail-label">Seats</span><span className="detail-value">{flight.total_seats}</span></div>}
      </div>

      {flight.flight_date && (
        <div className="flight-schedule-info">
          <div className="schedule-row"><span>📅 {flight.flight_date?.split('T')[0]}</span>{flight.gate_number && <span>🚪 Gate {flight.gate_number}</span>}{flight.available_seats !== undefined && <span>💺 {flight.available_seats} seats left</span>}</div>
          {flight.departure_time && flight.arrival_time && <div className="schedule-row"><span>🛫 {formatTime(flight.departure_time)}</span><span className="time-arrow">→</span><span>🛬 {formatTime(flight.arrival_time)}</span></div>}
        </div>
      )}

      {isAdmin ? (
        <div className="flight-card-actions">
          <button className="btn-schedule" onClick={() => onAddSchedule(flight)}>+ Schedule</button>
          <button className="btn-edit" onClick={() => onEdit(flight)}>Edit</button>
          <button className="btn-delete" onClick={() => onDelete(flight.flight_id)}>Delete</button>
        </div>
      ) : (
        <div className="flight-card-actions">
          {flight.schedule_id ? <button className="btn-primary compact" onClick={() => onSelectSeats?.(flight)}>Select Seats</button> : <span className="muted-small">No schedule available yet.</span>}
        </div>
      )}
    </div>
  );
};

export default FlightCard;
