import React, { useState } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const AdminTicketCheckIn = () => {
  const [ticketId, setTicketId] = useState('');
  const { toast } = useApp();
  const [bookingReference, setBookingReference] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [paymentId, setPaymentId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const checkIn = async (id = ticketId) => {
    try {
      await api.put(`/tickets/${id}/check-in`);
      toast.success(`Ticket ${id} checked in successfully.`);
      if (bookingReference) await lookupByReference(null, true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed.');
    }
  };

  const lookupByReference = async (e, silent = false) => {
    if (e) e.preventDefault();
    if (!bookingReference.trim()) return;
    setLookupLoading(true);
    try {
      const res = await api.get(`/tickets/booking-reference/${bookingReference.trim()}`);
      setLookupResults(res.data.data || []);
      if (!silent && (res.data.data || []).length === 0) toast.info('No tickets found for that booking reference.');
    } catch (err) {
      setLookupResults([]);
      toast.error(err.response?.data?.message || 'Lookup failed.');
    } finally {
      setLookupLoading(false);
    }
  };

  const refund = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/payments/${paymentId}/refund`);
      toast.success(`Payment ${paymentId} refunded successfully.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header"><div><h1>Admin Ticket / Payment Tools</h1><p>Lookup tickets by booking reference, check in by ticket, and refund payment by ID.</p></div></div>
      <div className="two-col">
        <div className="card form-card">
          <h3>Ticket Check-in</h3>
          <form onSubmit={(e) => { e.preventDefault(); checkIn(); }}>
            <div className="form-group"><label>Ticket ID</label><input value={ticketId} onChange={(e) => setTicketId(e.target.value)} required /></div>
            <button className="btn-primary">Check In</button>
          </form>
        </div>
        <div className="card form-card">
          <h3>Lookup by Booking Reference</h3>
          <form onSubmit={lookupByReference}>
            <div className="form-group"><label>Booking Reference</label><input value={bookingReference} onChange={(e) => setBookingReference(e.target.value.toUpperCase())} placeholder="SKR123ABCD" required /></div>
            <button className="btn-primary" disabled={lookupLoading}>{lookupLoading ? 'Searching...' : 'Find Tickets'}</button>
          </form>
        </div>
        <div className="card form-card">
          <h3>Refund Payment</h3>
          <form onSubmit={refund}>
            <div className="form-group"><label>Payment ID</label><input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} required /></div>
            <button className="btn-primary">Refund</button>
          </form>
        </div>
      </div>

      {lookupResults.length > 0 && (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Ticket</th><th>Passenger</th><th>Flight</th><th>Seat</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {lookupResults.map((ticket) => (
                <tr key={ticket.ticket_id}>
                  <td>{ticket.ticket_number}<br /><span className="muted-small">ID {ticket.ticket_id}</span></td>
                  <td>{ticket.passenger_name}</td>
                  <td>{ticket.flight_number} | {ticket.departure_city} to {ticket.destination_city}</td>
                  <td>{ticket.seat_number}</td>
                  <td><span className={`badge ${ticket.ticket_status}`}>{ticket.ticket_status}</span></td>
                  <td><button className="btn-edit" onClick={() => checkIn(ticket.ticket_id)} disabled={ticket.ticket_status === 'checked_in'}>Check In</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTicketCheckIn;
