import React, { useState } from 'react';
import api from '../../services/api';

const AdminTicketCheckIn = () => {
  const [ticketId, setTicketId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const checkIn = async (e) => {
    e.preventDefault(); setError(''); setMessage('');
    try { await api.put(`/tickets/${ticketId}/check-in`); setMessage(`Ticket ${ticketId} checked in successfully.`); }
    catch (err) { setError(err.response?.data?.message || 'Check-in failed.'); }
  };

  const refund = async (e) => {
    e.preventDefault(); setError(''); setMessage('');
    try { await api.post(`/payments/${paymentId}/refund`); setMessage(`Payment ${paymentId} refunded successfully.`); }
    catch (err) { setError(err.response?.data?.message || 'Refund failed.'); }
  };

  return <div className="page-container"><div className="page-header"><div><h1>Admin Ticket / Payment Tools</h1><p>Check-in ticket and refund payment by ID.</p></div></div>{error && <div className="alert alert-error">{error}</div>}{message && <div className="alert alert-success">{message}</div>}<div className="two-col"><div className="card form-card"><h3>Ticket Check-in</h3><form onSubmit={checkIn}><div className="form-group"><label>Ticket ID</label><input value={ticketId} onChange={(e)=>setTicketId(e.target.value)} required /></div><button className="btn-primary">Check In</button></form></div><div className="card form-card"><h3>Refund Payment</h3><form onSubmit={refund}><div className="form-group"><label>Payment ID</label><input value={paymentId} onChange={(e)=>setPaymentId(e.target.value)} required /></div><button className="btn-primary">Refund</button></form></div></div></div>;
};
export default AdminTicketCheckIn;
