import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { const res = await api.get('/tickets/my-tickets'); setTickets(res.data.data || []); }
    catch (err) { setError(err.response?.data?.message || 'Failed to load tickets.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const download = async (ticketId) => {
    setError('');
    try {
      const res = await api.get(`/tickets/${ticketId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `ticket-${ticketId}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.message || 'Download failed. Booking may not be confirmed yet.'); }
  };

  return <div className="page-container"><div className="page-header"><div><h1>My Tickets</h1><p>Tickets generated after booking and payment.</p></div><button className="btn-secondary" onClick={load}>Refresh</button></div>{error && <div className="alert alert-error">{error}</div>}{loading ? <div className="loading">Loading tickets...</div> : <div className="cards-list">{tickets.map(t => <div className="card booking-card" key={t.ticket_id}><div className="card-title-row"><h3>{t.ticket_number}</h3><span className="badge">{t.ticket_status}</span></div><p><strong>Passenger:</strong> {t.passenger_name} | <strong>Seat:</strong> {t.seat_number}</p><p><strong>{t.flight_number}</strong> — {t.departure_city} → {t.destination_city}</p><p><strong>Booking:</strong> {t.booking_reference} ({t.booking_status})</p><div className="card-actions"><button className="btn-primary compact" onClick={() => download(t.ticket_id)}>Download PDF</button></div></div>)}{!tickets.length && <div className="empty-state">No tickets yet. Pay a booking first.</div>}</div>}</div>;
};
export default MyTickets;
