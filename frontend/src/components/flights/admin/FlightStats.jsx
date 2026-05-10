import React, { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../../services/api';
import { useApp } from '../../../context/AppContext';

const FlightStats = () => {
  const { toast } = useApp();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/flights/stats');
        setStats(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [toast]);

  if (loading) return <div className="loading">Loading stats...</div>;

  return (
    <div className="stats-container">
      <h3>Flight Statistics</h3>
      {stats.length === 0 ? <p>No stats available.</p> : (
        <>
          <div className="chart-panel">
            <h4>Revenue by Flight</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.map((item) => ({ ...item, total_revenue: Number(item.total_revenue || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="flight_number" />
                <YAxis />
                <Tooltip formatter={(value) => `Rs ${Number(value).toLocaleString()}`} />
                <Bar dataKey="total_revenue" fill="#1a3a6b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="stats-grid">
            {stats.map((stat) => <div key={stat.flight_id} className="stat-card"><div className="stat-route">{stat.route}</div><div className="stat-details"><span>{stat.total_bookings} bookings</span><span>Rs {Number(stat.total_revenue || 0).toLocaleString()}</span></div></div>)}
          </div>
        </>
      )}
    </div>
  );
};

export default FlightStats;
