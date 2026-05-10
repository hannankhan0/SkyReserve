import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import FlightCard from './FlightCard';
import { useApp } from '../../context/AppContext';

const MAX_PRICE = 100000;
const formatPKR = (value) => `Rs ${Number(value || 0).toLocaleString('en-PK')}`;
const sortOptions = [
  { key: 'price_asc', label: 'Cheapest' },
  { key: 'duration_asc', label: 'Fastest' },
  { key: 'time_asc', label: 'Earliest' },
];
const cabinOptions = [
  { key: 'all', label: 'All classes' },
  { key: 'economy', label: 'Economy' },
  { key: 'business', label: 'Business' },
  { key: 'first_class', label: 'First Class' },
];

const hasCabinSeats = (flight, cabin) => {
  if (cabin === 'all') return true;
  return Number(flight[`${cabin}_seats`] || 0) > 0;
};

const FlightSearch = () => {
  const navigate = useNavigate();
  const { toast } = useApp();
  const { state } = useLocation();
  const [filters, setFilters] = useState(state?.quickSearch || { departure_city: '', destination_city: '', flight_date: '' });
  const [tripType, setTripType] = useState('one_way');
  const [returnDate, setReturnDate] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [sortBy, setSortBy] = useState('time_asc');
  const [cabinClass, setCabinClass] = useState('all');
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [routes, setRoutes] = useState([]);
  const [results, setResults] = useState([]);
  const [returnResults, setReturnResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);

  const departureCities = useMemo(() => [...new Set(routes.map((r) => r.departure_city).filter(Boolean))].sort(), [routes]);

  const destinationCities = useMemo(() => {
    const filtered = filters.departure_city ? routes.filter((r) => r.departure_city === filters.departure_city) : routes;
    return [...new Set(filtered.map((r) => r.destination_city).filter(Boolean))].sort();
  }, [routes, filters.departure_city]);

  const visibleResults = useMemo(() => results.filter((flight) => hasCabinSeats(flight, cabinClass)), [results, cabinClass]);
  const visibleReturnResults = useMemo(() => returnResults.filter((flight) => hasCabinSeats(flight, cabinClass)), [returnResults, cabinClass]);

  useEffect(() => {
    const fetchRoutes = async () => {
      setRoutesLoading(true);
      try {
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

  const runSearch = async (nextSort = sortBy) => {
    setLoading(true);
    setSearched(true);

    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
    params.sort_by = nextSort;
    if (priceRange[0] > 0) params.min_price = priceRange[0];
    if (priceRange[1] < MAX_PRICE) params.max_price = priceRange[1];

    try {
      const res = await api.get('/flights/search', { params });
      setResults(Array.isArray(res.data?.data) ? res.data.data : []);
      if (tripType === 'round_trip' && returnDate && filters.departure_city && filters.destination_city) {
        const returnParams = {
          departure_city: filters.destination_city,
          destination_city: filters.departure_city,
          flight_date: returnDate,
          sort_by: nextSort,
        };
        if (priceRange[0] > 0) returnParams.min_price = priceRange[0];
        if (priceRange[1] < MAX_PRICE) returnParams.max_price = priceRange[1];
        const returnRes = await api.get('/flights/search', { params: returnParams });
        setReturnResults(Array.isArray(returnRes.data?.data) ? returnRes.data.data : []);
      } else {
        setReturnResults([]);
      }
    } catch (err) {
      setResults([]);
      setReturnResults([]);
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch();
  };

  const changeSort = (nextSort) => {
    setSortBy(nextSort);
    if (searched) runSearch(nextSort);
  };

  const handleReset = () => {
    setFilters({ departure_city: '', destination_city: '', flight_date: '' });
    setSortBy('time_asc');
    setCabinClass('all');
    setPriceRange([0, MAX_PRICE]);
    setResults([]);
    setReturnResults([]);
    setSearched(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>Search Flights</h1><p>Select only available routes, then continue to seat selection.</p></div>
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

          <div className="filter-strip">
            <div>
              <span className="filter-strip-label">Trip</span>
              <div className="segmented-pills"><button type="button" className={tripType === 'one_way' ? 'active' : ''} onClick={() => setTripType('one_way')}>One-way</button><button type="button" className={tripType === 'round_trip' ? 'active' : ''} onClick={() => setTripType('round_trip')}>Round-trip</button></div>
            </div>
            <div className="form-row compact-form-row">
              {tripType === 'round_trip' && <div className="form-group"><label>Return Date</label><input type="date" value={returnDate} min={filters.flight_date || undefined} onChange={(e) => setReturnDate(e.target.value)} /></div>}
              <div className="form-group"><label>Adults</label><select value={passengerCount} onChange={(e) => setPassengerCount(Number(e.target.value))}>{Array.from({ length: 9 }).map((_, index) => <option value={index + 1} key={index + 1}>{index + 1}</option>)}</select></div>
            </div>
          </div>

          {routes.length > 0 && (
            <div className="available-routes-box">
              <strong>Available routes:</strong>{' '}
              {routes.slice(0, 8).map((r) => `${r.departure_city} to ${r.destination_city}`).join(' | ')}
              {routes.length > 8 ? ` +${routes.length - 8} more` : ''}
            </div>
          )}

          <div className="filter-strip">
            <div>
              <span className="filter-strip-label">Sort</span>
              <div className="segmented-pills">
                {sortOptions.map((option) => <button type="button" key={option.key} className={sortBy === option.key ? 'active' : ''} onClick={() => changeSort(option.key)}>{option.label}</button>)}
              </div>
            </div>
            <div>
              <span className="filter-strip-label">Cabin</span>
              <div className="segmented-pills">
                {cabinOptions.map((option) => <button type="button" key={option.key} className={cabinClass === option.key ? 'active' : ''} onClick={() => setCabinClass(option.key)}>{option.label}</button>)}
              </div>
            </div>
          </div>

          <div className="price-range-group">
            <div className="price-range-header">
              <label>Price Range (PKR)</label>
              <span className="price-range-values">{formatPKR(priceRange[0])} - {formatPKR(priceRange[1])}</span>
            </div>
            <div className="slider-track-wrapper">
              <div className="slider-track"><div className="slider-fill" style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }} /></div>
              <input type="range" min={0} max={MAX_PRICE} step={1000} value={priceRange[0]} onChange={handleMinSlider} className="range-input range-min" />
              <input type="range" min={0} max={MAX_PRICE} step={1000} value={priceRange[1]} onChange={handleMaxSlider} className="range-input range-max" />
            </div>
            <div className="price-range-labels"><span>{formatPKR(0)}</span><span>{formatPKR(MAX_PRICE)}</span></div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Searching...' : 'Search Flights'}</button>
            <button type="button" className="btn-secondary" onClick={handleReset}>Reset</button>
          </div>
        </form>
      </div>

      {searched && !loading && (
        <div className="search-results">
          <h2>{visibleResults.length} Flight{visibleResults.length !== 1 ? 's' : ''} Found</h2>
          {visibleResults.length === 0 ? (
            <div className="illustrated-empty-state"><div className="empty-icon">FL</div><h3>No matching flights</h3><p>Try a different route, cabin class, date, or price range.</p><button className="btn-secondary" onClick={handleReset}>Reset Search</button></div>
          ) : (
            <div className="flights-grid">
              {visibleResults.map((flight) => <FlightCard key={`${flight.flight_id}-${flight.schedule_id || 'no-schedule'}`} flight={flight} selectedClass={cabinClass} isAdmin={false} onSelectSeats={(item) => navigate(`/flights/${item.flight_id}`, { state: { flight: item, passengerCount, tripType, returnDate } })} />)}
            </div>
          )}
          {tripType === 'round_trip' && returnDate && (
            <>
              <h2 className="section-subhead">{visibleReturnResults.length} Return Flight{visibleReturnResults.length !== 1 ? 's' : ''} Found</h2>
              {visibleReturnResults.length === 0 ? <div className="illustrated-empty-state"><div className="empty-icon">RT</div><h3>No return flights</h3><p>Try another return date or route.</p></div> : <div className="flights-grid">{visibleReturnResults.map((flight) => <FlightCard key={`return-${flight.flight_id}-${flight.schedule_id || 'no-schedule'}`} flight={flight} selectedClass={cabinClass} isAdmin={false} onSelectSeats={(item) => navigate(`/flights/${item.flight_id}`, { state: { flight: item, passengerCount, tripType, returnDate, leg: 'return' } })} />)}</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FlightSearch;
