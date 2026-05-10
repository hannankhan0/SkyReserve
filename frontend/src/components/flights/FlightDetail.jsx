import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const FlightDetail = () => {
  const { flightId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useApp();
  const [flight, setFlight] = useState(state?.flight || null);
  const [routeSchedules, setRouteSchedules] = useState([]);
  const passengerCount = state?.passengerCount || 1;

  useEffect(() => {
    const load = async () => {
      try {
        const detail = await api.get(`/flights/${flightId}`);
        const detailFlight = detail.data.data;
        setFlight((prev) => ({ ...detailFlight, ...prev }));
        const schedules = await api.get('/flights/search', { params: { departure_city: detailFlight.departure_city, destination_city: detailFlight.destination_city, sort_by: 'time_asc' } });
        setRouteSchedules(schedules.data.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load flight details.');
      }
    };
    load();
  }, [flightId, toast]);

  const availableDates = useMemo(() => [...new Set(routeSchedules.map((item) => String(item.flight_date || '').split('T')[0]).filter(Boolean))], [routeSchedules]);
  const selectedScheduleId = flight?.schedule_id || routeSchedules[0]?.schedule_id;

  if (!flight) return <div className="loading">Loading flight details...</div>;

  return (
    <div className="page-container">
      <div className="page-header"><div><h1>{flight.flight_number} Details</h1><p>{flight.departure_city} to {flight.destination_city}</p></div><button className="btn-primary compact" onClick={() => navigate(`/seats/${selectedScheduleId}`, { state: { passengerCount } })}>Select {passengerCount} Seat{passengerCount === 1 ? '' : 's'}</button></div>
      <div className="dashboard-grid">
        <div className="card flight-detail-hero">
          <span className="muted-small">{flight.airline_name}</span>
          <h2>{flight.departure_city} to {flight.destination_city}</h2>
          <p><strong>Date:</strong> {String(flight.flight_date || '').split('T')[0] || 'Choose from below'} | <strong>Gate:</strong> {flight.gate_number || 'TBA'} | <strong>Seats:</strong> {flight.available_seats || 'N/A'}</p>
          <p><strong>Trip:</strong> {state?.tripType === 'round_trip' ? `Round-trip, return ${state?.returnDate || 'TBD'}` : 'One-way'} | <strong>Passengers:</strong> {passengerCount}</p>
        </div>
        <div className="card">
          <h3>Aircraft Specs</h3>
          <p><strong>{flight.aircraft_type}</strong> {flight.model || ''}</p>
          <p>Total seats: {flight.total_seats || 'N/A'} | Economy {flight.economy_seats || 0} | Business {flight.business_seats || 0} | First {flight.first_class_seats || 0}</p>
          <p>Range: {flight.max_range_km || 'N/A'} km | Cruise: {flight.cruise_speed_kmh || 'N/A'} km/h</p>
        </div>
      </div>
      <div className="card">
        <h3>Available Dates for This Route</h3>
        <div className="date-chip-row">{availableDates.map((date) => <span key={date}>{date}</span>)}{!availableDates.length && <span>No alternate dates found.</span>}</div>
      </div>
      <div className="card">
        <h3>Refund Policy</h3>
        <p className="muted-small">Refunds are available before cancellation cutoff for pending or confirmed bookings. Cancelled tickets release seats back to inventory, and eligible payments are marked refunded by the admin tools.</p>
      </div>
    </div>
  );
};

export default FlightDetail;
