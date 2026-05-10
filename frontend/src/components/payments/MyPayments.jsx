import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const { toast } = useApp();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/my-payments');
      setPayments(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="page-container">
      <div className="page-header"><div><h1>My Payments</h1><p>Payment history from backend.</p></div><button className="btn-secondary" onClick={load}>Refresh</button></div>
      {loading ? <div className="loading">Loading payments...</div> : (
        payments.length ? (
          <>
            <div className="table-card">
              <table className="data-table clickable-table">
                <thead><tr><th>ID</th><th>Booking</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.payment_id} onClick={() => setSelectedPayment(p)} className={selectedPayment?.payment_id === p.payment_id ? 'active-row' : ''}>
                      <td>{p.payment_id}</td>
                      <td>{p.booking_reference || p.booking_id}</td>
                      <td>{String(p.payment_method || '').replace('_', ' ')}</td>
                      <td>Rs {Number(p.payment_amount || 0).toLocaleString()}</td>
                      <td><span className={`badge ${p.payment_status}`}>{p.payment_status}</span></td>
                      <td>{String(p.payment_date || '').split('T')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedPayment && (
              <div className="payment-detail-panel">
                <div><span className="muted-small">Payment selected</span><h3>Payment #{selectedPayment.payment_id}</h3></div>
                <p><strong>Booking:</strong> {selectedPayment.booking_reference || selectedPayment.booking_id}</p>
                <p><strong>Amount:</strong> Rs {Number(selectedPayment.payment_amount || 0).toLocaleString()}</p>
                <p><strong>Status:</strong> {selectedPayment.payment_status}</p>
              </div>
            )}
          </>
        ) : (
          <div className="illustrated-empty-state"><div className="empty-icon">PY</div><h3>No payments yet</h3><p>Your completed booking payments will show here with receipt details.</p><Link className="btn-primary compact" to="/flights">Search Flights</Link></div>
        )
      )}
    </div>
  );
};

export default MyPayments;
