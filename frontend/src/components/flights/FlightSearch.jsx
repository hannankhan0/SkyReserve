import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import FlightCard from './FlightCard';

const MAX_PRICE = 100000;
const formatPKR = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK')}`;

const FlightSearch = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ departure_city: '', destination_city: '', flight_date: '' });
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [routes, setRoutes] = useState([]);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [error, setError] = useState('');

  const departureCities = useMemo(() => {
    return [...new Set(routes.map((r) => r.departure_city).filter(Boolean))].sort();
  }, [routes]);

  const destinationCities = useMemo(() => {
    const filtered = filters.departure_city
      ? routes.filter((r) => r.departure_city === filters.departure_city)
      : routes;
    return [...new Set(filtered.map((r) => r.destination_city).filter(Boolean))].sort();
  }, [routes, filters.departure_city]);

  useEffect(() => {
    const fetchRoutes = async () => {
      setRoutesLoading(true);
      try {
        // Build dropdowns from scheduled/searchable flights so users only see bookable routes.
        const res = await api.get('/flights/search');
        const scheduledFlights = Array.isArray(res.data?.data) ? res.data.data : [];
        const uniqueRoutes = Object.values(scheduledFlights.reduce((acc, item) => {
          const key = `${item.departure_city}__${item.destination_city}`;
          if (item.departure_city && item.destination_city && !acc[key]) {
            acc[key] = { departure_city: item.departure_city, destination_city: item.destination_city };
          }
          return acc;
        }, {}));
        setRoutes(uniqueRoutes);
      } catch (err) {
        setRoutes([]);
      } finally {
        setRoutesLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (filters.destination_city && !destinationCities.includes(filters.destination_city)) {
      setFilters((prev) => ({ ...prev, destination_city: '' }));
    }
  }, [destinationCities, filters.destination_city]);

  const handleChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleMinSlider = (e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - 1000), priceRange[1]]);
  const handleMaxSlider = (e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 1000)]);
  const minPercent = (priceRange[0] / MAX_PRICE) * 100;
  const maxPercent = (priceRange[1] / MAX_PRICE) * 100;

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(true);

    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
    if (priceRange[0] > 0) params.min_price = priceRange[0];
    if (priceRange[1] < MAX_PRICE) params.max_price = priceRange[1];

    try {
      const res = await api.get('/flights/search', { params });
      setResults(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setResults([]);
      setError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ departure_city: '', destination_city: '', flight_date: '' });
    setPriceRange([0, MAX_PRICE]);
    setResults([]);
    setSearched(false);
    setError('');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Search Flights</h1>
          <p>Select only available routes, then continue to seat selection.</p>
        </div>
      </div>

      <div className="card search-card">
        <form onSubmit={handleSearch}>
          <div className="form-row">
            <div className="form-group">
              <label>From City</label>
              <select name="departure_city" value={filters.departure_city} onChange={handleChange} disabled={routesLoading}>
                <option value="">All available departure cities</option>
                {departureCities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To City</label>
              <select name="destination_city" value={filters.destination_city} onChange={handleChange} disabled={routesLoading || destinationCities.length === 0}>
                <option value="">All available destination cities</option>
                {destinationCities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="flight_date" value={filters.flight_date} onChange={handleChange} />
            </div>
          </div>

          {routes.length > 0 && (
            <div className="available-routes-box">
              <strong>Available routes:</strong>{' '}
              {routes.slice(0, 8).map((r) => `${r.departure_city} → ${r.destination_city}`).join(' | ')}
              {routes.length > 8 ? ` +${routes.length - 8} more` : ''}
            </div>
          )}

          <div className="price-range-group">
            <div className="price-range-header">
              <label>Price Range (PKR)</label>
              <span className="price-range-values">{formatPKR(priceRange[0])} — {formatPKR(priceRange[1])}</span>
            </div>
            <div className="slider-track-wrapper">
              <div className="slider-track"><div className="slider-fill" style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }} /></div>
              <input type="range" min={0} max={MAX_PRICE} step={1000} value={priceRange[0]} onChange={handleMinSlider} className="range-input range-min" />
              <input type="range" min={0} max={MAX_PRICE} step={1000} value={priceRange[1]} onChange={handleMaxSlider} className="range-input range-max" />
            </div>
            <div className="price-range-labels"><span>{formatPKR(0)}</span><span>{formatPKR(MAX_PRICE)}</span></div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Searching...' : '🔍 Search Flights'}</button>
            <button type="button" className="btn-secondary" onClick={handleReset}>Reset</button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {searched && !loading && (
        <div className="search-results">
          <h2>{results.length} Flight{results.length !== 1 ? 's' : ''} Found</h2>
          {results.length === 0 ? (
            <div className="empty-state">No scheduled flights match your selected route/date/price.</div>
          ) : (
            <div className="flights-grid">
              {results.map((flight) => (
                <FlightCard
                  key={`${flight.flight_id}-${flight.schedule_id || 'no-schedule'}`}
                  flight={flight}
                  isAdmin={false}
                  onSelectSeats={(item) => navigate(`/seats/${item.schedule_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlightSearch;
