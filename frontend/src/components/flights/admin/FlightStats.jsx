import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const FlightStats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/flights/stats');
        setStats(res.data.data || []);
      } catch (err) {
        setError('Failed to load stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading">Loading stats...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="stats-container">
      <h3>Flight Statistics</h3>
      {stats.length === 0 ? (
        <p>No stats available.</p>
      ) : (
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-route">
                {stat.departure_city} → {stat.destination_city}
              </div>
              <div className="stat-details">
                <span>{stat.total_flights || stat.flight_count} flights</span>
                {stat.avg_price && <span>Avg: ${parseFloat(stat.avg_price).toFixed(2)}</span>}
                {stat.total_bookings !== undefined && <span>{stat.total_bookings} bookings</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlightStats;
