import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import FlightCard from '../FlightCard';
import AddFlightForm from './AddFlightForm';
import FlightStats from './FlightStats';
import AddScheduleModal from './AddScheduleModal';

const AdminFlightList = () => {
  const [flights, setFlights] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [filters, setFilters] = useState({ departure_city: '', destination_city: '', keyword: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editFlight, setEditFlight] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [scheduleFlight, setScheduleFlight] = useState(null);

  const fetchFlights = async () => {
    setLoading(true);
    setError('');
    try {
      const [flightRes, routeRes] = await Promise.allSettled([
        api.get('/flights'),
        api.get('/flights/routes'),
      ]);

      if (flightRes.status === 'fulfilled') {
        setFlights(Array.isArray(flightRes.value.data?.data) ? flightRes.value.data.data : []);
      } else {
        throw flightRes.reason;
      }

      if (routeRes.status === 'fulfilled') {
        setRoutes(Array.isArray(routeRes.value.data?.data) ? routeRes.value.data.data : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load flights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFlights(); }, []);

  const departureCities = useMemo(() => {
    const fromRoutes = routes.map((r) => r.departure_city).filter(Boolean);
    const fromFlights = flights.map((f) => f.departure_city).filter(Boolean);
    return [...new Set([...fromRoutes, ...fromFlights])].sort();
  }, [routes, flights]);

  const destinationCities = useMemo(() => {
    const source = filters.departure_city
      ? [...routes, ...flights].filter((r) => r.departure_city === filters.departure_city)
      : [...routes, ...flights];
    return [...new Set(source.map((r) => r.destination_city).filter(Boolean))].sort();
  }, [routes, flights, filters.departure_city]);

  useEffect(() => {
    if (filters.destination_city && !destinationCities.includes(filters.destination_city)) {
      setFilters((prev) => ({ ...prev, destination_city: '' }));
    }
  }, [destinationCities, filters.destination_city]);

  const filteredFlights = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    return flights.filter((flight) => {
      const matchDeparture = !filters.departure_city || flight.departure_city === filters.departure_city;
      const matchDestination = !filters.destination_city || flight.destination_city === filters.destination_city;
      const matchKeyword = !keyword ||
        String(flight.flight_number || '').toLowerCase().includes(keyword) ||
        String(flight.airline_name || '').toLowerCase().includes(keyword) ||
        String(flight.aircraft_type || '').toLowerCase().includes(keyword);
      return matchDeparture && matchDestination && matchKeyword;
    });
  }, [flights, filters]);

  const handleFilterChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAdd = () => { setEditFlight(null); setShowForm(true); };
  const handleEdit = (flight) => { setEditFlight(flight); setShowForm(true); };
  const handleAddSchedule = (flight) => setScheduleFlight(flight);

  const handleDelete = async (flight_id) => {
    if (!window.confirm('Delete this flight? This cannot be undone.')) return;
    try {
      await api.delete(`/flights/${flight_id}`);
      setDeleteMsg('Flight deleted.');
      fetchFlights();
      setTimeout(() => setDeleteMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditFlight(null);
    fetchFlights();
  };

  const resetFilters = () => setFilters({ departure_city: '', destination_city: '', keyword: '' });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Flight Management</h1>
          <p>Manage flights. Prices are stored and displayed in PKR.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setShowStats(!showStats)}>
            {showStats ? 'Hide Stats' : '📊 View Stats'}
          </button>
          <button className="btn-primary" onClick={handleAdd}>+ Add Flight</button>
        </div>
      </div>

      {showStats && <FlightStats />}
      {error && <div className="alert alert-error">{error}</div>}
      {deleteMsg && <div className="alert alert-success">{deleteMsg}</div>}

      <div className="card admin-filter-card">
        <div className="form-row">
          <div className="form-group">
            <label>From City</label>
            <select name="departure_city" value={filters.departure_city} onChange={handleFilterChange}>
              <option value="">All available departure cities</option>
              {departureCities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>To City</label>
            <select name="destination_city" value={filters.destination_city} onChange={handleFilterChange} disabled={destinationCities.length === 0}>
              <option value="">All available destination cities</option>
              {destinationCities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Search Flight / Airline</label>
            <input name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="PK301, PIA, Boeing..." />
          </div>
        </div>
        <div className="form-actions compact-actions">
          <button type="button" className="btn-secondary" onClick={resetFilters}>Reset Filters</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading flights...</div>
      ) : (
        <>
          <div className="results-count">
            {filteredFlights.length} of {flights.length} Flight{flights.length !== 1 ? 's' : ''}
          </div>
          {filteredFlights.length === 0 ? (
            <div className="empty-state">No flights match the selected filters.</div>
          ) : (
            <div className="flights-grid">
              {filteredFlights.map((flight) => (
                <FlightCard
                  key={flight.flight_id}
                  flight={flight}
                  isAdmin={true}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddSchedule={handleAddSchedule}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <AddFlightForm
          editFlight={editFlight}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditFlight(null); }}
        />
      )}

      {scheduleFlight && (
        <AddScheduleModal
          flight={scheduleFlight}
          onSuccess={() => {
            setScheduleFlight(null);
            setDeleteMsg('Schedule created successfully!');
            setTimeout(() => setDeleteMsg(''), 3000);
          }}
          onCancel={() => setScheduleFlight(null)}
        />
      )}
    </div>
  );
};

export default AdminFlightList;
