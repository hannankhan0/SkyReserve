import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const airportCode = (city) => String(city || 'SKY').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
const formatTime = (value) => String(value || '').slice(0, 5) || '--:--';
const classLabel = (value) => String(value || 'economy').replace('_', ' ');
const classKey = (value) => String(value || 'economy').toLowerCase().replace(/\s+/g, '_');

const QRPlaceholder = ({ value }) => (
  <svg className="ticket-qr" viewBox="0 0 100 100" role="img" aria-label={`QR placeholder for ${value}`}>
    <rect width="100" height="100" fill="#fff" />
    {[8, 62].map((x) => [8, 62].map((y) => <g key={`${x}-${y}`}><rect x={x} y={y} width="30" height="30" fill="#0f2347" /><rect x={x + 6} y={y + 6} width="18" height="18" fill="#fff" /><rect x={x + 11} y={y + 11} width="8" height="8" fill="#0f2347" /></g>))}
    {String(value || '').split('').slice(0, 18).map((char, index) => {
      const x = 10 + ((char.charCodeAt(0) + index * 7) % 72);
      const y = 10 + ((char.charCodeAt(0) * 3 + index * 11) % 72);
      return <rect key={`${char}-${index}`} x={x} y={y} width="6" height="6" fill="#1a3a6b" />;
    })}
  </svg>
);

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const { toast } = useApp();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets/my-tickets');
      setTickets(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const download = async (ticketId) => {
    try {
      const res = await api.get(`/tickets/${ticketId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${ticketId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Ticket PDF downloaded.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed. Booking may not be confirmed yet.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>My Tickets</h1><p>Tickets generated after booking and payment.</p></div>
        <button className="btn-secondary" onClick={load}>Refresh</button>
      </div>
      {loading ? <div className="loading">Loading tickets...</div> : (
        <div className="boarding-pass-list">
          {tickets.map((t) => (
            <div className="boarding-pass" key={t.ticket_id}>
              <div className="boarding-main">
                <div className="boarding-top">
                  <div><span className="muted-small">Passenger</span><h3>{t.passenger_name}</h3></div>
                  <span className={`class-badge ${classKey(t.seat_class)}`}>{classLabel(t.seat_class)}</span>
                </div>
                <div className="boarding-route">
                  <div><strong>{airportCode(t.departure_city)}</strong><span>{t.departure_city}</span><em>{formatTime(t.departure_time)}</em></div>
                  <div className="flight-path-line"><span></span></div>
                  <div><strong>{airportCode(t.destination_city)}</strong><span>{t.destination_city}</span><em>{formatTime(t.arrival_time)}</em></div>
                </div>
                <div className="boarding-details">
                  <span><b>Flight</b>{t.flight_number}</span>
                  <span><b>Seat</b>{t.seat_number}</span>
                  <span><b>Date</b>{String(t.flight_date || '').split('T')[0] || 'N/A'}</span>
                  <span><b>Booking</b>{t.booking_reference}</span>
                </div>
              </div>
              <div className="boarding-stub">
                <span className={`badge ${t.ticket_status}`}>{t.ticket_status}</span>
                <QRPlaceholder value={t.ticket_number} />
                <strong>{t.ticket_number}</strong>
                <button className="btn-primary compact" onClick={() => download(t.ticket_id)}>Download PDF</button>
              </div>
            </div>
          ))}
          {!tickets.length && <div className="illustrated-empty-state"><div className="empty-icon">TK</div><h3>No tickets yet</h3><p>Paid and confirmed bookings will generate boarding passes here.</p><Link className="btn-primary compact" to="/flights">Search Flights</Link></div>}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
