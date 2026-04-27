import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const res = await api.get('/payments/my-payments'); setPayments(res.data.data || []); } catch (err) { setError(err.response?.data?.message || 'Failed to load payments.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  return <div className="page-container"><div className="page-header"><div><h1>My Payments</h1><p>Payment history from backend.</p></div><button className="btn-secondary" onClick={load}>Refresh</button></div>{error && <div className="alert alert-error">{error}</div>}{loading ? <div className="loading">Loading payments...</div> : <div className="table-card"><table className="data-table"><thead><tr><th>ID</th><th>Booking</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{payments.map(p => <tr key={p.payment_id}><td>{p.payment_id}</td><td>{p.booking_reference || p.booking_id}</td><td>{p.payment_method}</td><td>Rs {Number(p.payment_amount || 0).toLocaleString()}</td><td><span className="badge">{p.payment_status}</span></td><td>{String(p.payment_date || '').split('T')[0]}</td></tr>)}{!payments.length && <tr><td colSpan="6">No payments found.</td></tr>}</tbody></table></div>}</div>;
};
export default MyPayments;
